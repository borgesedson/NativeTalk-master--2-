import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { uploadAudio, transcribeAudio } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { getLanguageCode } from "../lib/utils";

const LANGUAGES = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export default function InterpreterPage() {
    const navigate = useNavigate();
    const { authUser } = useAuthUser();
    const [langTop, setLangTop] = useState('en');
    const [langBottom, setLangBottom] = useState(authUser?.native_language || 'pt');

    // states: idle, recording, processing, speaking
    const [statusTop, setStatusTop] = useState('idle');
    const [statusBottom, setStatusBottom] = useState('idle');

    const [textTop, setTextTop] = useState({ original: '', translated: '' });
    const [textBottom, setTextBottom] = useState({ original: '', translated: '' });

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const synth = window.speechSynthesis;

    const startRecording = async (side) => {
        try {
            if (side === 'top') setStatusTop('recording');
            else setStatusBottom('recording');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => processAudio(side);
            mediaRecorder.start();
        } catch (err) {
            toast.error("Erro ao acessar o microfone.");
            if (side === 'top') setStatusTop('idle');
            else setStatusBottom('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const processAudio = async (side) => {
        if (side === 'top') {
            setStatusTop('processing');
            setTextTop({ original: '', translated: '' }); // clear processing
        } else {
            setStatusBottom('processing');
            setTextBottom({ original: '', translated: '' });
        }

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];

            const { url } = await uploadAudio(audioBlob);
            if (!url) throw new Error("Upload failed");

            const sourceLang = side === 'top' ? langTop : langBottom;
            const targetLang = side === 'top' ? langBottom : langTop;

            const result = await transcribeAudio(url, sourceLang, targetLang);

            const transcript = result?.originalTranscription || '';
            const translatedText = result?.translatedTranscription || '';

            if (!transcript) throw new Error("Transcrição falhou");

            // Set Texts
            if (side === 'top') {
                setStatusTop('idle');
                setTextTop({ original: transcript, translated: translatedText });
                setTextBottom({ original: translatedText, translated: transcript });
            } else {
                setStatusBottom('idle');
                setTextBottom({ original: transcript, translated: translatedText });
                setTextTop({ original: translatedText, translated: transcript });
            }

            // Speak on the OTHER side
            speakText(translatedText, targetLang);

        } catch (err) {
            toast.error(err.message || "Erro ao processar áudio");
            setStatusTop('idle');
            setStatusBottom('idle');
        }
    };

    const speakText = (text, langCode) => {
        if (!text) return;
        const u = new SpeechSynthesisUtterance(text);
        // Find closest vocal language
        const langMap = { 'pt': 'pt-BR', 'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT' };
        u.lang = langMap[getLanguageCode(langCode)] || 'en-US';
        synth.speak(u);
    };

    const renderSide = (side, isRotated) => {
        const isTop = side === 'top';
        const currentLang = isTop ? langTop : langBottom;
        const status = isTop ? statusTop : statusBottom;
        const textData = isTop ? textTop : textBottom;
        const partnerStatus = isTop ? statusBottom : statusTop;
        const isPartnerRecording = partnerStatus === 'recording' || partnerStatus === 'processing';

        const handleLangChange = (e) => {
            if (isTop) setLangTop(e.target.value);
            else setLangBottom(e.target.value);
        };

        return (
            <div
                className={`flex-1 flex flex-col justify-between p-6 relative
          ${isRotated ? 'rotate-180 bg-surface-dark border-b border-white/5' : 'bg-[#0D2137] border-t border-white/5'}`}
            >
                <div className="flex justify-between items-center w-full z-10">
                    <select
                        value={currentLang}
                        onChange={handleLangChange}
                        className="bg-white/10 text-white rounded-xl px-4 py-2 border border-white/10 focus:outline-none focus:border-primary font-medium"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code} className="text-slate-900">{l.flag} {l.name}</option>
                        ))}
                    </select>
                    {side === 'top' && (
                        <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white bg-white/5 p-2 rounded-full absolute right-6">
                            <span className="material-symbols-outlined shrink-0 text-[18px]">close</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center w-full my-4 h-full">
                    <AnimatePresence mode="wait">
                        {status === 'processing' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                <div className="loading loading-spinner loading-lg text-primary"></div>
                                <p className="text-white/50 animate-pulse text-sm">Traduzindo...</p>
                            </motion.div>
                        )}

                        {status === 'idle' && textData.original && !isPartnerRecording && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 max-w-[90%]">
                                {/* Exibe TRADUÇÃO grande que veio do outro lado (se o outro falou) 
                        Ou exibe o que a própria pessoa falou e como ficou traduzido? 
                        Se a pessoa (bottom) falou: textBottom.original é a fala dela. textTop.original é a tradução.
                        Isso foi setado em processAudio.
                    */}
                                {textData.original !== textData.translated ? (
                                    <>
                                        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">{textData.original}</h2>
                                        <h3 className="text-lg font-medium text-emerald-400 italic opacity-80">{textData.translated}</h3>
                                    </>
                                ) : (
                                    <h2 className="text-2xl font-bold text-white/50 tracking-tight leading-tight italic">...</h2>
                                )}
                            </motion.div>
                        )}

                        {isPartnerRecording && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                                <span className="material-symbols-outlined text-[48px] text-white/20 animate-pulse">record_voice_over</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-center w-full z-10">
                    <button
                        onMouseDown={() => startRecording(side)}
                        onMouseUp={stopRecording}
                        onTouchStart={(e) => { e.preventDefault(); startRecording(side); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                        onMouseLeave={stopRecording}
                        disabled={status === 'processing' || partnerStatus !== 'idle'}
                        className={`w-20 h-20 rounded-full flex justify-center items-center shadow-2xl transition-all duration-300
               ${status === 'recording' ? 'bg-red-500 scale-110 shadow-red-500/50 animate-pulse' : 'bg-primary shadow-primary/30'}
               ${(status === 'processing' || partnerStatus !== 'idle') ? 'opacity-50 grayscale' : 'hover:bg-primary-focus cursor-pointer'}
             `}
                    >
                        <span className="material-symbols-outlined text-white text-[32px]">
                            {status === 'recording' ? 'stop' : 'mic'}
                        </span>
                    </button>
                </div>
                <p className="text-center text-[10px] text-white/40 mt-4 uppercase tracking-widest">
                    {status === 'recording' ? 'Solte para enviar' : 'Segure para falar'}
                </p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden select-none">
            {renderSide('top', true)}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent z-50"></div>
            {renderSide('bottom', false)}
        </div>
    );
}
