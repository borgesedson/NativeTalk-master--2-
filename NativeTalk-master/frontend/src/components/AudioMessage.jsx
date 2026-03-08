import { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle, Download, Volume2, VolumeX, Loader2, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AudioMessage = ({ audioUrl, duration, transcription, translation, isOwnMessage }) => {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingTranslation, setIsPlayingTranslation] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscription, setShowTranscription] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveform, setWaveform] = useState([]);
  const audioRef = useRef(null);
  const speechRef = useRef(null);
  const canvasRef = useRef(null);



  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * (audioRef.current?.duration || 0);

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${Date.now()}.webm`;
    a.click();
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Gerar waveform simplificado
  useEffect(() => {
    const generateWaveform = () => {
      const bars = 40;
      const wave = Array.from({ length: bars }, () => Math.random() * 0.5 + 0.3);
      setWaveform(wave);
    };
    generateWaveform();
  }, [audioUrl]);

  // Handler para quando o áudio estiver pronto
  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const playTranslation = () => {
    // Para quem envia: reproduz a transcrição original
    // Para quem recebe: reproduz a tradução
    const textToSpeak = isOwnMessage ? transcription : translation;

    if (!textToSpeak || textToSpeak.startsWith('🎤')) return;

    // Verificar se o navegador suporta Speech Synthesis
    if (!window.speechSynthesis) {
      alert('Seu navegador não suporta síntese de voz');
      return;
    }

    // Se já está tocando, parar
    if (isPlayingTranslation) {
      window.speechSynthesis.cancel();
      setIsPlayingTranslation(false);
      return;
    }

    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Mapear idioma
    const languageMap = {
      'pt': 'pt-BR',
      'en': 'en-US',
      'es': 'es-ES',
      'ja': 'ja-JP',
      'fr': 'fr-FR',
      'de': 'de-DE',
    };

    utterance.lang = languageMap[i18n.language] || 'pt-BR';
    utterance.rate = 1.0; // Velocidade normal
    utterance.pitch = 1.0; // Tom normal

    utterance.onstart = () => setIsPlayingTranslation(true);
    utterance.onend = () => setIsPlayingTranslation(false);
    utterance.onerror = () => setIsPlayingTranslation(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const progress = audioRef.current?.duration
    ? (currentTime / audioRef.current.duration) * 100
    : 0;

  // Validação
  if (!audioUrl) {
    return <div className="p-2 bg-error/10 rounded text-xs text-error">❌ Áudio inválido</div>;
  }

  // Debug temporário
  console.log('AudioMessage:', {
    isOwnMessage,
    hasTranscription: !!transcription,
    hasTranslation: !!translation,
    transcription: transcription?.substring(0, 30),
    translation: translation?.substring(0, 30)
  });

  return (
    <div className="flex flex-col gap-2 max-w-sm">
      {/* Player de Áudio */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="btn btn-primary btn-sm btn-circle flex-shrink-0 hover:scale-110 transition-transform"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <PauseCircle className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Waveform Visualization */}
          <div className="flex items-center gap-0.5 h-8">
            {waveform.map((height, index) => {
              const isActive = (index / waveform.length) * 100 <= progress;
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-full transition-all duration-200 ${isActive
                    ? 'bg-primary'
                    : 'bg-base-300'
                    }`}
                  style={{
                    height: `${height * 100}%`,
                    opacity: isActive ? 1 : 0.3
                  }}
                />
              );
            })}
          </div>

          {/* Barra de Progresso Interativa */}
          <div
            className="h-1.5 bg-base-300 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* Tempo e Velocidade */}
          <div className="flex items-center justify-between text-xs text-base-content/70">
            <span className="font-mono font-medium">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              <button
                onClick={changePlaybackRate}
                className="px-1.5 py-0.5 rounded hover:bg-base-200 transition-colors font-mono font-medium"
                title="Velocidade de reprodução"
              >
                {playbackRate}x
              </button>
            </div>
            <span className="font-mono font-medium">{formatTime(duration || audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        <button
          onClick={downloadAudio}
          className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
          title={t('download') || 'Baixar'}
        >
          <Download className="w-4 h-4" />
        </button>

        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          onLoadStart={() => setIsLoading(true)}
          preload="metadata"
          className="hidden"
        />
      </div>

      {/* Para quem RECEBE: mostrar tradução + original */}
      {!isOwnMessage && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
          {/* Transcrição Original - Gray small */}
          {transcription && (
            <div className="px-1">
              <p className="text-xs text-gray-400 font-medium italic opacity-80">
                {transcription}
              </p>
            </div>
          )}

          {/* Tradução - White bold */}
          {translation && (
            <div className="px-1 flex items-center justify-between gap-2">
              <p className="text-[15px] text-white font-bold leading-relaxed flex-1">
                {translation}
              </p>
              <button
                onClick={playTranslation}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                title="Ouvir tradução"
              >
                <Volume2 className="size-4 text-primary" />
              </button>
            </div>
          )}

          {/* Fallback se nada existir */}
          {!transcription && !translation && (
            <div className="px-1">
              <p className="text-[11px] text-gray-500 italic">
                {t('voiceMessage') || 'Mensagem de voz'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Para quem ENVIA: mostrar transcrição (opcional, p/ feedback) */}
      {isOwnMessage && transcription && (
        <div className="px-1 mt-1 text-right">
          <p className="text-xs text-white/50 italic">
            "{transcription}"
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioMessage;
