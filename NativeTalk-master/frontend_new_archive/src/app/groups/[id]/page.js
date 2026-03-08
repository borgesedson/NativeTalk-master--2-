"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useParams, useRouter } from "next/navigation";
import { groupApi } from "@/lib/api";
import { useStream } from "@/contexts/StreamContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Chat,
    Channel,
    Window,
    MessageList,
    MessageInput,
    Thread,
} from "stream-chat-react";
import CustomMessage from "@/components/CustomMessage";
import { Loader2, Users, ArrowLeft, Video, Settings, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";

const GroupHeader = ({ group, onBack }) => {
    return (
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white md:hidden"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/10 overflow-hidden shadow-lg p-0.5">
                    <img
                        src={group.image || `https://avatar.iran.liara.run/public/10`}
                        alt={group.name}
                        className="w-full h-full object-cover rounded-[14px]"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Users size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {group.members?.length || 0} Members
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-primary hover:bg-primary/10 transition-all">
                    <Video size={18} />
                </button>
                <button className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-primary hover:bg-primary/10 transition-all">
                    <UserPlus size={18} />
                </button>
                <button className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white hover:bg-white/10 transition-all">
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};

export default function GroupPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { client, isReady } = useStream();
    const [group, setGroup] = useState(null);
    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initGroup = async () => {
            try {
                const data = await groupApi.getById(id);
                setGroup(data);

                if (isReady && client) {
                    const channelId = data.streamChannelId || `group-${data._id}`;
                    const groupChannel = client.channel("messaging", channelId);
                    await groupChannel.watch();
                    setChannel(groupChannel);
                }
            } catch (error) {
                console.error("Error fetching group:", error);
                if (error.response?.status === 403) {
                    toast.error("You are not a member of this group");
                } else {
                    toast.error("Failed to load group");
                }
                router.push("/groups");
            } finally {
                setLoading(false);
            }
        };

        initGroup();
    }, [id, isReady, client, router]);

    if (loading || !isReady) {
        return (
            <AppLayout activeTab="groups">
                <div className="flex-grow flex items-center justify-center bg-[#121214]">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </AppLayout>
        );
    }

    if (!group || !channel) return null;

    return (
        <AppLayout activeTab="groups">
            <div className="flex-grow flex flex-col h-full bg-[#0c0c0e] overflow-hidden relative">
                <GroupHeader group={group} onBack={() => router.push("/groups")} />

                <div className="flex-grow flex flex-col overflow-hidden relative">
                    <Chat client={client} theme="str-chat__theme-dark">
                        <Channel channel={channel} Message={CustomMessage}>
                            <Window>
                                <MessageList />
                                <div className="p-4 bg-background">
                                    <MessageInput grow focus />
                                </div>
                            </Window>
                            <Thread />
                        </Channel>
                    </Chat>
                </div>

                <style jsx global>{`
                    .str-chat {
                        --str-chat__primary-color: #6366f1;
                        --str-chat__active-primary-color: #4f46e5;
                        --str-chat__surface-color: #0c0c0e;
                        --str-chat__background-color: transparent;
                        --str-chat__header-background-color: transparent;
                        --str-chat__message-textarea-background-color: rgba(255, 255, 255, 0.05);
                        --str-chat__message-textarea-border-radius: 16px;
                        --str-chat__border-radius-circle: 16px;
                    }
                    
                    .str-chat__channel-header {
                        display: none !important;
                    }

                    .str-chat__message-list {
                        background: transparent;
                        padding-top: 1rem;
                    }

                    .str-chat__window {
                        background: transparent;
                    }

                    .str-chat__main-panel {
                        background: transparent;
                    }
                `}</style>
            </div>
        </AppLayout>
    );
}
