import { useState, useEffect } from "react";
import { translateMessage } from "../lib/api";
import { Languages } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const TranslatedMessage = ({ message, targetUserId }) => {
  const [translation, setTranslation] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { authUser } = useAuthUser();

  // Verifica se a mensagem é do próprio usuário
  const isOwnMessage = message.user?.id === authUser?.id;

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateMessage(message.text, targetUserId);
      setTranslation(result);
      setShowTranslation(true);
    } catch (error) {
      console.error("Error translating message:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-traduz mensagens recebidas se o idioma for diferente
  useEffect(() => {
    if (!isOwnMessage && message.text && authUser?.preferredLanguage) {
      // Auto-traduz automaticamente (opcional)
      // handleTranslate();
    }
  }, [message, isOwnMessage, authUser]);

  return (
    <div className="relative group">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm">{message.text}</p>
          
          {showTranslation && translation && (
            <div className="mt-2 p-2 bg-base-300 rounded-lg border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-1">
                <Languages className="size-3 text-primary" />
                <span className="text-xs text-base-content/70">
                  Tradução ({translation.targetLanguage})
                </span>
              </div>
              <p className="text-sm text-base-content/90">{translation.translatedText}</p>
            </div>
          )}
        </div>

        {!isOwnMessage && (
          <button
            onClick={handleTranslate}
            className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isTranslating}
            title="Traduzir mensagem"
          >
            {isTranslating ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Languages className={`size-4 ${showTranslation ? 'text-primary' : ''}`} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TranslatedMessage;
