#!/bin/bash
# Build script para Render

echo "📦 Instalando dependências do backend..."
npm install

echo "🎨 Buildando frontend..."
cd ../frontend
npm install
npm run build

echo "✅ Build completo!"
