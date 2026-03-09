import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, PhoneOff, Globe } from 'lucide-react';
import { useCallStateHooks, StreamCall } from '@stream-io/video-react-sdk';

const VoiceCallScreen = ({ call, contact, currentUser, onEnd }) => {
    if (!call) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D2137]">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-teal-500 animate-spin mb-4"></div>
                <p className="text-white/60 font-medium animate-pulse">Conectando chamada de voz...</p>
            </div>
        );
    }

    return (
        <StreamCall call={call}>
            <VoiceCallContent call={call} contact={contact} currentUser={currentUser} onEnd={onEnd} />
        </StreamCall>
    );
};

const VoiceCallContent = ({ call, contact, currentUser, onEnd }) => {
    const { useMicrophoneState } = useCallStateHooks();
    const { microphone, isMute } = useMicrophoneState();

    const [originalText, setOriginalText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [receivedSubtitle, setReceivedSubtitle] = useState('');
    const [seconds, setSeconds] = useState(0);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Subtitles
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentUser?.native_language || 'en-US';

        recognition.onresult = async (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript).join('');
            setOriginalText(transcript);

            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: transcript,
                        from: currentUser?.native_language || 'en',
                        to: contact?.native_language || 'pt'
                    })
                });
                const { translated } = await res.json();
                if (translated) {
                    setTranslatedText(translated);
                    await call.sendCustomEvent({
                        type: 'subtitle',
                        data: { text: translated, original: transcript }
                    });
                }
            } catch (err) {
                console.error('Translation error:', err);
            }
        };

        if (!isMute) {
            // recognition.start() throws an error if already started. Keep it simple in UI:
            try { recognition.start(); } catch (e) { }
        }

        return () => {
            try { recognition.stop(); } catch (e) { }
        };
    }, [isMute, currentUser, contact, call]);

    // Receive Subtitles
    useEffect(() => {
        if (!call) return;
        const unsubscribe = call.on('custom', (event) => {
            if (event.type === 'subtitle') {
                setReceivedSubtitle(event.data.text);
            }
        });
        return unsubscribe;
    }, [call]);

    const avatarUrl = contact?.image || contact?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${contact?.name || 'User'}`;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-gradient-to-b from-[#0D2137] to-[#0A1A2F]">

            {/* Top Section */}
            <div className="flex flex-col items-center pt-24 gap-4">
                <img
                    src={avatarUrl}
                    alt={contact?.name}
                    className="w-[140px] h-[140px] rounded-full object-cover border-4 border-white/10 shadow-2xl bg-[#0A1A2F]"
                />
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    {contact?.name}
                    <span className="text-2xl">{contact?.native_language === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
                </h2>
                <div className="font-mono text-white/50 text-xl tracking-wider">{formatTime(seconds)}</div>

                <div className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full bg-teal-500/20 text-teal-400 text-sm font-semibold uppercase tracking-wide border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <Globe className="w-4 h-4" />
                    Tradução Ativa
                </div>
            </div>

            {/* Subtitles Overlay */}
            <div className="flex-1 flex flex-col justify-end pb-8 px-6 md:px-20 pointer-events-none">

                {originalText && !receivedSubtitle && (
                    <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-5 shadow-2xl self-end max-w-[85%] border border-white/5 animate-fadeIn mb-4">
                        <p className="text-gray-400 italic text-[13px] mb-1">Você (Original)</p>
                        <p className="text-white/90 text-md leading-relaxed">{originalText}</p>
                        {translatedText && <p className="text-teal-400 font-bold mt-2 text-lg drop-shadow-sm">{translatedText}</p>}
                    </div>
                )}

                {receivedSubtitle && (
                    <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn w-full max-w-3xl mx-auto flex flex-col items-center text-center">
                        <p className="text-gray-400 italic text-[14px] mb-2">{contact?.name} (Original)</p>
                        <p className="text-white font-bold text-2xl md:text-3xl leading-tight drop-shadow-md">{receivedSubtitle}</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-[#0D2137]/90 backdrop-blur-2xl border-t border-white/10 pb-12 pt-8 px-8 flex justify-center gap-12 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pointer-events-auto">
                <button
                    onClick={() => microphone.toggle()}
                    className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all shadow-lg ${isMute ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                >
                    {isMute ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>

                <button
                    onClick={onEnd}
                    className="w-[80px] h-[80px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-transform hover:scale-110 active:scale-95 border-4 border-red-400/30"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                <button className="w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-lg">
                    <Volume2 className="w-7 h-7" />
                </button>
            </div>
        </div>
    );
};

export default VoiceCallScreen;
