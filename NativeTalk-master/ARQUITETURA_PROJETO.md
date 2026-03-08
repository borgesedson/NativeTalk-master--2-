# 🌐 Streamify - Arquitetura do Sistema Multilíngue

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STREAMIFY VIDEO CALLS                              │
│                     Sistema de Videochamadas Multilíngue                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                  │
│                         http://localhost:5173                                  │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────┐     ┌─────────────────────┐                        │
│  │   PÁGINAS (Pages)    │     │  COMPONENTES        │                        │
│  │                      │     │                     │                        │
│  │  • LoginPage         │────▶│  • CustomMessage    │◀── Botão de Tradução  │
│  │  • SignUpPage        │     │  • TranslatedMessage│                        │
│  │  • OnboardingPage    │     │  • ChatLoader       │                        │
│  │    - Native Lang     │     │  • CallButton       │                        │
│  │    - Learning Lang   │     │  • Navbar           │                        │
│  │    - Preferred Lang  │     │  • Sidebar          │                        │
│  │  • ChatPage          │     │  • ThemeSelector    │                        │
│  │  • CallPage          │     └─────────────────────┘                        │
│  │  • HomePage          │                                                     │
│  │  • NotificationsPage │     ┌─────────────────────┐                        │
│  └──────────────────────┘     │   HOOKS             │                        │
│                               │                     │                        │
│  ┌──────────────────────┐     │  • useAuthUser      │                        │
│  │   STATE MANAGEMENT   │     │  • useTranslation   │◀── Hook de Tradução   │
│  │                      │     │  • useLogin         │                        │
│  │  • Zustand           │     │  • useLogout        │                        │
│  │  • TanStack Query    │     │  • useSignUp        │                        │
│  └──────────────────────┘     └─────────────────────┘                        │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────┐               │
│  │               BIBLIOTECAS DE UI                            │               │
│  │  • TailwindCSS  • DaisyUI  • Lucide Icons                 │               │
│  │  • Stream Chat React  • Stream Video React SDK            │               │
│  └───────────────────────────────────────────────────────────┘               │
│                                                                                │
└────────────────────────────────┬──────────────────────────────────────────────┘
                                 │
                                 │ HTTP Requests (axios)
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Node.js/Express)                           │
│                             http://localhost:5001                              │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────┐                 │
│  │                    ROTAS (Routes)                        │                 │
│  │                                                          │                 │
│  │  /api/auth          ─────────▶  auth.route.js           │                 │
│  │  /api/users         ─────────▶  user.route.js           │                 │
│  │  /api/chat          ─────────▶  chat.route.js           │                 │
│  │  /api/translation   ─────────▶  translation.route.js ★  │  NOVO!          │
│  └─────────────────────────────────────────────────────────┘                 │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐                 │
│  │               CONTROLLERS (Controladores)                │                 │
│  │                                                          │                 │
│  │  • auth.controller.js      - Autenticação               │                 │
│  │  • user.controller.js      - Gerenciamento de Usuários  │                 │
│  │  • chat.controller.js      - Stream Token               │                 │
│  │  • translation.controller.js ★ - Tradução Automática    │  NOVO!          │
│  │    - translateMessage()                                 │                 │
│  │    - translateMessageMultiple()                         │                 │
│  └─────────────────────────────────────────────────────────┘                 │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐                 │
│  │                  SERVICES (Serviços)                     │                 │
│  │                                                          │                 │
│  │  • db.js              - Conexão MongoDB                 │                 │
│  │  • stream.js          - Stream Chat/Video               │                 │
│  │  • translation.js ★   - LibreTranslate API              │  NOVO!          │
│  │    - translateText()                                    │                 │
│  │    - detectLanguage()                                   │                 │
│  │    - getLanguageCode()                                  │                 │
│  │    - LANGUAGE_CODES (25+ idiomas)                       │                 │
│  └─────────────────────────────────────────────────────────┘                 │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐                 │
│  │                 MODELS (Modelos)                         │                 │
│  │                                                          │                 │
│  │  • User.js                                              │                 │
│  │    - fullName, email, password                          │                 │
│  │    - nativeLanguage                                     │                 │
│  │    - learningLanguage                                   │                 │
│  │    - preferredLanguage ★ (idioma para mensagens)        │  NOVO!          │
│  │    - friends, profilePic, bio                           │                 │
│  │                                                          │                 │
│  │  • FriendRequest.js                                     │                 │
│  └─────────────────────────────────────────────────────────┘                 │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────┐                 │
│  │               MIDDLEWARE (Intermediários)                │                 │
│  │                                                          │                 │
│  │  • auth.middleware.js  - Proteção de rotas (JWT)        │                 │
│  └─────────────────────────────────────────────────────────┘                 │
│                                                                                │
└────────────┬────────────────────┬─────────────────────┬─────────────────────┘
             │                    │                     │
             ▼                    ▼                     ▼
┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│   MongoDB Atlas     │  │  Stream API      │  │  LibreTranslate API ★   │
│                     │  │                  │  │                         │
│  • Users            │  │  • Chat          │  │  • Tradução Gratuita    │
│  • FriendRequests   │  │  • Video Calls   │  │  • 25+ Idiomas          │
│  • Mensagens        │  │  • Reactions     │  │  • Open Source          │
│                     │  │  • Typing        │  │  • Sem API Key          │
└─────────────────────┘  └──────────────────┘  └─────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                         🌍 FLUXO DE TRADUÇÃO
═══════════════════════════════════════════════════════════════════════════════

  Usuário A (Português)                         Usuário B (Inglês)
        │                                              │
        │  1. Envia: "Olá, tudo bem?"                 │
        ├──────────────────────────────────────────▶  │
        │                                              │
        │                                              │  2. Recebe mensagem
        │                                              │     em português
        │                                              │
        │                                              │  3. Clica no botão 🌐
        │                                              │
        │                                              │  4. POST /api/translation/translate
        │                                              │     { text: "Olá, tudo bem?",
        │                                              │       targetUserId: "userB_id" }
        │                                              │
        │                                              ▼
        │                                    ┌─────────────────────┐
        │                                    │  Backend processa:   │
        │                                    │  1. Busca idioma     │
        │                                    │     preferido userB  │
        │                                    │  2. Chama LibreTranslate │
        │                                    │  3. pt → en          │
        │                                    └─────────────────────┘
        │                                              │
        │                                              │  5. Retorna:
        │                                              │     { translatedText:
        │                                              │       "Hello, how are you?",
        │                                              │       sourceLanguage: "pt",
        │                                              │       targetLanguage: "en" }
        │                                              │
        │                                              ▼
        │                                         Exibe tradução:
        │                                         ┌──────────────────────┐
        │                                         │ Olá, tudo bem?       │
        │                                         │ ─────────────────    │
        │                                         │ 🌐 Tradução (en):    │
        │                                         │ Hello, how are you?  │
        │                                         └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           🎨 TECNOLOGIAS UTILIZADAS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND                    │  BACKEND                  │  SERVIÇOS         │
│                              │                           │                   │
│  • React 19                  │  • Node.js 24             │  • MongoDB Atlas  │
│  • Vite 6                    │  • Express.js             │  • Stream API     │
│  • TailwindCSS + DaisyUI     │  • Mongoose               │  • LibreTranslate │
│  • TanStack Query            │  • JWT + bcrypt           │                   │
│  • Zustand                   │  • dotenv                 │                   │
│  • Stream Chat React SDK     │  • Stream Chat SDK        │                   │
│  • Stream Video React SDK    │  • Nodemon                │                   │
│  • React Router 7            │                           │                   │
│  • Axios                     │                           │                   │
│  • Lucide Icons              │                           │                   │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                         ✨ RECURSOS PRINCIPAIS
═══════════════════════════════════════════════════════════════════════════════

  ✅  Chat em tempo real com typing indicators
  ✅  Videochamadas 1-on-1 e em grupo
  ✅  Compartilhamento de tela
  ✅  Sistema de amizades
  ✅  Notificações em tempo real
  ✅  Notificações
  ✅  32 temas de UI (DaisyUI)
  ✅  Autenticação JWT segura
  ✅  🌍 TRADUÇÃO MULTILÍNGUE AUTOMÁTICA (25+ idiomas)
  ✅  Profile customizável com idiomas
  ✅  Mensagens com texto original + tradução
  ✅  Detecção automática de idioma


═══════════════════════════════════════════════════════════════════════════════
                    📊 IDIOMAS SUPORTADOS (LibreTranslate)
═══════════════════════════════════════════════════════════════════════════════

  Português (pt)    Inglês (en)       Espanhol (es)     Francês (fr)
  Alemão (de)       Italiano (it)     Russo (ru)        Chinês (zh)
  Japonês (ja)      Coreano (ko)      Árabe (ar)        Hindi (hi)
  Holandês (nl)     Polonês (pl)      Turco (tr)        Vietnamita (vi)
  Tailandês (th)    Indonésio (id)    Grego (el)        Tcheco (cs)
  Sueco (sv)        Dinamarquês (da)  Finlandês (fi)    Norueguês (no)
  Ucraniano (uk)    Hebraico (he)     E muito mais...
  A seleção de idiomas foi otimizada para reduzir custos de hospedagem.
  Idiomas iniciais suportados:

  • Português (pt)
  • Inglês (en)
  • Espanhol (es)
  • Francês (fr)
  • Alemão (de)

  (É possível adicionar mais idiomas conforme a necessidade, ajustando a configuração do servidor.)
```
