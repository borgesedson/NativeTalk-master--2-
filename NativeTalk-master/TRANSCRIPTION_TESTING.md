# 🎤 Guia de Teste - Sistema de Transcrição de Áudio

## 📋 Visão Geral

O NativeTalk possui **2 métodos de transcrição**:

### 1. **Web Speech API** (Navegador - Gratuito) ✅ RECOMENDADO
- ✅ Funciona diretamente no navegador (Chrome, Edge, Safari)
- ✅ **Completamente gratuito**
- ✅ Sem necessidade de configuração
- ✅ Baixa latência (reconhecimento em tempo real)
- ⚠️ Apenas funciona online
- ⚠️ Limitado aos idiomas suportados pelo navegador

### 2. **Azure Speech Service** (Cloud - Pago)
- ✅ Maior precisão
- ✅ Mais idiomas suportados
- ✅ Funciona em qualquer navegador
- ⚠️ Requer conta Azure
- ⚠️ Custo: 5 horas grátis/mês, depois $1/hora
- ⚠️ Maior latência

---

## 🚀 Método 1: Testar com Web Speech API (Sem Configuração)

### Pré-requisitos
- ✅ Chrome/Edge (melhor suporte)
- ✅ Conexão com internet
- ✅ Microfone funcionando

### Passo a Passo

#### 1. Iniciar Servidores
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 2. Criar 2 Usuários
1. Abra `http://localhost:5173`
2. Cadastre **Usuário A** (Português)
   - Email: `user.a@test.com`
   - Native Language: Portuguese
   - Learning Language: English

3. Abra **janela anônima/privada**
4. Cadastre **Usuário B** (Inglês)
   - Email: `user.b@test.com`
   - Native Language: English
   - Learning Language: Portuguese

#### 3. Adicionar como Amigos
1. User A: Enviar friend request para User B
2. User B: Aceitar o pedido

#### 4. Iniciar Videochamada
1. User A: Clicar no botão de vídeo ao lado do nome do User B
2. User B: Aceitar a chamada
3. **Permitir acesso ao microfone e câmera** em ambos

#### 5. Testar Transcrição

##### User A (Português):
1. Clicar no botão 🎤 (microfone roxo grande)
2. Falar em português: **"Olá, como você está?"**
3. O navegador mostrará:
   - 🔴 Gravando... 🌐 (Web Speech ativo)
   - Transcrição aparece em tempo real

##### User B (Inglês):
1. Verá a legenda traduzida: **"Hello, how are you?"**
2. Clicar no botão 🎤
3. Responder em inglês: **"I'm fine, thank you!"**

##### User A:
1. Verá a legenda traduzida: **"Estou bem, obrigado!"**

### ✅ O que Deve Acontecer

```
User A (PT-BR) fala: "Olá, como você está?"
              ↓
    [Web Speech API reconhece]
              ↓
    Transcrição: "Olá, como você está?"
              ↓
       [Backend traduz PT → EN]
              ↓
User B (EN-US) vê: "Hello, how are you?"
```

### 🐛 Troubleshooting Web Speech API

#### Erro: "Web Speech API não suportada"
- **Solução**: Use Chrome ou Edge (versão recente)
- Safari: Suporte limitado

#### Microfone não reconhece
- **Verificar**: Permissões do navegador
- Chrome: `chrome://settings/content/microphone`
- Testar: Abrir DevTools (F12) → Console → Ver erros

#### Não transcreve nada
- **Solução**: Falar mais alto e claro
- Verificar se está usando o idioma correto
- Testar com frases simples primeiro

---

## ⚙️ Método 2: Configurar Azure Speech Service (Opcional)

### Quando Usar?
- Precisa de maior precisão
- Navegador não suporta Web Speech
- Produção com muitos usuários

### Passo a Passo

#### 1. Criar Conta Azure
1. Acessar: https://azure.microsoft.com/free/
2. Criar conta gratuita (12 meses grátis + $200 crédito)

#### 2. Criar Recurso Speech
1. Portal Azure → "Create a resource"
2. Buscar: **"Speech"**
3. Clicar em **"Speech Services"** → Create
4. Configurar:
   - **Subscription**: Sua assinatura
   - **Resource Group**: Criar novo (ex: `nativetalk-rg`)
   - **Region**: `East US` (recomendado)
   - **Name**: `nativetalk-speech`
   - **Pricing tier**: `Free F0` (5h grátis/mês)
5. Clicar **"Review + create"** → **"Create"**

#### 3. Obter Credenciais
1. Ir para o recurso criado
2. Menu lateral → **"Keys and Endpoint"**
3. Copiar:
   - **KEY 1** (ex: `abc123def456...`)
   - **LOCATION/REGION** (ex: `eastus`)

#### 4. Configurar Backend
```bash
# backend/.env
AZURE_SPEECH_KEY=sua_key_aqui
AZURE_SPEECH_REGION=eastus
```

#### 5. Testar
1. Reiniciar backend: `npm run dev`
2. Logs devem mostrar:
```
✅ Azure Speech configurado: eastus
```

3. Iniciar chamada e clicar no microfone
4. Logs backend:
```
🎤 Reconhecendo: Hello...
✅ Reconhecido: Hello, how are you?
🌐 Traduzido para pt: Olá, como você está?
```

