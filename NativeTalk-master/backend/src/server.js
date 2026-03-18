import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import translationRoutes from "./routes/translation.route.js";
import transcriptionRoutes from "./routes/transcription.route.js";
import audioRoutes from "./routes/audio.route.js";
import groupRoutes from "./routes/group.routes.js";
import liveRoutes from "./routes/live.route.js";
import { StreamChat } from "stream-chat";

import { translateText } from "./lib/translation.js"; // ✅ Importar função de tradução


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      const allowedOrigins = [
        "https://nativetalk-thlm.onrender.com",
        "http://82.25.64.9",
        "https://82.25.64.9",
        "http://82.25.64.9:80",
        "https://82.25.64.9:443"
      ];
      // Allow any Vercel/Cloudflare subdomain and exact matches
      const isVercel = /\.vercel\.app$/.test(origin);
      const isCloudflare = /\.trycloudflare\.com$/.test(origin);
      if (allowedOrigins.includes(origin) || isVercel || isCloudflare) {
        return callback(null, true);
      }
      console.log('🚨 Socket CORS blocked:', origin);
      return callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  }
});

const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🛡️ HEADERS DE SEGURANÇA (RELAXADOS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://*.stream-io-api.com", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 🔒 CORS PERMISSIVO
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://nativetalk-thlm.onrender.com",
  "http://82.25.64.9",
  "https://82.25.64.9",
  "http://82.25.64.9:80",
  "https://82.25.64.9:443",
  /\.vercel\.app$/,
  /\.trycloudflare\.com$/
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );

      if (allowed) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`⚠️ CORS: Permitindo origin em dev: ${origin}`);
          return callback(null, true);
        }
        console.log('🚨 CORS blocked:', origin);
        callback(new Error(`CORS: Origin '${origin}' não permitida`), false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  })
);

// ⚡ RATE LIMITING MUITO MAIS PERMISSIVO
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // ✅ 5 minutos (era 15)
  max: 500, // ✅ 500 requests (era 200)
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // ✅ PULAR RATE LIMIT PARA MAIS ROTAS CRÍTICAS
    const skipPaths = [
      '/uploads',
      '/favicon',
      '/api/auth/me', // ✅ CRÍTICO: Verificação de auth
      '/api/auth/login', // ✅ Login
      '/api/auth/signup', // ✅ Signup
      '/api/groups', // ✅ Listagem de grupos
      '/api/chat/token', // ✅ Token do Stream
    ];

    return skipPaths.some(path => req.path.includes(path)) ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.css') ||
      req.path.includes('.js');
  }
});

// ⚡ RATE LIMITING PARA AUTH (MUITO PERMISSIVO)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // ✅ Aumentado de 20 para 100
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'AUTH_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // ✅ NUNCA aplicar rate limit para verificação de auth
    return req.path === '/api/auth/me' ||
      req.path === '/api/auth/logout';
  }
});

// ✅ APLICAR RATE LIMITING GLOBAL APENAS EM PRODUÇÃO E MUITO PERMISSIVO
if (process.env.NODE_ENV === "production") {
  app.use(globalLimiter);
}

// 🔒 PAYLOADS
app.use(express.json({
  limit: '5mb', // ✅ Aumentado de 2mb para 5mb
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({
  limit: '5mb',
  extended: true,
  parameterLimit: 200 // ✅ Aumentado de 100 para 200
}));
app.use(cookieParser());

// 📡 LOGGER GLOBAL (CAPTURA TUDO)
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  if (req.headers.authorization) {
    console.log(`🔐 Auth: ${req.headers.authorization.substring(0, 20)}...`);
  }
  next();
});

// ✅ APLICAR RATE LIMITING ESPECÍFICO APENAS EM PRODUÇÃO E RELAXADO
if (process.env.NODE_ENV === "production") {
  app.use("/api/auth", authLimiter);
}

