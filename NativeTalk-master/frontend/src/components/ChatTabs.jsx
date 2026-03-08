import { X } from 'lucide-react';
import useChatTabsStore from '../store/useChatTabsStore';

const ChatTabs = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, clearUnread } = useChatTabsStore();

  if (tabs.length === 0) return null;

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    clearUnread(tab.id);
  };

  const handleCloseTab = (e, tabId) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  return (
    <div className="bg-base-100 border-b border-base-300 overflow-x-auto">
      <div className="flex items-center gap-1 p-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
                transition-all duration-200 min-w-[150px] max-w-[200px]
                group relative animate-fadeIn
                ${isActive 
                  ? 'bg-primary text-primary-content shadow-md' 
                  : 'bg-base-200 hover:bg-base-300'
                }
              `}
            >
              {/* Avatar */}
              <div className="avatar">
                <div className="w-6 h-6 rounded-full">
                  <img 
                    src={tab.friendAvatar || '/default-avatar.png'} 
                    alt={tab.friendName}
                  />
                </div>
              </div>

              {/* Nome */}
              <span className={`
                text-sm font-medium truncate flex-1
                ${isActive ? 'text-primary-content' : 'text-base-content'}
              `}>
                {tab.friendName}
              </span>

              {/* Badge de não lidas */}
              {tab.unreadCount > 0 && !isActive && (
                <span className="badge badge-error badge-sm">
                  {tab.unreadCount > 9 ? '9+' : tab.unreadCount}
                </span>
              )}

              {/* Botão fechar */}
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={`
                  btn btn-ghost btn-xs btn-circle
                  opacity-0 group-hover:opacity-100 transition-opacity
                  ${isActive ? 'text-primary-content hover:bg-primary-focus' : ''}
                `}
                title="Fechar aba"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatTabs;
