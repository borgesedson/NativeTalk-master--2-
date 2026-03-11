import { useState, useEffect } from "react";
import { useMessageContext, useChatContext } from "stream-chat-react";
import useAuthUser from "../hooks/useAuthUser";
import AudioMessage from "./AudioMessage";
import { useE2E } from "../hooks/useE2E";
import { motion } from "framer-motion";
import { format } from "date-fns";

const CustomMessage = (props) => {
  const { translations, buildMsgKey } = props;
  const { authUser } = useAuthUser();
  const { message } = useMessageContext();
  const { channel } = useChatContext();
  const { decryptIncomingMessage } = useE2E();

  const [decryptedE2E, setDecryptedE2E] = useState(null);

  const isOwnMessage = message?.user?.id === authUser?.id || message?.user?.id === message?._client?.userID;
  const msgKey = buildMsgKey ? buildMsgKey(message) : message?.id;
  const translationData = translations ? translations[msgKey] : null;

  // Base text / translation
  let displayText = message.text;
  let displayTranslation = translationData?.translatedText || translationData?.translation?.text;

  // Handle E2E Decryption
  useEffect(() => {
    if (message.isE2E && message.text) {
      const runDecryption = async () => {
        let partnerId = message.user?.id;
        if (isOwnMessage) {
          const members = Object.keys(channel.state.members || {});
          partnerId = members.find(id => id !== authUser?.id) || partnerId;
        }

        const plaintextStr = await decryptIncomingMessage(partnerId, message.text);
        if (plaintextStr) {
          try {
            const parsed = JSON.parse(plaintextStr);
            setDecryptedE2E({
              original: parsed.original,
              translated: parsed.translated
            });
          } catch {
            setDecryptedE2E({ original: plaintextStr });
          }
        }
      };
      runDecryption();
    }
  }, [message.text, message.isE2E, isOwnMessage, channel.state.members, authUser?.id]);

  if (message.isE2E && decryptedE2E) {
    displayText = decryptedE2E.original;
    displayTranslation = decryptedE2E.translated;
  } else if (message.isE2E && !decryptedE2E) {
    displayText = "🔒 Descriptografando...";
  }

  const audioAttachment = message.attachments?.find(att => att.type === 'audio');
  const isAudio = !!audioAttachment;

  const speak = (text, langCode) => {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode || 'pt-BR';
    window.speechSynthesis.speak(u);
  };

  const timeString = message.created_at ? format(new Date(message.created_at), 'HH:mm') : '';

  return (
    <div className={`flex flex-col gap-1 w-full mb-4 px-4 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      {isOwnMessage ? (
        /* SENT MESSAGE (Own) */
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1 items-end ml-auto max-w-[85%]"
        >
          <div className="flex items-end gap-2">
            <span className="text-[10px] text-slate-500 font-medium mb-1">{timeString}</span>
            <div className="bg-gradient-to-br from-primary to-[#085a5f] rounded-tl-xl rounded-bl-xl rounded-br-xl p-3 shadow-lg shadow-primary/10">
              {isAudio ? (
                <AudioMessage
                  audioUrl={audioAttachment.asset_url}
                  duration={audioAttachment.duration}
                  transcription={audioAttachment.transcription}
                  translation={audioAttachment.translation}
                  isOwnMessage={true}
                />
              ) : (
                <>
                  <p className="text-sm font-bold text-white leading-relaxed">{displayText}</p>
                  <div className="flex justify-end mt-1 gap-1 items-center">
                    {message.isE2E && <span className="text-[10px] text-emerald-300 font-medium" title="Criptografado ponta-a-ponta">🔒</span>}
                    <span className="material-symbols-outlined text-[16px] text-white/80">done_all</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* RECEIVED MESSAGE (Other) */
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1 items-start max-w-[85%] group"
        >
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 bg-surface-dark rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 shadow-md relative">
              {isAudio ? (
                <AudioMessage
                  audioUrl={audioAttachment.asset_url}
                  duration={audioAttachment.duration}
                  transcription={audioAttachment.transcription}
                  translation={audioAttachment.translation}
                  isOwnMessage={false}
                />
              ) : (
                <>
                  {displayTranslation ? (
                    <>
                      <p className="text-[12px] text-slate-400 italic mb-1">{displayText}</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white leading-relaxed">{displayTranslation}</p>
                        <button
                          onClick={() => speak(displayTranslation, authUser?.native_language)}
                          className="shrink-0 text-primary hover:text-primary/80 transition-colors organic-press"
                        >
                          <span className="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                      </div>
                      {message.isE2E && (
                        <div className="flex justify-start mt-1">
                          <span className="text-[10px] text-slate-400 font-medium" title="Criptografado ponta-a-ponta">🔒 Seguro</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white leading-relaxed">{displayText}</p>
                        {!message.isE2E && ( /* only speak readable plaintext fallback */
                          <button
                            onClick={() => speak(displayText, authUser?.native_language)}
                            className="shrink-0 text-primary hover:text-primary/80 transition-colors organic-press"
                          >
                            <span className="material-symbols-outlined text-[18px]">volume_up</span>
                          </button>
                        )}
                      </div>
                      {message.isE2E && (
                        <div className="flex justify-start mt-1">
                          <span className="text-[10px] text-slate-400 font-medium" title="Criptografado ponta-a-ponta">🔒 Criptografado</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mb-1">{timeString}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomMessage;
