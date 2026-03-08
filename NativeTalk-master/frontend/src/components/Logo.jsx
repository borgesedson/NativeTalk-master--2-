import React from 'react';

const Logo = ({ size = 48, fontSize = '24px', className = "" }) => {
    return (
        <div
            className={`flex items-center justify-center shadow-lg shadow-[#0D7377]/20 ${className}`}
            style={{
                background: 'linear-gradient(135deg, #0D7377, #0a5a5e)',
                borderRadius: '16px',
                width: `${size}px`,
                height: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: fontSize
            }}
        >
            <span role="img" aria-label="globe">🌐</span>
        </div>
    );
};

export default Logo;
