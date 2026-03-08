# Streamify Video Calls

## 🚀 Deploy no Vercel

### Passo 1: Criar conta e conectar GitHub
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Autorize o Vercel a acessar seus repositórios

### Passo 2: Fazer push do código para GitHub

```bash
# Inicializar Git (se ainda não fez)
git init
git add .
git commit -m "Preparar deploy para Vercel"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/streamify-video-calls.git
git branch -M master
git push -u origin master
```

### Passo 3: Importar projeto no Vercel
1. No Vercel, clique em **"Add New Project"**
2. Selecione o repositório `streamify-video-calls`
3. Clique em **"Import"**

### Passo 4: Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster0.ogzp6vj.mongodb.net/streamify
PORT=5001
STREAM_API_KEY=qqq782vgbvwx
STREAM_API_SECRET=seu_secret_aqui
DEEPL_API_KEY=sua_key_deepl
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_jwt
FRONTEND_URL=https://seu-app.vercel.app
```

### Passo 5: Deploy! 🎉
1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Seu app estará no ar! 🚀

### Passo 6: Atualizar CORS no Backend (após primeiro deploy)

Depois do primeiro deploy, você receberá a URL do seu app (ex: `https://streamify-video-calls.vercel.app`).

Adicione essa URL nas variáveis de ambiente:
```
FRONTEND_URL=https://SEU-APP.vercel.app
```

E faça commit para atualizar:
```bash
git add .
git commit -m "Atualizar CORS com URL do Vercel"
git push
```

## 🔄 Deploy Automático

Agora sempre que você fizer:
```bash
git add .
git commit -m "minha alteração"
git push
```

O Vercel vai detectar automaticamente e fazer o deploy em 30-60 segundos! ✨

## 📱 Testar no Celular

Depois do deploy, você pode acessar o app de qualquer lugar pelo link:
`https://seu-app.vercel.app`

## 🐛 Troubleshooting

### MongoDB não conecta
- Verifique se liberou o IP `0.0.0.0/0` no MongoDB Atlas (Network Access)
- Confirme se a `MONGODB_URI` está correta nas variáveis de ambiente

### Erros de CORS
- Adicione a URL do Vercel na variável `FRONTEND_URL`
- Reinicie o deploy

### Upload de fotos não funciona
- Vercel tem limitações de storage temporário
- Considere usar Cloudinary para uploads em produção
