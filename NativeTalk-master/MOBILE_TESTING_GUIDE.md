# 📱 Guia de Teste: Celular + Computador

## 🎯 Objetivo
Testar o NativeTalk com **2 usuários**:
- 👨‍💻 **Usuário A** - Computador (Português)
- 📱 **Usuário B** - Celular (Inglês)

---

## 🔧 Configuração Inicial

### Passo 1: Descobrir o IP do Computador

#### Windows (PowerShell):
```powershell
ipconfig
```

Procurar por **"Endereço IPv4"** na seção do adaptador de rede ativo:
```
Adaptador de Rede Sem Fio Wi-Fi:
   Endereço IPv4. . . . . . . . : 192.168.1.10  ← ESSE É SEU IP
```

**Anote esse IP!** Vamos chamar de `SEU_IP`

#### Exemplos comuns:
- `192.168.0.X` ou `192.168.1.X` (Wi-Fi residencial)
- `10.0.0.X` (Algumas redes)
- `172.16.X.X` até `172.31.X.X` (Redes corporativas)

---

### Passo 2: Verificar Firewall do Windows

O Windows pode bloquear conexões externas. Vamos liberar:

#### Opção 1: Permitir Node.js no Firewall (Recomendado)

1. Quando iniciar os servidores, o Windows pode mostrar um alerta
2. ✅ **Marcar** "Redes privadas"
3. ✅ Clicar em **"Permitir acesso"**

#### Opção 2: Desabilitar Firewall Temporariamente (Apenas para teste)

```powershell
# EXECUTAR COMO ADMINISTRADOR
# Desabilitar firewall (temporário)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Depois do teste, REABILITAR:
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

⚠️ **Importante**: Reabilitar depois do teste!

---

### Passo 3: Garantir que Celular e Computador Estão na Mesma Rede

✅ Ambos devem estar conectados no **MESMO Wi-Fi**

**Verificar no celular:**
- Android: Configurações → Wi-Fi → Nome da rede
- iOS: Ajustes → Wi-Fi → Nome da rede

**Deve ser EXATAMENTE o mesmo nome da rede do computador!**

---

## 🚀 Iniciar Servidores

### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```

✅ Aguardar: `Server is running on port 5001`

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

✅ Aguardar:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.10:5173/  ← IP APARECE AQUI!
```

**ANOTE ESSES DOIS ENDEREÇOS:**
- Frontend: `http://SEU_IP:5173`
- Backend: `http://SEU_IP:5001`

---

## 👨‍💻 Configurar Usuário A (Computador)

### 1. Abrir no Navegador do PC
```
http://localhost:5173
```

### 2. Criar Conta
- **Email**: `user.a@test.com`
- **Password**: `123456`
- **Full Name**: `User A`

### 3. Complete Profile
- **Native Language**: Portuguese
- **Learning Language**: English
- **Location**: São Paulo, Brazil
- **Bio**: Quero praticar inglês

---

## 📱 Configurar Usuário B (Celular)

### 1. Conectar Celular no Mesmo Wi-Fi

### 2. Abrir Navegador do Celular

**Use o IP que você anotou!**

Exemplo (substitua `192.168.1.10` pelo SEU IP):
```
http://192.168.1.10:5173
```

### 3. Criar Conta
- **Email**: `user.b@test.com`
- **Password**: `123456`
- **Full Name**: `User B`

### 4. Complete Profile
- **Native Language**: English
- **Learning Language**: Portuguese
- **Location**: New York, USA
- **Bio**: I want to practice Portuguese

---

## 👥 Adicionar Como Amigos

### No Computador (User A):
1. Ir para Home
2. Seção **"Meet New Learners"**
3. Encontrar **User B**
4. Clicar **"Send Friend Request"** (Enviar Solicitação de Amizade)

### No Celular (User B):
1. Clicar no ícone de **🔔 Notifications** (canto superior direito)
2. Ver pedido de **User A**
3. Clicar **"Accept"** (Aceitar)

✅ **Agora são amigos!**

---

## 💬 Testar Chat com Tradução

