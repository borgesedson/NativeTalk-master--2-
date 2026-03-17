import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, MessageSquare, Globe } from 'lucide-react';
import { useCallStateHooks, ParticipantView, StreamCall } from '@stream-io/video-react-sdk';

const VideoCallScreen = ({ call, contact, currentUser, onEnd }) => {
    if (!call) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-teal-500 animate-spin mb-4"></div>
                <p className="text-white/60 font-medium animate-pulse">Conectando vídeo...</p>
            </div>
        );
    }

    return (
        <StreamCall call={call}>
            <VideoCallContent call={call} contact={contact} currentUser={currentUser} onEnd={onEnd} />
        </StreamCall>
    );
};

const VideoCallContent = ({ call, contact, currentUser, onEnd }) => {
    const { useLocalParticipant, useRemoteParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
    const localParticipant = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const remoteParticipant = remoteParticipants[0];

    const { microphone, isMute } = useMicrophoneState();
    const { camera, isEnabled: isCameraEnabled } = useCameraState();

    const [receivedSubtitle, setReceivedSubtitle] = useState('');
    const [originalText, setOriginalText] = useState('');

    // Timer
    const [seconds, setSeconds] = useState(0);
    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Subtitles (Web Speech API)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentUser?.native_language || 'en-US';

        recognition.onresult = async (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
            setOriginalText(transcript);

            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${API_BASE_URL}/translate`, {
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
                    await call.sendCustomEvent({
                        type: 'subtitle',
                        data: { text: translated, original: transcript }
                    });
                }
            } catch (e) { }
        };

        if (!isMute) {
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

    return (
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col font-sans">
            {/* Remote Video Background */}
            <div className="absolute inset-0 z-0">
                {remoteParticipant ? (
                    <ParticipantView participant={remoteParticipant} mirror={false} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0D2137] to-black">
                        <div className="w-32 h-32 rounded-full border-4 border-white/20 border-t-teal-500 animate-spin mb-8"></div>
                        <p className="text-white/60 text-xl font-medium animate-pulse">Aguardando vídeo de {contact?.name}...</p>
                    </div>
                )}
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-12 pb-24 px-6 flex justify-between items-start z-20 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                        {contact?.name}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-teal-500/40">
                            <Globe className="w-3.5 h-3.5" /> Tradução Ativa
                        </div>
                    </h2>
                    <p className="text-white/90 font-mono text-lg drop-shadow-md font-medium tracking-wide">
                        {formatTime(seconds)} • {contact?.native_language === 'pt' ? '🇧🇷 Português' : '🇺🇸 Inglês'}
                    </p>
                </div>
            </div>

            {/* Local Video PiP */}
            <div className="absolute top-12 right-6 w-[110px] h-[160px] md:w-[160px] md:h-[220px] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] border-2 border-white/20 z-20 bg-gray-900 pointer-events-auto transition-transform hover:scale-105 cursor-pointer">
                {localParticipant ? (
                    <ParticipantView participant={localParticipant} mirror={true} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900/80 text-sm font-medium text-white/50">Você</div>
                )}
            </div>

            {/* Subtitles Overlay */}
            <div className="absolute bottom-40 inset-x-0 px-4 md:px-20 z-20 pointer-events-none flex flex-col justify-end items-center">
                {receivedSubtitle ? (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] animate-fadeIn max-w-3xl w-full text-center">
                        <p className="text-teal-400 font-medium tracking-wide text-[13px] mb-2 uppercase">{contact?.name} disse:</p>
                        <p className="text-white font-bold text-2xl md:text-4xl leading-snug drop-shadow-lg">{receivedSubtitle}</p>
                    </div>
                ) : originalText ? (
                    <div className="bg-black/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-xl animate-fadeIn max-w-xl self-end mr-6 opacity-80">
                        <p className="text-white/50 text-xs mb-1">Ouvindo você...</p>
                        <p className="text-white/90 text-sm">{originalText}</p>
                    </div>
                ) : null}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-8 inset-x-6 md:inset-x-24 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[40px] px-6 py-5 flex justify-between md:justify-center md:gap-12 items-center z-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">

                <button
                    onClick={() => camera.toggle()}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${!isCameraEnabled ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-105'}`}
                >
                    {!isCameraEnabled ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </button>

                <button
                    onClick={() => microphone.toggle()}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isMute ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-105'}`}
                >
                    {isMute ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={onEnd}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-[32px] bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-red-400/30 mx-2"
                >
                    <PhoneOff className="w-8 h-8 md:w-10 md:h-10 fill-white" />
                </button>

                <button className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-lg hover:scale-105">
                    <MessageSquare className="w-6 h-6" />
                </button>

            </div>
        </div>
    );
};

export default VideoCallScreen;
