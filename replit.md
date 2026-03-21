# NativeTalk - Replit Setup

## Project Overview
NativeTalk is a full-stack multilingual chat and video call application with real-time translation. It features a React/Vite frontend and an Express/Node.js backend served together on a single port.

## Architecture
- **Backend**: Express.js + Socket.IO (`NativeTalk-master/backend/`) — serves API, WebSocket, and built frontend static files on port 5000
- **Frontend**: React + Vite (`NativeTalk-master/frontend/`) — built to `frontend/dist/` and served by the backend
- **Real-time**: Socket.IO for calls, messaging, and audio translation
- **Chat**: Stream Chat SDK for persistent messaging
- **Translation**: Proxied to Argos (VPS) or MyMemory fallback
- **Transcription**: Whisper (VPS) or Azure Speech

## Running the App
The workflow `Start application` runs:
```
cd NativeTalk-master && node backend/src/server.js
```
The backend serves on port 5000 and serves the pre-built frontend from `frontend/dist/`.

To rebuild the frontend after changes:
```
cd NativeTalk-master/frontend && npm run build
```

## Required Secrets
These secrets must be set in Replit Secrets for full functionality:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET_KEY` — JWT signing secret
- `STEAM_API_KEY` — Stream Chat API key (note: misspelled in .env.example, actual key name in code may vary)
- `STEAM_API_SECRET` — Stream Chat API secret

Optional:
- `DEEPL_API_KEY` — DeepL translation API
- `AZURE_SPEECH_KEY` — Azure speech-to-text
- `AZURE_SPEECH_REGION` — Azure region

## Replit Compatibility Changes Made
1. Backend port changed from 5080 → 5000 (Replit webview requires port 5000)
2. CORS allowlist updated to include `*.replit.dev`, `*.replit.app`, `*.repl.co` patterns
3. Socket.IO CORS also updated with Replit domain patterns
4. Vite dev proxy updated from `localhost:5001` → `localhost:5000`
5. Root `package.json` scripts updated for Replit workflow

## Dependencies
- Backend: `npm install` in `NativeTalk-master/backend/`
- Frontend: `npm install` in `NativeTalk-master/frontend/`
