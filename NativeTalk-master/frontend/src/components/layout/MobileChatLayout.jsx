import React from 'react';

const MobileChatLayout = ({
    contactsSidebar
}) => {
    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#0D2137] text-slate-100 overflow-hidden font-display">
            {/* The contacts sidebar will take the full width and remaining height */}
            <div className="flex-1 overflow-hidden relative">
                {contactsSidebar}
            </div>
        </div>
    );
};

export default MobileChatLayout;
