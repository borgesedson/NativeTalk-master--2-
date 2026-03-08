import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import { Bell, Clock, MessageSquare, UserCheck, ArrowLeft, Sparkles, UserPlus, CheckCircle, Ghost } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAvatarUrl } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Amizade aceita!");
    },
    onError: (err) => toast.error(err.message || "Erro ao aceitar"),
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="screen bg-[#0a0a0a]">
      <main className="flex-1 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
          {/* Header */}
          <div className="flex items-center gap-6 mb-12">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ArrowLeft className="size-6" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 flex items-center gap-3">
                Notificações
                <Bell className="size-6 text-primary animate-pulse" />
              </h1>
              <p className="text-gray-500 text-sm">Fique conectado com sua rede.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-white/5 animate-pulse rounded-[2rem]" />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              <AnimatePresence>
                {/* Pending Requests */}
                {incomingRequests.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                      <UserPlus className="size-5" />
                      Pedidos de amizade
                      <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full ml-2">
                        {incomingRequests.length}
                      </span>
                    </h2>

                    <div className="space-y-4">
                      {incomingRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          layout
                          className="bg-[#141414] border border-white/5 rounded-[2rem] p-6 hover:border-primary/30 transition-all flex items-center gap-6 group"
                        >
                          <div className="size-20 rounded-[1.5rem] overflow-hidden bg-white/5 shadow-inner ring-2 ring-primary/10">
                            <img src={getAvatarUrl(request.sender.avatar_url, request.sender.name)} alt={request.sender.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold truncate mb-1">{request.sender.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-black text-gray-400 uppercase tracking-tighter border border-white/5">
                                {request.sender.native_language}
                              </span>
                              <span className="text-xs text-gray-500">quer se conectar</span>
                            </div>
                          </div>

                          <button
                            className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                            onClick={() => acceptRequestMutation(request.id)}
                            disabled={isPending}
                          >
                            {isPending ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Aceitar'}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Recent Activity / Accepted Requests */}
                {acceptedRequests.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold flex items-center gap-2 text-accent-coral">
                      <Sparkles className="size-5" />
                      Conexões recentes
                    </h2>

                    <div className="space-y-4">
                      {acceptedRequests.map((notification) => (
                        <motion.div
                          key={notification.id}
                          layout
                          onClick={() => navigate(`/chat/${notification.recipient.id}`)}
                          className="bg-[#141414] border border-white/5 rounded-[2rem] p-6 hover:border-accent-coral/30 transition-all flex items-center gap-6 group cursor-pointer"
                        >
                          <div className="size-16 rounded-[1.2rem] overflow-hidden bg-white/5 shadow-inner ring-2 ring-accent-coral/10">
                            <img src={getAvatarUrl(notification.recipient.avatar_url, notification.recipient.name)} alt={notification.recipient.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold">{notification.recipient.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">Aceitou seu convite</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 grayscale group-hover:grayscale-0 transition-all">
                            <CheckCircle className="size-5 text-accent-coral" />
                            <span className="text-[10px] font-black text-gray-500 uppercase">Success</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Empty State */}
                {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#141414] rounded-[2.5rem] border border-white/5 p-20 text-center"
                  >
                    <div className="size-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-600">
                      <Ghost className="size-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Tudo em dia!</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Novas atividades aparecerão aqui conforme você cresce sua rede.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default NotificationsPage;
