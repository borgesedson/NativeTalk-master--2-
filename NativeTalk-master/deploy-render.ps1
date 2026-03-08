# Script de Deploy para Render.com via API
# Execute: .\deploy-render.ps1
# Este script cria o serviço se ele não existir, ou força um novo deploy se já existir.
Write-Host "🚀 Deploy NativeTalk no Render.com" -ForegroundColor Cyan
Write-Host ""

# --- INÍCIO: Carregamento automático de variáveis do arquivo .env ---
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "✅ Arquivo .env encontrado. Carregando segredos..." -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^(?<key>[^=]+)=(?<value>.*)$') {
            # Remove aspas se existirem no valor
            $cleanedValue = $Matches.value.Trim().Trim('"').Trim("'")
            Set-Variable -Name $Matches.key -Value $cleanedValue
        }
    }
} else {
    Write-Host "❌ ERRO: Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Crie um arquivo chamado '.env' na raiz do projeto e adicione suas chaves." -ForegroundColor Yellow
    Write-Host "Exemplo:"
    Write-Host "RENDER_API_KEY=sua_chave"
    Write-Host "MONGO_URI=sua_uri"
    exit 1
}
# --- FIM: Carregamento de variáveis ---
 
if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY) -or [string]::IsNullOrWhiteSpace($MONGO_URI)) {
    Write-Host "❌ A API Key do Render e a URI do MongoDB não foram encontradas no arquivo .env!" -ForegroundColor Red
    exit 1
}

# Headers para todas as requisições
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host ""
Write-Host "📝 Criando Web Service..." -ForegroundColor Yellow

# Configuração do serviço
$body = @{
    name = "nativetalk"
    type = "web"
    repo = "https://github.com/borgesedson/NativeTalk"
    branch = "master"
    rootDir = "backend"
    buildCommand = "npm install && npm run build"
    startCommand = "npm start"
    envVars = @(
        @{
            key = "MONGO_URI"
            value = $MONGO_URI
        },
        @{
            key = "JWT_SECRET"
            value = $JWT_SECRET
        },
        @{
            key = "STREAM_API_KEY"
            value = $STREAM_API_KEY
        },
        @{
            key = "STREAM_SECRET_KEY"
            value = $STREAM_SECRET_KEY
        },
        @{
            key = "DEEPL_API_KEY"
            value = $DEEPL_API_KEY
        },
        @{
            key = "TRANSLATION_PROVIDER"
            value = "deepl"
        },
        @{
            key = "NODE_ENV"
            value = "production"
        },
        @{
            key = "PORT"
            value = "10000"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    # 1. Verificar se o serviço já existe
    Write-Host "🔍 Verificando se o serviço 'nativetalk' já existe..." -ForegroundColor Yellow
    $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?name=nativetalk" -Method Get -Headers $headers
    $service = $services | Where-Object { $_.service.name -eq "nativetalk" }

    if ($service) {
        # 2. Se existe, força um novo deploy com cache limpo
        $serviceId = $service.service.id
        Write-Host "✅ Serviço encontrado (ID: $serviceId). Forçando um novo deploy com cache limpo..." -ForegroundColor Green
        
        $deployBody = @{ clearCache = "clear" } | ConvertTo-Json
        $deployResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys" -Method Post -Headers $headers -Body $deployBody

        Write-Host "🚀 Deploy iniciado com sucesso! Commit: $($deployResponse.commit.id)" -ForegroundColor Cyan
        Write-Host "📊 Acompanhe o progresso em: https://dashboard.render.com/web/$serviceId"

    } else {
        # 3. Se não existe, cria o serviço
        Write-Host "🤔 Serviço não encontrado. Criando um novo..." -ForegroundColor Yellow
        $createResponse = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Method Post -Headers $headers -Body $body
        
        $newServiceId = $createResponse.service.id
        $newServiceName = $createResponse.service.name

        Write-Host ""
        Write-Host "✅ Web Service '$newServiceName' criado com sucesso!" -ForegroundColor Green
        Write-Host "🌐 Service ID: $newServiceId" -ForegroundColor Cyan
        Write-Host "🔗 URL: https://$newServiceName.onrender.com" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 Acompanhe o deploy inicial em: https://dashboard.render.com/web/$newServiceId"
    }

    Write-Host ""
    Write-Host "⏳ O deploy pode levar de 5 a 15 minutos. Limpe o cache do navegador (Ctrl+Shift+R) após a conclusão." -ForegroundColor Magenta

} catch {
    Write-Host ""
    Write-Host "❌ Ocorreu um erro durante a operação:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    # Tenta extrair a mensagem de erro da resposta da API, se disponível
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorText = $reader.ReadToEnd()
    Write-Host "Detalhes da API: $errorText" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "  - Verifique se a API Key está correta" -ForegroundColor White
    Write-Host "  - Confira se o repositório está público no GitHub" -ForegroundColor White
}