// 🔒 SERVIR ARQUIVOS DE UPLOAD
const uploadsPath = path.join(__dirname, "../uploads");
console.log("📁 Serving static files from:", uploadsPath);
app.use("/uploads", express.static(uploadsPath));

// ✅ ROOT ROUTE
app.get('/', (req, res) => {
  res.send(`
    <style>
      body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f4f9; color: #333; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
      h1 { color: #4f46e5; margin-top: 0; }
      p { line-height: 1.6; }
      .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 99px; background: #dcfce7; color: #166534; font-weight: 600; font-size: 0.875rem; }
      .links { margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; }
      a { color: #4f46e5; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
    </style>
    <div class="card">
      <h1>NativeTalk Backend</h1>
      <p>O servidor está rodando corretamente.</p>
      <div class="status">● Online (Porta ${PORT})</div>
      <div class="links">
        <a href="/api/health">Health Check</a>
        <a href="http://localhost:5173" target="_blank">Abrir App (Frontend)</a>
      </div>
    </div>
  `);
});

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// 🌐 PROXY TRADUÇÃO (ARGOS VPS)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from, to } = req.body;
    console.log(`[SERVER TRANSLATE] from: ${from} | to: ${to} | text: ${text?.substring(0, 30)}`);

    // VPS expects: text, from, to (NOT source/target!)
    const vpsPayload = { text, from, to };

    const argosUrl = process.env.VITE_ARGOS_API_URL || 'http://82.25.64.9:5000/translate';
    const response = await fetch(argosUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vpsPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[SERVER TRANSLATE] VPS error (${response.status}):`, errText);
      return res.status(response.status).json({ error: 'Argos VPS returned an error', details: errText });
    }

    const data = await response.json();
    console.log(`[SERVER TRANSLATE] VPS result: "${data.translated?.substring(0, 40)}"`);

    const translated = data.translated || text;

    // Confidence helper
    const editDistance = (s1, s2) => {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
      let costs = new Array();
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i == 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) != s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    }

    const similarity = (a, b) => {
      if (!a || !b) return 0
      const longer = a.length > b.length ? a : b
      const shorter = a.length > b.length ? b : a
      if (longer.length === 0) return 1.0
      return (longer.length - editDistance(longer, shorter)) / longer.length
    }

    const confidence = 1 - similarity(text, translated);

    res.json({
      translated: translated,
      translatedText: translated,
      confidence: Math.round(confidence * 100)
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error.message);
    res.status(500).json({ error: 'Internal server error in translation proxy' });
  }
});

// 🌐 PROXY AUDIO STT (WHISPER VPS)
app.post('/api/stt', async (req, res) => {
  try {
    const { audio, audio_url, from, to } = req.body;
    console.log(`[STT] Requested: from ${from} to ${to}`);

    if (!audio && !audio_url) return res.status(400).json({ error: 'Audio data (base64) or audio_url is required' });

    const payload = { from, to };
    if (audio) payload.audio = audio;
    if (audio_url) payload.audio_url = audio_url;

    console.log(`[STT] Calling Whisper VPS...`);
    const whisperUrl = process.env.VITE_WHISPER_API_URL || 'http://82.25.64.9:5001/stt-and-translate';
    const response = await fetch(whisperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[STT] Whisper VPS error (${response.status}):`, errText);
      return res.status(response.status).json({ error: 'Whisper VPS returned an error' });
    }

    const data = await response.json();
    console.log('[STT] Success:', data.transcript?.substring(0, 50));
    res.json(data);
  } catch (error) {
    console.error('[STT] Error:', error.message);
    res.status(500).json({ error: 'Internal server error in STT proxy' });
  }
});

// --- REPLACED WITH HIGHER LOGGER ---

// ⚡ ROTAS DA API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/translation", translationRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/live", liveRoutes);
const frontendPath = path.join(__dirname, "../../frontend/dist"); // ✅ Path corrected for current structure

