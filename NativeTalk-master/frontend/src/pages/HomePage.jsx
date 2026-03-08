import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { StreamChat } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthUser from '../hooks/useAuthUser';
import { getStreamToken } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getLanguageCode } from '../lib/utils';
import MessagingTopBar from '../components/MessagingTopBar';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [client, setClient] = useState(null);

  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getFlag = (lang) => {
    const code = getLanguageCode(lang);
    const flags = {
      en: '🇺🇸', pt: '🇧🇷', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪',
      it: '🇮🇹', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳'
    };
    return flags[code] || '🌐';
  };

  const formatTimestamp = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday'; // Keeps English fallback as in design
    return format(d, 'MMM d');
  };

  useEffect(() => {
    if (!tokenData?.token || !authUser) return;

    let mounted = true;

    async function initStreamAndFetchChannels() {
      try {
        const streamClient = StreamChat.getInstance(STREAM_API_KEY);

        await streamClient.connectUser(
          {
            id: authUser.id,
            name: authUser.name,
            image: authUser.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authUser.name),
          },
          tokenData.token
        );

        if (!mounted) return;
        setClient(streamClient);

        const filter = {
          type: 'messaging',
          members: { $in: [authUser.id] }
        };
        const sort = [{ last_message_at: -1 }];
        const channelsResponse = await streamClient.queryChannels(filter, sort, {
          watch: true,
          state: true,
        });

        if (!mounted) return;
        setChannels(channelsResponse);
        setLoading(false);

        const handleEvent = () => {
          streamClient.queryChannels(filter, sort, { watch: true, state: true })
            .then((updatedChannels) => {
              if (mounted) setChannels(updatedChannels);
            });
        };

        streamClient.on('message.new', handleEvent);
        streamClient.on('notification.message_new', handleEvent);

        return () => {
          streamClient.off('message.new', handleEvent);
          streamClient.off('notification.message_new', handleEvent);
        };
      } catch (error) {
        console.error('Error initializing Stream:', error);
        setLoading(false);
      }
    }

    initStreamAndFetchChannels();

    return () => {
      mounted = false;
      if (client) {
        client.disconnectUser();
      }
    };
  }, [tokenData, authUser]);

  const getOtherMember = (channel) => {
    const members = Object.values(channel.state.members);
    return members.find(member => member.user?.id !== authUser.id)?.user;
  };

  const filteredChannels = channels.filter(channel => {
    if (!searchQuery) return true;
    const otherMember = getOtherMember(channel);
    return otherMember?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-primary/10 font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <MessagingTopBar onSearchClick={() => setShowSearch(!showSearch)} />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-background-light/80 dark:bg-background-dark/80 px-6 overflow-hidden border-b border-primary/10 backdrop-blur-md"
            >
              <div className="py-4 relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-200/50 dark:bg-slate-800/50 border border-primary/10 rounded-[1.5rem] py-3 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all font-medium placeholder:text-slate-400 text-slate-900 dark:text-white"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 px-6 border-b border-primary/10 animate-pulse">
                <div className="size-[52px] rounded-full bg-primary/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-primary/10 rounded" />
                  <div className="h-3 w-1/2 bg-primary/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 p-10 bg-primary/10 rounded-full"
            >
              <Globe className="size-20 text-primary/40" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Sem conversas</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-xs">Encontre contatos para iniciar conversas com tradução.</p>
            <button
              onClick={() => navigate('/calls')}
              className="px-10 py-4 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/20 organic-press text-lg"
            >
              Nova Conversa
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredChannels.map((channel, index) => {
              const otherMember = getOtherMember(channel);
              const lastMessage = channel.state.messages[channel.state.messages.length - 1];
              const unreadCount = channel.countUnread();
              const isOnline = otherMember?.online;
              const nativeLang = getLanguageCode(authUser?.native_language);

              // We check if translations exist and extract the target
              const translatedText = lastMessage?.translations?.[nativeLang] || lastMessage?.translations?.en;
              const previewText = lastMessage?.text;

              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <a
                    onClick={(e) => { e.preventDefault(); navigate(`/chat/${otherMember?.id}`); }}
                    className="group flex flex-row items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors cursor-pointer border-b border-primary/20"
                    href="#"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="size-[52px] bg-slate-200 dark:bg-slate-700 rounded-full border-2 border-primary/20 bg-cover bg-center"
                        style={{ backgroundImage: `url('${otherMember?.image || '/avatar.png'}')` }}
                      >
                      </div>
                      <div className={`absolute bottom-0 right-0 size-3.5 border-2 border-background-light dark:border-background-dark rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    </div>

                    <div className="flex flex-1 flex-col justify-center min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-base font-semibold truncate text-slate-900 dark:text-slate-100">
                          {otherMember?.name?.split(' ')[0]} {getFlag(otherMember?.native_language)}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTimestamp(channel.state.last_message_at)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className={`text-sm truncate pr-4 ${unreadCount > 0 ? 'text-slate-900 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400'} ${translatedText ? 'italic' : ''}`}>
                            {translatedText ? `“${previewText}”` : (previewText || 'Say Hi!')}
                          </p>
                          {translatedText && (
                            <p className="text-sm font-medium text-primary flex items-center gap-1 truncate pr-4">
                              <span className="material-symbols-outlined text-[14px]">translate</span>
                              *{translatedText}*
                            </p>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent-coral text-[10px] font-bold text-white shadow-sm">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(12, 115, 121, 0.3);
            border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default HomePage;
