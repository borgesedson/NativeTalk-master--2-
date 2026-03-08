@echo off
echo ========================================
echo  Deploy NativeTalk para Producao
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando status do Git...
git status
echo.

echo [2/5] Adicionando arquivos modificados...
git add .
echo.

echo [3/5] Fazendo commit das correcoes...
git commit -m "Fix: Adicionar suporte completo a grupos com correcoes de autenticacao e bugs"
echo.

echo [4/5] Enviando para GitHub (branch master)...
git push origin master
echo.

echo [5/5] Deploy concluido!
echo.
echo ========================================
echo  PROXIMO PASSO:
echo ========================================
echo.
echo Se voce ja tem o servico no Render:
echo   - O deploy automatico vai comecar em alguns segundos
echo   - Acesse: https://dashboard.render.com
echo   - Acompanhe os logs do deploy
echo.
echo Se ainda nao tem o servico no Render:
echo   1. Acesse: https://dashboard.render.com/create?type=web
echo   2. Conecte o repositorio: borgesedson/NativeTalk
echo   3. Siga as instrucoes do arquivo DEPLOY_RENDER_MANUAL.md
echo.
echo URL do seu app apos deploy: https://nativetalk.onrender.com
echo ========================================
echo.
pause
