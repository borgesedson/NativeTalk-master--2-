import React from 'react';

const MobileChatLayout = ({
    navigationSidebar,
    contactsSidebar
}) => {
    return (
        <div className="flex w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display" style={{ height: '100dvh' }}>
            {/* Narrow side sidebar for mobile navigation */}
            <div className="w-[60px] shrink-0 h-full bg-[#0A1A2F] border-r border-white/5 flex flex-col py-4 overflow-hidden">
                {navigationSidebar}
            </div>

            {/* Channel list takes all remaining space */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden h-full">
                {contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