### 💰 Custos Azure

| Uso | Custo |
|-----|-------|
| 0-5h/mês | **Grátis** |
| Acima de 5h | $1.00/hora |

**Exemplo**: 100 chamadas de 3min cada = 5h = **$0** (dentro do free tier)

---

## 🧪 Modo de Teste (Simulação)

Para testar sem microfone ou sem Azure:

### Backend
```javascript
// Enviar testMode: true na requisição
const response = await transcribeAudio(audioData, userId1, userId2, true);
```

### Resposta Simulada
```json
{
  "originalTranscription": "Test transcription in original language",
  "translatedTranscription": "Transcrição de teste no idioma traduzido",
  "testMode": true
}
```

---

## 📊 Comparação: Web Speech vs Azure

| Critério | Web Speech API | Azure Speech |
|----------|---------------|--------------|
| **Custo** | Gratuito ✅ | 5h grátis, depois pago |
| **Configuração** | Zero 🎉 | Requer conta Azure |
| **Navegadores** | Chrome, Edge, Safari* | Todos |
| **Latência** | <100ms ⚡ | ~500ms |
| **Precisão** | Boa (80-90%) | Excelente (95%+) |
| **Idiomas** | 50+ | 100+ |
| **Offline** | ❌ | ❌ |
| **Recomendação** | **Desenvolvimento** | **Produção** |

*Safari tem suporte limitado

---

## 🎯 Cenários de Teste

### 1. Conversação Básica
```
A (PT): "Oi, tudo bem?"
B (EN): "Hello, how are you?"
A (PT): vê → "Olá, como você está?"
```

### 2. Frases Longas
```
A (PT): "Eu gostaria de aprender mais sobre a cultura japonesa"
B (EN): vê → "I would like to learn more about Japanese culture"
```

### 3. Múltiplos Idiomas
```
A (ES): "¿Cómo te llamas?"
B (FR): vê → "Comment tu t'appelles?"
```

### 4. Ruído de Fundo
- Testar em ambiente silencioso primeiro
- Depois testar com música/TV ao fundo
- Verificar qualidade da transcrição

---

## 📱 Testar no Mobile

### Chrome Android
1. Abrir `http://SEU_IP:5173` (ex: `192.168.1.10:5173`)
2. Permitir microfone
3. Web Speech API funciona nativamente ✅

### Safari iOS
1. Web Speech pode não funcionar
2. Usar Azure como fallback
3. Ou aguardar melhor suporte da Apple

---

## 🔍 Debug e Logs

### Frontend (Console do Navegador)
```javascript
✅ Web Speech API disponível
🎤 Web Speech reconhecimento iniciado
📝 Transcrição: "Hello world"
🛑 Web Speech reconhecimento encerrado
```

### Backend (Terminal)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 TRANSCRIÇÃO + TRADUÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️  Quem fala: 507f1f77... (portuguese)
👂 Quem ouve: 507f191e... (english)
🎙️  Idioma do áudio: pt-BR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Transcrição original: "Olá"
🌐 Traduzido para en: "Hello"
```

---

## ✅ Checklist de Teste Completo

### Funcionalidades
- [ ] Web Speech API detectada automaticamente
- [ ] Botão de microfone aparece na chamada
- [ ] Clicar inicia reconhecimento
- [ ] Transcrição aparece em tempo real
- [ ] Legendas aparecem para ambos usuários
- [ ] Legendas somem após 5 segundos
- [ ] Funciona em Chrome/Edge
- [ ] Permissões de microfone solicitadas
- [ ] Erros são exibidos adequadamente

### Idiomas Testados
- [ ] Português → Inglês
- [ ] Inglês → Português
- [ ] Espanhol → Inglês
- [ ] Francês → Inglês
- [ ] Alemão → Inglês

### Performance
- [ ] Latência < 1 segundo (Web Speech)
- [ ] Sem travamentos
- [ ] Múltiplas transcrições consecutivas
- [ ] Funciona com vídeo ativo

---

## 🚨 Problemas Conhecidos

### 1. Web Speech para em 60 segundos
- **Causa**: Limite do navegador
- **Solução**: Clicar no microfone novamente para continuar

### 2. "Not allowed to use microphone"
- **Causa**: Permissões negadas
- **Solução**: Resetar permissões do site nas configurações

### 3. Transcrição em idioma errado
- **Causa**: Idioma do usuário mal configurado
- **Solução**: Atualizar `nativeLanguage` no perfil

---

## 📚 Recursos Adicionais

- **Web Speech API Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Azure Speech Docs**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
- **Idiomas Suportados (Web Speech)**: https://cloud.google.com/speech-to-text/docs/languages
- **Idiomas Suportados (Azure)**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support

---

## 🎉 Próximos Passos

Após testar:
1. ✅ Implementar gravação de transcrições no histórico
2. ✅ Adicionar botão de ligar/desligar transcrição automática
3. ✅ Suporte a transcrição de mensagens de voz gravadas
4. ✅ Melhorar UI das legendas (tamanho, posição, cores)
5. ✅ Adicionar suporte a mais idiomas

---

✅ **Sistema pronto para teste!**
🎤 **Use Web Speech API para começar sem configuração**
☁️ **Configure Azure apenas para produção ou testes avançados**
