import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Globe, User, Clock } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';

const VoiceCallScreen = ({ contact, onEndCall, subtitle, isMuted, onToggleMute, isSpeakerOn, onToggleSpeaker }) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[500] bg-[#0D2137] text-white flex flex-col items-center font-display overflow-hidden">
            {/* Header Info */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full p-8 flex flex-col items-center"
            >
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 mb-2">
                    <Clock className="size-3 text-[#0D7377]" />
                    <span className="text-xs font-mono font-bold tracking-widest text-[#0D7377]">{formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#0D7377]/20 rounded-lg border border-[#0D7377]/30">
                    <Globe className="size-3 text-[#0D7377] animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0D7377]">Traduzindo ao vivo</span>
                </div>
            </motion.header>

            {/* Center Content: Avatar */}
            <main className="flex-1 flex flex-col items-center justify-center pb-24">
                <div className="relative mb-8">
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute inset-[-30px] bg-[#0D7377]/15 rounded-full blur-2xl"
                    />
                    <div className="relative size-[200px] rounded-[60px] overflow-hidden border-2 border-white/10 shadow-2xl bg-[#1a2e44] flex items-center justify-center">
                        {contact?.avatar_url ? (
                            <img
                                src={getAvatarUrl(contact.avatar_url, contact.name)}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="size-24 text-[#0D7377]/20" />
                        )}
                    </div>
                </div>

                <div className="text-center group">
                    <h2 className="text-4xl font-black mb-1 group-hover:scale-105 transition-transform">{contact?.name || 'Contato'}</h2>
                    <p className="text-white/40 font-bold uppercase tracking-tighter text-sm flex items-center justify-center gap-2">
                        Em conexão segura
                        {contact?.native_language && (
                            <span className="text-lg opacity-80" title={contact.native_language}>
                                {contact.native_language.toLowerCase().includes('pt') ? '🇧🇷' :
                                    contact.native_language.toLowerCase().includes('en') ? '🇺🇸' :
                                        contact.native_language.toLowerCase().includes('es') ? '🇪🇸' : '🌐'}
                            </span>
                        )}
                    </p>
                </div>
            </main>

            {/* Subtitles Box */}
            <AnimatePresence>
                {subtitle && (
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        className="absolute bottom-40 w-full max-w-xl px-6 z-50"
                    >
                        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-2xl text-center">
                            <p className="text-xl md:text-2xl font-black text-white leading-tight">
                                {subtitle}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Bar */}
            <motion.footer
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="w-full p-8 pb-12 flex items-center justify-center"
            >
                <div className="bg-white/5 backdrop-blur-2xl border border-white/5 p-4 rounded-[40px] flex items-center gap-6 shadow-2xl">
                    <button
                        onClick={onToggleMute}
                        className={`size-14 rounded-3xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/60 hover:text-white'}`}
                    >
                        {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="size-20 bg-[#F4845F] text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-[#F4845F]/20 hover:scale-110 active:scale-95 transition-all"
                    >
                        <PhoneOff className="size-8 stroke-[3px]" />
                    </button>

                    <button
                        onClick={onToggleSpeaker}
                        className={`size-14 rounded-3xl flex items-center justify-center transition-all ${!isSpeakerOn ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/60 hover:text-white'}`}
                    >
                        {isSpeakerOn ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
                    </button>
                </div>
            </motion.footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}} />
        </div>
    );
};

export default VoiceCallScreen;
