import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatTabsStore = create(
  persist(
    (set, get) => ({
      // Estado
      chatWindows: [], // Array de { id, friendId, friendName, friendAvatar, unreadCount, isMinimized }
      maxWindows: 3, // Máximo de janelas abertas

      // Adicionar nova janela de chat
      openChatWindow: (friend) => {
        const { chatWindows, maxWindows } = get();
        const existingWindow = chatWindows.find(w => w.friendId === friend.id);
        
        if (existingWindow) {
          // Se já existe, maximizar e trazer para frente
          set({
            chatWindows: chatWindows.map(w => 
              w.friendId === friend.id 
                ? { ...w, isMinimized: false }
                : w
            )
          });
        } else {
          // Criar nova janela
          const newWindow = {
            id: `chat-${Date.now()}-${friend.id}`,
            friendId: friend.id,
            friendName: friend.name,
            friendAvatar: friend.avatar_urlture,
            unreadCount: 0,
            isMinimized: false,
          };
          
          // Se atingiu o máximo, remover a primeira
          const updatedWindows = chatWindows.length >= maxWindows
            ? [...chatWindows.slice(1), newWindow]
            : [...chatWindows, newWindow];
          
          set({ chatWindows: updatedWindows });
        }
      },

      // Fechar janela
      closeChatWindow: (windowId) => {
        const { chatWindows } = get();
        set({ chatWindows: chatWindows.filter(w => w.id !== windowId) });
      },

      // Minimizar/Maximizar janela
      toggleMinimize: (windowId) => {
        const { chatWindows } = get();
        set({
          chatWindows: chatWindows.map(w => 
            w.id === windowId 
              ? { ...w, isMinimized: !w.isMinimized }
              : w
          )
        });
      },

      // Incrementar contador de não lidas
      incrementUnread: (friendId) => {
        const { chatWindows } = get();
        set({
          chatWindows: chatWindows.map(w => 
            w.friendId === friendId 
              ? { ...w, unreadCount: w.unreadCount + 1 }
              : w
          )
        });
      },

      // Zerar contador de não lidas
      clearUnread: (windowId) => {
        const { chatWindows } = get();
        set({
          chatWindows: chatWindows.map(w => 
            w.id === windowId 
              ? { ...w, unreadCount: 0 }
              : w
          )
        });
      },

      // Fechar todas as janelas
      closeAllWindows: () => {
        set({ chatWindows: [] });
      },
    }),
    {
      name: 'chat-windows-storage',
      partialize: (state) => ({ 
        chatWindows: state.chatWindows.map(w => ({ ...w, unreadCount: 0, isMinimized: true })),
      }),
    }
  )
);

export default useChatTabsStore;
