@echo off
color 0A
echo ========================================
echo   INSTALADOR AUTOMATICO - NATIVETALK
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    echo Depois de instalar, FECHE e REABRA este terminal.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado!
node --version
npm --version
echo.

echo ========================================
echo   INSTALANDO FRONTEND
echo ========================================
cd frontend

echo.
echo [1/3] Limpando instalacao anterior...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del /f package-lock.json 2>nul

echo [2/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend!
    pause
    exit /b 1
)

echo [3/3] Frontend instalado com sucesso!
echo.

cd ..

echo ========================================
echo   INSTALANDO BACKEND
echo ========================================
cd backend

echo.
echo [1/3] Limpando instalacao anterior...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del /f package-lock.json 2>nul

echo [2/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo [3/3] Backend instalado com sucesso!
echo.

cd ..

echo ========================================
echo   INSTALACAO COMPLETA!
echo ========================================
echo.
echo Para iniciar o projeto:
echo.
echo 1. BACKEND (Terminal 1):
echo    cd backend
echo    npm start
echo.
echo 2. FRONTEND (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Acesse: http://localhost:5173
echo.
echo ========================================
pause
