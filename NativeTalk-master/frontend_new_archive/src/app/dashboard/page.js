"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import SidebarChannels from "@/components/SidebarChannels";
import ChatWindow from "@/components/ChatWindow";
import { MessageCircle, Languages } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
    const [activeChannel, setActiveChannel] = useState(null);

    return (
        <AppLayout activeTab="chats">
            <SidebarChannels onChannelSelect={setActiveChannel} />

            <main className="flex-grow flex flex-col relative bg-[#121214]">
                {activeChannel ? (
                    <ChatWindow channel={activeChannel} />
                ) : (
                    <div className="flex-grow flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-sm"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/20">
                                <MessageCircle className="text-primary w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Select a conversation</h2>
                            <p className="text-white/40 text-sm leading-relaxed mb-8">
                                Choose a contact from the list on the left to start a multilingual conversation with real-time translation.
                            </p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                <Languages size={12} className="text-primary" />
                                Translation Engine Active
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
