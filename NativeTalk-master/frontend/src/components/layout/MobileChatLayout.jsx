import React from 'react';

const MobileChatLayout = ({
    navigationSidebar,
    contactsSidebar
}) => {
    return (
        <div className="flex h-[100dvh] w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display">
            {/* Narrow side sidebar for mobile navigation */}
            <div className="w-[64px] h-full bg-[#111D2E] border-r border-white/5 flex flex-col py-4 shrink-0 overflow-hidden">
                {navigationSidebar}
            </div>

            {/* The contacts sidebar will take the remaining width */}
            <div className="flex-1 overflow-hidden relative">
                {contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
