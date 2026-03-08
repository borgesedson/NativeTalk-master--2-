# 🚀 Teste Rápido - Sistema de Transcrição

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Iniciar Servidores

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

✅ Aguarde: `Server running on port 5001` e `Local: http://localhost:5173`

---

### 2️⃣ Criar 2 Usuários de Teste

#### 👤 Usuário A (Português)
1. Abrir: `http://localhost:5173`
2. Sign Up:
   - Email: `teste.a@mail.com`
   - Password: `123456`
   - Full Name: `User A`
3. Complete Profile:
   - Native Language: **Portuguese**
   - Learning Language: **English**
   - Location: `São Paulo, Brazil`

#### 👤 Usuário B (Inglês)
1. Abrir **JANELA ANÔNIMA/PRIVADA** (Ctrl+Shift+N no Chrome)
2. Ir para: `http://localhost:5173`
3. Sign Up:
   - Email: `teste.b@mail.com`
   - Password: `123456`
   - Full Name: `User B`
4. Complete Profile:
   - Native Language: **English**
   - Learning Language: **Portuguese**
   - Location: `New York, USA`

---

### 3️⃣ Adicionar como Amigos

#### No User A:
1. Ver "Meet New Learners"
2. Encontrar **User B**
3. Clicar **"Send Friend Request"**

#### No User B:
1. Clicar **"Friend Requests"** (canto superior direito)
2. Clicar **"Accept"** no pedido do User A

✅ Agora são amigos!

---

### 4️⃣ Testar Chat com Tradução

#### User A envia mensagem:
```
"Olá! Como você está?"
```

#### User B vê:
```
ORIGINAL: Olá! Como você está?
TRANSLATED: Hello! How are you?
```

#### User B responde:
```
"I'm fine, thank you!"
```

#### User A vê:
```
ORIGINAL: I'm fine, thank you!
TRANSLATED: Estou bem, obrigado!
```

🎉 **Sistema de tradução funcionando!**

---

### 5️⃣ Testar Videochamada com Transcrição

#### Iniciar chamada:
1. **User A**: Clicar no ícone de **vídeo** 📹 ao lado do nome do User B
2. **User B**: Aceitar a chamada
3. **Permitir acesso** ao microfone e câmera em AMBOS

#### Testar transcrição:

##### 🗣️ User A fala em Português:
1. Clicar no botão **🎤 grande roxo** na parte inferior
2. Falar claramente: **"Olá, como você está?"**
3. Ver: 🔴 **Gravando... 🌐** (Web Speech ativo)
4. Transcrição aparece automaticamente

##### 👂 User B vê a legenda traduzida:
```
"Hello, how are you?"
```

##### 🗣️ User B responde em Inglês:
1. Clicar no botão 🎤
2. Falar: **"I'm doing great, thanks for asking!"**

##### 👂 User A vê a legenda traduzida:
```
"Estou indo muito bem, obrigado por perguntar!"
```

---

## ✅ O Que Você Deve Ver

### Durante a Gravação:
- ✅ Botão 🎤 fica vermelho e pulsando
- ✅ Texto: "Gravando... 🌐" (se Web Speech API)
- ✅ Texto: "Gravando... ☁️" (se Azure Speech)

### Após Falar:
- ✅ Legenda aparece na parte inferior da tela
- ✅ Legenda **traduzida** para o idioma do outro usuário
- ✅ Legenda some após ~5 segundos

### No Console do Navegador (F12):
```javascript
✅ Web Speech API disponível
🎤 Web Speech reconhecimento iniciado
📝 Transcrição: "Olá, como você está?"
🛑 Web Speech reconhecimento encerrado
```

### No Terminal do Backend:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 TRANSCRIÇÃO + TRADUÇÃO:
🗣️  Quem fala: 507f1f77... (portuguese)
👂 Quem ouve: 507f191e... (english)
🎙️  Idioma do áudio: pt-BR
📝 Transcrição original: "Olá, como você está?"
🌐 Traduzido para en: "Hello, how are you?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Problemas Comuns

### ❌ "Web Speech API não suportada"
**Solução**: Use Chrome ou Edge (versão recente)

### ❌ Microfone não funciona
**Solução**: 
1. Verificar permissões do navegador
2. Chrome: `chrome://settings/content/microphone`
3. Permitir acesso ao site

### ❌ Não transcreve nada
**Solução**:
1. Falar mais **alto e claro**
2. Verificar se o microfone está funcionando
3. Testar com frases simples primeiro: "Hello", "Olá"

### ❌ Tradução não aparece
**Solução**:
1. Verificar se os idiomas dos usuários estão diferentes
2. Verificar console do browser (F12) para erros
3. Verificar terminal do backend para logs

### ❌ "Connection refused" no backend
**Solução**:
1. Verificar se o backend está rodando na porta 5001
2. `cd backend && npm run dev`

---

## 🎯 Frases para Testar

### Português → Inglês:
- "Olá, tudo bem?"
- "Como foi seu dia?"
- "Você gosta de aprender idiomas?"
- "O tempo está bonito hoje"

### Inglês → Português:
- "Hello, how are you?"
- "What's your favorite food?"
- "I love learning new languages"
- "The weather is nice today"

### Espanhol → Inglês:
- "Hola, ¿cómo estás?"
- "¿Qué tal tu día?"
- "Me gusta aprender idiomas"

### Francês → Inglês:
- "Bonjour, comment allez-vous?"
- "J'aime apprendre les langues"

---

## 📊 Verificar Cache de Traduções

1. Ir para a HomePage (depois de trocar algumas mensagens)
2. Ver widget **"Cache Stats"** com:
   - Taxa de Acerto: **75%** (exemplo)
   - Economia de API: **150 chamadas**
   - Tamanho do Cache: **180/1000**

---

## 🎉 Sucesso!

Se você conseguiu:
- ✅ Criar 2 usuários
- ✅ Adicionar como amigos
- ✅ Trocar mensagens traduzidas no chat
- ✅ Iniciar videochamada
- ✅ Ver legendas traduzidas em tempo real

**🎊 PARABÉNS! Seu NativeTalk está funcionando perfeitamente!**

---

## 📚 Próximos Passos

1. 📖 Ler: `TRANSCRIPTION_TESTING.md` (teste completo)
2. 📖 Ler: `CACHE_SYSTEM.md` (sobre o sistema de cache)
3. 📖 Ler: `MOBILE_OPTIMIZATION.md` (testar no celular)
4. 🔧 Configurar Azure Speech (opcional, para produção)
5. 🎨 Testar temas diferentes (32 disponíveis)

---

## 🆘 Precisa de Ajuda?

Verifique os logs:
- **Frontend**: F12 → Console
- **Backend**: Terminal onde rodou `npm run dev`

Arquivos importantes:
- `frontend/src/components/AudioTranscription.jsx`
- `backend/src/controllers/transcription.controller.js`
- `backend/src/lib/translation.js`

---

✅ **Tempo estimado**: 5-10 minutos
🎤 **Funciona em**: Chrome, Edge (Web Speech API nativa)
☁️ **Azure opcional**: Configure apenas para produção
