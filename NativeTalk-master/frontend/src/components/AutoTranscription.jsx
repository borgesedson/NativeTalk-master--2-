import { useState, useRef, useEffect } from "react";
import { Volume2, AlertCircle, Languages, Loader2 } from "lucide-react";
import { transcribeAudio } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { useTranslation } from "react-i18next";

const AutoTranscription = ({ currentUserId, otherUserId, onTranscription }) => {
    const { t } = useTranslation();
    const { authUser } = useAuthUser();
    const [isActive, setIsActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTranscription, setCurrentTranscription] = useState("");
    const [error, setError] = useState("");

    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);

    // Limpar ao desmontar
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startContinuousRecognition = () => {
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
            'italian': 'it-IT',
            'russian': 'ru-RU',
            'korean': 'ko-KR',
        };

        const userLang = authUser?.native_language?.toLowerCase() || 'english';
        recognition.lang = languageMap[userLang] || 'en-US';
        recognition.continuous = true; // CONTÍNUO!
        recognition.interimResults = true; // Resultados parciais

        console.log(`🎤 Iniciando reconhecimento contínuo em ${recognition.lang}`);

        recognition.onstart = () => {
            console.log("✅ Reconhecimento contínuo iniciado");
            isListeningRef.current = true;
            setError("");
        };

        recognition.onresult = async (event) => {
            // Pegar o último resultado
            const lastResultIndex = event.results.length - 1;
            const lastResult = event.results[lastResultIndex];
            const transcript = lastResult[0].transcript;

            console.log(`📝 ${lastResult.isFinal ? 'Final' : 'Parcial'}: ${transcript}`);

            // Mostrar transcrição parcial imediatamente
            setCurrentTranscription(transcript);

            // Se for resultado final, enviar para tradução
            if (lastResult.isFinal && (transcript?.trim()?.length || 0) > 0) {
                console.log("✅ Transcrição final, enviando para tradução...");
                setIsProcessing(true);

                try {
                    const result = await transcribeAudio(
                        null,
                        currentUserId,
                        otherUserId,
                        transcript
                    );

                    console.log("🌐 Tradução recebida:", result);

                    // Callback para componente pai com tradução
                    if (onTranscription) {
                        onTranscription(result);
                    }

                    // Limpar após 3 segundos
                    setTimeout(() => {
                        setCurrentTranscription("");
                    }, 3000);
                } catch (error) {
                    console.error("❌ Erro ao traduzir:", error);
                } finally {
                    setIsProcessing(false);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("❌ Erro Web Speech:", event.error);

            // Ignorar erros "no-speech" (silêncio)
            if (event.error === 'no-speech') {
                console.log("⏸️ Silêncio detectado, continuando...");
                return;
            }

            // Para outros erros, tentar reiniciar
            if (event.error !== 'aborted') {
                setError(`Erro: ${event.error}`);
                setTimeout(() => {
                    if (isActive && isListeningRef.current) {
                        console.log("🔄 Reiniciando reconhecimento...");
                        recognition.start();
                    }
                }, 1000);
            }
        };

        recognition.onend = () => {
            console.log("🛑 Reconhecimento encerrado");
            isListeningRef.current = false;

            // Se ainda está ativo, reiniciar automaticamente
            if (isActive) {
                console.log("🔄 Reiniciando reconhecimento automático...");
                setTimeout(() => {
                    if (isActive) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error("Erro ao reiniciar:", e);
                        }
                    }
                }, 500);
            }
        };

        try {
            recognition.start();
        } catch (error) {
            console.error("❌ Erro ao iniciar reconhecimento:", error);
            setError("Erro ao iniciar reconhecimento de voz");
        }
    };

    const toggleTranscription = () => {
        if (isActive) {
            // Desativar
            console.log("⏹️ Desativando transcrição automática");
            setIsActive(false);
            isListeningRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setCurrentTranscription("");
        } else {
            // Ativar
            console.log("▶️ Ativando transcrição automática");
            setIsActive(true);
            startContinuousRecognition();
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 md:gap-3 p-2">
            {/* Botão de ativar/desativar */}
            <button
                onClick={toggleTranscription}
                className={`
          btn btn-circle btn-lg md:btn-xl touch-manipulation
          ${isActive ? 'btn-error' : 'btn-primary'}
          shadow-lg hover:shadow-xl transition-all
        `}
                aria-label={isActive ? 'Desativar tradução automática' : 'Ativar tradução automática'}
            >
                {isActive ? (
                    <Languages className="w-6 h-6 animate-pulse" />
                ) : (
                    <Languages className="w-6 h-6" />
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
                {isActive && (
                    <div className="flex items-center gap-2 text-success justify-center">
                        <div className="w-2 h-2 md:w-3 md:h-3 bg-success rounded-full animate-pulse"></div>
                        <span className="text-sm md:text-base font-semibold">
                            {t('autoTranslating') || 'Tradução Automática Ativa'}
                        </span>
                    </div>
                )}
                {isProcessing && (
                    <div className="flex items-center gap-2 text-info justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{t('translating') || 'Traduzindo'}...</span>
                    </div>
                )}
                {!isActive && !error && (
                    <span className="text-xs md:text-sm text-base-content/60">
                        {t('tapToEnableAutoTranslation') || 'Toque para ativar tradução automática'}
                    </span>
                )}
            </div>

            {/* Transcrição em tempo real (sua própria fala) */}
            {currentTranscription && isActive && (
                <div className="alert alert-info shadow-lg max-w-full md:max-w-md mx-4 animate-fade-in">
                    <Volume2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                    <span className="text-xs md:text-sm">{currentTranscription}</span>
                </div>
            )}
        </div>
    );
};

export default AutoTranscription;
