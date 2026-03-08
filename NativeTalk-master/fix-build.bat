@echo off
echo ========================================
echo  Corrigindo Build do Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Adicionando correcao do build...
git add backend/package.json
echo.

echo [2/4] Fazendo commit...
git commit -m "Fix: Corrigir script de build para reconstruir frontend em producao"
echo.

echo [3/4] Enviando para GitHub...
git push origin master
echo.

echo [4/4] Concluido!
echo.
echo ========================================
echo O Render vai detectar o push e fazer
echo um novo deploy em alguns segundos.
echo.
echo Acompanhe em: https://dashboard.render.com
echo ========================================
echo.
pause
