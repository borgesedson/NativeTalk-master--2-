import React from 'react';

const Logo = ({ size = 48, className = "" }) => {
    return (
        <div
            className={`flex items-center justify-center bg-[#111D2E] border border-white/10 rounded-xl shadow-lg shadow-[#0D7377]/10 relative overflow-hidden ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D7377]/20 to-transparent"></div>
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-comp)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 11H16M10 7H14" stroke="url(#chat-comp)" strokeWidth="2.5" strokeLinecap="round" />
                <defs>
                    <linearGradient id="chat-comp" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2ECC71" />
                        <stop offset="1" stopColor="#0D7377" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export default Logo;
