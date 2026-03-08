import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NoChatSelected = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-base-200 p-8">
      <div className="bg-primary/10 rounded-full p-8 mb-4">
        <MessageCircle size={64} className="text-primary" />
      </div>
      <h2 className="text-2xl font-semibold text-base-content mb-2">
        {t('chat.noChatSelected') || 'No chat selected'}
      </h2>
      <p className="text-base-content/60 text-center max-w-md">
        {t('chat.selectChatMessage') || 'Select a conversation from the sidebar to start chatting'}
      </p>
    </div>
  );
};

export default NoChatSelected;
