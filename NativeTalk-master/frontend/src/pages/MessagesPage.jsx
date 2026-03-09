import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { StreamChat } from 'stream-chat';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Search, Loader2, ArrowLeft, Ghost, MessageSquare, Clock, Zap, Target, Sparkles, Orbit, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthUser from '../hooks/useAuthUser';
import { getStreamToken } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '../components/BottomNav';
import { getAvatarUrl } from '../lib/utils';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const MessagesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [client, setClient] = useState(null);

  const { data: tokenData } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
            image: getAvatarUrl(authUser.avatar_url, authUser.name),
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
        streamClient.on('message.updated', handleEvent);

        return () => {
          streamClient.off('message.new', handleEvent);
          streamClient.off('message.updated', handleEvent);
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
    return members.find(member => member.user?.id !== authUser?.id)?.user;
  };

  const filteredChannels = channels.filter(channel => {
    if (channel.id.startsWith('group-')) return false;
    if (!searchQuery) return true;
    const otherMember = getOtherMember(channel);
    return otherMember?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="screen bg-[#0a0a0a]">

      <main className="flex-1 relative">

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-4xl font-bold tracking-tight"
              >
                Mensagens
              </motion.h1>
              <p className="text-gray-500 text-sm mt-1">Suas conversas recentes</p>
            </div>

            <div className="relative group w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-gray-700 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-700"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="grid gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-white/5 animate-pulse rounded-[2.5rem]" />
              ))
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-[#141414] rounded-[3rem] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className="p-10 bg-white/5 rounded-[2.5rem] mb-6 border border-white/5">
                  <MessageCircle className="size-16 text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-400">Nenhuma conversa</h3>
                <p className="text-gray-600 max-w-xs mx-auto mt-2">Encontre parceiros para começar a praticar idiomas.</p>
                <button
                  onClick={() => navigate('/calls')}
                  className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Target className="size-5" />
                  Encontrar parceiros
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {filteredChannels.map((channel, index) => {
                  const otherMember = getOtherMember(channel);
                  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                  const unreadCount = channel.countUnread();

                  return (
                    <motion.div
                      key={channel.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/chat/${otherMember?.id}`)}
                      className="group bg-[#141414] hover:bg-[#1a1a1a] p-6 rounded-[2.5rem] border border-white/5 hover:border-primary/40 transition-all cursor-pointer flex items-center gap-6 relative overflow-hidden shadow-xl"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${unreadCount > 0 ? 'bg-primary' : 'bg-transparent'} group-hover:w-2 transition-all`} />

                      <div className="relative">
                        <div className="size-20 rounded-[1.75rem] overflow-hidden bg-white/5 ring-4 ring-white/[0.02]">
                          <img
                            src={otherMember?.image || '/avatar.png'}
                            alt={otherMember?.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        {otherMember?.online && (
                          <div className="absolute bottom-0 right-0 size-5 bg-green-500 border-[5px] border-[#141414] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                              {otherMember?.name || 'Usuário'}
                            </h3>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase tracking-tighter border border-white/5">
                              <Globe className="size-3" />
                              EN-DE
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="size-3" />
                            <span className="text-xs text-gray-600">
                              {lastMessage?.created_at ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true }) : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-8">
                          <p className={`text-sm truncate leading-relaxed ${unreadCount > 0 ? 'text-primary font-black' : 'text-gray-500 font-medium'}`}>
                            {unreadCount > 0 && <span className="inline-block size-2 bg-primary rounded-full mr-2 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />}
                            {lastMessage?.text || 'Nenhuma mensagem ainda.'}
                          </p>
                          {unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-xl shadow-xl shadow-primary/30 flex items-center justify-center min-w-[28px]"
                            >
                              {unreadCount}
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Hover Action */}
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                          <Zap className="size-6 fill-white" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Bottom Insight */}
          <div className="mt-16 bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Orbit className="size-8" />
              </div>
              <div>
                <h4 className="font-bold">Comunidade</h4>
                <p className="text-gray-500 text-xs">Explore novos parceiros de prática.</p>
              </div>
            </div>
            <button onClick={() => navigate('/calls')} className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-semibold text-sm transition-all">
              Descobrir pessoas
              <Sparkles className="size-4 text-primary" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
