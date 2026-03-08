# 🚀 INÍCIO RÁPIDO - Teste Celular + PC

## ⚡ Método Rápido (3 Comandos)

### 1️⃣ Descobrir seu IP

```powershell
ipconfig
```

Procure por **"Endereço IPv4"** (exemplo: `192.168.1.10`)

---

### 2️⃣ Iniciar Servidores

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

✅ O Vite vai mostrar:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.10:5173/  ← USE ESTE NO CELULAR!
```

---

### 3️⃣ Acessar no Celular

1. **Conectar celular no MESMO Wi-Fi do PC**
2. **Abrir navegador do celular** (Chrome recomendado)
3. **Digitar o IP** que apareceu no Network (ex: `http://192.168.1.10:5173`)

---

## 🛡️ Se o Windows Bloquear

Quando o Windows mostrar alerta de Firewall:

1. ✅ Marcar: **"Redes privadas"**
2. ✅ Clicar: **"Permitir acesso"**

**Ou liberar manualmente:**

```powershell
# Execute como Administrador (clique direito no PowerShell → Executar como administrador)

# Liberar Frontend
New-NetFirewallRule -DisplayName "NativeTalk Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Liberar Backend  
New-NetFirewallRule -DisplayName "NativeTalk Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
```

---

## 👥 Criar Usuários

### 💻 No PC:
- Acessar: `http://localhost:5173`
- Criar conta: `user.a@test.com` / `123456`
- Native Language: **Portuguese**
- Learning Language: **English**

### 📱 No Celular:
- Acessar: `http://SEU_IP:5173` (ex: `http://192.168.1.10:5173`)
- Criar conta: `user.b@test.com` / `123456`
- Native Language: **English**
- Learning Language: **Portuguese**

---

## 💬 Testar

1. **PC**: Enviar friend request para User B
2. **Celular**: Aceitar o pedido
3. **PC**: Enviar mensagem "Olá!"
4. **Celular**: Ver tradução "Hello!"
5. **PC**: Iniciar videochamada 📹
6. **Celular**: Aceitar e permitir câmera/microfone
7. **PC**: Clicar no 🎤 e falar em português
8. **Celular**: Ver legenda em inglês
9. **🎉 SUCESSO!**

---

## 🐛 Problemas?

### ❌ "Este site não pode ser acessado"

**Verificar:**
1. IP correto? (`ipconfig` no PC)
2. Mesmo Wi-Fi? (PC e celular na mesma rede)
3. Servidores rodando? (ver terminais)
4. Firewall permitiu? (ver alertas do Windows)

**Teste rápido no celular:**
```
http://SEU_IP:5001
```
Se aparecer "Cannot GET /", está conectando! ✅

---

### ❌ Script não executa

**Solução:**
```powershell
PowerShell -ExecutionPolicy Bypass -File setup-mobile.ps1
```

**Ou descubra o IP manualmente:**
```powershell
ipconfig
```

---

## 📚 Mais Detalhes

Veja: **MOBILE_TESTING_GUIDE.md** (guia completo)

---

✅ **3 passos**: IP → Servidores → Celular
🎯 **5 minutos** para configurar
📱 **Chrome Android** funciona melhor
🎤 **Transcrição grátis** (Web Speech API)
