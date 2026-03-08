import { useState } from "react";
import { useMessageContext } from "stream-chat-react";
import useAuthUser from "../hooks/useAuthUser";
import AudioMessage from "./AudioMessage";
import { motion } from "framer-motion";
import { format } from "date-fns";

const CustomMessage = (props) => {
  const { translations, buildMsgKey } = props;
  const { authUser } = useAuthUser();
  const { message } = useMessageContext();

  const isOwnMessage = message?.user?.id === authUser?.id || message?.user?.id === message?._client?.userID;
  const msgKey = buildMsgKey ? buildMsgKey(message) : message?.id;
  const translationData = translations ? translations[msgKey] : null;
  const translation = translationData?.translatedText || translationData?.translation?.text;

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
                  <p className="text-sm font-bold text-white leading-relaxed">{message.text}</p>
                  <div className="flex justify-end mt-1">
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
                  {translation ? (
                    <>
                      <p className="text-[12px] text-slate-400 italic mb-1">{message.text}</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white leading-relaxed">{translation}</p>
                        <button
                          onClick={() => speak(translation, authUser?.native_language)}
                          className="shrink-0 text-primary hover:text-primary/80 transition-colors organic-press"
                        >
                          <span className="material-symbols-outlined text-[18px]">volume_up</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white leading-relaxed">{message.text}</p>
                      <button
                        onClick={() => speak(message.text, authUser?.native_language)}
                        className="shrink-0 text-primary hover:text-primary/80 transition-colors organic-press"
                      >
                        <span className="material-symbols-outlined text-[18px]">volume_up</span>
                      </button>
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
