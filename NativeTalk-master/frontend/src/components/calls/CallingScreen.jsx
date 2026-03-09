import React, { useState, useEffect } from 'react';
import { PhoneOff } from 'lucide-react';

const CallingScreen = ({ call, contact, onEnd }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => {
                if (s >= 30) {
                    clearInterval(timer);
                    onEnd();
                    return s;
                }
                return s + 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onEnd]);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const avatarUrl = contact?.avatar_url || contact?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${contact?.name || 'User'}`;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between" style={{ backgroundColor: '#0D2137' }}>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">

                {/* Pulsing Avatar */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-white/20" style={{ animationDuration: '2s' }}></div>
                    <img
                        src={avatarUrl}
                        alt={contact?.name}
                        className="w-[120px] h-[120px] rounded-full object-cover border-4 border-white/20 relative z-10 bg-[#0A1A2F]"
                    />
                </div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">{contact?.name || 'Contato'}</h2>
                    <p className="text-gray-400 flex items-center justify-center">
                        Chamando<span className="animate-bounce ml-1">.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                    </p>
                </div>

                <div className="font-mono text-white/50 text-xl font-medium tracking-widest mt-4">
                    {formatTime(seconds)}
                </div>
            </div>

            <div className="pb-16 w-full flex justify-center">
                <button
                    onClick={onEnd}
                    className="w-[64px] h-[64px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-transform hover:scale-105 active:scale-95"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

export default CallingScreen;
