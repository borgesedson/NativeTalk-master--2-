import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Plus, Phone, Video, MessageSquare,
  Clock, Settings, LogOut, Users, UserPlus,
  PhoneCall, Mail, Globe, Check, X, Trash2,
  Mic, MicOff, PhoneOff, Volume2, Sparkles, MapPin, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, getFriends, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getRecommendedUsers } from '../lib/api';
import Avatar from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const ContactsPage = () => {
  const [activeTab, setActiveTab] = useState('partners');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
    enabled: activeTab === 'discover' && !searchQuery,
    staleTime: 5 * 60 * 1000,
  });

  // Debounced Search Effect
  useEffect(() => {
    if (!searchQuery.trim() || activeTab !== 'discover') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await getAllUsers({ name: searchQuery });
        setSearchResults(results.filter(u => u.id !== user?.id));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id, activeTab]);

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success("Connection request sent!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const filteredFriends = friends.filter(f =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.native_language?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const discoveryList = searchQuery ? searchResults : recommendedUsers;

  return (
    <div className="screen bg-[#0a0a0a]">
      <main className="flex-1 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-4xl font-bold tracking-tight mb-1"
              >
                Amigos <span className="text-primary">&</span> Descoberta
              </motion.h1>
              <p className="text-gray-500 text-sm">Conecte-se com pessoas de todo o mundo.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Nome ou idioma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all w-full md:w-64"
                />
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-12 bg-white/5 p-1.5 rounded-[2rem] w-fit border border-white/5">
            {[
              { id: 'partners', label: 'Meus Amigos', icon: Users },
              { id: 'discover', label: 'Descobrir', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-xl shadow-primary/10'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {activeTab === 'partners' ? (
                loadingFriends ? (
                  [...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />)
                ) : filteredFriends.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-[#141414] rounded-[3rem] border border-white/5">
                    <UserPlus className="size-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-400">Nenhum parceiro ainda</h3>
                    <p className="text-gray-600 mt-2 max-w-xs mx-auto">Vá para a aba de Descoberta para encontrar pessoas.</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <PartnerCard key={friend.id} user={friend} onCall={() => navigate(`/call?with=${friend.id}&type=video`)} onChat={() => navigate(`/chat/${friend.id}`)} />
                  ))
                )
              ) : (
                (loadingUsers || isSearching) ? (
                  [...Array(8)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />)
                ) : discoveryList.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-[#141414] rounded-[3rem] border border-white/5">
                    <Globe className="size-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-400">Expandindo a rede...</h3>
                    <p className="text-gray-600 mt-2">Ninguém encontrado com este nome no momento.</p>
                  </div>
                ) : (
                  discoveryList.map((peer) => (
                    <PeerCard key={peer.id} user={peer} onConnect={() => sendRequestMutation(peer.id)} />
                  ))
                )
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

const PartnerCard = ({ user, onCall, onChat }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all group relative overflow-hidden"
  >
    {/* Status Glow */}
    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />

    <div className="flex items-start justify-between mb-6 relative z-10">
      <Avatar user={user} size="lg" showOnlineStatus={user.isOnline} />
      <div className="flex flex-col items-end gap-2">
        <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5 transition-all">
          <span className="text-xs font-semibold text-gray-500">{user.native_language || 'EN'}</span>
        </div>
      </div>
    </div>

    <div className="mb-8 relative z-10">
      <h3 className="text-xl font-bold mb-1 truncate group-hover:text-primary transition-colors">{user.name}</h3>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <MapPin className="size-3" />
        {user.location || 'Localização'}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3 relative z-10">
      <button
        onClick={onChat}
        className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-white/5"
      >
        <MessageSquare className="size-4" />
        Chat
      </button>
      <button
        onClick={onCall}
        className="py-3 bg-primary text-white hover:bg-primary-focus rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 border border-primary/20"
      >
        <Video className="size-4" />
        Ligar
      </button>
    </div>
  </motion.div>
);

const PeerCard = ({ user, onConnect }) => {
  const [requested, setRequested] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 hover:border-accent-coral/30 transition-all group overflow-hidden relative"
    >
      {/* Decorative Brand Mark */}
      <div className="absolute top-[-10px] right-[-10px] size-24 bg-accent-coral/5 rounded-full blur-2xl group-hover:bg-accent-coral/10 transition-colors" />

      <div className="flex items-center gap-6 mb-8 relative z-10">
        <Avatar user={user} size="md" />
        <div className="min-w-0">
          <h3 className="text-xl font-bold truncate mb-1">{user.name}</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] font-black text-gray-400 border border-white/5">
              <Globe className="size-3" />
              {user.native_language || 'EN'}
            </div>
            {user.online && <div className="size-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
          </div>
        </div>
      </div>

      <div className="mb-10 min-h-[48px] relative z-10">
        <p className="text-gray-500 text-sm italic leading-relaxed line-clamp-2">
          "{user.bio || 'Quer praticar idiomas e fazer amigos.'}"
        </p>
      </div>

      <button
        onClick={() => {
          onConnect();
          setRequested(true);
        }}
        disabled={requested}
        className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${requested
          ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
          : 'bg-white/5 border border-white/10 hover:bg-accent-coral hover:text-white group-hover:border-accent-coral/20'
          }`}
      >
        {requested ? <Check className="size-5" /> : <UserPlus className="size-5" />}
        {requested ? 'Pedido enviado' : 'Enviar pedido'}
      </button>
    </motion.div>
  );
};

export default ContactsPage;
