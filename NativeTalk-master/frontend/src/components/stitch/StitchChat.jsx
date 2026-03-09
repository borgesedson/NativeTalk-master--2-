import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StreamChat } from 'stream-chat';
import { Chat, ChannelList, Channel, Window, MessageList, MessageInput, useChatContext, useMessageContext, useTypingContext, useMessageInputContext } from 'stream-chat-react';
import { useNavigate } from 'react-router';
import useAuthUser from '../../hooks/useAuthUser';
import { getStreamToken, translateMessage, getAllUsers } from '../../lib/api';
import DesktopChatLayout from '../layout/DesktopChatLayout';
import { getAvatarUrl, getLanguageCode } from '../../lib/utils';
import AudioRecorder from '../AudioRecorder';
import toast from 'react-hot-toast';
import { uploadAudio, transcribeAudio } from '../../lib/api';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const LANGUAGE_FLAGS = {
    'pt': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸',
    'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵',
    'zh': '🇨🇳', 'ko': '🇰🇷', 'ru': '🇷🇺',
    'ar': '🇸🇦', 'it': '🇮🇹'
};

const getFlag = (langCode) => LANGUAGE_FLAGS[langCode] || '🌐';

// --- Subs ---

const NavigationSidebar = () => {
    const { authUser: user, logout } = useAuthUser();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full items-center justify-between w-full">
            <div className="flex flex-col items-center gap-8 w-full mt-2">
                <div onClick={() => navigate('/home')} className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-[#0D7377] shadow-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl font-bold">public</span>
                </div>
                <nav className="flex flex-col gap-6 w-full items-center text-slate-400">
                    <button onClick={() => navigate('/dashboard')} className={`relative flex items-center justify-center p-3 rounded-xl transition-all organic-press ${location.pathname === '/dashboard' || location.pathname === '/' ? 'bg-[#0D7377] text-white shadow-lg' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                        {(location.pathname === '/dashboard' || location.pathname === '/') && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0D7377] rounded-r-full"></div>}
                        <span className="material-symbols-outlined text-[26px]">chat</span>
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-new-chat'))} className={`relative flex items-center justify-center p-3 rounded-xl transition-all organic-press ${location.pathname === '/contacts' ? 'bg-[#0D7377] text-white shadow-lg' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                        <span className="material-symbols-outlined text-[26px]">group</span>
                    </button>
                    <button onClick={() => navigate('/favorites')} className="flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                        <span className="material-symbols-outlined text-[26px]">star</span>
                    </button>
                    <button onClick={() => navigate('/notifications')} className="relative flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                        <span className="material-symbols-outlined text-[26px]">notifications</span>
                        {/* Fake badge mapping to real future hook */}
                        <span className="absolute top-2 right-2 size-2.5 rounded-full bg-[#F4845F] border-2 border-[#0A1A2F]"></span>
                    </button>
                    <button onClick={() => navigate('/settings')} className="flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group mt-2">
                        <span className="material-symbols-outlined text-[26px]">settings</span>
                    </button>
                </nav>
            </div>

            <div className="mb-4 flex flex-col items-center gap-2 cursor-pointer group relative z-50">
                <div className="size-12 rounded-2xl bg-cover bg-center border-2 border-transparent group-hover:border-white/20 transition-all shadow-lg organic-press"
                    style={{ backgroundImage: `url('${user?.avatar_url || "https://ui-avatars.com/api/?name=" + (user?.name || 'U')}')` }}>
                </div>

                {/* Interactive Profile Menu on Hover */}
                <div className="absolute left-16 bottom-0 bg-[#1E2A3A] border border-white/10 rounded-xl shadow-2xl py-2 w-56 opacity-0 translate-x-[-10px] group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                        <p className="text-sm font-bold text-white truncate">{user?.name || "Meu Perfil"}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => navigate('/settings')} className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">person</span> Meu Perfil
                    </button>
                    <button onClick={() => navigate('/settings')} className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span> Configurações
                    </button>
                    <div className="h-px bg-white/10 my-1 w-full relative"></div>
                    <button onClick={logout} className="w-full px-4 py-2.5 text-left text-[14px] text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-colors flex items-center gap-3 font-medium">
                        <span className="material-symbols-outlined text-[18px]">logout</span> Sair da conta
                    </button>
                </div>
            </div>
        </div>
    );
};

const OnlineUsersRow = () => {
    const { client } = useChatContext();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const currentUser = client.user;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await client.queryUsers(
                    { online: true, id: { $ne: currentUser.id } },
                    { last_active: -1 },
                    { limit: 10 }
                );
                setOnlineUsers(res.users);
            } catch (err) {
                console.error("Error fetching online users", err);
            }
        };

        fetchUsers();

        const handlePresence = () => fetchUsers();
        client.on('user.presence.changed', handlePresence);
        return () => client.off('user.presence.changed', handlePresence);
    }, [client, currentUser.id]);

    if (onlineUsers.length === 0) return null; // "No online users: Hide the online users row entirely"

    return (
        <div className="flex overflow-x-auto hide-scrollbar px-6 pb-4 gap-4 border-b border-white/5 mb-4 pt-2">
            {onlineUsers.map((u) => (
                <div key={u.id} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
                    <div className="relative">
                        <div className="size-11 rounded-full bg-cover bg-center shadow-md bg-slate-800" style={{ backgroundImage: `url('${u.image || "https://ui-avatars.com/api/?name=" + u.name}')` }}></div>
                        <div className="absolute bottom-0 right-0 size-3 rounded-full bg-success border-2 border-[#0D2137]"></div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 truncate w-12 text-center">{u.name}</span>
                </div>
            ))}
        </div>
    );
};

