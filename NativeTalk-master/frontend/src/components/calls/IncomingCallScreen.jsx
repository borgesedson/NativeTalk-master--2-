import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, User, Globe } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';

const IncomingCallScreen = ({ contact, onAnswer, onReject, callType = 'voice' }) => {
    return (
        <div className="fixed inset-0 z-[2000] bg-[#0D2137] text-white flex flex-col items-center justify-center p-6 font-display overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-full bg-[radial-gradient(circle_at_center,_rgba(13,115,119,0.1)_0%,_transparent_70%)]"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 bg-[#0D7377]/10 border border-[#0D7377]/20 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-[#0D7377] uppercase mb-4">
                        <Globe className="size-3" />
                        Voz em Tempo Real
                    </span>
                    <h3 className="text-white/40 font-bold">está te ligando...</h3>
                </motion.div>

                {/* Avatar centered with pulse */}
                <div className="relative mb-12">
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-[-60px] bg-[#0D7377]/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="relative size-[140px] rounded-[50px] overflow-hidden border-4 border-[#0D7377]/30 shadow-[0_0_50px_rgba(13,115,119,0.3)] bg-[#1a2e44] flex items-center justify-center"
                    >
                        {contact?.avatar_url ? (
                            <img
                                src={getAvatarUrl(contact.avatar_url, contact.name)}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="size-20 text-[#0D7377]/40" />
                        )}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-24"
                >
                    <h2 className="text-4xl font-black mb-2 tracking-tight">{contact?.name || 'Desconhecido'}</h2>
                    <div className="flex items-center justify-center gap-2 text-white/40 font-bold uppercase tracking-tighter text-sm">
                        {contact?.native_language && (
                            <>
                                <span>Fala {contact.native_language}</span>
                                <span className="text-xl">
                                    {contact.native_language.toLowerCase().includes('pt') ? '🇧🇷' :
                                        contact.native_language.toLowerCase().includes('en') ? '🇺🇸' :
                                            contact.native_language.toLowerCase().includes('es') ? '🇪🇸' : '🌐'}
                                </span>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex items-center justify-between w-full max-w-[320px]">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={onReject}
                            className="size-20 bg-[#F4845F] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#F4845F]/20 hover:scale-110 active:scale-90 transition-all border-4 border-[#0D2137]"
                        >
                            <Phone className="size-8 rotate-[135deg]" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#F4845F]">Recusar</span>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={onAnswer}
                            className="size-20 bg-[#0D7377] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#0D7377]/20 hover:scale-110 active:scale-90 transition-all border-4 border-[#0D2137] relative"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-[-8px] border-2 border-[#0D7377]/30 rounded-full"
                            />
                            <Phone className="size-8" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0D7377]">Atender</span>
                    </div>
                </div>
            </div>

            {/* Subtle ringtone audio element could be injected here */}
        </div>
    );
};

export default IncomingCallScreen;
