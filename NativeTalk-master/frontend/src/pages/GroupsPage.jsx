import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Users, AlertCircle, Video, ArrowRight, Sparkles, Search, MessageSquare, Globe } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroups, initiateCall } from "../lib/api";
import BottomNav from "../components/BottomNav";
import CreateGroupModal from "../components/CreateGroupModal";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GroupsPage = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: groups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const handleCreateGroupSuccess = () => {
    setIsCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    toast.success(t("groupCreatedSuccess") || "Group created successfully!");
  };

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-y-auto pb-28 font-display">
      <BottomNav />

      <main className="flex-1 overflow-y-auto relative pb-24 lg:pb-0">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
              >
                {t('groups') || 'Communities'}
              </motion.h1>
              <p className="text-gray-400 text-lg">
                {t('manageGroupsDesc') || 'Find your tribe and practice together.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={t('searchGroups') || 'Search groups...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all w-full md:w-64"
                />
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all border border-primary/20 shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Plus className="size-6" />
                <span className="font-bold hidden sm:inline">{t('createGroup') || 'New Group'}</span>
              </button>
            </div>
          </div>

          {/* Groups Section */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-[#141414] rounded-[2.5rem] border border-red-500/20 p-12 text-center max-w-lg mx-auto">
                <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error loading groups</h3>
                <p className="text-gray-500 mb-6">{error.message}</p>
                <button onClick={() => refetch()} className="btn btn-primary">Try Again</button>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-[#141414] rounded-[2.5rem] border border-white/5 p-16 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-600">
                  <Users className="size-10" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('noGroupsYet') || 'Join your first community'}</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">{t('noGroupsDesc') || 'Create a group to start practicing your favorite languages with friends.'}</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-transform"
                >
                  {t('createFirstGroup') || 'Create Group'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {filteredGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="group bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                      {/* Decorative Gradient */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="size-20 rounded-[1.5rem] overflow-hidden bg-white/5 shadow-inner ring-2 ring-primary/10">
                          <img
                            src={group.avatar_url || group.image || "/group_placeholder.png"}
                            alt={group.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5 transition-all">
                            <Users className="size-3.5 text-primary" />
                            <span className="text-xs font-bold text-gray-400">{group.members?.length || 0}</span>
                          </div>
                          {group.native_language && (
                            <div className="bg-primary/10 px-2 py-0.5 rounded text-[10px] font-black text-primary uppercase tracking-tighter border border-primary/20">
                              {group.native_language}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-8 relative z-10">
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{group.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">
                          {group.description || 'Community for language learners and cultural exchange.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/5">
                        <div className="flex -space-x-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="size-8 rounded-full border-2 border-[#141414] bg-white/10 overflow-hidden">
                              <img src={`https://i.pravatar.cc/100?u=${group.id}${i}`} alt="member" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {group.members?.length > 3 && (
                            <div className="size-8 rounded-full border-2 border-[#141414] bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                              +{group.members.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            className="p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/groups/${group.id}`);
                            }}
                          >
                            <Video className="size-5" />
                          </button>
                          <button className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            {t('enter') || 'Enter'}
                            <ArrowRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateGroupSuccess}
      />
    </div>
  );
};

export default GroupsPage;