const CustomConversationRow = (props) => {
    const { channel, active, setActiveChannel } = props;
    const { client } = useChatContext();
    const currentUser = client.user;

    // Fallback if members data is somehow empty
    const otherMember = Object.values(channel.state.members || {}).find(m => m.user.id !== currentUser.id);
    const otherUser = otherMember?.user;

    const unseenCount = channel.countUnread();
    const messages = channel.state.messages || [];
    const lastMessage = messages[messages.length - 1];

    const name = channel.data.name || otherUser?.name || 'Unknown';
    const imgUrl = channel.data.image || otherUser?.image || `https://ui-avatars.com/api/?name=${name}`;
    const isOnline = otherUser?.online;

    const lastMsgText = lastMessage?.text || (lastMessage?.attachments?.length ? 'Anexo' : '');
    const langCode = getFlag(getLanguageCode(otherUser?.native_language || 'en'));

    const time = lastMessage ? format(new Date(lastMessage.created_at), 'HH:mm') : '';

    // Typing indicator check
    const isOtherUserTyping = Object.values(channel.state.typing || {}).some(t => t.user?.id !== currentUser.id);

    return (
        <div
            onClick={() => setActiveChannel(channel)}
            className={`flex gap-3 cursor-pointer p-2.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${active ? 'bg-white/10 border border-white/5 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}
        >
            <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${imgUrl}')` }}></div>
                {isOnline && <div className="absolute bottom-0 right-0 size-3 border-2 border-[#0D2137] rounded-full bg-success"></div>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-bold text-[14px] truncate text-white">{name} <span className="text-[12px]">{langCode}</span></h3>
                    <span className="text-[11px] font-medium text-slate-500">{time}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[13px] text-slate-400 truncate italic">
                        {isOtherUserTyping ? "Digitando..." : `"${lastMsgText}"`}
                    </p>
                    {unseenCount > 0 && <span className="size-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-md">{unseenCount}</span>}
                </div>
            </div>
        </div>
    );
};

