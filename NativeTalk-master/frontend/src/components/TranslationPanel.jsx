import { useState } from "react";
import { translateMessage } from "../lib/api";
import { Languages, X } from "lucide-react";
import { useParams } from "react-router";

const TranslationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { id: targetUserId } = useParams();

  const handleTranslate = async (text) => {
    if (!text) return;
    
    setIsTranslating(true);
    try {
      const result = await translateMessage(text, targetUserId);
      setTranslation(result);
    } catch (error) {
      console.error("Error translating:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Listener para quando o usuário selecionar texto
  useState(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0) {
        setSelectedText(text);
        setIsOpen(true);
        handleTranslate(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-base-100 shadow-2xl rounded-lg border border-base-300 z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Languages className="size-5 text-primary" />
            <h3 className="font-semibold">Tradução</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-base-content/70 mb-1">Texto original:</p>
            <p className="text-sm bg-base-200 p-2 rounded">{selectedText}</p>
          </div>

          {isTranslating ? (
            <div className="flex items-center justify-center py-4">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : translation ? (
            <div>
              <p className="text-xs text-base-content/70 mb-1">
                Tradução ({translation.sourceLanguage} → {translation.targetLanguage}):
              </p>
              <p className="text-sm bg-primary/10 p-2 rounded border-l-4 border-primary">
                {translation.translatedText}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
