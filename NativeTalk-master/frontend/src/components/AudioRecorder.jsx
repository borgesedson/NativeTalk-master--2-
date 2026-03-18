import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuthUser from '../hooks/useAuthUser';

const AudioRecorder = ({ onSendAudio, disabled }) => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    if (disabled) return;
    
    if (!navigator.mediaDevices || !window.isSecureContext) {
      toast.error('Gravação de áudio requer conexão segura HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Force ogg/opus format — most compatible with ffmpeg
      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') 
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : 'audio/webm;codecs=opus';

      console.log('[Audio] Recording format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        console.log('[Audio] Blob size:', blob.size, 'type:', blob.type);
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(100); // collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const cancelRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setTranscription('');
  };

  const sendAudio = async () => {
    if (audioBlob && onSendAudio) {
      setIsSending(true);
      try {
        console.log("Sending audio blob to handler...");
        await onSendAudio(audioBlob, '', recordingTime);
        cancelRecording();
      } catch (err) {
        console.error("Failed to send audio:", err);
      } finally {
        setIsSending(false);
      }
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-[#E74C3C]/10 rounded-2xl border-2 border-[#E74C3C] shadow-lg animate-pulse">
        <Mic className="grow-0 w-5 h-5 text-[#E74C3C]" />
        <span className="grow text-sm font-mono font-bold text-[#E74C3C]">
          🎤 Gravando {formatTime(recordingTime)} / 1:00
        </span>
        <button onMouseUp={stopRecording} onTouchEnd={stopRecording} className="btn btn-error btn-sm btn-circle">
          <Square className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-2xl border-2 border-primary shadow-lg animate-fadeIn">
        <button onClick={playAudio} className="btn btn-primary btn-sm btn-circle">
          {isPlaying ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
        </button>
        <span className="flex-1 text-sm font-mono text-primary font-bold">
          {formatTime(recordingTime)}
        </span>
        <button onClick={cancelRecording} className="btn btn-ghost btn-sm btn-circle"><Trash2 className="w-4 h-4" /></button>
        <button onClick={sendAudio} disabled={isSending} className="btn btn-success btn-sm btn-circle">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
      </div>
    );
  }

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled}
      className={`btn btn-circle btn-sm md:btn-md transition-all shadow-lg ${isRecording ? 'btn-error scale-110' : 'btn-primary'}`}
    >
      <Mic className="w-4 h-4 md:w-5 md:h-5 text-white" />
    </button>
  );
};

export default AudioRecorder;
