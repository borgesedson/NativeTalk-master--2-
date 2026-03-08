"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { groupApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import CreateGroupModal from "@/components/CreateGroupModal";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [joining, setJoining] = useState(null);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await groupApi.getAllGroups();
            setGroups(data);
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast.error("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleJoin = async (e, groupId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setJoining(groupId);
            await groupApi.join(groupId);
            toast.success("Joined group!");
            fetchGroups(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to join group");
        } finally {
            setJoining(null);
        }
    };

    const filteredGroups = groups.filter(g =>
        g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout activeTab="groups">
            <div className="flex-grow flex flex-col bg-[#121214] overflow-hidden">
                <header className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Community Groups</h1>
                        <p className="text-white/40 text-sm">Join channels to collaborate and practice with others.</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        Create Group
                    </button>
                </header>

                <div className="p-8 flex-grow overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                            <input
                                type="text"
                                placeholder="Search groups by name or topic..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-lg shadow-inner placeholder:text-white/10"
                            />
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <Loader2 className="text-primary animate-spin mb-4" size={48} />
                                <p className="text-white/40 font-medium">Fetching community channels...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredGroups.map((group, index) => {
                                        const isMember = group.members?.some(m => m._id === user?._id || m === user?._id);

                                        return (
                                            <motion.div
                                                key={group._id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group relative"
                                            >
                                                <Link
                                                    href={isMember ? `/groups/${group._id}` : "#"}
                                                    onClick={(e) => !isMember && e.preventDefault()}
                                                    className={`block p-6 rounded-[32px] border transition-all h-full ${isMember
                                                            ? "bg-white/[0.03] border-white/5 hover:border-primary/30 hover:bg-white/[0.05]"
                                                            : "bg-white/[0.01] border-white/5 opacity-80 cursor-default"
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/10 overflow-hidden shadow-lg p-0.5 group-hover:scale-110 transition-transform duration-500">
                                                            <img
                                                                src={group.image || `https://avatar.iran.liara.run/public/${index + 10}`}
                                                                alt={group.name}
                                                                className="w-full h-full object-cover rounded-[14px]"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                            <Users size={12} className="text-primary" />
                                                            <span className="text-[10px] font-bold text-white/50">{group.members?.length || 0}</span>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                                        {group.name}
                                                    </h3>
                                                    <p className="text-white/30 text-xs line-clamp-2 mb-8 leading-relaxed">
                                                        {group.description || "A community for language learners and cultural exchange."}
                                                    </p>

                                                    <div className="mt-auto">
                                                        {isMember ? (
                                                            <div className="flex items-center justify-between text-primary font-bold text-xs group-hover:translate-x-1 transition-transform">
                                                                Open Chat
                                                                <ArrowRight size={16} />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => handleJoin(e, group._id)}
                                                                disabled={joining === group._id}
                                                                className="w-full py-3 bg-white/5 hover:bg-primary hover:text-white text-white/60 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                                            >
                                                                {joining === group._id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    "Join Group"
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}

                        {!loading && filteredGroups.length === 0 && (
                            <div className="text-center py-32 space-y-6">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                                    <Search className="text-white/10" size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">No groups found</h3>
                                    <p className="text-white/30 text-sm">Try searching for something else or create your own group.</p>
                                </div>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="text-primary font-bold hover:underline py-2"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <CreateGroupModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onGroupCreated={() => {
                        fetchGroups();
                        setIsModalOpen(false);
                    }}
                />
            </div>
        </AppLayout>
    );
}
