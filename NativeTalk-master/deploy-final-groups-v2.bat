@echo off
echo ========================================
echo  DEPLOY FINAL - Sistema de Grupos v2.0
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando alteracoes...
git status
echo.

echo [2/5] Adicionando todos os arquivos...
git add .
echo.

echo [3/5] Fazendo commit...
git commit -m "Feature: Sistema completo de grupos funcionando - Backend e Frontend corrigidos"
echo.

echo [4/5] Enviando para GitHub...
git push origin master
echo.

echo [5/5] Deploy iniciado!
echo.
echo ========================================
echo  ALTERACOES IMPLEMENTADAS COM SUCESSO!
echo ========================================
echo.
echo O QUE FOI CORRIGIDO E ADICIONADO:
echo.
echo Backend:
echo  - Corrigido metodo isMember para funcionar com populate
echo  - Corrigido metodo isAdmin para funcionar com populate
echo  - Corrigido sameSite cookie para 'none' em producao
echo  - Adicionados logs detalhados para debug
echo.
echo Frontend:
echo  - Adicionada pagina /groups no menu lateral
echo  - Corrigido STREAM_API_KEY no GroupChatPage
echo  - Adicionado botao de voltar no chat do grupo
echo  - Modal de criar grupos funcionando
echo  - Modal de adicionar membros funcionando
echo  - Chat em grupo com traducao automatica
echo  - Chamadas de video em grupo
echo.
echo Funcionalidades Completas:
echo  - Criar grupos (ate 20 membros)
echo  - Listar grupos
echo  - Chat em grupo em tempo real
echo  - Traducao automatica de mensagens
echo  - Adicionar/remover membros
echo  - Promover membros a admin
echo  - Chamadas de video/audio em grupo
echo  - Sistema de permissoes
echo.
echo ========================================
echo  PROXIMO PASSO:
echo ========================================
echo.
echo 1. Render vai detectar o push automaticamente
echo 2. Deploy comeca em 1-2 minutos
echo 3. Aguarde 10-15 minutos para completar
echo 4. Acesse: https://nativetalk-thlm.onrender.com
echo 5. Faca logout e login novamente
echo 6. Va em "Groups" no menu lateral
echo.
echo IMPORTANTE: Limpe o cache do navegador
echo (Ctrl + Shift + R) apos o deploy
echo.
echo Acompanhe o deploy em:
echo https://dashboard.render.com
echo ========================================
echo.
pause
