@echo off
echo ========================================
echo  INVESTIGACAO PROFUNDA - GRUPOS
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] VERIFICANDO ARQUIVOS BACKEND...
if exist "backend\src\controllers\group.controller.js" (
    echo ✅ group.controller.js [EXISTE]
) else (
    echo ❌ group.controller.js [NAO EXISTE] - PROBLEMA!
)

if exist "backend\src\routes\group.routes.js" (
    echo ✅ group.routes.js [EXISTE]
) else (
    echo ❌ group.routes.js [NAO EXISTE] - PROBLEMA!
)

echo.
echo [2/6] VERIFICANDO ARQUIVOS FRONTEND...
if exist "frontend\src\pages\GroupsPage.jsx" (
    echo ✅ GroupsPage.jsx [EXISTE]
) else (
    echo ❌ GroupsPage.jsx [NAO EXISTE] - PROBLEMA CRITICO!
)

if exist "frontend\src\lib\groupApi.js" (
    echo ✅ groupApi.js [EXISTE]
) else (
    echo ❌ groupApi.js [NAO EXISTE] - PROBLEMA!
)

echo.
echo [3/6] VERIFICANDO CONFIGURACAO NO APP.JSX...
findstr /C:"GroupsPage" "frontend\src\App.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ GroupsPage importado no App.jsx
) else (
    echo ❌ GroupsPage NAO importado no App.jsx - PROBLEMA CRITICO!
)

findstr /C:"/groups" "frontend\src\App.jsx" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Rota /groups configurada no App.jsx
) else (
    echo ❌ Rota /groups NAO configurada - PROBLEMA CRITICO!
)

echo.
echo [4/6] VERIFICANDO ARQUIVOS NO GITHUB...
git ls-tree -r HEAD | findstr GroupsPage >nul 2>&1
if %errorlevel%==0 (
    echo ✅ GroupsPage esta no repositorio GitHub
) else (
    echo ❌ GroupsPage NAO esta no repositorio GitHub - PROBLEMA!
)

echo.
echo [5/6] VERIFICANDO STATUS DO GIT...
echo Status atual:
git status --porcelain

echo.
echo [6/6] RESUMO DO PROBLEMA...
echo ========================================

if not exist "frontend\src\pages\GroupsPage.jsx" (
    echo 🔍 PROBLEMA IDENTIFICADO: GroupsPage.jsx NAO EXISTE!
    echo.
    echo CAUSA: Sistema de grupos nao foi implementado
    echo SOLUCAO: Implementar GroupsPage.jsx e configurar rotas
) else (
    findstr /C:"GroupsPage" "frontend\src\App.jsx" >nul 2>&1
    if %errorlevel% neq 0 (
        echo 🔍 PROBLEMA IDENTIFICADO: GroupsPage existe mas nao esta no App.jsx!
        echo.
        echo CAUSA: Rotas nao configuradas
        echo SOLUCAO: Adicionar import e rota no App.jsx
    ) else (
        git ls-tree -r HEAD | findstr GroupsPage >nul 2>&1
        if %errorlevel% neq 0 (
            echo 🔍 PROBLEMA IDENTIFICADO: GroupsPage nao esta no GitHub!
            echo.
            echo CAUSA: Arquivo nao foi commitado
            echo SOLUCAO: git add . && git commit && git push
        ) else (
            echo 🔍 PROBLEMA IDENTIFICADO: Tudo parece correto!
            echo.
            echo CAUSA PROVAVEL: Cache do Render ou build
            echo SOLUCAO: Force rebuild com cache limpo no Render
        )
    )
)

echo ========================================
echo.
pause