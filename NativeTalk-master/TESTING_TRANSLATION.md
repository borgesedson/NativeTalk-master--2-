# 🚀 Como Testar o Sistema de Tradução

## Passos para Testar

### 1. Iniciar o Backend
```bash
cd backend
npm run dev
```

### 2. Iniciar o Frontend
```bash
cd frontend
npm run dev
```

### 3. Criar Dois Usuários com Idiomas Diferentes

#### Usuário 1 (Português):
1. Registre-se com email/senha
2. No onboarding:
   - Native Language: Portuguese
   - Learning Language: English
   - Preferred Message Language: Portuguese
   - Preencha os outros campos

#### Usuário 2 (Inglês):
1. Abra uma janela anônima/privada
2. Registre-se com outro email
3. No onboarding:
   - Native Language: English
   - Learning Language: Portuguese
   - Preferred Message Language: English
   - Preencha os outros campos

### 4. Conectar os Usuários
1. Com um usuário, envie solicitação de amizade para o outro
2. Com o outro usuário, aceite a solicitação

### 5. Testar o Chat com Tradução

#### Cenário 1: Usuário Português envia mensagem
1. Como usuário português, envie: "Olá, como você está?"
2. Como usuário inglês, veja a mensagem original
3. Clique no ícone 🌐 ao lado da mensagem
4. Veja a tradução: "Hello, how are you?"

#### Cenário 2: Usuário Inglês responde
1. Como usuário inglês, responda: "I'm fine, thanks!"
2. Como usuário português, veja a mensagem original
3. Clique no ícone 🌐 ao lado da mensagem
4. Veja a tradução: "Estou bem, obrigado!"

## ✅ Checklist de Funcionalidades

- [ ] Onboarding mostra 3 seletores de idioma
- [ ] Campo "Preferred Message Language" está presente
- [ ] Mensagens exibem botão de tradução 🌐
- [ ] Ao clicar no botão, a tradução aparece
- [ ] Tradução mostra idioma de destino
- [ ] Texto original e traduzido são exibidos juntos
- [ ] Loading aparece durante tradução
- [ ] Mensagens próprias não mostram botão de tradução

## 🐛 Troubleshooting

### Erro: "Cannot find module 'libretranslate'"
✅ Resolvido - não usamos mais essa biblioteca

### Tradução não aparece
1. Verifique se o backend está rodando
2. Abra o console do navegador (F12)
3. Verifique se há erros nas chamadas de API
4. Teste a API diretamente: http://localhost:5001/api/translation/translate

### Erro CORS
1. Verifique se o CORS está configurado no backend
2. Certifique-se de que o frontend está rodando em http://localhost:5173

### LibreTranslate não responde
1. A instância pública pode estar lenta
2. Tente novamente após alguns segundos
3. Considere usar instância própria do LibreTranslate

## 📊 Testando a API Diretamente

### Usando curl (PowerShell):
```powershell
# Fazer login primeiro para obter o cookie JWT
$response = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"user@example.com","password":"password123"}' `
  -SessionVariable session

# Testar tradução
Invoke-RestMethod -Uri "http://localhost:5001/api/translation/translate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"text":"Hello world","targetUserId":"USER_ID_HERE"}' `
  -WebSession $session
```

### Resposta Esperada:
```json
{
  "originalText": "Hello world",
  "translatedText": "Olá mundo",
  "sourceLanguage": "en",
  "targetLanguage": "pt"
}
```

## 🎯 Casos de Uso

### Caso 1: Chat Português ↔ Inglês
- Usuário PT envia: "Bom dia"
- Usuário EN vê: "Bom dia" + tradução "Good morning"

### Caso 2: Chat Espanhol ↔ Francês
- Usuário ES envia: "Hola amigo"
- Usuário FR vê: "Hola amigo" + tradução "Bonjour ami"

### Caso 3: Mesmo Idioma
- Usuário PT envia: "Olá"
- Outro usuário PT vê: "Olá" (sem botão de tradução necessário)

## 📝 Notas Importantes

1. **LibreTranslate Público**: 
   - Gratuito mas pode ser lento
   - Sem necessidade de API key
   - Ideal para desenvolvimento/testes

2. **Instância Própria** (Produção):
   - Mais rápida e confiável
   - Instale: `pip install libretranslate`
   - Execute: `libretranslate --host 0.0.0.0 --port 5000`
   - Configure: `LIBRETRANSLATE_URL=http://localhost:5000`

3. **Mensagens Próprias**:
   - Não mostram botão de tradução
   - Assume-se que você entende o que escreveu

4. **Performance**:
   - Primeira tradução pode demorar 2-5 segundos
   - Cache pode ser implementado para melhorar
