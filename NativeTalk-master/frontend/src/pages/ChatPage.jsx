import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, translateMessage, transcribeAudio } from "../lib/api";
import { storage } from "../lib/insforge";
import { useE2E } from "../hooks/useE2E";

import {
  Channel,
  Chat,
  MessageList,
  Thread,
  Window,
  useChatContext,
  MessageInput
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import ChatLoader from "../components/ChatLoader";
import CustomMessage from "../components/CustomMessage";
import CustomChannelHeader from "../components/CustomChannelHeader";
import AudioRecorder from "../components/AudioRecorder";
import { sendNotification } from "../components/NotificationManager";
import { getAvatarUrl, getLanguageCode } from "../lib/utils";

import "stream-chat-react/dist/css/v2/index.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamReady, setStreamReady] = useState(false);
  const [translations, setTranslations] = useState({});
  const translatingRef = useRef(new Set());
  const initRef = useRef(false);

  // Global translation cache
  const translationCache = useRef({});

  const { encryptMessageForUser } = useE2E();

  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = StreamChat.getInstance(STREAM_API_KEY);
  }

  const buildMsgKey = (m) => m?.id || `${m?.created_at}-${m?.user?.id}`;
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken", user?.id],
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (chatClient?.userID && chatClient.userID === authUser?.id) {
      setStreamReady(true);
    } else {
      setStreamReady(false);
    }
  }, [chatClient?.userID, authUser?.id]);

  useEffect(() => {
    if (!tokenData?.token || !authUser || initRef.current) return;
    let cleanupFn = null;

    async function initChat() {
      try {
        const client = clientRef.current;
        
        // Validate token before passing to Stream SDK
        if (!tokenData.token || typeof tokenData.token !== 'string') {
          console.error('[Stream] Invalid token in ChatPage:', tokenData.token);
          return;
        }
        
        await client.connectUser(
          { id: authUser.id, name: authUser.name, image: getAvatarUrl(authUser.avatar_url, authUser.name) },
          tokenData.token
        );

        const channelId = [authUser.id.replace(/-/g, ''), targetUserId.replace(/-/g, '')].sort().join("");
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser.id, targetUserId],
        });

        // 1. Limit initial messages load to 20
        await currChannel.watch({ limit: 20 });

        setChatClient(client);
        setChannel(currChannel);
        initRef.current = true;

        const translateIncoming = async (message) => {
          if (!message || !message.text) return;
          if (message.isE2E) return; // Wait! E2E messages arrive encrypted, don't translate them naturally

          const isOwnMessage = message.user?.id === authUser.id;
          if (isOwnMessage) return;

          // Normalize languages to ISO (e.g. "English" -> "en")
          const currentUserLang = getLanguageCode(authUser.native_language || 'pt');
          const msgLang = getLanguageCode(message.originalLanguage || 'en');

          // Se o idioma for o mesmo (ex: ambos são 'en'), não traduz
          if (msgLang === currentUserLang) return;

          const msgKey = buildMsgKey(message);

          // 3. Cache translations
          const cacheKey = `${msgKey}-${currentUserLang}`;
          if (translationCache.current[cacheKey]) {
            setTranslations((prev) => ({ ...prev, [msgKey]: translationCache.current[cacheKey] }));
            return;
          }

          if (translatingRef.current.has(msgKey)) return;
          if (translations[msgKey]) return; // Já traduzido

          translatingRef.current.add(msgKey);
          try {
            const result = await translateMessage(message.text, message.user.id, currentUserLang, msgLang);
            if (result && result.translatedText) {
              translationCache.current[cacheKey] = result;
              setTranslations((prev) => ({ ...prev, [msgKey]: result }));
            }
          } catch (e) {
            console.error("Translation error:", e);
          } finally {
            translatingRef.current.delete(msgKey);
          }
        };

        const handleNewMessage = async (event) => {
          const message = event.message;
          if (!message) return;

          if (event.type === "message.new" && message.user?.id !== authUser.id && !document.hasFocus()) {
            sendNotification(message.user.name || 'Nova Mensagem', {
              body: message.isE2E ? 'Mensagem criptografada' : (message.text?.substring(0, 100) || 'Arquivo recebido'),
              icon: message.user.image || '/avatar.png',
              tag: `message-${message.id}`,
            });
          }

          await translateIncoming(message);
        };

        currChannel.on("message.new", handleNewMessage);

        // 2 & 5. Throttle and Batch Translations
        const existingMessages = currChannel.state.messages || [];

        // Only translate last 10 messages initially to save API calls
        const messagesToTranslate = existingMessages.slice(-10);

        // batchTranslate added previously
        const batchTranslateObj = {
          run: async (messages) => {
            const promises = messages
              .filter(m => m.user?.id !== authUser.id)
              .map(m => translateIncoming(m));
            await Promise.allSettled(promises);
          }
        };

        batchTranslateObj.run(messagesToTranslate);

        // Optional scroll event handler could go here, but Stream's MessageList
        // handles infinite scroll. We can hook into the channel's query event
        // to translate older messages when they are loaded via on-scroll
        client.on('message.read', (e) => {
          // We'll use a local state or ref to trigger translations if needed,
          // but Stream's message.new handles live messages.
        });

        // Listen to when channel state updates (e.g. after paginating/fetching older messages)
        // This line is redundant as message.new is already handled above.
        // currChannel.on('message.new', handleNewMessage);

        // To handle pagination translation:
        currChannel.on('message.read', () => {
          const allMsgs = currChannel.state.messages || [];
          const readerLang = getLanguageCode(authUser.native_language || 'pt');
          const untranslated = allMsgs.filter(m => {
            const msgKey = buildMsgKey(m);
            const cacheKey = `${msgKey}-${readerLang}`;
            return m.user?.id !== authUser.id && !translationCache.current[cacheKey];
          });
          // Translate next batch of 10 if there are untranslated ones
          if (untranslated.length > 0) {
            batchTranslateObj.run(untranslated.slice(-10));
          }
        });

        cleanupFn = () => {
          currChannel.off("message.new", handleNewMessage);
          currChannel.off("message.read");
          try { client.disconnectUser(); } catch { }
          initRef.current = false;
        };
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Não foi possível conectar ao chat.");
      } finally {
        setLoading(false);
      }
    }

    initChat();
    return () => { if (cleanupFn) cleanupFn(); };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => { if (channel) navigate(`/call/${channel.id}`); };

  const handleSendAudio = async (audioBlob, _, duration) => {
    if (!channel) return;

    const toastId = toast.loading('🔄 Transcrevendo...', { id: 'audio-flow' });

    try {
      // 1. Upload do áudio para o Insforge Storage
      const { url: audioUrl } = await uploadAudio(audioBlob);

      if (!audioUrl) {
        throw new Error("Erro ao fazer upload do áudio");
      }

      // 2. Transcrição e Tradução via VPS
      const result = await transcribeAudio(
        audioUrl,
        'en',
        authUser?.native_language || 'pt'
      );

      const transcript = result?.originalTranscription || '';
      const translatedText = result?.translatedTranscription || '';

      if (!transcript) {
        throw new Error("Não foi possível processar o áudio");
      }

      // 3. Feedback visual de tradução (simulado pois já veio junto)
      toast.loading('🌐 Traduzindo...', { id: toastId });
      await new Promise(r => setTimeout(r, 400)); // Breve delay para percepção do usuário

      // 4. Enviar mensagem via Stream com metadados de idioma
      await channel.sendMessage({
        text: transcript,
        originalLanguage: authUser?.native_language || 'pt',
        attachments: [{
          type: 'audio',
          asset_url: audioUrl,
          title: 'Áudio',
          duration,
          transcription: transcript,
          translation: translatedText
        }],
      });

      toast.success('✅ Enviado!', { id: toastId });
    } catch (error) {
      console.error("Audio flow error:", error);
      toast.error(error.message || 'Erro ao processar áudio', { id: toastId });
    }
  };

  // 4. Show skeleton while loading
  if (loading || !chatClient || !channel || !streamReady) return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0D2137]">
      <div className="h-[60px] md:h-[88px] shrink-0 border-b border-white/5 bg-transparent pt-[env(safe-area-inset-top)]"></div>
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden opacity-50">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex gap-3 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            <div className="size-10 rounded-full bg-white/5 shrink-0"></div>
            <div className={`h-16 bg-white/5 rounded-2xl w-[60%] ${i % 2 === 0 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}></div>
          </div>
        ))}
      </div>
      <div className="h-[80px] shrink-0 border-t border-white/5 bg-transparent pb-[env(safe-area-inset-bottom)]"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0D2137]">
      <Chat client={chatClient} theme="str-chat__theme-dark">
        <Channel channel={channel}>
          <Window>
            <CustomChannelHeader handleVideoCall={handleVideoCall} />

            <div className="wa-message-list-wrapper">
              <MessageList
                Message={(messageProps) => (
                  <CustomMessage {...messageProps} translations={translations} buildMsgKey={buildMsgKey} />
                )}
              />
            </div>

            <div className="wa-message-input-wrapper">
              <AudioRecorder onSendAudio={handleSendAudio} />
              <div className="wa-input-container">
                <MessageInput
                  focus
                  overrideSubmitHandler={async (message) => {
                    const originalText = message?.text?.trim() || '';
                    if (!originalText && !message.attachments?.length) return;

                    const originalLanguage = authUser?.native_language || 'pt';

                    // Prepare metadata
                    let translationsMeta = null;

                    // 1. Send text to VPS for translation (Sender side)
                    if (originalText) {
                      toast.loading('Criptografando...', { id: 'e2e-toast' });
                      try {
                        const trLayer = await translateMessage(originalText, targetUserId);
                        const payloadToEncrypt = JSON.stringify({
                          original: originalText,
                          translated: trLayer.translatedText,
                          targetLanguage: trLayer.targetLanguage,
                          sourceLanguage: trLayer.sourceLanguage
                        });

                        // 2. Encrypt using Recipient's public key
                        const cipherStr = await encryptMessageForUser(targetUserId, payloadToEncrypt);

                        // 3. Send via Stream as ciphertext
                        await channel.sendMessage({
                          text: cipherStr,
                          isE2E: true,
                          originalLanguage
                        });
                        toast.success('Mensagem Segura', { id: 'e2e-toast', duration: 1500 });
                      } catch (err) {
                        toast.error(err.message || 'Erro E2E', { id: 'e2e-toast' });
                        // fallback non e2e if keys not initialized? No, better strict.
                      }
                    }
                  }}
                />
              </div>
            </div>
          </Window>
          <Thread />
        </Channel>
      </Chat>

      <style dangerouslySetInnerHTML={{
        __html: `
        .wa-chat-main-container .str-chat {
          --str-chat__primary-color: #0c7379;
          --str-chat__active-primary-color: #09595d;
          --str-chat__background-color: transparent;
          background: transparent !important;
          height: 100% !important;
        }

        .wa-chat-main-container .str-chat__main-panel {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          overflow: hidden !important;
        }

        /* Hide default header */
        .wa-chat-main-container .str-chat__channel-header {
          display: none !important;
        }

        /* ===== MESSAGE LIST ===== */
        .wa-chat-main-container .str-chat__list,
        .wa-chat-main-container .str-chat-channel {
          background: transparent !important;
        }

        .wa-chat-container .str-chat__list {
          padding: 16px 0 !important;
        }

        .wa-chat-container .str-chat__li {
          margin-bottom: 0 !important;
        }

        /* ===== HIDE DEFAULT BUBBLES (we use CustomMessage) ===== */
        .wa-chat-container .str-chat__message-bubble {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        /* ===== DATE SEPARATOR ===== */
        .wa-chat-container .str-chat__date-separator {
          padding: 16px 0 !important;
        }
        .wa-chat-container .str-chat__date-separator-date {
          background: rgba(12, 115, 121, 0.05) !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 4px 12px !important;
          border-radius: 9999px !important;
          box-shadow: none !important;
        }
        .wa-chat-container .str-chat__date-separator-line {
          display: none !important;
        }

        /* ===== INPUT WRAPPER ===== */
        .wa-message-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          background-color: #112021;
          border-top: 1px solid rgba(12, 115, 121, 0.2);
        }

        .wa-input-container {
          flex: 1;
        }

        .wa-input-wrapper .str-chat__message-input,
        .wa-input-wrapper .str-chat__input-flat {
          background: #1E2A3A !important;
          border: 1px solid rgba(12, 115, 121, 0.1) !important;
          border-radius: 9999px !important;
          min-height: 44px !important;
          overflow: hidden !important;
          transition: all 0.2s;
        }

        .wa-input-wrapper .str-chat__message-input:focus-within {
          border-color: rgba(12, 115, 121, 0.4) !important;
        }

        .wa-input-wrapper .str-chat__textarea textarea,
        .wa-input-wrapper .str-chat__message-textarea {
          background: transparent !important;
          color: #f1f5f9 !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
          line-height: 20px !important;
        }

        .wa-input-wrapper .str-chat__textarea textarea::placeholder {
          color: #64748b !important;
        }

        /* Send button */
        .wa-input-wrapper .str-chat__send-button {
          background: #0D7377 !important;
          border-radius: 50% !important;
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 4px 6px 4px 0 !important;
          padding: 0 !important;
          box-shadow: 0 4px 14px -2px rgba(12, 115, 121, 0.3) !important;
          transition: all 0.2s !important;
        }
        .wa-input-wrapper .str-chat__send-button:hover {
          background: #0a5a5e !important;
          transform: scale(0.95);
        }
        .wa-input-wrapper .str-chat__send-button svg {
          fill: #fff !important;
          width: 16px !important;
          height: 16px !important;
        }

        /* Attachment buttons */
        .wa-input-wrapper .str-chat__input-flat-emojiselect,
        .wa-input-wrapper .str-chat__fileupload-wrapper {
          color: #64748b !important;
          transition: color 0.2s;
        }
        .wa-input-wrapper .str-chat__input-flat-emojiselect:hover,
        .wa-input-wrapper .str-chat__fileupload-wrapper:hover {
          color: #0c7379 !important;
        }

        /* ===== SCROLLBAR ===== */
        .wa-chat-container .str-chat__list::-webkit-scrollbar {
          display: none; /* Match scrollbar-hide in design */
        }
        .wa-chat-container .str-chat__list {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* ===== HIDE UNNECESSARY ELEMENTS ===== */
        .wa-chat-container .str-chat__message-simple-status,
        .wa-chat-container .str-chat__message-simple__actions,
        .wa-chat-container .str-chat__message-simple__actions__container,
        .wa-chat-container .str-chat__message-replies-count-button,
        .wa-chat-container .str-chat__message-sender-avatar {
          display: none !important;
        }

        /* ===== THREAD ===== */
        .wa-chat-container .str-chat__thread {
          background: #112021 !important;
          border-left: 1px solid rgba(12, 115, 121, 0.2) !important;
        }

        /* ===== EMPTY STATE ===== */
        .wa-chat-container .str-chat__empty-channel {
          color: #64748b !important;
          background: transparent !important;
        }

        /* ===== REACTIONS ===== */
        .wa-chat-container .str-chat__message-actions-box,
        .wa-chat-container .str-chat__reaction-selector {
          background: #1E2A3A !important;
          border: 1px solid rgba(12, 115, 121, 0.1) !important;
          border-radius: 12px !important;
        }

        /* ===== TYPING INDICATOR ===== */
        .wa-chat-container .str-chat__typing-indicator {
          color: #64748b !important;
          padding: 4px 16px !important;
          font-size: 12px !important;
          font-style: italic !important;
        }

        /* ===== MOBILE ONLY: HIDE SIDEBAR ===== */
        @media (max-width: 768px) {
          .str-chat__channel-list {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
};
export default ChatPage;
