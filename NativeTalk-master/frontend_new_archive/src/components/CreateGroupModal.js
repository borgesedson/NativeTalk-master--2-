"use client";

import React, { useState } from "react";
import { X, Camera, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { groupApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Group name is required");

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            if (image) formData.append("groupImage", image);

            const newGroup = await groupApi.create(formData);
            toast.success("Group created successfully!");
            onGroupCreated(newGroup);
            onClose();
            // Reset form
            setName("");
            setDescription("");
            setImage(null);
            setPreview(null);
        } catch (error) {
            console.error("Error creating group:", error);
            toast.error(error.response?.data?.message || "Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-lg bg-[#121214] border border-white/5 rounded-[32px] shadow-2xl overflow-hidden relative z-10"
                >
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Create Group</h2>
                            <p className="text-white/40 text-xs mt-1">Start a new collaborative channel</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative group pointer-events-none">
                                <div className="w-24 h-24 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users size={32} className="text-white/10" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto cursor-pointer">
                                        <Camera className="text-white" size={24} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-white/20 mt-3 font-bold uppercase tracking-widest">Group Avatar</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Design Team 🎨"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-inner placeholder:text-white/10"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's this group about?"
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-inner resize-none placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl border border-white/5 text-white/40 font-bold hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    "Create Group"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
