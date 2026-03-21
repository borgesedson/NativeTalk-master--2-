import React from 'react';

const MobileChatLayout = ({
    navigationSidebar,
    contactsSidebar,
    mainChatArea,
    isChatOpen
}) => {
    return (
        <div className="flex h-[100dvh] w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display">
            {/* 1. Navigation Sidebar (Left - 64px) - Only show when NOT in a chat on small screens */}
            {!isChatOpen && (
                <div className="w-[64px] h-full bg-[#111D2E] border-r border-white/5 flex flex-col py-4 shrink-0 overflow-hidden">
                    {navigationSidebar}
                </div>
            )}

            {/* 2. Content Area (Fills remaining) */}
            <div className="flex-1 overflow-hidden relative">
                {isChatOpen ? mainChatArea : contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
