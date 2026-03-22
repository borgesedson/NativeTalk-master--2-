import React from 'react';

const MobileChatLayout = ({
    navigationSidebar,
    contactsSidebar,
    mainChatArea,
    isChatOpen
}) => {
    return (
        <div className="flex h-full w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display flex-col">
            {/* Content Area (Fills remaining) */}
            <div className="flex-1 overflow-hidden relative">
                {isChatOpen ? mainChatArea : contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
