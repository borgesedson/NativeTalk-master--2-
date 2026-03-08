"use client";

import React from "react";
import {
    Chat,
    Channel,
    Window,
    ChannelHeader,
    MessageList,
    MessageInput,
    Thread,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { useStream } from "@/contexts/StreamContext";
import CustomMessage from "@/components/CustomMessage";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ChatWindow({ channel }) {
    const { client, isReady } = useStream();

    if (!isReady || !client) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-white/40">Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#0c0c0e]">
            <Chat client={client} theme="str-chat__theme-dark">
                <Channel channel={channel} Message={CustomMessage}>
                    <Window>
                        <ChannelHeader />
                        <MessageList />
                        <MessageInput grow />
                    </Window>
                    <Thread />
                </Channel>
            </Chat>

            <style jsx global>{`
        .str-chat {
          --str-chat__primary-color: var(--color-primary);
          --str-chat__active-primary-color: var(--color-primary);
          --str-chat__surface-color: #0c0c0e;
          --str-chat__background-color: transparent;
          --str-chat__header-background-color: rgba(10, 10, 12, 0.7);
          --str-chat__message-textarea-background-color: rgba(255, 255, 255, 0.05);
          --str-chat__message-textarea-border-radius: 12px;
          --str-chat__border-radius-circle: 12px;
        }
        
        .str-chat__channel-header {
          padding: 1.5rem;
          background: rgba(10, 10, 12, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .str-chat__message-list {
          background: transparent;
        }

        .str-chat__window {
            background: transparent;
        }

        .str-chat__main-panel {
            background: transparent;
        }
      `}</style>
        </div>
    );
}
