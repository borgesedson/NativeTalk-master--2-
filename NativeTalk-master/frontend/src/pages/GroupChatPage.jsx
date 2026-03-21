import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, translateMessage, transcribeAudio } from "../lib/api";
import { getGroup } from "../lib/groupApi";

import {
    Channel,
    Chat,
    MessageInput,
    MessageList,
    Thread,
    Window,
    useChannelStateContext
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import ChatLoader from "../components/ChatLoader";
import CustomMessage from "../components/CustomMessage";
import AudioRecorder from "../components/AudioRecorder";
import { sendNotification } from "../components/NotificationManager";
import AddMembersModal from "../components/AddMembersModal";
import { Video, Users, UserPlus, ArrowLeft, MoreVertical, LayoutGrid, Globe, Zap, ShieldCheck, Orbit, Sparkles } from "lucide-react";
import { getAvatarUrl } from "../lib/utils";

import "stream-chat-react/dist/css/v2/index.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Premium Group Header
const GroupChannelHeader = ({ group, handleVideoCall, onAddMember, isUserAdmin, onBack }) => {
    const { channel } = useChannelStateContext();
    const memberCount = Object.keys(channel.state.members).length;

    return (
        <div className="h-16 md:h-28 flex items-center justify-between px-4 md:px-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-50 overflow-hidden">
            {/* Background Pulse */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 md:gap-6">
                <button
                    onClick={onBack}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                >
                    <ArrowLeft className="size-5 text-gray-400" />
                </button>
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="relative group/avatar cursor-pointer">
                        <div className="size-14 rounded-2xl overflow-hidden bg-primary/10 border-2 border-white/5 p-0.5 shadow-2xl">
                            <img src={group?.avatar_url || channel.data?.image || "/group_placeholder.png"} alt={group?.name} className="w-full h-full object-cover rounded-xl group-hover/avatar:scale-110 transition-transform duration-500" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-xl font-black tracking-tight text-white uppercase truncate max-w-[120px] md:max-w-none">{group?.name || channel.data?.name}</h3>
                            <div className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded flex items-center gap-1.5 text-[8px] font-black text-primary uppercase tracking-widest">
                                <Zap className="size-2.5 fill-primary" />
                                ACTIVE TRIBE
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-[10px] text-gray-500 font-black flex items-center gap-1.5 uppercase tracking-widest">
                                <Users className="size-3 text-primary" />
                                {memberCount} Node Members
                            </p>
                            <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="size-2.5 text-green-500" /> Secure Protocol
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Centerpiece */}
            <div className="hidden lg:flex flex-col items-center">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-xl">
                    <Globe className="size-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Multilingual Synthesis Enabled</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isUserAdmin && (
                    <button
                        onClick={onAddMember}
                        className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-primary border border-white/5 active:scale-95"
                    >
                        <UserPlus className="size-5" />
                    </button>
                )}
                <button
                    onClick={handleVideoCall}
                    className="p-3.5 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                    <Video className="size-5 fill-white" />
                </button>
                <button className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <MoreVertical className="size-5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

const GroupChatPage = () => {
    const { id: groupId } = useParams();
    const navigate = useNavigate();

    const [chatClient, setChatClient] = useState(null);
    const [channel, setChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [translations, setTranslations] = useState({});
    const translatingRef = useRef(new Set());
    const initRef = useRef(false);

    const { authUser } = useAuthUser();

    const handleBack = () => {
        navigate(-1);
    };

    const { data: group } = useQuery({
        queryKey: ["group", groupId],
        queryFn: () => getGroup(groupId),
        enabled: !!groupId,
    });

    const { data: tokenData } = useQuery({
        queryKey: ["streamToken", user?.id],
        queryFn: getStreamToken,
        enabled: !!authUser,
        staleTime: 20 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const buildMsgKey = (m) => m?.id || `${m?.created_at}-${m?.user?.id}`;

    useEffect(() => {
        if (!tokenData?.token || !authUser || initRef.current || !group) return;

        let cleanupFn = null;

        async function initChat() {
            try {
                const client = StreamChat.getInstance(STREAM_API_KEY);

                await client.connectUser(
                    {
                        id: authUser?.id,
                        name: authUser.name,
                        image: getAvatarUrl(authUser.avatar_url, authUser.name),
                    },
                    tokenData.token
                );

                const channelId = group.streamChannelId || `group-${group.id}`;
                const currChannel = client.channel("messaging", channelId);
                await currChannel.watch();

                setChatClient(client);
                setChannel(currChannel);
                initRef.current = true;

                const handleNewMessage = async (event) => {
                    const message = event.message;
                    if (!message || !message.text) return;

                    const isOwnMessage = message.user.id === authUser?.id || message.user?.id === client.userID;
                    if (isOwnMessage) return;

                    if (event.type === "message.new") {
                        const isTabFocused = document.hasFocus();
                        if (!isTabFocused) {
                            sendNotification(group.name, {
                                body: `${message.user.name}: ${message.text}`,
                                icon: group.avatar_url,
                                tag: `group-${group.id}`,
                            });
                        }
                    }

                    const msgKey = buildMsgKey(message);
                    if (translatingRef.current.has(msgKey)) return;

                    translatingRef.current.add(msgKey);
                    try {
                        const result = await translateMessage(message.text, message.user.id);
                        if (result.sourceLanguage !== result.targetLanguage) {
                            setTranslations((prev) => ({ ...prev, [msgKey]: result }));
                        }
                    } catch (e) {
                        console.error("Translation error:", e);
                    } finally {
                        translatingRef.current.delete(msgKey);
                    }
                };

                currChannel.on("message.new", handleNewMessage);

                (currChannel.state.messages || []).forEach((m) => {
                    if (m.user.id !== authUser?.id && m.text) {
                        handleNewMessage({ message: m, type: "message.read" });
                    }
                });

                cleanupFn = () => {
                    currChannel.off("message.new", handleNewMessage);
                    try { client.disconnectUser(); } catch { }
                    initRef.current = false;
                };

            } catch (error) {
                console.error("Error initializing group chat:", error);
                toast.error("Could not connect to group chat.");
            } finally {
                setLoading(false);
            }
        }

        initChat();
        return () => { if (cleanupFn) cleanupFn(); };

    }, [tokenData, authUser, group]);

    const handleVideoCall = () => {
        if (channel) {
            navigate(`/group-call/${groupId}`);
        }
    };

    const handleSendAudio = async (audioBlob, transcription, duration) => {
        if (!channel) return;
        toast.loading('Synthesizing...', { id: 'upload-audio' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result;
            try {
                const result = await transcribeAudio(base64Audio, 'en');

                await channel.sendMessage({
                    text: result?.originalTranscription || transcription || '🎤 Audio Node',
                    attachments: [{
                        type: 'audio',
                        asset_url: base64Audio,
                        duration: duration,
                        transcription: result?.originalTranscription || transcription,
                        translation: result?.translatedTranscription || '',
                    }],
                });
                toast.success('Transmission Sent', { id: 'upload-audio' });
            } catch (e) {
                toast.error('Transmission Failed', { id: 'upload-audio' });
            }
        };
    };

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    const isAdmin = group?.admins?.some(admin =>
        (typeof admin === 'string' ? admin : admin.id) === authUser?.id
    );

    if (loading || !chatClient || !channel) return <ChatLoader />;

    return (
        <div className="screen-no-nav bg-[#050505] text-white">

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

                <div className="flex-1 flex flex-col relative z-10">
                    <Chat client={chatClient}>
                        <Channel channel={channel}>
                            <Window>
                                <GroupChannelHeader
                                    group={group}
                                    handleVideoCall={handleVideoCall}
                                    onAddMember={() => setIsAddMemberModalOpen(true)}
                                    onBack={handleBack}
                                    isUserAdmin={isAdmin}
                                />

                                <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-black">
                                    <MessageList
                                        Message={(messageProps) => (
                                            <CustomMessage {...messageProps} translations={translations} buildMsgKey={buildMsgKey} />
                                        )}
                                    />
                                </div>

                                <div className="p-4 md:p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 relative z-20">
                                    <div className="max-w-5xl mx-auto flex items-end gap-4">
                                        <div className="mb-1.5 order-2 md:order-1">
                                            <AudioRecorder onSendAudio={handleSendAudio} />
                                        </div>
                                        <div className="flex-1 order-1 md:order-2 stream-input-premium">
                                            <MessageInput focus />
                                        </div>
                                        <div className="hidden md:flex mb-1.5 order-3 gap-2">
                                            <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
                                                <Sparkles className="size-5 text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Window>
                            <Thread />
                        </Channel>
                    </Chat>
                </div>

                {/* Global Pulse Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none flex items-center gap-2">
                    <Orbit className="size-3 text-primary animate-spin" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">SECURE TRIBE CHANNEL</span>
                </div>
            </main>

            {isAddMemberModalOpen && (
                <AddMembersModal
                    groupId={groupId}
                    currentMemberIds={group?.members?.map(m => typeof m === 'string' ? m : m.id) || []}
                    onClose={() => setIsAddMemberModalOpen(false)}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .str-chat {
                    --str-chat__primary-color: #2563eb;
                    font-family: 'Outfit', sans-serif !important;
                }
                .str-chat__list {
                    background: transparent !important;
                    padding: 2rem 1rem !important;
                }
                .str-chat__main-panel { background: transparent !important; }
                .str-chat-channel { background: transparent !important; }
                /* Hide default headers */
                .str-chat__channel-header { display: none !important; }
                .stream-input-premium .str-chat__input-flat {
                   background: rgba(255,255,255,0.03);
                   border: 1px solid rgba(255,255,255,0.05);
                   border-radius: 2rem;
                   overflow: hidden;
                }
                .stream-input-premium .str-chat__input-flat:focus-within {
                   border-color: rgba(37,99,235,0.5);
                   box-shadow: 0 0 20px rgba(37,99,235,0.1);
                }
            `}} />
        </div>
    );
};

export default GroupChatPage;