### Computador (User A) envia:
```
Olá! Como você está?
```

### Celular (User B) vê:
```
ORIGINAL: Olá! Como você está?
TRANSLATED: Hello! How are you?
```

### Celular (User B) responde:
```
I'm great! Nice to meet you!
```

### Computador (User A) vê:
```
ORIGINAL: I'm great! Nice to meet you!
TRANSLATED: Estou ótimo! Prazer em conhecê-lo!
```

🎉 **Chat com tradução funcionando!**

---

## 📹 Testar Videochamada

### Iniciar Chamada

#### No Computador (User A):
1. Na lista de amigos, clicar no ícone **📹** ao lado de "User B"
2. Aguardar User B aceitar

#### No Celular (User B):
1. Aceitar a chamada
2. **Permitir acesso** à câmera e microfone

### ✅ Deve Aparecer:
- 📹 Vídeo de ambos usuários
- 🎤 Botão de microfone (roxo, grande)
- Controles de chamada na parte inferior

---

## 🎤 Testar Transcrição de Áudio

### No Computador (User A):
1. Clicar no **botão 🎤 roxo grande** (parte inferior da tela)
2. Falar em português: **"Olá, tudo bem com você?"**
3. Ver indicador: 🔴 **Gravando... 🌐**

### No Celular (User B):
1. Verá a **legenda traduzida** na parte inferior:
   ```
   "Hello, is everything okay with you?"
   ```

### No Celular (User B):
1. Clicar no botão 🎤
2. Falar em inglês: **"Yes, I'm doing great!"**

### No Computador (User A):
1. Verá a legenda traduzida:
   ```
   "Sim, estou indo muito bem!"
   ```

🎉 **Transcrição com tradução funcionando!**

---

## 🐛 Solução de Problemas

### ❌ Celular não consegue acessar

#### Problema: "Este site não pode ser acessado"

**Soluções:**

1. **Verificar IP correto**
   ```powershell
   ipconfig
   ```
   Usar o IP exato que aparece

2. **Verificar se estão na mesma rede Wi-Fi**
   - Celular e PC devem estar no MESMO Wi-Fi

3. **Verificar se servidores estão rodando**
   ```powershell
   # Backend deve mostrar:
   Server is running on port 5001
   
   # Frontend deve mostrar:
   Network: http://192.168.1.10:5173/
   ```

4. **Testar conexão**
   
   No celular, abrir navegador e ir para:
   ```
   http://SEU_IP:5001
   ```
   
   Se aparecer "Cannot GET /", **está funcionando!** ✅

5. **Liberar portas no Firewall**
   
   Execute como Administrador:
   ```powershell
   # Liberar porta 5173 (Frontend)
   New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   
   # Liberar porta 5001 (Backend)
   New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
   ```

### ❌ Vídeo não funciona no celular

#### Problema: Câmera/microfone bloqueados

**Soluções:**

1. **Chrome Android**: 
   - Clicar no cadeado 🔒 na barra de endereço
   - Permitir Câmera e Microfone

2. **Safari iOS**:
   - Ajustes → Safari → Câmera/Microfone
   - Permitir para o site

### ❌ Transcrição não funciona no celular

#### Chrome Android: ✅ Deve funcionar (Web Speech API)
#### Safari iOS: ⚠️ Suporte limitado

**Alternativa para iOS:**
- Usar Azure Speech Service (ver `TRANSCRIPTION_TESTING.md`)

### ❌ CORS Error

**Sintoma**: Console mostra erro de CORS

**Solução**: Já configurado automaticamente! Se ainda aparecer:

1. Verificar se o IP está correto
2. Reiniciar backend: `npm run dev`
3. Limpar cache do navegador (Ctrl+Shift+Del)

### ❌ Backend não responde

**Verificar logs do terminal backend:**

Se aparecer:
```
⚠️ CORS bloqueado para: http://192.168.1.20:5173
```

Significa que o celular está tentando acessar. O backend está configurado para permitir.

---

## 📊 Logs para Verificar

