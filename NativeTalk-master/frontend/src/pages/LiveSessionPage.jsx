import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamChat } from 'stream-chat';
import useAuthUser from '../hooks/useAuthUser';
import toast from 'react-hot-toast';
import { uploadAudio, getStreamToken } from '../lib/api';
import { LANGUAGES } from '../constants';
import Logo from '../components/Logo';
import { getLanguageCode } from '../lib/utils';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const LANGUAGE_FLAGS = {
    'pt': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸',
    'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵',
    'zh': '🇨🇳', 'ko': '🇰🇷', 'ru': '🇷🇺',
    'ar': '🇸🇦', 'it': '🇮🇹', 'tr': '🇹🇷', 'nl': '🇳🇱', 'hi': '🇮🇳'
};

const getFlag = (langCode) => LANGUAGE_FLAGS[langCode] || '🌐';

const LiveSessionPage = () => {
    const { authUser: user } = useAuthUser();
    const navigate = useNavigate();
    const [step, setStep] = useState('create'); // 'create', 'share', 'active', 'ended'
    const [session, setSession] = useState(null);
    const [myLang, setMyLang] = useState(user?.native_language || 'pt');
    const [guestLang, setGuestLang] = useState('en');
    const [isCreating, setIsCreating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [myTranscript, setMyTranscript] = useState('');
    const [otherTranscript, setOtherTranscript] = useState('');
    const [otherTranslation, setOtherTranslation] = useState('');
    const [guestJoined, setGuestJoined] = useState(false);
    const [showConnected, setShowConnected] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamClientRef = useRef(null);
    const channelRef = useRef(null);

    // Initial language setup and cleanup
    useEffect(() => {
        if (user?.native_language) setMyLang(user.native_language);
        return () => {
            if (streamClientRef.current) {
                streamClientRef.current.disconnectUser();
            }
        };
    }, [user]);

    // Auto-dismiss "Conectado!" after 3 seconds
    useEffect(() => {
        if (guestJoined && !otherTranslation) {
            setShowConnected(true);
            const timer = setTimeout(() => setShowConnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [guestJoined]);

    // Polling fallback to ensure Host UI updates if StreamChat WebSocket misses
    const guestJoinedRef = useRef(false);
    useEffect(() => {
        guestJoinedRef.current = guestJoined;
    }, [guestJoined]);

    useEffect(() => {
        if (step !== 'active' || !session?.session_code) return;

        let cancelled = false;
        const poll = async () => {
            if (cancelled || guestJoinedRef.current) return;
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${API_BASE_URL}/live/${session.session_code}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log('[Polling]', data.status, data.language_2, data.guest_name);
                    if (data.guest_name) {
                        setGuestJoined(true);
                        setGuestLang(data.language_2 || guestLang);
                        toast.success(`${data.guest_name} entrou na sessão!`);
                        return; // stop polling
                    }
                }
            } catch (e) {
                console.error('Polling error', e);
            }
            if (!cancelled) setTimeout(poll, 2000);
        };
        setTimeout(poll, 2000);
        return () => { cancelled = true; };
    }, [step, session?.session_code]);

    const handleCreateSession = async () => {
        setIsCreating(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE_URL}/live/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creator_name: user?.name || 'Anfitrião',
                    language_1: getLanguageCode(myLang),
                    language_2: getLanguageCode(guestLang),
                    created_by: user?.id
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setSession(data);
            setStep('active');
            initStream(data.session_code);
        } catch (error) {
            toast.error('Erro ao criar sessão: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const initStream = async (code) => {
        try {
            const client = StreamChat.getInstance(STREAM_API_KEY);
            const token = await getStreamToken();
            
            if (client.userID) {
                await client.disconnectUser();
            }
            await client.connectUser({ id: user.id, name: user.name }, token);
            streamClientRef.current = client;

            const channelId = code.replace('-', '').toLowerCase();
            const channel = client.channel('livestream', channelId, {
                name: `Live Session ${code}`,
                members: [user.id]
            });
            await channel.watch();
            channelRef.current = channel;

            channel.on('live.translation', (event) => {
                if (event.speaker === 'guest') {
                    setOtherTranscript(event.transcript);
                    setOtherTranslation(event.translated);
                    speak(event.translated, getLanguageCode(myLang));
                } else if (event.speaker === 'creator') {
                    setMyTranscript(event.transcript);
                }
            });

            channel.on('member.added', (event) => {
                toast.success('Convidado entrou na sessão!');
                setGuestJoined(true);
            });

            channel.on('guest_joined', (event) => {
                toast.success(`${event.guestName || 'Convidado'} entrou na sessão!`);
                setGuestJoined(true);
            });

            // Check if already active
            const state = await channel.query();
            if (Object.keys(state.members || {}).length > 1) {
                setGuestJoined(true);
            }
        } catch (error) {
            console.error('Stream init error:', error);
        }
    };

    const speak = (text, lang) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : lang;
        window.speechSynthesis.speak(utterance);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            toast.error('Erro ao acessar microfone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const processAudio = async (blob) => {
        setIsProcessing(true);
        try {
            const uploadResult = await uploadAudio(blob, 'audio/wav');
            const audioUrl = uploadResult?.url || uploadResult;

            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE_URL}/stt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    from: 'auto',
                    to: getLanguageCode(guestLang)
                })
            });
            const { transcript, translated } = await res.json();

            if (channelRef.current) {
                await channelRef.current.sendEvent({
                    type: 'live.translation',
                    speaker: 'creator',
                    transcript,
                    translated,
                    fromLang: 'auto',
                    toLang: getLanguageCode(guestLang)
                });
            }
        } catch (error) {
            toast.error('Erro no processamento');
        } finally {
            setIsProcessing(false);
        }
    };

    const shareUrl = `${window.location.origin}/live/${session?.session_code}`;

    const renderCreate = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0D2137] text-white">
            <div className="absolute top-6 left-6">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
            </div>
            
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mb-8 opacity-20"
            >
                <span className="material-symbols-outlined text-[120px] text-primary">public</span>
            </motion.div>

            <h1 className="text-3xl font-bold mb-2">Sessão ao Vivo 🌐</h1>
            <p className="text-slate-400 mb-12 text-center max-w-xs">Fale no seu idioma. Seja entendido no dele.</p>

            <div className="w-full max-w-sm space-y-6">
                <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">Meu idioma:</label>
                    <select 
                        value={myLang}
                        onChange={(e) => setMyLang(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#1E2A3A]">{l.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">Idioma do convidado:</label>
                    <select 
                        value={guestLang}
                        onChange={(e) => setGuestLang(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#1E2A3A]">{l.label}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleCreateSession}
                    disabled={isCreating}
                    className="w-full bg-[#F4845F] hover:bg-[#ff9673] text-white font-bold h-16 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isCreating ? 'CRIANDO...' : 'CRIAR SESSÃO 🚀'}
                </button>

                <div className="pt-8 mt-4 border-t border-white/10 text-center">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">Ou entrar em sessão existente:</p>
                    <input 
                        type="text" 
                        placeholder="CÓDIGO (EX: ABC-1234)" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary text-center uppercase font-bold tracking-widest transition-colors"
                        onChange={(e) => {
                            let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (val.length > 3) {
                                val = val.substring(0, 3) + '-' + val.substring(3, 7);
                            }
                            if (val.length === 8) {
                                navigate(`/live/${val}`);
                            }
                            e.target.value = val;
                        }}
                        maxLength={8}
                    />
                </div>
            </div>
        </div>
    );

    const renderActive = () => (
        <div className="flex flex-col min-h-[100dvh] bg-[#0D2137] overflow-hidden">
            {/* GUEST SIDE (TOP) */}
            {!guestJoined ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-b border-white/5">
                    <p className="text-xs font-bold text-primary tracking-widest uppercase mb-4">
                        Aguardando Convidado
                    </p>
                    <div className="text-center mb-6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1">Código da sala</p>
                        <p className="text-4xl font-black tracking-widest text-white">{session?.session_code}</p>
                    </div>
                    
                    <div className="w-full max-w-sm space-y-3">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success('Link copiado!');
                            }}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-3 transition-colors"
                        >
                            <span className="material-symbols-outlined">link</span> Compartilhar Link
                        </button>
                        
                        <button 
                            onClick={() => {
                                window.open(`https://wa.me/?text=Junte-se à minha sessão NativeTalk: ${shareUrl}`, '_blank');
                            }}
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-12 rounded-2xl flex items-center justify-center gap-3 transition-colors"
                        >
                            <span className="material-symbols-outlined">chat</span> WhatsApp
                        </button>
                    </div>

                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 text-slate-500 hover:text-white text-xs underline"
                    >
                        Cancelar Sessão
                    </button>
                </div>
            ) : (
                <div className="flex-1 rotate-180 flex flex-col p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{getFlag(guestLang)}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{guestLang} (Convidado)</span>
                        <span className="ml-auto size-2 bg-green-400 rounded-full animate-pulse"></span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center gap-4">
                        {otherTranslation ? (
                            <p className="text-3xl font-bold text-white leading-tight">
                                {otherTranslation}
                            </p>
                        ) : showConnected ? (
                            <div className="text-center">
                                <span className="material-symbols-outlined text-5xl text-green-400 mb-2">check_circle</span>
                                <p className="text-xl font-bold text-green-400">Conectado!</p>
                                <p className="text-sm text-slate-400 mt-1">Esperando o convidado falar...</p>
                            </div>
                        ) : (
                            <p className="text-lg text-slate-500 text-center italic">Tradução aparecerá aqui...</p>
                        )}
                        <p className="text-sm italic text-slate-400 line-clamp-2">
                            {otherTranscript}
                        </p>
                    </div>
                </div>
            )}

            {/* DIVIDER WITH INFO */}
            <div className="h-10 bg-[#0D7377] flex items-center justify-between px-6 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span>Cod: {session?.session_code}</span>
                <span className="animate-pulse">Sessão Ativa</span>
                <span>24:00:00</span>
            </div>

            {/* CREATOR SIDE (BOTTOM) */}
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getFlag(myLang)}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{myLang} (Você)</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <p className="text-3xl font-bold text-white leading-tight">
                        {myTranscript || "Toque e segure para falar"}
                    </p>
                </div>

                <div className="flex justify-center pb-8">
                    <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`size-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-3xl shadow-red-500/50' : 'bg-[#F4845F] shadow-xl shadow-primary/20'}`}
                    >
                        {isProcessing ? (
                            <div className="loading loading-spinner text-white"></div>
                        ) : (
                            <span className="material-symbols-outlined text-4xl text-white">
                                {isRecording ? 'stop' : 'mic'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence mode="wait">
            {step === 'create' && <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderCreate()}</motion.div>}
            {step === 'active' && <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderActive()}</motion.div>}
        </AnimatePresence>
    );
};

export default LiveSessionPage;
