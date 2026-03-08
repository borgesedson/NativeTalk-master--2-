#!/bin/bash
# ============================================================
# NativeTalk VPS Setup Script
# Instala ArgosTranslate + Whisper na VPS Hostinger
# ============================================================
# Uso: bash setup.sh
# ============================================================

set -e

echo "🚀 NativeTalk AI Server - Setup"
echo "================================"

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências do sistema
echo "🔧 Instalando dependências..."
apt install -y python3 python3-pip python3-venv git curl ufw ffmpeg

# 3. Configurar swap (importante para VPS com pouca RAM)
echo "💾 Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap de 4GB criado"
else
    echo "ℹ️ Swap já existe"
fi

# 4. Criar diretório do projeto
echo "📁 Criando diretório..."
mkdir -p /opt/nativetalk && cd /opt/nativetalk

# 5. Criar ambiente virtual
echo "🐍 Criando ambiente virtual Python..."
python3 -m venv venv
source venv/bin/activate

# 6. Instalar dependências Python
echo "📥 Instalando dependências Python (isso leva ~5min)..."
pip install --upgrade pip
pip install fastapi uvicorn[standard] pydantic

echo "📥 Instalando ArgosTranslate..."
pip install argostranslate

echo "📥 Instalando Whisper (isso leva ~3min)..."
pip install openai-whisper

# 7. Baixar modelos de idioma do Argos
echo "🌐 Baixando pacotes de idiomas..."
python3 -c "
import argostranslate.package
argostranslate.package.update_package_index()
available = argostranslate.package.get_available_packages()

# Pares essenciais
pairs = [
    ('en', 'pt'), ('pt', 'en'),
    ('en', 'es'), ('es', 'en'),
    ('en', 'fr'), ('fr', 'en'),
    ('en', 'de'), ('de', 'en'),
    ('en', 'it'), ('it', 'en'),
    ('en', 'ru'), ('ru', 'en'),
    ('en', 'zh'), ('zh', 'en'),
    ('en', 'ja'), ('ja', 'en'),
    ('en', 'ko'), ('ko', 'en'),
    ('en', 'ar'), ('ar', 'en'),
    ('pt', 'es'), ('es', 'pt'),
    ('pt', 'fr'), ('fr', 'pt'),
]

installed = 0
for pkg in available:
    if (pkg.from_code, pkg.to_code) in pairs:
        print(f'  📥 {pkg.from_code} → {pkg.to_code}')
        argostranslate.package.install_from_path(pkg.download())
        installed += 1

print(f'✅ {installed} pacotes de idiomas instalados!')
"

# 8. Configurar firewall
echo "🔒 Configurando firewall..."
ufw allow 22/tcp
ufw allow 5000/tcp
ufw --force enable

# 9. Copiar o servidor
echo "📄 O servidor será executado a partir de /opt/nativetalk/server.py"
echo "   Copie o arquivo server.py para este diretório."

# 10. Criar serviço systemd
echo "⚙️ Criando serviço systemd..."
cat > /etc/systemd/system/nativetalk-ai.service << 'SERVICEEOF'
[Unit]
Description=NativeTalk AI Server (Translate + Transcribe)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nativetalk
ExecStart=/opt/nativetalk/venv/bin/python3 /opt/nativetalk/server.py
Restart=always
RestartSec=10
Environment=WHISPER_MODEL=base
Environment=HOST=0.0.0.0
Environment=PORT=5000
Environment=ARGOS_DEVICE_TYPE=cpu

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable nativetalk-ai

echo ""
echo "============================================"
echo "✅ Instalação concluída!"
echo "============================================"
echo ""
echo "Próximos passos:"
echo "  1. Copie server.py para /opt/nativetalk/"
echo "  2. Inicie: systemctl start nativetalk-ai"
echo "  3. Verifique: curl http://localhost:5000/health"
echo ""
echo "Modelos Whisper disponíveis:"
echo "  tiny  (~39MB RAM)  - Rápido, menos preciso"
echo "  base  (~74MB RAM)  - Bom equilíbrio ⭐"
echo "  small (~244MB RAM) - Melhor precisão"
echo "  medium(~769MB RAM) - Alta precisão"
echo "  large (~1.5GB RAM) - Máxima precisão"
echo ""
echo "Para trocar: edite WHISPER_MODEL no serviço systemd"
echo "============================================"