### Terminal Backend (deve mostrar):
```
Server is running on port 5001
✅ MongoDB conectado

[Quando usar tradução]
💾 Cache HIT (45/50) - Economia: 45 chamadas

[Quando usar transcrição]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 TRANSCRIÇÃO + TRADUÇÃO:
🗣️  Quem fala: 507f1f77... (portuguese)
👂 Quem ouve: 507f191e... (english)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Console do Navegador (F12 no PC, DevTools no celular):
```javascript
✅ Web Speech API disponível
🎤 Web Speech reconhecimento iniciado
📝 Transcrição: "Olá, tudo bem?"
```

---

## 🎯 Checklist Completo

### Preparação
- [ ] IP do computador anotado
- [ ] Firewall permite Node.js
- [ ] Celular e PC no mesmo Wi-Fi
- [ ] Backend rodando (porta 5001)
- [ ] Frontend rodando (porta 5173)

### Testes - Chat
- [ ] User A criado no PC
- [ ] User B criado no celular
- [ ] Amizade estabelecida
- [ ] Mensagem PT → EN traduzida ✅
- [ ] Mensagem EN → PT traduzida ✅
- [ ] Cache de traduções funcionando

### Testes - Videochamada
- [ ] Chamada iniciada
- [ ] Vídeo de ambos aparecendo
- [ ] Áudio funcionando
- [ ] Controles visíveis

### Testes - Transcrição
- [ ] Botão 🎤 visível
- [ ] Fala PT reconhecida
- [ ] Legenda traduzida para EN
- [ ] Fala EN reconhecida
- [ ] Legenda traduzida para PT

---

## 💡 Dicas Extras

### Para Melhor Experiência:

1. **Use fones de ouvido** para evitar eco
2. **Ambiente silencioso** para melhor transcrição
3. **Fale claramente** e pausadamente
4. **Chrome no Android** tem melhor suporte que Safari iOS

### URLs Rápidas (substitua SEU_IP):

- **Frontend Celular**: `http://SEU_IP:5173`
- **Backend API**: `http://SEU_IP:5001`
- **Frontend PC**: `http://localhost:5173`

### Testar Conexão Rápida:

No celular, abrir navegador e testar:
```
http://SEU_IP:5001
```

Se ver "Cannot GET /", está conectando! ✅

---

## 🎉 Cenário de Teste Ideal

1. **User A (PC, PT)**: "Oi! Você está pronto para nossa chamada?"
   
2. **User B (Celular, EN)** vê: "Hi! Are you ready for our call?"
   
3. **User B** responde: "Yes! Let's start the video call!"
   
4. **User A** vê: "Sim! Vamos começar a videochamada!"
   
5. **Iniciar videochamada** 📹
   
6. **User A fala**: "Como foi seu dia hoje?"
   
7. **User B vê legenda**: "How was your day today?"
   
8. **User B fala**: "It was great, thank you for asking!"
   
9. **User A vê legenda**: "Foi ótimo, obrigado por perguntar!"

---

## 📚 Arquivos de Referência

- `QUICK_START_TEST.md` - Teste básico
- `TRANSCRIPTION_TESTING.md` - Detalhes da transcrição
- `MOBILE_OPTIMIZATION.md` - Otimizações mobile
- `CACHE_SYSTEM.md` - Sistema de cache

---

## 🆘 Ainda com Problemas?

### Verificar Logs:
1. **Terminal Backend**: Ver erros de conexão
2. **Terminal Frontend**: Ver se Network URL aparece
3. **Console do navegador** (F12): Ver erros JavaScript

### Testar Passo a Passo:
1. Celular acessa `http://SEU_IP:5001` ← Backend
2. Celular acessa `http://SEU_IP:5173` ← Frontend
3. Se ambos funcionam, o app deve funcionar!

---

✅ **Tempo estimado de configuração**: 10-15 minutos
📱 **Compatibilidade**: Android (Chrome) ✅ | iOS (Safari) ⚠️ (limitado)
🌍 **Funciona offline**: Não (precisa de internet para tradução)

**Boa sorte com os testes! 🚀**
