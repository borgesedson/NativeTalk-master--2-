"use client";

import React, { useState, useEffect } from "react";
import { MessageSimple } from "stream-chat-react";
import { useAuth } from "@/contexts/AuthContext";
import { translateApi } from "@/lib/api";
import { Languages, Loader2 } from "lucide-react";

export default function CustomMessage(props) {
    const { message } = props;
    const { user: currentUser } = useAuth();

    if (!message) return null;

    const [translatedText, setTranslatedText] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    // Somente traduzir se a mensagem for de outro usuário
    const isMessageFromOther = message.user?.id && currentUser?._id && message.user.id !== currentUser._id;

    useEffect(() => {
        const handleTranslation = async () => {
            const userId = message.user?.id;
            // Evitar traduzir se já traduzido ou se for do próprio usuário
            if (!isMessageFromOther || translatedText || !message.text || !userId) return;

            setIsLoading(true);
            try {
                const result = await translateApi.translate(message.text, userId);
                if (result.translatedText !== result.originalText) {
                    setTranslatedText(result.translatedText);
                }
            } catch (error) {
                console.error("Translation error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        handleTranslation();
    }, [message.text, message.user?.id, isMessageFromOther, translatedText]);

    return (
        <div className="custom-message-wrapper group relative">
            <MessageSimple {...props} />

            {isMessageFromOther && (translatedText || isLoading) && (
                <div className={`mt-1 ml-12 p-3 rounded-2xl text-sm transition-all shadow-sm max-w-[80%] ${showOriginal ? "bg-white/5 border border-white/10 text-white/60 italic" : "bg-primary/20 border border-primary/20 text-white"
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Languages size={14} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Translation</span>
                        {isLoading && <Loader2 size={10} className="animate-spin text-primary" />}

                        {!isLoading && translatedText && (
                            <button
                                onClick={() => setShowOriginal(!showOriginal)}
                                className="ml-auto text-[10px] hover:underline"
                            >
                                {showOriginal ? "Show Translation" : "Show Original"}
                            </button>
                        )}
                    </div>

                    <p className="leading-relaxed">
                        {isLoading ? "Translating..." : (showOriginal ? message.text : translatedText)}
                    </p>
                </div>
            )}

            <style jsx global>{`
        .str-chat__message-simple {
          padding-top: 4px;
          padding-bottom: 4px;
        }
        .str-chat__message-simple-text-inner {
          border-radius: 16px !important;
          padding: 12px 16px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .str-chat__message-simple--me .str-chat__message-simple-text-inner {
          background: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: white !important;
        }
      `}</style>
        </div>
    );
}
