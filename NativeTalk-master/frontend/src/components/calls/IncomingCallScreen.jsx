import React from 'react';
import { Phone, PhoneOff, Globe } from 'lucide-react';

const IncomingCallScreen = ({ call, caller, onAccept, onReject }) => {
    const avatarUrl = caller?.image || caller?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${caller?.name || 'User'}`;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between backdrop-blur-xl" style={{ backgroundColor: 'rgba(13,33,55,0.97)' }}>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">

                {/* Pulsing Green Avatar */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-teal-500/40" style={{ animationDuration: '1.5s' }}></div>
                    <img
                        src={avatarUrl}
                        alt={caller?.name || 'Caller'}
                        className="w-[120px] h-[120px] rounded-full object-cover border-4 border-teal-500 relative z-10 bg-[#0A1A2F]"
                    />
                </div>

                <div className="text-center mt-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{caller?.name || 'Alguém'}</h2>
                    <p className="text-gray-400 mb-8">está te chamando</p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 text-teal-400 text-sm font-medium border border-teal-500/30">
                        <Globe className="w-4 h-4" />
                        Tradução ativada
                    </div>
                </div>
            </div>

            <div className="pb-16 flex gap-16 w-full justify-center">
                <button
                    onClick={onReject}
                    className="w-[64px] h-[64px] rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-transform hover:scale-110 active:scale-95"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                <button
                    onClick={onAccept}
                    className="w-[64px] h-[64px] rounded-full bg-green-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-transform hover:scale-110 active:scale-95 animate-bounce"
                >
                    <Phone className="w-8 h-8 fill-white" />
                </button>
            </div>
        </div>
    );
};

export default IncomingCallScreen;
