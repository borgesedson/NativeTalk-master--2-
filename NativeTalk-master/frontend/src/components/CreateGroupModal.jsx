import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../lib/groupApi";
import { Search, X, Users, Upload, Smartphone, Check, UserPlus, Sparkles, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import useChatStore from "../store/useChatStore";
import { motion, AnimatePresence } from "framer-motion";

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [avatar, setAvatar] = useState("");

    const { users, getUsers } = useChatStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen) getUsers();
    }, [isOpen, getUsers]);

    // Filter users based on search term
    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.native_language?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createGroupMutation = useMutation({
        mutationFn: createGroup,
        onSuccess: () => {
            onSuccess();
            onClose();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create group");
        },
    });

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Please enter a group name");
        if (selectedUsers.length === 0) {
            return toast.error("Please select at least one member");
        }

        createGroupMutation.mutate({
            name,
            description,
            avatar,
            memberIds: selectedUsers.map((u) => u.id),
        });
    };

    const toggleUser = (user) => {
        if (selectedUsers.find((u) => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
        } else {
            if (selectedUsers.length >= 19) {
                return toast.error("Maximum 20 members allowed");
            }
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#141414] border border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Users className="size-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    {name || "New Community"}
                                    <Sparkles className="size-4 text-accent-coral" />
                                </h2>
                                <p className="text-gray-500 text-sm">Design your translation-powered group</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl transition-all border border-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col md:flex-row h-full overflow-hidden">
                        {/* LEFT: Info */}
                        <div className="flex-1 p-8 space-y-6 overflow-y-auto border-r border-white/5 custom-scrollbar">
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Group Information</label>
                                    <input
                                        type="text"
                                        placeholder="Name your tribe..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg font-bold"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <textarea
                                        placeholder="Describe the group's purpose... (optional)"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all h-32 resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Group Avatar URL</label>
                                        <span className="text-[10px] text-primary/60 font-medium">Auto-generated if empty</span>
                                    </div>
                                    <div className="relative group">
                                        <Upload className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500 group-focus-within:text-primary" />
                                        <input
                                            type="text"
                                            placeholder="https://image-url.com/avatar.png"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-6 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            value={avatar}
                                            onChange={(e) => setAvatar(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Member Selection */}
                        <div className="flex-1 p-8 flex flex-col h-full bg-[#0d0d0d]">
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center justify-between">
                                    <span>Add Partners</span>
                                    <span className="text-primary font-black tracking-normal">{selectedUsers.length}/20</span>
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or language..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[250px]">
                                {filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-3">
                                        <div className="p-4 bg-white/5 rounded-full">
                                            <LayoutGrid className="size-6 opacity-30" />
                                        </div>
                                        <p className="text-sm">No peers found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredUsers.map((user) => {
                                            const isSelected = !!selectedUsers.find(u => u.id === user.id);
                                            return (
                                                <motion.div
                                                    key={user.id}
                                                    whileHover={{ x: 4 }}
                                                    onClick={() => toggleUser(user)}
                                                    className={`
                                                      flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border
                                                      ${isSelected
                                                            ? 'bg-primary/20 border-primary/40 ring-1 ring-primary/20'
                                                            : 'hover:bg-white/5 border-transparent'}
                                                    `}
                                                >
                                                    <div className="relative">
                                                        <div className="size-11 rounded-xl overflow-hidden bg-white/5">
                                                            <img src={user.avatar_url || "/avatar.png"} alt={user.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute -top-1.5 -right-1.5 size-5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0d0d0d] shadow-lg">
                                                                <Check className="size-3 text-white stroke-[4px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold truncate text-sm ${isSelected ? 'text-primary' : 'text-white'}`}>{user.name}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">
                                                                {user.native_language || "English"}
                                                            </span>
                                                            {user.online && <div className="size-1.5 bg-green-500 rounded-full" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-white/5 bg-white/5 backdrop-blur-xl flex justify-between items-center">
                        <div className="flex flex-wrap gap-2 max-w-[50%]">
                            <AnimatePresence>
                                {selectedUsers.length > 0 && selectedUsers.map(user => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="bg-primary/20 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-2 hover:bg-primary/30 transition-colors"
                                    >
                                        {user.name.split(' ')[0]}
                                        <X
                                            className="size-3 cursor-pointer hover:text-white"
                                            onClick={() => toggleUser(user)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="px-6 py-3 text-gray-400 font-bold hover:text-white transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/10 flex items-center gap-2 active:scale-95 ${(!name.trim() || selectedUsers.length === 0)
                                        ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                        : "bg-primary text-white hover:bg-primary-focus border border-primary/20"
                                    }`}
                                onClick={handleCreateGroup}
                                disabled={createGroupMutation.isPending || !name.trim() || selectedUsers.length === 0}
                            >
                                {createGroupMutation.isPending ? (
                                    <>
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Building...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="size-4" />
                                        Establish Community
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateGroupModal;
