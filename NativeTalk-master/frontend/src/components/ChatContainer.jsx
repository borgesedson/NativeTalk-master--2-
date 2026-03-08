import React, { useEffect, useState } from 'react';
import { Chat, Channel, ChannelList, ChannelHeader, MessageList, MessageInput, Thread } from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import { useAuth } from '../contexts/AuthContext';
import 'stream-chat-react/dist/css/v2/index.css';

const ChatContainer = () => {
  const { user } = useAuth();
  const [chatClient, setChatClient] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      try {
        const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
        
        await client.connectUser(
          {
            id: user.id,
            name: user.name,
            image: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff`,
          },
          user.streamToken // Token deve vir do backend
        );

        setChatClient(client);
      } catch (error) {
        console.error('Erro ao inicializar chat:', error);
      }
    };

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [user]);

  if (!chatClient || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <Chat client={chatClient} theme="str-chat__theme-light">
      <div className="str-chat__container">
        <ChannelList 
          filters={{ type: 'messaging', members: { $in: [user.id] } }}
          sort={{ last_message_at: -1 }}
          options={{ limit: 10 }}
          showChannelSearch={true}
        />
        
        <Channel>
          <div className="str-chat__main-panel">
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </div>
          <Thread />
        </Channel>
      </div>
    </Chat>
  );
};

export default ChatContainer;