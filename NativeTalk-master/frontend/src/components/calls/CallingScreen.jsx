import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';

const CallingScreen = ({ contact, onCancel }) => {
    return (
        <div className="fixed inset-0 z-[1000] bg-[#0D2137] text-white flex flex-col items-center justify-center p-6 font-display overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] size-[50%] bg-[#0D7377]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-5%] left-[-5%] size-[40%] bg-[#F4845F]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Avatar with Pulse */}
                <div className="relative mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-[-40px] bg-[#0D7377]/20 rounded-full blur-2xl"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative size-[120px] rounded-[40px] overflow-hidden border-2 border-white/10 shadow-2xl bg-[#1a2e44] flex items-center justify-center"
                    >
                        {contact?.avatar_url ? (
                            <img
                                src={getAvatarUrl(contact.avatar_url, contact.name)}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="size-16 text-[#0D7377]/40" />
                        )}
                    </motion.div>
                </div>

                {/* Contact Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                >
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h2 className="text-3xl font-black tracking-tight">{contact?.name || 'Iniciando...'}</h2>
                        {contact?.native_language && (
                            <span className="text-xl" title={contact.native_language}>
                                {contact.native_language.toLowerCase().includes('pt') ? '🇧🇷' :
                                    contact.native_language.toLowerCase().includes('en') ? '🇺🇸' :
                                        contact.native_language.toLowerCase().includes('es') ? '🇪🇸' : '🌐'}
                            </span>
                        )}
                    </div>
                    <p className="text-[#0D7377] font-black uppercase tracking-[0.2em] text-xs animate-pulse">
                        Chamando...
                    </p>
                </motion.div>
            </div>

            {/* Controls Container */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute bottom-20 flex flex-col items-center gap-8"
            >
                <button
                    onClick={onCancel}
                    className="size-20 bg-[#F4845F] text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#F4845F]/20 hover:scale-110 active:scale-90 transition-all group"
                >
                    <X className="size-8 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cancelar Chamada</span>
            </motion.div>
        </div>
    );
};

export default CallingScreen;
