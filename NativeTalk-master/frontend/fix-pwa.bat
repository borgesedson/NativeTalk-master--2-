@echo off
echo ====================================
echo Corrigindo problemas do PWA...
echo ====================================
echo.

echo [1/3] Limpando cache e node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo.
echo [2/3] Instalando dependencias atualizadas...
npm install

echo.
echo [3/3] Verificando instalacao...
npm list vite-plugin-pwa

echo.
echo ====================================
echo Correccoes concluidas!
echo ====================================
echo.
echo Proximos passos:
echo 1. Execute: npm run dev
echo 2. Teste o PWA em https://localhost:5173
echo 3. Para producao: npm run build
echo.
pause
