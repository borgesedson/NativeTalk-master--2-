import React from 'react';

const MobileChatLayout = ({
    navigationSidebar,
    contactsSidebar
}) => {
    return (
        <div className="flex h-[100dvh] w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display">
             {/* 1. Navigation Sidebar (Left - 64px) */}
            <div className="w-[64px] shrink-0 bg-[#0A1A2F] flex flex-col items-center py-4 border-r border-white/5 z-20 shadow-xl overflow-y-auto hide-scrollbar">
                {navigationSidebar}
            </div>

            {/* 2. Contacts / List Sidebar */}
            <div className="flex-1 overflow-hidden relative">
                {contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
