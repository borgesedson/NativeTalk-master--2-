import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Maximize, Minimize, User } from 'lucide-react';
import { getAvatarUrl } from '../../lib/utils';

const VideoCallScreen = ({ contact, localStream, remoteStream, onEndCall, subtitle, isMuted, onToggleMute, isCameraOff, onToggleCamera }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    return (
        <div className="fixed inset-0 z-[600] bg-black text-white flex flex-col font-display overflow-hidden">
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 bg-[#0D2137]">
                {remoteStream ? (
                    <video
                        srcObject={remoteStream}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0D2137] to-[#0a1a2a]">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="size-40 bg-white/5 rounded-[3rem] flex items-center justify-center border border-white/10"
                        >
                            <User className="size-20 text-white/10" />
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black">{contact?.name || 'Conectando...'}</h3>
                            <p className="text-[#0D7377] font-bold text-sm tracking-widest uppercase">Aguardando vídeo</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Local Video (PiP) */}
            <motion.div
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                className="absolute bottom-24 right-6 size-32 md:size-48 rounded-3xl overflow-hidden border-2 border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl z-50 cursor-grab active:cursor-grabbing"
            >
                {isCameraOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/60">
                        <CameraOff className="size-8 text-white/20" />
                    </div>
                ) : (
                    <video
                        srcObject={localStream}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute top-2 right-2 size-2 bg-[#0D7377] rounded-full shadow-[0_0_8px_rgba(13,115,119,0.8)]" />
            </motion.div>

            {/* Subtitles Overlay */}
            <AnimatePresence>
                {subtitle && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-32 inset-x-6 z-40 flex justify-center"
                    >
                        <div className="max-w-2xl bg-black/70 backdrop-blur-2xl border border-white/10 p-5 rounded-[1.5rem] shadow-2xl">
                            <p className="text-lg md:text-xl font-bold text-white text-center leading-relaxed">
                                {subtitle}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Container */}
            <motion.footer
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center p-6"
            >
                <div className="bg-white/10 backdrop-blur-3xl border border-white/10 p-3 rounded-[35px] flex items-center gap-4 shadow-2xl">
                    <button
                        onClick={onToggleMute}
                        className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                    </button>

                    <button
                        onClick={onToggleCamera}
                        className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                        {isCameraOff ? <CameraOff className="size-5" /> : <Camera className="size-5" />}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="size-16 bg-[#F4845F] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-[#F4845F]/20 hover:scale-110 active:scale-95 transition-all"
                    >
                        <PhoneOff className="size-7 stroke-[3px]" />
                    </button>

                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="size-12 bg-white/5 text-white/70 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all text-xs font-black"
                    >
                        {isFullScreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                    </button>
                </div>
            </motion.footer>
        </div>
    );
};

export default VideoCallScreen;
