import React, { useState, useEffect, useCallback, useContext, createContext, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { getStreamToken, translateMessage } from '../lib/api';
import { getLanguageCode } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';

// Lazy load heavy components
const CallingScreen = lazy(() => import('../components/calls/CallingScreen'));
const IncomingCallScreen = lazy(() => import('../components/calls/IncomingCallScreen'));
const VoiceCallScreen = lazy(() => import('../components/calls/VoiceCallScreen'));
const VideoCallScreen = lazy(() => import('../components/calls/VideoCallScreen'));

// Dynamically load Stream UI wrapper to avoid heavy initial bundle
let StreamVideo, CallingState; 
import('@stream-io/video-react-sdk').then(module => {
    StreamVideo = module.StreamVideo;
    CallingState = module.CallingState;
});

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const CallManager = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [videoClient, setVideoClient] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isOutgoing, setIsOutgoing] = useState(false);
    const [subtitle, setSubtitle] = useState("");
    const [recognition, setRecognition] = useState(null);

    // States for UI
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    useEffect(() => {
        if (!user) return;

        let client;
        let unsubscribe;

        const initClient = async () => {
            try {
                const { token } = await getStreamToken();
                const { StreamVideoClient: Client } = await import('@stream-io/video-react-sdk');
                client = new Client({
                    apiKey: STREAM_API_KEY,
                    user: {
                        id: user.id,
                        name: user.name,
                        image: user.avatar_url,
                    },
                    token,
                });
                setVideoClient(client);

                // Listen for ringing calls
                unsubscribe = client.on('call.ring', (event) => {
                    if (event.call) {
                        setIncomingCall(event.call);
                    }
                });
            } catch (error) {
                console.error('Failed to init Stream Video:', error);
            }
        };

        initClient();

        return () => {
            if (unsubscribe) unsubscribe();
            if (client) client.disconnectUser();
        };
    }, [user]);

    // Subtitles Logic
    const startSubtitles = useCallback((call, contactLang) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = getLanguageCode(user.native_language || 'pt');

        rec.onresult = async (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');

            if (event.results[event.results.length - 1].isFinal) {
                try {
                    const res = await translateMessage(transcript, null, contactLang, user.native_language);
                    const translated = res.translatedText;

                    await call.sendCustomEvent({
                        type: 'subtitle',
                        data: { text: translated, from: user.id }
                    });
                } catch (e) {
                    console.error("Subtitle translation error:", e);
                }
            }
        };

        rec.start();
        return rec;
    }, [user]);

    useEffect(() => {
        if (!activeCall) return;

        const handleCustomEvent = (event) => {
            if (event.type === 'subtitle') {
                setSubtitle(event.data.text);
                setTimeout(() => setSubtitle(""), 5000);
            }
        };

        const unsubscribe = activeCall.on('custom', handleCustomEvent);
        return () => unsubscribe();
    }, [activeCall]);

    useEffect(() => {
        if (activeCall && activeCall.state?.callingState === CallingState.JOINED && !recognition) {
            const contact = activeCall.state.members.find(m => m.user.id !== user.id)?.user;
            const contactLang = contact?.native_language || 'en';
            const rec = startSubtitles(activeCall, contactLang);
            setRecognition(rec);
        }
        return () => {
            if (activeCall?.state?.callingState !== CallingState.JOINED && recognition) {
                recognition.stop();
                setRecognition(null);
            }
        };
    }, [activeCall, activeCall?.state?.callingState, user, recognition, startSubtitles]);

    const handleStartCall = async (targetUserId, type = 'voice') => {
        if (!videoClient) return;

        // Use Stream's built-in call types: 'default' for video, 'audio_room' for voice
        const streamCallType = type === 'video' ? 'default' : 'audio_room';
        const callId = `call-${user.id}-${targetUserId}-${Date.now()}`;
        const call = videoClient.call(streamCallType, callId);

        setIsOutgoing(true);
        setActiveCall(call);

        await call.getOrCreate({
            ring: true,
            data: { members: [{ user_id: user.id }, { user_id: targetUserId }] }
        });
    };

    const handleAnswer = async () => {
        if (!incomingCall) return;
        await incomingCall.answer();
        setActiveCall(incomingCall);
        setIncomingCall(null);
    };

    const handleReject = async () => {
        if (!incomingCall) return;
        await incomingCall.reject();
        setIncomingCall(null);
    };

    const handleEndCall = async () => {
        if (activeCall) {
            await activeCall.leave();
            setActiveCall(null);
            setIsOutgoing(false);
            if (recognition) {
                recognition.stop();
                setRecognition(null);
            }
        }
    };

    if (!videoClient) return children;

    return (
        <CallContext.Provider value={{ startCall: handleStartCall }}>
            <StreamVideo client={videoClient}>
                {children}

                <AnimatePresence>
                    <Suspense fallback={null}>
                        {isOutgoing && activeCall && activeCall.state.callingState !== CallingState.JOINED && (
                            <CallingScreen
                                contact={activeCall.state.members[1]?.user}
                                onCancel={handleEndCall}
                            />
                        )}

                        {incomingCall && (
                            <IncomingCallScreen
                                contact={incomingCall.state.createdBy}
                                onAnswer={handleAnswer}
                                onReject={handleReject}
                            />
                        )}

                        {activeCall && activeCall.state.callingState === CallingState.JOINED && (
                            activeCall.type === 'audio_room' ? (
                                <VoiceCallScreen
                                    contact={activeCall.state.members.find(m => m.user.id !== user.id)?.user}
                                    onEndCall={handleEndCall}
                                    subtitle={subtitle}
                                    isMuted={isMuted}
                                    onToggleMute={() => {
                                        activeCall.microphone.toggle();
                                        setIsMuted(!isMuted);
                                    }}
                                    isSpeakerOn={isSpeakerOn}
                                    onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
                                />
                            ) : (
                                <VideoCallScreen
                                    contact={activeCall.state.members.find(m => m.user.id !== user.id)?.user}
                                    onEndCall={handleEndCall}
                                    subtitle={subtitle}
                                    localStream={activeCall.state.localParticipant?.videoStream}
                                    remoteStream={activeCall.state.remoteParticipants[0]?.videoStream}
                                    isMuted={isMuted}
                                    onToggleMute={() => {
                                        activeCall.microphone.toggle();
                                        setIsMuted(!isMuted);
                                    }}
                                    isCameraOff={isCameraOff}
                                    onToggleCamera={() => {
                                        activeCall.camera.toggle();
                                        setIsCameraOff(!isCameraOff);
                                    }}
                                />
                            )
                        )}
                    </Suspense>
                </AnimatePresence>
            </StreamVideo>
        </CallContext.Provider>
    );
};

export default CallManager;
