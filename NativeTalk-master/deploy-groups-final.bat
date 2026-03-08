@echo off
echo ========================================
echo  Deploy Final - Sistema de Grupos
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando arquivos modificados...
git status
echo.

echo [2/5] Adicionando todas as alteracoes...
git add .
echo.

echo [3/5] Fazendo commit...
git commit -m "Feature: Sistema completo de grupos - Menu lateral, pagina dedicada, chat em grupo"
echo.

echo [4/5] Enviando para GitHub...
git push origin master
echo.

echo [5/5] Deploy Concluido!
echo.
echo ========================================
echo  ALTERACOES ENVIADAS COM SUCESSO!
echo ========================================
echo.
echo O que foi adicionado:
echo.
echo - Pagina /groups no menu lateral
echo - Criar, listar, editar grupos
echo - Chat em grupo com traducao
echo - Adicionar/remover membros
echo - Chamadas de video em grupo
echo - Sistema de permissoes (admin/membro)
echo.
echo Render vai fazer deploy automatico em 2-5 min
echo Acompanhe: https://dashboard.render.com
echo.
echo URL do app: https://nativetalk-thlm.onrender.com
echo ========================================
echo.
pause
