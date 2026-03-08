# Sistema de Tradução Multilíngue

## 📝 Descrição

O Streamify agora possui um sistema de tradução automática que permite que usuários de diferentes idiomas se comuniquem de forma transparente. Cada mensagem pode ser traduzida automaticamente para o idioma preferido do destinatário.

## 🌍 Como Funciona

### 1. **Configuração do Idioma do Usuário**

Durante o onboarding, cada usuário configura:
- **Native Language**: Seu idioma nativo
- **Learning Language**: Idioma que está aprendendo
- **Preferred Message Language**: Idioma em que prefere receber mensagens (opcional)

### 2. **Tradução de Mensagens**

As mensagens podem ser traduzidas de duas formas:

#### **Tradução Manual (Implementada)**
- Clique no ícone de tradução ao lado de qualquer mensagem recebida
- A mensagem será traduzida para o seu idioma preferido
- Tanto o texto original quanto a tradução são exibidos

#### **Tradução Automática (Configurável)**
- Descomente o código no componente `TranslatedMessage.jsx` para habilitar
- Todas as mensagens recebidas serão traduzidas automaticamente

## 🔧 Configuração Técnica

### Backend

1. **API de Tradução**: LibreTranslate (https://libretranslate.com)
   - Usa a instância pública (sem necessidade de API key)
   - Pode ser configurada para usar instância própria via env `LIBRETRANSLATE_URL`

2. **Endpoints**:
   ```
   POST /api/translation/translate
   Body: { text: string, targetUserId: string }
   ```

3. **Modelo de Usuário**:
   - `nativeLanguage`: Idioma nativo
   - `learningLanguage`: Idioma que está aprendendo
   - `preferredLanguage`: Idioma preferido para mensagens (padrão: 'en')

### Frontend

1. **Componente**: `TranslatedMessage.jsx`
   - Exibe mensagens com botão de tradução
   - Mostra tanto o texto original quanto traduzido

2. **Hook**: `useTranslation.js`
   - Facilita chamadas de tradução
   - Gerencia estados de loading e erro

3. **API**: Função `translateMessage()` em `lib/api.js`

## 🚀 Como Usar

### Para Usuários

1. Complete o onboarding selecionando seus idiomas
2. No chat, clique no ícone 🌐 ao lado de mensagens em outros idiomas
3. Veja a tradução aparecer abaixo da mensagem original

### Para Desenvolvedores

#### Adicionar tradução em um componente:

```jsx
import { useTranslation } from "../hooks/useTranslation";

const MyComponent = () => {
  const { translate, isTranslating } = useTranslation();

  const handleTranslate = async (text, targetUserId) => {
    const result = await translate(text, targetUserId);
    console.log(result.translatedText);
  };

  return (
    <button onClick={() => handleTranslate("Hello", "userId123")}>
      Traduzir
    </button>
  );
};
```

## 🌐 Idiomas Suportados

O sistema suporta todos os idiomas disponíveis no LibreTranslate, incluindo:

- Português (pt)
- Inglês (en)
- Espanhol (es)
- Francês (fr)
- Alemão (de)
- Italiano (it)
- Russo (ru)
- Chinês (zh)
- Japonês (ja)
- Coreano (ko)
- Árabe (ar)
- Hindi (hi)
- E muitos outros...

## ⚙️ Configuração Avançada

### Usar Instância Própria do LibreTranslate

1. Instale o LibreTranslate localmente:
   ```bash
   pip install libretranslate
   libretranslate --host 0.0.0.0 --port 5000
   ```

2. Configure a variável de ambiente no backend:
   ```env
   LIBRETRANSLATE_URL=http://localhost:5000
   ```

### Habilitar Tradução Automática

No arquivo `frontend/src/components/TranslatedMessage.jsx`, descomente o código no `useEffect`:

```jsx
useEffect(() => {
  if (!isOwnMessage && message.text && authUser?.preferredLanguage) {
    handleTranslate(); // Descomente esta linha
  }
}, [message, isOwnMessage, authUser]);
```

## 🔍 Troubleshooting

### Tradução não funciona

1. Verifique se o backend está rodando
2. Verifique a conexão com LibreTranslate
3. Confira os logs do console para erros
4. Verifique se os idiomas estão configurados corretamente no perfil

### Tradução lenta

- A instância pública do LibreTranslate pode ser lenta
- Considere hospedar sua própria instância
- Cache de traduções pode ser implementado

## 📈 Melhorias Futuras

- [ ] Cache de traduções no frontend
- [ ] Suporte para tradução de mensagens de voz
- [ ] Tradução em tempo real durante chamadas de vídeo
- [ ] Detecção automática de idioma
- [ ] Preferências de tradução por conversa
- [ ] Estatísticas de uso de idiomas

## 📄 Licença

Este recurso faz parte do Streamify e segue a mesma licença do projeto principal.
