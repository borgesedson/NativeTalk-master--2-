import React from 'react';

const DesktopChatLayout = ({
    navigationSidebar,
    contactsSidebar,
    mainChatArea
}) => {
    return (
        <div className="flex h-[100dvh] w-full bg-background-dark text-slate-100 overflow-hidden font-display">

            {/* 1. Navigation Sidebar (Left - 80px) - Visible on Tablet/Desktop (md+) */}
            <div className="w-[80px] shrink-0 bg-[#0A1A2F] flex-col items-center py-6 hidden md:flex border-r border-[#1E2A3A] z-20 shadow-xl backdrop-blur-md">
                {navigationSidebar}
            </div>

            {/* 2. Contacts / List Sidebar (Center - 320px) - Hidden on Mobile when viewing chat */}
            <div className="w-full md:w-[320px] shrink-0 bg-[#0D2137] flex-col overflow-y-auto hide-scrollbar z-10 border-r border-[#1E2A3A] hidden md:flex">
                {contactsSidebar}
            </div>

            {/* 3. Main Chat Area (Right - fills remaining) */}
            <div className="flex-1 bg-[#111D2E] flex flex-col overflow-hidden min-w-0 relative z-0 h-full w-full">
                {mainChatArea}
            </div>

        </div>
    );
};

export default DesktopChatLayout;
