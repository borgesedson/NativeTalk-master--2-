"use client";

import React, { useEffect, useState } from "react";
import { useStream } from "@/contexts/StreamContext";
import { Chat, ChannelList } from "stream-chat-react";
import { Search, Plus } from "lucide-react";

const CustomChannelPreview = (props) => {
    const { channel, active, setActiveChannel, onChannelSelect } = props;
    const { user: localUser } = useStream();

    const members = channel.state?.members ? Object.values(channel.state.members).filter(
        (m) => m.user?.id !== localUser?._id && m.user?.id !== localUser?.id
    ) : [];
    const displayUser = members[0]?.user || {};

    const handleSelect = () => {
        if (setActiveChannel) setActiveChannel(channel);
        if (onChannelSelect) onChannelSelect(channel);
    };

    return (
        <div
            onClick={handleSelect}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all group ${active ? "bg-white/10 shadow-lg shadow-black/20" : "hover:bg-white/5"
                }`}
        >
            <div className="relative">
                <div className="w-12 h-12 bg-white/10 rounded-full border border-white/10 overflow-hidden shadow-inner">
                    <img
                        src={displayUser.image || `https://avatar.iran.liara.run/public/1`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
                {displayUser.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                        {displayUser.name || "Unknown"}
                    </h4>
                    <span className="text-[10px] text-white/30 uppercase font-bold">
                        {channel.state.last_message_at
                            ? new Date(channel.state.last_message_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : ""}
                    </span>
                </div>
                <p className="text-xs text-white/40 truncate">
                    {channel.state.messages[channel.state.messages.length - 1]?.text ||
                        "No messages yet"}
                </p>
            </div>
        </div>
    );
};

export default function SidebarChannels({ onChannelSelect }) {
    const { client, isReady } = useStream();

    if (!isReady || !client) return null;

    const filters = { type: "messaging", members: { $in: [client.userID] } };
    const sort = { last_message_at: -1 };

    return (
        <section className="w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col bg-background/50 backdrop-blur-sm">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Messages</h2>
                    <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto px-2 space-y-1">
                <Chat client={client} theme="str-chat__theme-dark">
                    <ChannelList
                        filters={filters}
                        sort={sort}
                        Preview={(previewProps) => (
                            <CustomChannelPreview {...previewProps} onChannelSelect={onChannelSelect} />
                        )}
                    />
                </Chat>
            </div>
        </section>
    );
}
