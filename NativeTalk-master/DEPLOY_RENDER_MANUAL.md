# 🚀 Deploy Manual no Render.com - PASSO A PASSO

## 📋 INSTRUÇÕES COMPLETAS

### 1. Acesse o Render
🔗 https://dashboard.render.com/create?type=web

### 2. Conecte o GitHub
- Clique em **"Connect a repository"**
- Se aparecer a lista de repos, procure por **"NativeTalk"**
- Se não aparecer, clique em **"Configure account"** e dê permissão ao Render

### 3. Configure o Web Service

Preencha EXATAMENTE assim:

```
Name: nativetalk

Region: Oregon (US West) ou Frankfurt (EU Central)

Branch: master

Root Directory: backend

Build Command: npm install && npm run build

Start Command: npm start

Instance Type: Free
```

### 4. Adicione as Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

Cole uma por uma:

```
MONGO_URI
mongodb+srv://borgesedson431_db_user:pip2g74j4B06p430@cluster0.ogzp6vj.mongodb.net/streamify?retryWrites=true&w=majority

JWT_SECRET
meusiteseguro

STREAM_API_KEY
qqq782vgbvwx

STREAM_SECRET_KEY
vqcjdey2uetvbq7jqgqt8q33dtaxxfvhjndwkpb24kfd6jcktu9exbx9ksd5ahy7

DEEPL_API_KEY
eea9e7d4-4868-4257-aece-1de650b0ef93:fx

TRANSLATION_PROVIDER
deepl

NODE_ENV
production

PORT
10000
```

### 5. Clique em "Create Web Service"

✅ O Render vai automaticamente:
- Clonar o repositório
- Instalar dependências do backend
- Buildar o frontend (via npm run build)
- Iniciar o servidor

### 6. Acompanhe o Deploy

Você verá os logs em tempo real:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Running build command...
==> Frontend build completed
==> Starting service...
==> Your service is live 🎉
```

### 7. Acesse sua aplicação

URL gerada: https://nativetalk.onrender.com

⏱️ **Tempo estimado:** 5-10 minutos

---

## ⚠️ PROBLEMAS COMUNS

### Erro: "Build failed"
- Verifique se `Root Directory` está como `backend`
- Verifique se o Build Command está correto

### Erro: "Application failed to start"
- Verifique se todas as variáveis de ambiente foram adicionadas
- Verifique os logs na aba "Logs"

### Aplicação não carrega
- Aguarde 1-2 minutos após "Deploy live"
- Limpe o cache do navegador (Ctrl+F5)

---

## 📊 Após o Deploy

1. Teste a URL: https://nativetalk.onrender.com
2. Faça login com um usuário existente
3. Teste tradução de mensagens
4. Teste chamada de vídeo

---

## 🔄 Deploys Futuros

Após o primeiro deploy, qualquer `git push` no GitHub vai automaticamente fazer redeploy no Render!

```bash
git add .
git commit -m "Minha atualização"
git push origin master
```

✅ Deploy automático!