const NewChatModal = ({ isOpen, onClose }) => {
    const { client, setActiveChannel } = useChatContext();
    const currentUser = client.user;
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setUsers([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setLoading(true);
                try {
                    const response = await getAllUsers({ name: searchQuery });
                    const mappedUsers = response
                        .filter(u => u.id !== currentUser.id)
                        .map(u => ({
                            id: u.id,
                            name: u.name || 'Sem nome',
                            image: u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}`
                        }));
                    setUsers(mappedUsers.slice(0, 8));
                } catch (e) {
                    console.error('Error searching users', e);
                } finally {
                    setLoading(false);
                }
            } else {
                setUsers([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isOpen, client]);

    const handleStartChat = async (selectedUser) => {
        try {
            const channel = client.channel('messaging', {
                members: [client.user.id, selectedUser.id],
            });
            await channel.watch();
            setActiveChannel(channel);
            onClose();
        } catch (e) {
            console.error('Error starting chat', e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#111D2E] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-[#0A1A2F]">
                    <h3 className="text-xl font-bold text-white">Nova Conversa</h3>
                    <button onClick={onClose} className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-6 pb-4">
                    <div className="relative mb-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar por nome ou @username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1E2A3A] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#0D7377]/50 transition-all text-[15px]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] px-2 pb-4 hide-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8"><span className="loading loading-spinner text-[#0D7377]"></span></div>
                    ) : users.length > 0 ? (
                        <div className="flex flex-col gap-1 px-4">
                            {users.map((u) => (
                                <div key={u.id} onClick={() => handleStartChat(u)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors group">
                                    <div className="size-12 rounded-full bg-cover bg-center shrink-0 border border-white/5 shadow-md" style={{ backgroundImage: `url('${u.image || "https://ui-avatars.com/api/?name=" + u.name}')` }}></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[15px] text-white group-hover:text-[#0D7377] transition-colors">{u.name}</span>
                                        <span className="text-[13px] text-slate-500">@{u.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery.length > 1 ? (
                        <div className="text-center py-10 text-slate-500 text-[14px]">Nenhum usuário encontrado.</div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 text-[14px]">Digite para pesquisar contatos.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContactsSidebarContent = () => {
    const { client } = useChatContext();
    const currentUser = client.user;
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [channelSearch, setChannelSearch] = useState("");

    const filters = useMemo(() => ({
        type: 'messaging',
        members: { $in: [currentUser.id] }
    }), [currentUser.id]);

    const sort = useMemo(() => ({ last_message_at: -1 }), []);

    useEffect(() => {
        const handleOpen = () => setIsNewChatOpen(true);
        window.addEventListener('open-new-chat', handleOpen);
        return () => window.removeEventListener('open-new-chat', handleOpen);
    }, []);

    // A custom list filter to only show channels that match the client-side search text.
    // Stream's ChannelList exposes custom filtering via the `customFilter` prop which intercepts channels before rendering!
    const channelFilterFn = (channels) => {
        if (!channelSearch.trim()) return channels;
        const lowSearch = channelSearch.toLowerCase();
        return channels.filter(c => {
            const otherMember = Object.values(c.state.members || {}).find(m => m.user.id !== currentUser.id);
            const name = c.data?.name || otherMember?.user?.name || '';
            return name.toLowerCase().includes(lowSearch);
        });
    };

    return (
        <div className="h-full bg-transparent flex flex-col w-full text-white relative">
            <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />

            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-white">Mensagens</h2>
                <button onClick={() => setIsNewChatOpen(true)} className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">edit_square</span>
                </button>
            </div>

            <OnlineUsersRow />

            <div className="px-6 mb-4 mt-2 relative">
                <input
                    type="text"
                    placeholder="Search..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[18px]">search</span>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6">
                <div className="flex items-center gap-2 mb-3 px-2 text-slate-400 opacity-80 pt-2">
                    <span className="material-symbols-outlined text-[16px]">forum</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Todas as Conversas</span>
                </div>

                <ChannelList
                    filters={filters}
                    sort={sort}
                    Preview={CustomConversationRow}
                    customChannelFilterFn={channelFilterFn}
                    EmptyStateIndicator={() => (
                        <div className="text-center text-slate-400 mt-10 p-6 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <p className="mb-4 text-[13px] font-medium">Nenhuma conversa ainda</p>
                            <button onClick={() => setIsNewChatOpen(true)} className="text-primary hover:text-white transition-colors text-[13px] font-bold flex items-center justify-center gap-1 mx-auto bg-white/5 px-4 py-2 rounded-full">
                                Encontre alguém para conversar <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    )}
                    LoadingErrorIndicator={() => <div className="p-4 text-red-400 text-sm">Problemas de conexão. Tente novamente...</div>}
                    LoadingIndicator={() => (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="size-12 rounded-full bg-white/5 shrink-0"></div>
                                    <div className="flex-1 py-1 space-y-2">
                                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                                        <div className="h-3 bg-white/5 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) {
        const distance = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        return distance.includes('menos de um minuto') ? 'agora' : format(date, 'HH:mm');
    }
    if (isYesterday(date)) return 'ontem';
    return format(date, 'eee', { locale: ptBR }).substring(0, 3);
};

const CustomMessageBubble = (props) => {
    const { translations, onTranslate } = props;
    const { authUser } = useAuthUser();
    const { message, readBy } = useMessageContext();

    // Cache key: message ID + reader's user ID (isolated per user)
    const cacheKey = `${message?.id}-${authUser?.id}`;

    useEffect(() => {
        if (message && !translations[cacheKey]) {
            onTranslate(message);
        }
    }, [message?.id, cacheKey, !!translations[cacheKey], onTranslate]);

    const isOwnMessage = message?.user?.id === authUser?.id || message?.user?.id === message?._client?.userID;
    const translationData = translations ? translations[cacheKey] : null;
    const translation = translationData?.translatedText || translationData?.translation?.text;

    const timeString = formatMessageTime(message.created_at);

    const handlePlayback = (textToSpeak) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        // Speak in the READER's native language (normalized to ISO code)
        const lang = getLanguageCode(authUser?.native_language || 'en');
        utterance.lang = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : lang;
        window.speechSynthesis.speak(utterance);
    };

    // Make read receipts dynamic
    // Stream Chat 'status' is usually 'received' when sent successfully to the server
    const isSending = message.status === 'sending';
    const isRead = readBy?.filter((u) => u.id !== authUser?.id).length > 0;

    const ReadReceipt = () => {
        if (isSending) return <span className="material-symbols-outlined text-[14px]">check</span>;
        if (isRead) return <span className="material-symbols-outlined text-[14px] text-[#0D7377]">done_all</span>;
        return <span className="material-symbols-outlined text-[14px]">done_all</span>;
    };

    if (isOwnMessage) {
        return (
            <div className="flex flex-col items-end gap-1 ml-auto max-w-[75%] mb-4">
                <div className="bg-gradient-to-br from-[#0D7377] to-[#0a5a5e] text-white rounded-[18px] rounded-tr-[4px] p-4 shadow-lg border border-white/10">
                    <p className="text-[15px] leading-relaxed font-bold">{message.text}</p>
                </div>
                <div className="flex items-center gap-1.5 mr-1 mt-0.5 opacity-60 text-slate-400">
                    <span className="text-[11px] font-medium">{timeString}</span>
                    <ReadReceipt />
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 max-w-[75%] mb-4 group">
            <div className="size-10 shrink-0 rounded-full bg-cover bg-center mt-1 shadow-md" style={{ backgroundImage: `url('${message.user?.image || "https://ui-avatars.com/api/?name=" + (message.user?.name || 'U')}')` }}></div>
            <div className="flex flex-col gap-1 items-start">
                <span className="text-[13px] font-bold text-[#0D7377] ml-1">{message.user?.name || 'Guest'}</span>
                <div className="bg-[#1E2A3A] text-white rounded-[18px] rounded-tl-[4px] p-4 shadow-lg border border-white/5 relative">

                    {translation && translation !== message.text ? (
                        <>
                            <p className="text-[12px] text-white/50 italic mb-1.5 leading-relaxed">
                                {message.text}
                            </p>
                            <div className="pt-1.5 border-t border-white/10 flex items-start gap-2">
                                <p className="text-[15px] font-semibold text-white leading-relaxed flex-1">
                                    {translation}
                                </p>
                                <button
                                    onClick={() => handlePlayback(translation)}
                                    className="text-slate-400 hover:text-white transition-colors shrink-0 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-2">
                            <p className="text-[15px] font-semibold text-white leading-relaxed flex-1">
                                {message.text}
                            </p>
                            <button
                                onClick={() => handlePlayback(message.text)}
                                className="text-slate-400 hover:text-white transition-colors shrink-0 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">volume_up</span>
                            </button>
                        </div>
                    )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium ml-1 mt-0.5">
                    {timeString}
                </span>
            </div>
        </div>
    );
};

const CustomChatHeader = () => {
    const { channel } = useChatContext();
    const { client } = useChatContext();
    const navigate = useNavigate();
    const [showSearch, setShowSearch] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const otherMember = Object.values(channel?.state?.members || {}).find(m => m.user.id !== client.user.id);
    const otherUser = otherMember?.user;

    if (!channel) return <div className="h-[88px] shrink-0 border-b border-white/5"></div>;

    const name = channel.data?.name || otherUser?.name || 'Unknown';
    const imgUrl = channel.data?.image || otherUser?.image;
    const isOnline = otherUser?.online;

    return (
        <div className="h-[88px] shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-transparent relative">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="size-12 rounded-full bg-cover bg-center shadow-lg border-2 border-[#111D2E]" style={{ backgroundImage: `url('${imgUrl || "https://ui-avatars.com/api/?name=" + name}')` }}></div>
                    {isOnline && <div className="absolute bottom-0 right-0 size-3.5 border-[2.5px] border-[#111D2E] rounded-full bg-success"></div>}
                </div>
                {showSearch ? (
                    <div className="flex items-center gap-2 animate-fadeIn bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 w-[300px]">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Pesquisar nesta conversa..."
                            className="bg-transparent text-sm w-full outline-none text-white placeholder-slate-500"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    const query = e.target.value.trim();
                                    try {
                                        const res = await client.search({
                                            channel_cid: channel.cid,
                                            query: query
                                        });
                                        if (res.results?.length > 0) {
                                            toast.success(`${res.results.length} mensagens encontradas`);
                                        } else {
                                            toast.error('Nenhuma mensagem encontrada');
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        toast.error('Erro ao pesquisar');
                                    }
                                }
                            }}
                        />
                        <button onClick={() => setShowSearch(false)} className="text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <h2 className="text-[18px] font-bold tracking-tight text-white">{name}</h2>
                        <span className="text-[13px] font-medium flex items-center gap-1.5 mt-0.5" style={{ color: isOnline ? '#2ECC71' : '#64748b' }}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={`size-10 rounded-full border border-white/10 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 ${showSearch ? 'bg-[#0D7377] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
                <button onClick={() => navigate(`/call/video/${channel.id}`)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
                <button onClick={() => navigate(`/call/voice/${channel.id}`)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <div className="relative">
                    <button onClick={() => setShowOptions(!showOptions)} className="ml-2 size-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95" aria-label="More options">
                        <span className="material-symbols-outlined text-[22px]">more_vert</span>
                    </button>
                    {showOptions && (
                        <div className="absolute right-0 top-12 w-56 bg-[#1E2A3A] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-fadeIn flex flex-col">
                            <button
                                onClick={() => { navigate('/settings'); setShowOptions(false); }}
                                className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">person</span> Ver perfil
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await channel.mute();
                                        toast.success('Conversa silenciada');
                                    } catch (e) { toast.error('Erro ao silenciar'); }
                                    setShowOptions(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-[14px] text-white hover:bg-white/5 transition-colors flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">notifications_off</span> Silenciar notificações
                            </button>
                            <div className="h-px bg-white/10 my-1 w-full relative"></div>
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Bloquear ${name}?`)) {
                                        try {
                                            await client.blockUser(otherUser.id);
                                            toast.success('Usuário bloqueado');
                                        } catch (e) { toast.error('Erro ao bloquear'); }
                                    }
                                    setShowOptions(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-[14px] text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-colors flex items-center gap-3 font-medium">
                                <span className="material-symbols-outlined text-[18px]">block</span> Bloquear usuário
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('Limpar todas as mensagens desta conversa?')) {
                                        try {
                                            await channel.truncate();
                                            toast.success('Conversa limpa');
                                        } catch (e) { toast.error('Erro ao limpar'); }
                                    }
                                    setShowOptions(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-[14px] text-[#E74C3C] hover:bg-[#E74C3C]/10 transition-colors flex items-center gap-3 font-medium">
                                <span className="material-symbols-outlined text-[18px]">delete</span> Limpar conversa
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Click outside detection hack for options menu usually requires a ref, this is a quick visual implementation */}
            {showOptions && <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)}></div>}
        </div>
    );
};

const CustomMessageInputUI = () => {
    const { text, setText } = useMessageInputContext();
    const { channel } = useChatContext();
    const { authUser } = useAuthUser();
    const fileInputRef = useRef(null);

    const handleSendAudio = async (audioBlob, _, duration) => {
        if (!channel) return;
        const toastId = toast.loading('🔄 Transcrevendo...', { id: 'audio-flow' });
        try {
            // 1. Converter para base64 como solicitado
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(audioBlob);
            });

            // 2. Upload para Storage (URL pública)
            const uploadResult = await uploadAudio(audioBlob);
            const audioUrl = uploadResult?.url || uploadResult;
            if (!audioUrl) throw new Error("Erro ao fazer upload do áudio");

            toast.loading('🌐 Traduzindo...', { id: toastId });

            // 3. STT + Tradução via Proxy do Backend
            const response = await fetch('/api/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio: base64,
                    from: getLanguageCode(authUser?.native_language || 'pt'),
                    to: getLanguageCode(channel.state.members[Object.keys(channel.state.members).find(id => id !== authUser.id)]?.user?.native_language || 'en')
                })
            });

            if (!response.ok) throw new Error("VPS STT failed");
            const result = await response.json();

            const transcript = result?.transcript || '';
            const translatedText = result?.translated || '';

            if (!transcript) throw new Error("Não foi possível processar o áudio");

            toast.loading('Enviando...', { id: toastId });

            console.log('[Send] audioUrl type:', typeof audioUrl, 'value:', audioUrl);

            await channel.sendMessage({
                text: transcript || '',
                originalLanguage: authUser?.native_language || 'pt',
                translation: translatedText,
                attachments: [{
                    type: 'audio',
                    asset_url: String(audioUrl),
                    title: 'Áudio',
                    duration,
                    transcription: transcript,
                    translation: translatedText
                }],
            });

            toast.success('✅ Enviado!', { id: toastId });
        } catch (error) {
            console.error("Audio flow error:", error);
            toast.error(error.message || 'Erro ao processar áudio', { id: toastId });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !channel) return;
        try {
            toast.loading('Enviando arquivo...', { id: 'file-upload' });
            const response = await channel.sendFile(file, file.name, file.type);
            await channel.sendMessage({
                text: text || 'Anexo',
                originalLanguage: authUser?.native_language || 'pt',
                attachments: [{
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    asset_url: response.file,
                    title: file.name,
                    file_size: file.size,
                    mime_type: file.type
                }]
            });
            setText('');
            toast.success('Arquivo enviado!', { id: 'file-upload' });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar arquivo', { id: 'file-upload' });
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        channel.sendMessage({
            text,
            originalLanguage: authUser?.native_language || 'pt'
        });
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <div className="w-full bg-[#1E2A3A] rounded-[2rem] p-1 pr-3 border border-white/5 shadow-xl transition-all hover:border-white/10 flex items-end min-h-[60px] relative z-20">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center size-12 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0 ml-1 mb-[4px]">
                <span className="material-symbols-outlined text-[24px]">attach_file</span>
            </button>
            <div className="flex-1 flex items-center py-2 px-2 bg-transparent">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem"
                    className="w-full bg-transparent text-[16px] text-white placeholder-slate-500 focus:outline-none resize-none max-h-[120px] overflow-y-auto"
                    rows={1}
                />
            </div>
            <div className="shrink-0 mb-[4px] ml-2 flex items-center justify-center">
                {text.trim().length > 0 ? (
                    <button
                        onClick={onSubmit}
                        className="flex items-center justify-center size-12 rounded-full bg-[#0D7377] text-white hover:bg-[#0a5a5e] transition-all organic-press cursor-pointer shadow-lg"
                        style={{ boxShadow: '0 4px 14px -2px rgba(13, 115, 119, 0.4)' }}
                    >
                        <span className="material-symbols-outlined text-[22px] translate-x-[2px]">send</span>
                    </button>
                ) : (
                    <AudioRecorder onSendAudio={handleSendAudio} />
                )}
            </div>
        </div>
    );
};

const MainChatAreaContent = ({ translations, onTranslate }) => {
    const { channel } = useChatContext();
    const { typing } = useTypingContext();
    const { authUser } = useAuthUser();

    if (!channel) return (
        <div className="flex flex-col h-full w-full items-center justify-center bg-transparent">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-500">forum</span>
            </div>
            <p className="text-slate-400 font-medium">Selecione uma conversa para começar</p>
        </div>
    );

    const isTyping = Object.values(typing || {}).some(t => t.user?.id !== authUser?.id);

    return (
        <div className="flex flex-col h-full w-full bg-transparent">
            {/* Header */}
            <CustomChatHeader />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 hide-scrollbar flex flex-col pt-6 pb-4 relative">
                <MessageList
                    Message={(props) => <CustomMessageBubble {...props} translations={translations} onTranslate={onTranslate} />}
                    hideDeletedMessages
                />

                {isTyping && (
                    <div className="flex gap-3 max-w-[70%] mb-4 animate-pulse">
                        <div className="size-10 shrink-0 rounded-full bg-white/10 mt-1 shadow-md"></div>
                        <div className="flex flex-col gap-1 items-start">
                            <div className="bg-[#1E2A3A] text-white p-3 px-5 rounded-[1.5rem] rounded-tl-[0.5rem] shadow-lg border border-white/5">
                                <span className="text-[14px] text-slate-400 font-medium italic">Digitando...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-8 pb-8 pt-2 relative z-20">
                <MessageInput Input={CustomMessageInputUI} />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .wa-message-input-wrapper-custom .str-chat__message-input {
                    background: transparent !important;
                    border: none !important;
                    width: 100%;
                }
                .wa-message-input-wrapper-custom .str-chat__input-flat {
                    background: transparent !important;
                    border: none !important;
                }
                .wa-message-input-wrapper-custom .str-chat__textarea textarea {
                    background: transparent !important;
                    color: white !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding-top: 14px;
                    font-size: 15px !important;
                    font-family: inherit !important;
                }
                .wa-message-input-wrapper-custom .str-chat__textarea textarea::placeholder {
                    color: #64748b !important;
                }
                .wa-message-input-wrapper-custom .str-chat__send-button {
                    background: #F4845F !important;
                    border-radius: 50% !important;
                    width: 48px !important;
                    height: 48px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-shadow: 0 4px 14px -2px rgba(244, 132, 95, 0.4) !important;
                    margin-left: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .wa-message-input-wrapper-custom .str-chat__send-button:hover {
                    background: #ff9f80 !important;
                    transform: scale(1.05);
                }
                .wa-message-input-wrapper-custom .str-chat__send-button svg {
                    fill: white !important;
                    width: 22px !important;
                    height: 22px !important;
                }
                .wa-message-input-wrapper-custom .str-chat__file-input-container,
                .wa-message-input-wrapper-custom .str-chat__input-flat-emojiselect {
                     display: none !important;
                }
                
                /* List Overrides */
                .str-chat__channel {
                    background: transparent !important;
                }
                .str-chat__main-panel {
                    background: transparent !important;
                }
                .str-chat__list {
                    padding: 0 !important;
                    background: transparent !important;
                }
                .str-chat__li {
                    margin-bottom: 0 !important;
                }
                .str-chat__message-bubble {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .str-chat__date-separator {
                    padding: 16px 0 !important;
                }
                .str-chat__date-separator-date {
                    background: rgba(255, 255, 255, 0.05) !important;
                    color: #94a3b8 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    padding: 4px 16px !important;
                    border-radius: 9999px !important;
                    box-shadow: none !important;
                }
                .str-chat__date-separator-line {
                    display: none !important;
                }
            `}} />
        </div>
    );
};

// Main Export Component
const StitchChat = () => {
    const { authUser: user, isLoading: authLoading } = useAuthUser();
    const [chatClient, setChatClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [translations, setTranslations] = useState({});
    const translatingRef = useRef(new Set());

    const handleTranslate = React.useCallback(async (message) => {
        if (!message || message.user?.id === user?.id) return;

        // Composite key: messageId-readerId (isolated per user)
        const cacheKey = `${message.id}-${user?.id}`;
        if (translatingRef.current.has(cacheKey)) return;

        const senderLang = getLanguageCode(
            message.user?.nativeLanguage ||
            message.user?.native_language ||
            message.user?.language ||
            'en'
        );
        const readerLang = getLanguageCode(user?.native_language || 'en');

        console.log(`[Translation] ${senderLang}→${readerLang} | "${message.text?.substring(0, 30)}" | key: ${cacheKey}`);

        if (senderLang === readerLang) return;

        translatingRef.current.add(cacheKey);
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message.text, from: senderLang, to: readerLang })
            });
            const data = await response.json();
            console.log(`[Translation RESULT] status=${response.status} | raw:`, JSON.stringify(data));
            if (response.ok) {
                const translatedText = data.translated || data.translatedText || message.text;
                console.log(`[Translation RESULT] original="${message.text?.substring(0, 30)}" → translated="${translatedText?.substring(0, 30)}" | same=${translatedText === message.text}`);
                if (translatedText && translatedText !== message.text) {
                    setTranslations(prev => {
                        if (prev[cacheKey]) return prev;
                        return { ...prev, [cacheKey]: { translatedText, translation: { text: translatedText, language: readerLang } } };
                    });
                }
            }
        } catch (e) {
            console.error(`[Translation] Failed for ${cacheKey}:`, e);
        } finally {
            translatingRef.current.delete(cacheKey);
        }
    }, [user]);

    const { data: tokenData } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!user,
        staleTime: 20 * 60 * 1000,
    });

    useEffect(() => {
        if (!tokenData?.token || !user) return;
        const client = StreamChat.getInstance(STREAM_API_KEY);
        let cleanup = false;

        const initChat = async () => {
            try {
                const langCode = getLanguageCode(user.native_language);
                console.log(`[Stream] Connecting user ${user.id} with nativeLanguage: ${langCode}`);
                await client.connectUser(
                    {
                        id: user.id,
                        name: user.name,
                        image: getAvatarUrl(user.avatar_url, user.name),
                        native_language: langCode,
                        nativeLanguage: langCode
                    },
                    tokenData.token
                );

                // Force-sync language to Stream Chat profile (fixes users who connected before the fix)
                await client.partialUpdateUser({
                    id: user.id,
                    set: { nativeLanguage: langCode, native_language: langCode }
                });

                // Add message listener for translations
                client.on('message.new', async (event) => {
                    if (event.message) handleTranslate(event.message);
                });

                if (!cleanup) {
                    setChatClient(client);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Connect error", err);
                setLoading(false);
            }
        };

        if (!chatClient) {
            initChat();
        }

        return () => {
            cleanup = true;
            client.disconnectUser();
        };
    }, [tokenData, user]);

    if (authLoading || loading || !chatClient) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A1A2F] text-slate-400">
                <div className="text-center">
                    <p className="loading loading-spinner text-primary mb-4"></p>
                    <p className="text-sm font-medium">Instantiating workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <Chat client={chatClient} theme="str-chat__theme-dark">
            <DesktopChatLayout
                navigationSidebar={<NavigationSidebar />}
                contactsSidebar={<ContactsSidebarContent />}
                mainChatArea={
                    <Channel>
                        <Window>
                            <MainChatAreaContent translations={translations} onTranslate={handleTranslate} />
                        </Window>
                    </Channel>
                }
            />
        </Chat>
    );
};

export default StitchChat;
