@echo off
echo ========================================
echo  Reorganizando Interface de Grupos
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Adicionando alteracoes...
git add frontend/src/pages/MessagesPage.jsx
git add frontend/src/components/GroupList.jsx
echo.

echo [2/4] Fazendo commit...
git commit -m "Refactor: Mostrar grupos e mensagens juntos na mesma pagina"
echo.

echo [3/4] Enviando para GitHub...
git push origin master
echo.

echo [4/4] Concluido!
echo.
echo ========================================
echo Agora os grupos aparecem ANTES das
echo mensagens diretas na mesma pagina!
echo.
echo Aguarde o deploy no Render (5-10 min)
echo Acompanhe: https://dashboard.render.com
echo ========================================
echo.
pause
