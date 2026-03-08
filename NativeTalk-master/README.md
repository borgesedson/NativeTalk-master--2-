<h1 align="center">🌍 NativeTalk - Multilingual Chat & Video App</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

<div align="center">

**Chat e videochamadas em tempo real com tradução automática de mensagens**

[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render)](./DEPLOY_RENDER_MANUAL.md)
[![Live Demo](https://img.shields.io/badge/Demo-Live-success?style=for-the-badge)](https://nativetalk-thlm.onrender.com)

</div>

---

## ✨ Principais Funcionalidades

### 🌍 **Sistema Multilíngue**
- 💬 **Tradução em Tempo Real** de mensagens com DeepL
- 🎤 **Transcrição de Áudio** durante videochamadas
- 🌐 **Interface multilíngue** - 7 idiomas suportados
- 💾 **Sistema de Cache** inteligente (reduz 60-80% das chamadas de API)
- 🗣️ Suporte a **25+ idiomas**

### 📹 **Videochamadas**
- 🎥 Chamadas de vídeo 1-on-1 com Stream Video SDK
- 🎤 Transcrição e tradução em tempo real
- 📝 Legendas multilíngues durante chamadas

### 💬 **Chat em Tempo Real**
- ✉️ Mensagens instantâneas com Stream Chat
- 🌐 Tradução inline (original + traduzido)
- 👥 Sistema de amizades
- ⚡ Indicadores de digitação

### 🎨 **Interface**
- 📱 **PWA** - Instalável em dispositivos móveis
- 🎨 **32 temas DaisyUI** personalizáveis
- 📱 **Mobile-first** e responsivo

---

## 🚀 Deploy em Produção

Este projeto está configurado para deploy no **Render**:

📖 **[Guia Completo de Deploy no Render](./DEPLOY_RENDER_MANUAL.md)**

**Demo ao vivo:** https://nativetalk-thlm.onrender.com

---

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (grátis)
- Conta no [Stream](https://getstream.io/) (grátis)
- _(Opcional)_ Conta [DeepL](https://www.deepl.com/pro-api) para tradução

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/nativetalk.git
cd nativetalk
```

### 2. Configure o Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` em `/backend`:

```env
PORT=5001
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/nativetalk?retryWrites=true&w=majority
STREAM_API_KEY=sua_stream_api_key
STREAM_API_SECRET=sua_stream_secret_key
JWT_SECRET_KEY=seu_jwt_secret_seguro
NODE_ENV=development

# Tradução (opcional - usa MyMemory como fallback)
DEEPL_API_KEY=sua_deepl_api_key
TRANSLATION_PROVIDER=deepl
```

### 3. Configure o Frontend

```bash
cd ../frontend
npm install
```

Crie o arquivo `.env` em `/frontend`:

```env
VITE_STREAM_API_KEY=sua_stream_api_key
```

### 4. Rode o projeto

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## 📚 Stack Tecnológico

### Frontend
- React 19 + Vite
- TailwindCSS + DaisyUI
- Stream Chat & Video SDK
- TanStack Query + Zustand
- i18next
- PWA (vite-plugin-pwa)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Stream SDK
- DeepL API (tradução)
- JWT Authentication

---

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📖 Documentação Adicional

- [📘 Guia de Tradução](./TRANSLATION_GUIDE.md)
- [📱 Otimizações Mobile](./MOBILE_OPTIMIZATION.md)
- [🔧 Deploy no Render](./DEPLOY_RENDER_MANUAL.md)
- [📦 Sistema de Cache](./CACHE_SYSTEM.md)

---

## 📝 Licença

Este projeto está sob a licença MIT.

---

## 🌟 Onde Obter as Credenciais

### MongoDB Atlas (Banco de Dados)
1. Acesse https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita
3. Crie um cluster (M0 - Free)
4. Em "Database Access", crie um usuário
5. Em "Network Access", adicione seu IP (ou 0.0.0.0/0 para todos)
6. Clique em "Connect" → "Connect your application"
7. Copie a string de conexão

### Stream (Chat e Vídeo)
1. Acesse https://getstream.io/
2. Crie uma conta gratuita
3. Crie uma nova app
4. Copie o **API Key** e **Secret Key**

### DeepL (Tradução - Opcional)
1. Acesse https://www.deepl.com/pro-api
2. Crie uma conta (500.000 caracteres/mês grátis)
3. Copie a API Key

**Sem DeepL:** A aplicação usa MyMemory como fallback automaticamente.
