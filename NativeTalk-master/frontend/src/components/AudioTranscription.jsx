import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";
import { transcribeAudio } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { useTranslation } from "react-i18next";

const AudioTranscription = ({ currentUserId, otherUserId, onTranscription }) => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [useWebSpeech, setUseWebSpeech] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Verificar suporte a Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      console.log("✅ Web Speech API disponível");
      setUseWebSpeech(true);
    } else {
      console.log("⚠️ Web Speech API não disponível, usando Azure");
    }
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startWebSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Web Speech API não suportada neste navegador");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configurar idioma do usuário
    const languageMap = {
      'english': 'en-US',
      'portuguese': 'pt-BR',
      'spanish': 'es-ES',
      'french': 'fr-FR',
      'german': 'de-DE',
      'japanese': 'ja-JP',
      'chinese': 'zh-CN',
    };

    const userLang = authUser?.native_language?.toLowerCase() || 'english';
    recognition.lang = languageMap[userLang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("🎤 Web Speech reconhecimento iniciado");
      setIsRecording(true);
      setError("");
    };

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      console.log("📝 Transcrição:", transcript);
      setCurrentTranscription(transcript);

      if (event.results[0].isFinal) {
        console.log("✅ Transcrição final, enviando para tradução...");
        setIsProcessing(true);

        try {
          // Enviar para backend para tradução
          const result = await transcribeAudio(
            null, // Sem áudio, já temos a transcrição
            currentUserId,
            otherUserId,
            transcript // Passar a transcrição do Web Speech
          );

          console.log("🌐 Tradução recebida:", result);

          // Atualizar com a tradução
          setCurrentTranscription(result.translatedTranscription);

          // Callback para componente pai com tradução
          if (onTranscription) {
            onTranscription(result);
          }

          // Limpar após 5 segundos
          setTimeout(() => setCurrentTranscription(""), 5000);
        } catch (error) {
          console.error("❌ Erro ao traduzir:", error);
          // Se falhar, usar transcrição original
          if (onTranscription) {
            onTranscription({
              originalTranscription: transcript,
              translatedTranscription: transcript,
            });
          }
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("❌ Erro Web Speech:", event.error);
      setError(`Erro: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      console.log("🛑 Web Speech reconhecimento encerrado");
      setIsRecording(false);
      setTimeout(() => setCurrentTranscription(""), 5000);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("❌ Erro ao iniciar reconhecimento:", error);
      setError("Erro ao iniciar reconhecimento de voz");
    }
  };

  const startRecording = async () => {
    // Se Web Speech API está disponível, usar ela primeiro
    if (useWebSpeech) {
      startWebSpeechRecognition();
      return;
    }

    // Fallback para Azure Speech Service
    try {
      console.log("🎤 Iniciando gravação (Azure)...");
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 Gravação parada, processando...");
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Converter para base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            console.log("📤 Enviando áudio para transcrição...");

            // Enviar para backend
            const result = await transcribeAudio(
              base64Audio,
              currentUserId,
              otherUserId
            );

            console.log("✅ Transcrição recebida:", result);

            setCurrentTranscription(result.translatedTranscription);

            // Callback para componente pai
            if (onTranscription) {
              onTranscription(result);
            }

            // Limpar após alguns segundos
            setTimeout(() => {
              setCurrentTranscription("");
            }, 5000);

          };
        } catch (error) {
          console.error("❌ Erro ao processar áudio:", error);
        } finally {
          setIsProcessing(false);
          // Parar stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("✅ Gravação iniciada");

    } catch (error) {
      console.error("❌ Erro ao iniciar gravação:", error);
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && useWebSpeech) {
      console.log("⏹️ Parando Web Speech...");
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current && isRecording) {
      console.log("⏹️ Parando gravação Azure...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 p-2 md:p-4">
      {/* Botão de gravação */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          btn btn-circle btn-lg md:btn-xl touch-manipulation
          ${isRecording ? 'btn-error animate-pulse' : 'btn-primary'}
          ${isProcessing ? 'loading' : ''}
          shadow-lg hover:shadow-xl transition-all
        `}
        aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
      >
        {isProcessing ? (
          <span className="loading loading-spinner"></span>
        ) : isRecording ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {/* Status */}
      <div className="text-center min-h-[2rem]">
        {error && (
          <div className="flex items-center gap-2 text-error justify-center">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs md:text-sm">{error}</span>
          </div>
        )}
        {isRecording && (
          <div className="flex items-center gap-2 text-error justify-center">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-error rounded-full animate-pulse"></div>
            <span className="text-sm md:text-base font-semibold">
              {t('recording')}... {useWebSpeech ? "🌐" : "☁️"}
            </span>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-info justify-center">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm md:text-base">{t('processing')}...</span>
          </div>
        )}
        {!isRecording && !isProcessing && !error && (
          <span className="text-xs md:text-sm text-base-content/60">
            {t('tapToSpeak')} {useWebSpeech ? `(${t('browser')})` : `(${t('cloud')})`}
          </span>
        )}
      </div>

      {/* Transcrição atual */}
      {currentTranscription && (
        <div className="alert alert-info shadow-lg max-w-full md:max-w-md mx-4">
          <Volume2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-xs md:text-sm">{currentTranscription}</span>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;
