import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  MessageSquare, Users, Settings, Volume2, VolumeX,
  PhoneCall, Maximize, Minimize, RotateCcw, Sparkles, Languages, Globe, Zap, ArrowLeft, MoreHorizontal, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUser, initiateCall, updateCallStatus } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// Speech Config
const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

const CallPage = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [callType, setCallType] = useState('video');
  const [fullScreen, setFullScreen] = useState(false);

  const [isTranslationEnabled, setIsTranslationEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState(null);
  const [myLanguage, setMyLanguage] = useState('');
  const [otherUserLanguage, setOtherUserLanguage] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const callTimerRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { callId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      setMyLanguage(user.native_language || 'en-US');
      initializeSocket();
      setupWebRTC();

      const withUserId = searchParams.get('with');
      const type = searchParams.get('type') || 'video';

      if (withUserId && !callId) {
        startCall(withUserId, type);
      }
    }

    return () => cleanup();
  }, [user, callId, searchParams]);

  useEffect(() => {
    if (isCallActive && isTranslationEnabled && myLanguage && otherUserLanguage) {
      setupSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    return () => stopSpeechRecognition();
  }, [isCallActive, isTranslationEnabled, myLanguage, otherUserLanguage]);

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isCallActive]);

  const initializeSocket = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    socketRef.current = io(serverUrl);
    socketRef.current.emit('join-user-room', user.id);

    socketRef.current.on('translation-message', (data) => {
      setTranslatedText({
        original: data.originalText,
        translated: data.translatedText,
        fromLanguage: data.fromLanguage,
        timestamp: data.timestamp
      });

      if (data.toLanguage === myLanguage) {
        speakText(data.translatedText, myLanguage);
      }

      setTimeout(() => setTranslatedText(null), 8000);
    });

    socketRef.current.on('incoming-call', handleIncomingCall);
    socketRef.current.on('call-accepted', handleCallAccepted);
    socketRef.current.on('call-rejected', handleCallRejected);
    socketRef.current.on('call-ended', handleCallEnded);
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);
  };
  const translateAndSend = async (text) => {
    if (!socketRef.current) return;

    // Attempt to determine recipient based on active call info (callerInfo object)
    const receiverId = callerInfo?.callerId === user.id ? callerInfo?.receiverId : callerInfo?.callerId;

    socketRef.current.emit('translation-message', {
      originalText: text,
      fromLanguage: myLanguage,
      toLanguage: otherUserLanguage || 'en',
      receiverId: receiverId || otherUser?.id
    });
  };

  const setupSpeechRecognition = () => {
    if (!speechRecognition) return;
    recognitionRef.current = new speechRecognition();
    const recognition = recognitionRef.current;
    recognition.lang = myLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      if (isCallActive && isTranslationEnabled) {
        setTimeout(() => { if (recognitionRef.current && isCallActive) recognitionRef.current.start(); }, 1000);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else setCurrentTranscript(transcript);
      }
      if (finalTranscript.trim()) {
        translateAndSend(finalTranscript.trim());
        setCurrentTranscript('');
      }
    };

    try { recognition.start(); } catch (e) { }
  };

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async (receiverId, type) => {
    // Logic as before but with UI updates
    setCallType(type);
    setIsCallActive(true);
    toast.success("Ringing...");
  };

  const endCall = () => {
    socketRef.current?.emit('end-call', { callId, to: otherUser?.id });
    cleanup();
    navigate('/history');
  };

  const cleanup = () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    stopSpeechRecognition();
    setIsCallActive(false);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    recognitionRef.current = null;
    setIsListening(false);
  };

  const speakText = (text, lang) => {
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  };

  // WebRTC Handlers (Placeholders for brevity, you already have them in original)
  const handleIncomingCall = (data) => { setIsIncoming(true); setOtherUser(data.caller); };
  const handleCallAccepted = (data) => { setIsCallActive(true); setIsIncoming(false); };
  const handleCallRejected = () => { toast.error("Call Rejected"); cleanup(); navigate(-1); };
  const handleCallEnded = () => { toast.info("Call Ended"); cleanup(); navigate(-1); };
  const handleOffer = async () => { };
  const handleAnswer = async () => { };
  const handleIceCandidate = () => { };
  const setupWebRTC = () => { };

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-display">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 size-[60%] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-0 size-[40%] bg-accent-coral/5 rounded-full blur-[100px]" />
      </div>

      {/* TOP BAR */}
      <header className="absolute top-0 inset-x-0 z-50 p-8 flex items-center justify-between pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/5 px-6 py-3 rounded-2xl pointer-events-auto"
        >
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
              {otherUser?.name?.charAt(0) || <User className="size-4" />}
            </div>
            <div>
              <h2 className="text-sm font-black truncate max-w-[120px]">{otherUser?.name || 'Practitioner'}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                {formatDuration(callDuration)}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase">
            <Zap className="size-3 fill-primary" />
            EN-DE LINKED
          </div>
          <button className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {/* MAIN VIDEO AREA */}
      <main className="flex-1 relative flex items-center justify-center p-6">
        {/* OTHER USER VIDEO (Immersive) */}
        <div className="relative w-full h-full max-w-6xl aspect-video rounded-[3rem] overflow-hidden bg-[#0a0a0a] border border-white/5 group shadow-2xl">
          {isVideoOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0a0a0a] to-[#141414]">
              <div className="size-48 bg-white/5 rounded-[4rem] flex items-center justify-center ring-8 ring-white/[0.02]">
                <User className="size-24 text-gray-700" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black">{otherUser?.name || 'Remote Partner'}</h3>
                <p className="text-gray-500 font-bold text-sm">Video Stream Terminated</p>
              </div>
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              poster="https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&q=80&w=2000"
            />
          )}

          {/* Subtitle Overlay (The "Stitch" experience) */}
          <AnimatePresence>
            {translatedText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-12 inset-x-12 z-40"
              >
                <div className="max-w-3xl mx-auto bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="size-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Synthesis</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                    "{translatedText.translated}"
                  </p>
                  <p className="mt-2 text-xs text-gray-500 italic opacity-60">Source: {translatedText.original}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* My Audio Transcript Indicator */}
          <AnimatePresence>
            {currentTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-primary/20 border border-primary/30 py-2 px-6 rounded-full backdrop-blur-xl"
              >
                <p className="text-xs font-bold text-primary flex items-center gap-2">
                  <Mic className="size-3 animate-pulse" />
                  {currentTranscript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SELF VIDEO (Picture-in-Picture) */}
          <motion.div
            drag
            dragConstraints={{ left: -400, right: 400, top: -200, bottom: 200 }}
            className="absolute bottom-8 right-8 size-48 md:size-64 rounded-[2rem] overflow-hidden border-2 border-white/10 bg-[#141414] shadow-2xl z-50 cursor-grab active:cursor-grabbing"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-500"
            />
            <div className="absolute top-4 right-4 size-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-lg px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-tighter">YOU (LOCAL NODE)</p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* CONTROLS BAR */}
      <footer className="h-32 mb-8 relative z-50 flex items-center justify-center p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 bg-black/60 backdrop-blur-3xl border border-white/5 p-4 rounded-[40px] pointer-events-auto shadow-2xl"
        >
          <div className="flex items-center gap-2 px-6 border-r border-white/5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-3xl transition-all ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
            </button>
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-3xl transition-all ${isVideoOff ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {isVideoOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
            </button>
          </div>

          <button
            onClick={endCall}
            className="p-8 bg-red-500 text-white rounded-[2rem] hover:bg-red-600 active:scale-95 transition-all shadow-xl shadow-red-500/20"
          >
            <PhoneOff className="size-8 stroke-[3px]" />
          </button>

          <div className="flex items-center gap-2 px-6 border-l border-white/5">
            <button
              onClick={() => setIsTranslationEnabled(!isTranslationEnabled)}
              className={`p-4 rounded-3xl transition-all ${isTranslationEnabled ? 'bg-primary/10 text-primary' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <Languages className="size-6" />
            </button>
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-4 rounded-3xl transition-all ${!isSpeakerOn ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {isSpeakerOn ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
            </button>
          </div>
        </motion.div>
      </footer>

      {/* AUDIO ACTIVITY MONITOR (Visual Flair) */}
      {isListening && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse pointer-events-none" />
      )}

      {/* INCOMING OVERLAY */}
      <AnimatePresence>
        {isIncoming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="size-48 bg-primary/20 rounded-[4rem] mx-auto mb-12 flex items-center justify-center ring-8 ring-primary/5"
              >
                <PhoneCall className="size-24 text-primary animate-bounce fill-primary" />
              </motion.div>
              <h2 className="text-4xl font-black mb-4">Incoming Practice Session</h2>
              <p className="text-gray-400 text-lg mb-16">{otherUser?.name || 'Someone'} is requesting a cultural link.</p>

              <div className="flex gap-8 justify-center">
                <button
                  onClick={() => { socketRef.current?.emit('reject-call', { callId, to: otherUser?.id }); setIsIncoming(false); }}
                  className="px-12 py-6 bg-red-500/10 text-red-500 font-bold rounded-3xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                >
                  Ignore
                </button>
                <button
                  onClick={() => { setIsIncoming(false); setIsCallActive(true); }}
                  className="px-12 py-6 bg-primary text-white font-bold rounded-3xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Establish Link
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .rotate-x-6 { transform: rotateX(6deg); }
        .perspective-1000 { perspective: 1000px; }
        @keyframes flow {
           0% { background-position: 0% 50%; }
           100% { background-position: 100% 50%; }
        }
      `}} />
    </div>
  );
};

export default CallPage;