if (fs.existsSync(frontendPath)) {
  console.log("✅ Frontend dist found, serving static files");
  app.use(express.static(frontendPath, {
    maxAge: '1h',
    index: false,
  }));

  app.get("*", (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        error: "API endpoint não encontrado",
        code: "API_NOT_FOUND"
      });
    }

    if (fs.existsSync(path.join(frontendPath, "index.html"))) {
      res.sendFile(path.join(frontendPath, "index.html"));
    } else {
      res.status(404).send("Frontend build not found");
    }
  });
} else {
  console.log("⚠️ Frontend dist não encontrado. Rode 'npm run build' no frontend para acesso via porta 5001.");
}

// 🛡️ MIDDLEWARE DE ERRO
app.use((error, req, res, next) => {
  console.error("🚨 Erro:", error.message);

  if (error.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Acesso negado - CORS',
      code: 'CORS_ERROR'
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR'
  });
});

// 🚀 SOCKET HANDLERS
io.on('connection', (socket) => {
  console.log('👤 Usuário conectado via Socket.io:', socket.id);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    socket.userId = userId;
    console.log(`👤 Usuário ${userId} entrou na sua sala privada`);
  });

  // 📞 CHAMADAS DIRETAS
  socket.on('initiate-direct-call', (data) => {
    console.log('📞 Chamada iniciada:', { from: data.caller.name, to: data.receiverId, type: data.type });
    socket.to(`user-${data.receiverId}`).emit('incoming-call', {
      caller: data.caller,
      type: data.type,
      timestamp: data.timestamp
    });
  });

  socket.on('accept-direct-call', (data) => {
    console.log('✅ Chamada aceita:', { caller: data.callerId, from: data.accepter.name });
    socket.to(`user-${data.callerId}`).emit('call-accepted', {
      accepter: data.accepter,
      timestamp: Date.now()
    });
  });

  socket.on('reject-direct-call', (data) => {
    socket.to(`user-${data.callerId}`).emit('call-rejected', {
      rejecterId: data.rejecterId,
      timestamp: Date.now()
    });
  });

  socket.on('end-direct-call', (data) => {
    socket.to(`user-${data.receiverId}`).emit('call-ended', {
      enderId: socket.userId,
      timestamp: Date.now()
    });
  });

  // 🌍 TRADUÇÃO DE ÁUDIO EM TEMPO REAL
  socket.on('send-audio-translation', (data) => {
    socket.to(`user-${data.toUser}`).emit('audio-translation', {
      audioData: data.audioData,
      originalText: data.originalText,
      translatedText: data.translatedText,
      fromLanguage: data.fromLanguage,
      toLanguage: data.toLanguage,
      timestamp: Date.now()
    });
  });

  // 📨 MENSAGENS DE TEXTO COM TRADUÇÃO (Stitch / Custom Chat)
  socket.on('send-message', async (data) => {
    try {
      const { toUser, text, audioUrl, targetLang } = data;
      const senderId = socket.userId;

      let translation = null;

      // Pipeline de Tradução
      if (text && targetLang) {
        // Detectar idioma original (opcional, ou passar fromLang)
        const translatedText = await translateText(text, 'auto', targetLang);
        if (translatedText && translatedText !== text) {
          translation = {
            text: translatedText,
            language: targetLang
          };
        }
      }

      // TODO: Insforge Message Saving Implementation
      const messageData = {
        senderId,
        receiverId: toUser,
        text,
        audioUrl,
        translation,
        createdAt: new Date().toISOString()
      };

      // Emitir para o destinatário
      socket.to(`user-${toUser}`).emit('receive-message', messageData);

      // Emitir confirmação para o remetente (opcional, para update de UI optimista ou confirmação)
      socket.emit('message-sent', messageData);

      console.log(`📨 Mensagem enviada de ${senderId} para ${toUser}`);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });


  socket.on('disconnect', () => {
    console.log('👋 Usuário desconectado:', socket.id);
  });
});

// 🚀 INICIALIZAR SERVIDOR
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// ✅ TIMEOUT MAIOR
server.timeout = 120000;
