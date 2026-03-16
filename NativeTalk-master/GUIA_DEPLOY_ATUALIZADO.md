# 🚀 Guia de Deploy Moderno — NativeTalk

Este guia substitui os arquivos antigos e reflete a arquitetura atual do projeto (InsForge + Render + Vercel).

---

## 1. Backend (Render.com)

O backend gerencia o Socket.io, STT e Traduções.

### Passos no Render:
1. Vá em **Dashboard > New > Web Service**.
2. Conecte seu repositório GitHub.
3. Configure os detalhes:
   - **Name:** `nativetalk-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Variáveis de Ambiente (Environment Variables):
Adicione estas variáveis no painel do Render:
- `INSFORGE_BASE_URL`: Sua URL do InsForge (Ex: `https://xxxx.insforge.app`)
- `INSFORGE_API_KEY`: Sua chave de administração do InsForge
- `INSFORGE_ANON_KEY`: Sua chave anônima do InsForge
- `STREAM_API_KEY`: Sua Key do Stream Chat
- `STREAM_API_SECRET`: Seu Secret do Stream Chat
- `JWT_SECRET`: Uma senha forte para tokens
- `VITE_ARGOS_API_URL`: URL da sua VPS de Tradução (Opcional, padrão: `http://82.25.64.9:5000/translate`)
- `VITE_WHISPER_API_URL`: URL da sua VPS de Áudio (Opcional, padrão: `http://82.25.64.9:5001/stt-and-translate`)
- `NODE_ENV`: `production`

---

## 2. Frontend (Vercel.com)

O frontend é o aplicativo React.

### Passos no Vercel:
1. Vá em **New Project** no painel do Vercel.
2. Selecione o repositório GitHub.
3. Configure os detalhes:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Variáveis de Ambiente (Environment Variables):
No Vercel, adicione:
- `VITE_STREAM_API_KEY`: Sua Key do Stream
- `VITE_INSFORGE_BASE_URL`: Sua URL do InsForge
- `VITE_INSFORGE_ANON_KEY`: Sua chave anônima do InsForge
- `VITE_API_URL`: **A URL do seu backend no Render** (Ex: `https://nativetalk-backend.onrender.com`)
- `VITE_SERVER_URL`: **A mesma URL do Render**

---

## 3. Ajustes Importantes (Pós-Deploy)

1. **CORS:** O backend precisa permitir que o domínio do Vercel acesse a API. Eu adicionei suporte a curingas para domínios `.vercel.app` para facilitar.
2. **Stream Chat:** No painel do Stream Chat, verifique se as configurações de segurança permitem o acesso do seu novo domínio.

---

### Verificação
Após o deploy, teste:
- Se o login funciona.
- Se o chat conecta.
- Se a tradução está ativa.
