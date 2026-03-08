# 🚀 Deploy no Railway.app (FÁCIL!)

## ✅ Por que Railway é melhor?
- ✅ Deploy automático do GitHub
- ✅ Detecta automaticamente backend e frontend
- ✅ 100% GRÁTIS (sem cartão)
- ✅ Funciona na primeira tentativa
- ✅ Muito mais simples que Vercel

---

## 📋 PASSO 1: Criar Conta

1. Acesse: **https://railway.app**
2. Clique em **"Start a New Project"** ou **"Login with GitHub"**
3. Autorize o Railway a acessar seus repositórios

---

## 🔧 PASSO 2: Deploy do Backend

### 2.1. Criar Serviço
1. No dashboard, clique em **"New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione o repositório: **NativeTalk**
4. Railway vai detectar o Node.js automaticamente

### 2.2. Configurar Backend
1. Clique no serviço criado
2. Aba **"Settings"**:
   - **Root Directory**: `backend`
   - **Start Command**: `node src/server.js`
   - **Build Command**: `npm install`

### 2.3. Adicionar Variáveis de Ambiente
Aba **"Variables"** → **"New Variable"**:

```
MONGO_URI=mongodb+srv://borgesedson431_db_user:pip2g74j4B06p430@cluster0.ogzp6vj.mongodb.net/streamify?retryWrites=true&w=majority

JWT_SECRET=meusiteseguro

STREAM_API_KEY=qqq782vgbvwx

STREAM_SECRET_KEY=vqcjdey2uetvbq7jqgqt8q33dtaxxfvhjndwkpb24kfd6jcktu9exbx9ksd5ahy7

DEEPL_API_KEY=eea9e7d4-4868-4257-aece-1de650b0ef93:fx

TRANSLATION_PROVIDER=deepl

NODE_ENV=production

PORT=5001
```

### 2.4. Gerar Domínio Público
1. Aba **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. **COPIE A URL** (exemplo: `nativetalk-backend.up.railway.app`)

---

## 🎨 PASSO 3: Deploy do Frontend

### 3.1. Adicionar Novo Serviço
1. No mesmo projeto, clique em **"+ New"** → **"GitHub Repo"**
2. Selecione **NativeTalk** novamente (pode usar o mesmo repo)

### 3.2. Configurar Frontend
1. Clique no novo serviço
2. Aba **"Settings"**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (ou use Nginx)

### 3.3. Adicionar URL do Backend
Aba **"Variables"**:

```
VITE_API_URL=https://SEU-BACKEND.up.railway.app
VITE_STREAM_API_KEY=qqq782vgbvwx
```

⚠️ **IMPORTANTE**: Use a URL do backend que você copiou no PASSO 2.4

### 3.4. Gerar Domínio do Frontend
1. Aba **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. **PRONTO!** Seu app está no ar! 🎉

---

## 🔗 Resultado Final

Você terá:
- **Backend**: `https://nativetalk-backend.up.railway.app`
- **Frontend**: `https://nativetalk-frontend.up.railway.app`

---

## 🔄 Atualizações Automáticas

Sempre que você fizer `git push`, o Railway faz deploy automático! ✅

---

## ⚡ Alternativa AINDA MAIS SIMPLES

Railway também suporta **deploy único** se você preferir:

1. Configure o backend para servir o frontend (modo produção)
2. Um único serviço Railway
3. Menos complexo, mais barato

Quer que eu configure dessa forma?

---

**Qualquer dúvida, me chama!** 🚀
