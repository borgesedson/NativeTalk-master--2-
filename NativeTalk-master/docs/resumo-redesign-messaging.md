# Knowledge Snapshot: Redesign NativeTalk (Dashboard -> Messaging)

Este documento serve como resumo técnico da transição arquitetural e visual realizada para preservar o contexto em futuras interações.

## 📌 Visão Geral
O NativeTalk foi transformado de uma interface de dashboard tradicional para um aplicativo de mensagens moderno, mobile-first, focado em conversas em tempo real com tradução automática.

## 🏗️ Mudanças Arquiteturais
- **Navegação Global**: O componente `Sidebar.jsx` foi removido. Foi implementado o `BottomNav.jsx`, uma barra de navegação inferior translúcida com desfoque (blur).
- **Estrutura de Layout**: Removidos os componentes `Layout.jsx` e `Navbar.jsx` em favor de uma estrutura direta por página, com preenchimento inferior (`pb-28`) para evitar sobreposição.
- **Lógica de Dados**: A `HomePage.jsx` agora consome canais diretamente do **Stream SDK**.

## 🎨 Design System & Estética
- **Paleta de Cores**:
    - Fundo Principal: `#0D2137`
    - Acentos (Teal): `#0D7377`
    - Badges (Coral): `#F4845F`
- **UX Messaging**: Avatares de 56px, online dots, bandeiras de idioma integradas e previews traduzidos.

## 🛠️ Novos Componentes Core
1. **`BottomNav.jsx`**: Navegação entre Conversas, Contatos, Notificações e Ajustes.
2. **`MessagingTopBar.jsx`**: Cabeçalho fixo com logo e busca integrada.
3. **`Logo.jsx`**: Logo padronizado (Globo Teal).

---
*Snapshot criado em: Março de 2026*
