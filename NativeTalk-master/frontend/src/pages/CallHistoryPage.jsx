import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Phone, Video, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing,
  Search, Filter, Trash2, Star, Calendar, Clock, TrendingUp,
  ArrowLeft, MoreVertical, RefreshCw, Smartphone, Globe, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { getCallHistory, getCallStats, deleteCallFromHistory, rateCall } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const CallHistoryPage = () => {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeFilter, searchQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const filters = {};
      if (activeFilter !== 'all') {
        if (activeFilter === 'missed') {
          filters.status = 'missed';
        } else if (activeFilter === 'video' || activeFilter === 'audio') {
          filters.type = activeFilter;
        }
      }

      const [historyResponse, statsResponse] = await Promise.all([
        getCallHistory(1, 100, filters),
        getCallStats()
      ]);

      setCalls(historyResponse || []); // Adjusted based on expected InsForge return
      setStats(statsResponse?.stats || {});
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCall = async () => {
    if (!selectedCall) return;
    try {
      await deleteCallFromHistory(selectedCall.id);
      setCalls(calls.filter(call => call.id !== selectedCall.id));
      setShowDeleteModal(false);
      setSelectedCall(null);
      toast.success('Record removed from history');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRateCall = async () => {
    if (!selectedCall || !rating) return;
    try {
      await rateCall(selectedCall.id, rating);
      setCalls(calls.map(call =>
        call.id === selectedCall.id
          ? { ...call, quality_rating: rating }
          : call
      ));
      setShowRateModal(false);
      setSelectedCall(null);
      setRating(0);
      toast.success('Quality rating saved!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getCallIcon = (call) => {
    if (call.status === 'missed') return <PhoneMissed className="size-5 text-red-500" />;
    return call.type === 'video' ? <Video className="size-5 text-primary" /> : <Phone className="size-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-y-auto pb-28 font-display">
      <BottomNav />

      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
              >
                Call Logs
              </motion.h1>
              <p className="text-gray-400 text-lg">Your global practice sessions and cultural exchanges.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Filter sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all w-full md:w-64"
                />
              </div>
              <button
                onClick={loadData}
                className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
              >
                <RefreshCw className={`size-6 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Practice', value: stats.total || 0, icon: Phone, color: 'text-blue-400' },
              { label: 'Missed Calls', value: stats.missed || 0, icon: PhoneMissed, color: 'text-red-400' },
              { label: 'Avg Duration', value: `${Math.floor((stats.avgDuration || 0) / 60)}m`, icon: Clock, color: 'text-teal-400' },
              { label: 'Today', value: stats.today || 0, icon: Calendar, color: 'text-green-400' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#141414] border border-white/5 rounded-[2rem] p-6 flex items-center gap-4 group hover:border-white/10 transition-colors"
              >
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['all', 'missed', 'video', 'audio'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all border ${activeFilter === filter
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* History List */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-[2rem]" />
              ))
            ) : calls.length === 0 ? (
              <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-20 text-center">
                <Smartphone className="size-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-400">Empty Logs</h3>
                <p className="text-gray-600 mt-2">Your practice sessions will be tracked here.</p>
              </div>
            ) : (
              <AnimatePresence>
                {calls.map((call, index) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#141414] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-primary/30 transition-all"
                  >
                    <Avatar user={call.contact} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getCallIcon(call)}
                        <h3 className="text-xl font-bold text-white truncate">{call.contact?.name || 'Practitioner'}</h3>
                        {call.quality_rating && (
                          <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded text-[10px] font-black text-yellow-400 border border-yellow-400/20">
                            <Star className="size-3 fill-yellow-400" />
                            {call.quality_rating}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                        <span className={call.status === 'missed' ? 'text-red-400' : 'text-green-400'}>
                          {call.status === 'missed' ? 'Missed' : call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : 'Call Ended'}
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatDistanceToNow(new Date(call.created_at))} ago
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-colors"
                        onClick={() => navigate(`/call/${call.contact_id}`)}
                      >
                        <PhoneCall className="size-5" />
                      </button>
                      <button
                        className="p-3 bg-white/5 text-gray-500 rounded-2xl hover:bg-white/10 hover:text-red-400 transition-colors border border-white/5"
                        onClick={() => {
                          setSelectedCall(call);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="size-5" />
                      </button>
                      {call.status === 'ended' && !call.quality_rating && (
                        <button
                          className="p-3 bg-white/5 text-gray-500 rounded-2xl hover:bg-white/10 hover:text-yellow-400 transition-colors border border-white/5"
                          onClick={() => {
                            setSelectedCall(call);
                            setShowRateModal(true);
                          }}
                        >
                          <Star className="size-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#141414] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative z-10 text-center">
              <Trash2 className="size-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Remove Record?</h3>
              <p className="text-gray-500 mb-8">This will delete this practice session from your local history logs.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-white">Keep it</button>
                <button onClick={handleDeleteCall} className="flex-1 py-4 bg-red-500 font-bold text-white rounded-2xl shadow-lg shadow-red-500/20">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rate Modal */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowRateModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#141414] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative z-10 text-center">
              <Sparkles className="size-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Rate Practice</h3>
              <p className="text-gray-500 mb-8">How was the connection and translation quality during this session?</p>

              <div className="flex justify-center gap-2 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={`p-2 transition-all hover:scale-125 ${star <= rating ? 'text-yellow-400' : 'text-gray-700'}`}>
                    <Star size={32} fill={star <= rating ? 'currentColor' : 'none'} className="stroke-[3px]" />
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowRateModal(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-white">Ignore</button>
                <button onClick={handleRateCall} disabled={!rating} className="flex-1 py-4 bg-primary font-bold text-white rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50">Submit</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallHistoryPage;