import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamChat } from 'stream-chat';
import useAuthUser from '../hooks/useAuthUser';
import toast from 'react-hot-toast';
import { uploadAudio } from '../lib/api';
import { LANGUAGES } from '../constants';
import Logo from '../components/Logo';
import { getLanguageCode } from '../lib/utils';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const LANGUAGE_FLAGS = {
    'pt': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸',
    'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵',
    'zh': '🇨🇳', 'ko': '🇰🇷', 'ru': '🇷🇺',
    'ar': '🇸🇦', 'it': '🇮🇹', 'tr': '🇹🇷', 'nl': '🇳🇱'
};

const getFlag = (langCode) => LANGUAGE_FLAGS[langCode] || '🌐';

const LiveJoinPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState('join'); // 'join', 'active', 'ended'
    const [session, setSession] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [guestLang, setGuestLang] = useState('en');
    const [isJoining, setIsJoining] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [myTranscript, setMyTranscript] = useState('');
    const [otherTranscript, setOtherTranscript] = useState('');
    const [otherTranslation, setOtherTranslation] = useState('');
    const [showConnected, setShowConnected] = useState(true);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamClientRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        fetchSession();
        return () => {
            if (streamClientRef.current) {
                streamClientRef.current.disconnectUser();
            }
        };
    }, [code]);

    // Auto-dismiss "Conectado!" after 3 seconds
    useEffect(() => {
        if (step === 'active' && showConnected) {
            const timer = setTimeout(() => setShowConnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [step, showConnected]);

    const fetchSession = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE_URL}/live/${code}`);
            const data = await res.json();
            if (data.error) {
                toast.error('Sessão não encontrada');
                navigate('/dashboard');
                return;
            }
            setSession(data);
            setGuestLang(data.language_2 || 'en');
        } catch (error) {
            toast.error('Erro ao buscar sessão');
        }
    };

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            // 1. Join in DB
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const joinRes = await fetch(`${API_BASE_URL}/live/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_name: guestName || 'Convidado',
                    language_2: getLanguageCode(guestLang)
                })
            });
            const updatedSession = await joinRes.json();
            setSession(updatedSession);

            // 2. Initialise Guest Stream Session
            const client = StreamChat.getInstance(STREAM_API_KEY);
            const tokenRes = await fetch(`${API_BASE_URL}/live/${code}/stream-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guest_name: guestName || 'Convidado' })
            });
            const { token, userId } = await tokenRes.json();

            if (client.userID) {
                await client.disconnectUser();
            }
            await client.connectUser({ id: userId, name: guestName || 'Convidado' }, token);
            streamClientRef.current = client;

            const channelId = code.replace('-', '').toLowerCase();
            const channel = client.channel('livestream', channelId);
            await channel.watch();
            channelRef.current = channel;

            // Envia evento customizado para garantir que o anfitrião saiba que o convidado entrou
            await channel.sendEvent({
                type: 'guest_joined',
                guestName: guestName || 'Convidado'
            });

            channel.on('live.translation', (event) => {
                if (event.speaker === 'creator') {
                    setOtherTranscript(event.transcript);
                    setOtherTranslation(event.translated);
                    speak(event.translated, getLanguageCode(guestLang));
                } else if (event.speaker === 'guest') {
                    setMyTranscript(event.transcript);
                }
            });

            setStep('active');
        } catch (error) {
            toast.error('Erro ao entrar: ' + error.message);
        } finally {
            setIsJoining(false);
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
            toast.error('Microfone não acessível');
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

            const res = await fetch(`${API_BASE_URL}/stt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    from: 'auto',
                    to: getLanguageCode(session.language_1)
                })
            });
            const { transcript, translated } = await res.json();

            if (channelRef.current) {
                await channelRef.current.sendEvent({
                    type: 'live.translation',
                    speaker: 'guest',
                    transcript,
                    translated,
                    fromLang: 'auto',
                    toLang: getLanguageCode(session.language_1)
                });
            }
        } catch (error) {
            toast.error('Erro ao traduzir');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderJoin = () => (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0D2137] text-white">
            <Logo size={64} className="mb-8" />
            
            <h1 className="text-2xl font-bold mb-2">Entrar na Sessão</h1>
            <p className="text-slate-400 mb-8 text-center">Você foi convidado para uma sessão de tradução em tempo real.</p>

            <div className="w-full max-w-sm space-y-6 bg-white/5 p-8 rounded-[32px] border border-white/10">
                <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">Seu nome (opcional):</label>
                    <input 
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Ex: Maria"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">Seu idioma:</label>
                    <select 
                        value={guestLang}
                        onChange={(e) => setGuestLang(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#1E2A3A]">{l.label}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full bg-[#0D7377] hover:bg-[#0e8a8f] text-white font-bold h-16 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isJoining ? 'ENTRANDO...' : 'ENTRAR NA SESSÃO 🚀'}
                </button>
            </div>
            
            <p className="mt-8 text-xs text-slate-500 text-center px-12">
                Ao entrar, você concorda que seu áudio será processado para tradução em tempo real.
            </p>
        </div>
    );

    const renderActive = () => (
        <div className="flex flex-col min-h-[100dvh] bg-[#0D2137] overflow-hidden">
            {/* CREATOR SIDE (TOP) - ROTATED 180 */}
            <div className="flex-1 rotate-180 flex flex-col p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getFlag(session?.language_1)}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{session?.language_1} (Anfitrião)</span>
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
                            <p className="text-sm text-slate-400 mt-1">Esperando o anfitrião falar...</p>
                        </div>
                    ) : (
                        <p className="text-lg text-slate-500 text-center italic">Tradução aparecerá aqui...</p>
                    )}
                    <p className="text-sm italic text-slate-400 line-clamp-2">
                        {otherTranscript}
                    </p>
                </div>
            </div>

            {/* DIVIDER */}
            <div className="h-10 bg-[#0D7377] flex items-center justify-between px-6 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span>Cod: {code}</span>
                <span className="animate-pulse">Sessão Ativa</span>
                <span>Guest: {guestName || 'Você'}</span>
            </div>

            {/* GUEST SIDE (BOTTOM) */}
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getFlag(guestLang)}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{guestLang} (Você)</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <p className="text-3xl font-bold text-white leading-tight">
                        {myTranscript || "Segure para falar"}
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
            {step === 'join' && <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderJoin()}</motion.div>}
            {step === 'active' && <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderActive()}</motion.div>}
        </AnimatePresence>
    );
};

export default LiveJoinPage;
