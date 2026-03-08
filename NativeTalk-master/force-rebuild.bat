@echo off
echo ========================================
echo  Forcando Rebuild Completo
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Adicionando alteracoes...
git add .
echo.

echo [2/4] Fazendo commit...
git commit -m "Force: Limpar cache e forcar rebuild do frontend v1.2.0"
echo.

echo [3/4] Enviando para GitHub...
git push origin master
echo.

echo [4/4] Concluido!
echo.
echo ========================================
echo IMPORTANTE: No Render, faca o seguinte:
echo.
echo 1. Acesse: https://dashboard.render.com
echo 2. Clique no seu servico "nativetalk"
echo 3. Va em "Manual Deploy" - "Clear build cache and deploy"
echo 4. Aguarde 5-10 minutos
echo.
echo Isso vai garantir que o frontend seja
echo reconstruido do zero!
echo ========================================
echo.
pause
