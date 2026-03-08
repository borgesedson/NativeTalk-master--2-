# Script de Configuração Rápida - NativeTalk
# Para executar: PowerShell -ExecutionPolicy Bypass -File setup-mobile.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   NativeTalk - Configuração para Mobile" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Descobrir IP do computador
Write-Host "1. Descobrindo IP do computador..." -ForegroundColor Yellow

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    # Tentar Ethernet se Wi-Fi não funcionar
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object -First 1).IPAddress
}

if ($ipAddress) {
    Write-Host "   ✅ IP encontrado: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "   ❌ Não foi possível encontrar o IP automaticamente" -ForegroundColor Red
    Write-Host "   Execute 'ipconfig' manualmente e procure por 'Endereço IPv4'" -ForegroundColor Yellow
    $ipAddress = Read-Host "   Digite seu IP"
}

# 2. Verificar se as portas estão disponíveis
Write-Host "`n2. Verificando portas..." -ForegroundColor Yellow

$portBackend = 5001
$portFrontend = 5173

try {
    $null = Test-NetConnection -ComputerName localhost -Port $portBackend -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null
    Write-Host "   ⚠️  Porta $portBackend já está em uso (Backend pode já estar rodando)" -ForegroundColor Yellow
} catch {
    Write-Host "   ✅ Porta $portBackend disponível" -ForegroundColor Green
}

try {
    $null = Test-NetConnection -ComputerName localhost -Port $portFrontend -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null
    Write-Host "   ⚠️  Porta $portFrontend já está em uso (Frontend pode já estar rodando)" -ForegroundColor Yellow
} catch {
    Write-Host "   ✅ Porta $portFrontend disponível" -ForegroundColor Green
}

# 3. Configurar Firewall
Write-Host "`n3. Configurando Firewall do Windows..." -ForegroundColor Yellow

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    try {
        # Verificar se a regra já existe
        $ruleBackend = Get-NetFirewallRule -DisplayName "NativeTalk Backend" -ErrorAction SilentlyContinue
        $ruleFrontend = Get-NetFirewallRule -DisplayName "NativeTalk Frontend" -ErrorAction SilentlyContinue
        
        if (-not $ruleBackend) {
            New-NetFirewallRule -DisplayName "NativeTalk Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow -Profile Private | Out-Null
            Write-Host "   ✅ Regra de Firewall criada para Backend (porta 5001)" -ForegroundColor Green
        } else {
            Write-Host "   ℹ️  Regra de Firewall para Backend já existe" -ForegroundColor Cyan
        }
        
        if (-not $ruleFrontend) {
            New-NetFirewallRule -DisplayName "NativeTalk Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Private | Out-Null
            Write-Host "   ✅ Regra de Firewall criada para Frontend (porta 5173)" -ForegroundColor Green
        } else {
            Write-Host "   ℹ️  Regra de Firewall para Frontend já existe" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "   ❌ Erro ao configurar Firewall: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Execute como Administrador para configurar o Firewall automaticamente" -ForegroundColor Yellow
    Write-Host "   Ou permita manualmente quando o Windows solicitar" -ForegroundColor Yellow
}

# 4. Gerar QR Code (texto) para facilitar acesso no celular
Write-Host "`n4. URLs para acesso:" -ForegroundColor Yellow

$frontendUrl = "http://${ipAddress}:5173"
$backendUrl = "http://${ipAddress}:5001"

Write-Host "`n   📱 ACESSE NO CELULAR:" -ForegroundColor Green
Write-Host "   ================================" -ForegroundColor White
Write-Host "   $frontendUrl" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "   ================================" -ForegroundColor White

Write-Host "`n   💻 Acesso no Computador:" -ForegroundColor Green
Write-Host "   http://localhost:5173" -ForegroundColor Cyan

# 5. Instruções
Write-Host "`n5. Próximos Passos:" -ForegroundColor Yellow
Write-Host "   1. Certifique-se que o celular está no MESMO Wi-Fi" -ForegroundColor White
Write-Host "   2. No TERMINAL 1, execute: cd backend && npm run dev" -ForegroundColor White
Write-Host "   3. No TERMINAL 2, execute: cd frontend && npm run dev" -ForegroundColor White
Write-Host "   4. No celular, abra o navegador e acesse:" -ForegroundColor White
Write-Host "      $frontendUrl" -ForegroundColor Cyan
Write-Host "   5. Crie dois usuários (um no PC, outro no celular)" -ForegroundColor White
Write-Host "   6. Adicione como amigos e teste o chat/vídeo!" -ForegroundColor White

# 6. Copiar URL para clipboard
Write-Host "`n6. Facilitando acesso..." -ForegroundColor Yellow
try {
    Set-Clipboard -Value $frontendUrl
    Write-Host "   ✅ URL copiada para área de transferência!" -ForegroundColor Green
    Write-Host "   Cole no navegador do celular (Ctrl+V)" -ForegroundColor Cyan
} catch {
    Write-Host "   ℹ️  Copie manualmente: $frontendUrl" -ForegroundColor Cyan
}

# 7. Teste de conectividade
Write-Host "`n7. Teste de conectividade:" -ForegroundColor Yellow
Write-Host "   Quando os servidores estiverem rodando, teste no celular:" -ForegroundColor White
Write-Host "   1. Abrir navegador" -ForegroundColor White
Write-Host "   2. Acessar: $backendUrl" -ForegroundColor Cyan
Write-Host "   3. Se aparecer 'Cannot GET /', esta conectando!" -ForegroundColor White

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Configuracao Concluida!" -ForegroundColor Green
Write-Host "   Leia: MOBILE_TESTING_GUIDE.md para mais detalhes" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Perguntar se deseja abrir o guia
$openGuide = Read-Host "Deseja abrir o guia completo agora? (S/N)"
if ($openGuide -eq "S" -or $openGuide -eq "s") {
    if (Test-Path "MOBILE_TESTING_GUIDE.md") {
        Start-Process "MOBILE_TESTING_GUIDE.md"
    } else {
        Write-Host "Arquivo MOBILE_TESTING_GUIDE.md não encontrado" -ForegroundColor Red
    }
}

Write-Host "`nPressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
