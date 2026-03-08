"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { userApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, UserCheck, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ConnectPage() {
    const [users, setUsers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sendingRequest, setSendingRequest] = useState(null);
    const [activeConnectTab, setActiveConnectTab] = useState("discover");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userApi.getRecommended();
            setUsers(data);

            // Also fetch incoming requests
            const reqData = await userApi.getFriendRequests();
            setIncomingRequests(reqData.incomingReqs || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load connections");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSendRequest = async (userId) => {
        try {
            setSendingRequest(userId);
            await userApi.sendRequest(userId);
            toast.success("Friend request sent!");
            // Refresh list or mark as sent
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setSendingRequest(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAcceptRequest = async (requestId) => {
        try {
            await userApi.acceptRequest(requestId);
            toast.success("Connection accepted!");
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    return (
        <AppLayout activeTab="connect">
            <div className="flex-grow flex flex-col bg-[#121214] overflow-hidden">
                <header className="p-8 border-b border-white/5">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Discover People</h1>
                    <p className="text-white/40 text-sm">Find others who speak your native language or want to learn yours.</p>
                </header>

                <div className="flex px-8 border-b border-white/5 bg-white/[0.02]">
                    <button
                        onClick={() => setActiveConnectTab("discover")}
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${activeConnectTab === "discover" ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/60"
                            }`}
                    >
                        Discover
                    </button>
                    <button
                        onClick={() => setActiveConnectTab("requests")}
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-all relative ${activeConnectTab === "requests" ? "border-primary text-primary" : "border-transparent text-white/40 hover:text-white/60"
                            }`}
                    >
                        Pending Requests
                        {incomingRequests.length > 0 && (
                            <span className="absolute top-3 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>
                </div>

                <div className="p-8 flex-grow overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        {activeConnectTab === "discover" ? (
                            <>
                                <div className="relative mb-12">
                                    <label htmlFor="search-people" className="sr-only">Search by name</label>
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                                    <input
                                        id="search-people"
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-lg shadow-inner"
                                    />
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <Loader2 className="text-primary animate-spin mb-4" size={40} />
                                        <p className="text-white/40">Searching for connections...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence mode="popLayout">
                                            {filteredUsers.map((user, index) => (
                                                <motion.div
                                                    key={user._id}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="glass rounded-3xl p-6 border border-white/5 hover:border-primary/20 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/10 overflow-hidden shadow-lg p-0.5">
                                                            <img
                                                                src={user.profilePic || `https://avatar.iran.liara.run/public/${index + 1}`}
                                                                alt={user.fullName}
                                                                className="w-full h-full object-cover rounded-[14px]"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-white font-bold truncate group-hover:text-primary transition-colors">
                                                                {user.fullName}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                    {user.nativeLanguage}
                                                                </span>
                                                                <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                    Learning {user.learningLanguage || 'EN'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSendRequest(user._id)}
                                                        disabled={sendingRequest === user._id}
                                                        className="w-full py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary text-sm font-bold transition-all hover:text-white flex items-center justify-center gap-2 group/btn disabled:opacity-50 shadow-lg"
                                                    >
                                                        {sendingRequest === user._id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                                Send Request
                                                            </>
                                                        )}
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {!loading && filteredUsers.length === 0 && (
                                    <div className="text-center py-20">
                                        <p className="text-white/40 text-lg">No users found matching your search.</p>
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="text-primary mt-4 font-bold hover:underline"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {incomingRequests.map((request, index) => (
                                        <motion.div
                                            key={request._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="glass rounded-3xl p-6 border border-primary/20 bg-primary/5 shadow-xl shadow-primary/5"
                                        >
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-20 h-20 bg-white/10 rounded-3xl border border-white/10 overflow-hidden shadow-lg mb-4 ring-2 ring-primary/20">
                                                    <img
                                                        src={request.sender?.profilePic || `https://avatar.iran.liara.run/public/${index + 1}`}
                                                        alt={request.sender?.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">{request.sender?.fullName}</h3>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-6">
                                                    Speaks {request.sender?.nativeLanguage}
                                                </p>

                                                <button
                                                    onClick={() => handleAcceptRequest(request._id)}
                                                    className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                                >
                                                    <UserCheck size={18} />
                                                    Accept Connection
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {incomingRequests.length === 0 && (
                                    <div className="col-span-full text-center py-20">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                                            <UserPlus className="text-white/10" size={32} />
                                        </div>
                                        <p className="text-white/40">No pending friend requests.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
