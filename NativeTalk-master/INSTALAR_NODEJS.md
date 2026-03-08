# 🚀 Como Instalar Node.js

## ❌ Problema Detectado
Seu sistema não tem Node.js instalado. É necessário para rodar o projeto React.

## ✅ Solução: Instalar Node.js

### Método 1: Download Direto (Recomendado)

1. **Acesse:** https://nodejs.org/
2. **Baixe** a versão **LTS** (Long Term Support) - recomendado
3. **Execute** o instalador `.msi`
4. **Siga** o assistente de instalação (Next, Next, Install)
5. **Marque** a opção: "Automatically install the necessary tools"

### Método 2: Usando Chocolatey (Se já tiver)

```powershell
# Como Administrador
choco install nodejs-lts
```

### Método 3: Usando winget (Windows 11)

```powershell
winget install OpenJS.NodeJS.LTS
```

## 🔍 Verificando a Instalação

Após instalar, **FECHE E REABRA** o PowerShell/VS Code, então rode:

```powershell
node --version
# Deve mostrar: v20.x.x ou v22.x.x

npm --version
# Deve mostrar: 10.x.x
```

## 🎯 Depois de Instalar

```powershell
# Vá para a pasta do projeto
cd "C:\Users\Cunae\Downloads\NativeTalk-master\NativeTalk-master\frontend"

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🐛 Troubleshooting

### "npm não é reconhecido" depois de instalar
1. **Feche completamente** o VS Code
2. **Reabra** o VS Code
3. Abra um **novo terminal**

### Erro de permissão
Execute o PowerShell como **Administrador**

### Versão antiga do Node
```powershell
# Desinstalar versão antiga
# Painel de Controle → Programas → Desinstalar Node.js
# Depois instale a versão mais recente
```

## 📦 Versões Recomendadas

- **Node.js:** v20.x ou v22.x (LTS)
- **npm:** 10.x (vem junto com Node.js)

## ⚡ Link de Download Direto

**Windows 64-bit:** https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi

---

**Depois de instalar, volte aqui e rode os comandos acima!** 🎉
