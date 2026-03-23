import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StreamChat } from 'stream-chat';
import { Chat, ChannelList, Channel, Window, MessageList, MessageInput, useChatContext, useMessageContext, useTypingContext, useMessageInputContext, useChannelActionContext } from 'stream-chat-react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useNavigate, useLocation } from 'react-router';
import useAuthUser from '../../hooks/useAuthUser';
import { getStreamToken, translateMessage, getAllUsers, getUserProfile, uploadAudio, transcribeAudio } from '../../lib/api';
import { LANGUAGES } from '../../constants';
import DesktopChatLayout from '../layout/DesktopChatLayout';
import MobileChatLayout from '../layout/MobileChatLayout';
import useIsMobile from '../../hooks/useIsMobile';
import { getAvatarUrl, getLanguageCode } from '../../lib/utils';
import AudioRecorder from '../AudioRecorder';
import CallingScreen from '../calls/CallingScreen';
import IncomingCallScreen from '../calls/IncomingCallScreen';
import VoiceCallScreen from '../calls/VoiceCallScreen';
import VideoCallScreen from '../calls/VideoCallScreen';
import toast from 'react-hot-toast';
import translationEngine from '../../lib/translationEngine';
import Logo from '../Logo';

const BUILD_ID = 'v2.6.0-PWA-PRO'; // PWA BottomNav & Mobile Layout
console.log('🚀 NativeTalk Build Active:', BUILD_ID);

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const LANGUAGE_FLAGS = {
    'pt': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸',
    'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵',
    'zh': '🇨🇳', 'ko': '🇰🇷', 'ru': '🇷🇺',
    'ar': '🇸🇦', 'it': '🇮🇹'
};

const getFlag = (langCode) => LANGUAGE_FLAGS[langCode] || '🌐';

// --- Audio Preprocessing Helpers ---
const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const bufferArray = new ArrayBuffer(44 + dataSize);
    const view = new DataView(bufferArray);

    const writeString = (offset, str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([bufferArray], { type: 'audio/wav' });
};

const preprocessAudio = async (blob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to mono (single channel — better for Whisper)
    const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        1, // mono
        audioBuffer.duration * 16000,
        16000 // 16kHz
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Add noise reduction filter
    const filter = offlineContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 100; // remove low frequency noise

    source.connect(filter);
    filter.connect(offlineContext.destination);
    source.start();

    const processedBuffer = await offlineContext.startRendering();

    // Convert back to blob
    const wavBlob = audioBufferToWav(processedBuffer);
    console.log('[Audio] Preprocessed:', blob.size, '→', wavBlob.size, 'bytes');
    return wavBlob;
};

// --- Subs ---

const NavigationSidebar = () => {
    const { authUser: user, logout } = useAuthUser();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();

    return (
        <div className="flex flex-col h-full items-center justify-between w-full">
            <div className={`flex flex-col items-center ${isMobile ? 'gap-4' : 'gap-8'} w-full mt-2`}>
                <div onClick={() => navigate('/dashboard')} className="cursor-pointer hover:scale-105 transition-transform active:scale-95">
                    <Logo size={isMobile ? 38 : 48} className="!bg-transparent !border-none !shadow-none" />
                </div>
                <nav className={`flex flex-col ${isMobile ? 'gap-4' : 'gap-6'} w-full items-center text-slate-400`}>
                    <button onClick={() => navigate('/dashboard')} className={`relative flex items-center justify-center p-3 rounded-xl transition-all organic-press ${location.pathname === '/dashboard' || location.pathname === '/' ? 'bg-[#0D7377] text-white shadow-lg' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                        {(location.pathname === '/dashboard' || location.pathname === '/') && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0D7377] rounded-r-full"></div>}
                        <span className="material-symbols-outlined text-[24px]">chat</span>
                    </button>
                    <button onClick={() => navigate('/contacts')} className={`relative flex items-center justify-center p-3 rounded-xl transition-all organic-press ${location.pathname === '/contacts' ? 'bg-[#0D7377] text-white shadow-lg' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                        <span className="material-symbols-outlined text-[24px]">group</span>
                    </button>
                    <button onClick={() => navigate('/favorites')} className="flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                        <span className="material-symbols-outlined text-[24px]">star</span>
                    </button>

                    <button onClick={() => navigate('/notifications')} className="relative flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group">
                        <span className="material-symbols-outlined text-[24px]">notifications</span>
                        {/* Fake badge mapping to real future hook */}
                        <span className="absolute top-2 right-2 size-2.5 rounded-full bg-[#F4845F] border-2 border-[#0A1A2F]"></span>
                    </button>
                    <button onClick={() => navigate('/settings')} className="flex items-center justify-center p-3 hover:text-white hover:bg-white/5 rounded-xl transition-colors group mt-2">
                        <span className="material-symbols-outlined text-[24px]">settings</span>
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
    const currentUser = client.user;
    const [onlineUsers, setOnlineUsers] = useState([]);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser?.id) return;
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
    }, [client, currentUser?.id]);

    if (onlineUsers.length === 0) return null; // "No online users: Hide the online users row entirely"

    const handleUserClick = async (u) => {
        if (isMobile) {
            const toastId = toast.loading('Carregando chat...');
            try {
                const channel = client.channel('messaging', {
                    members: [client.user.id, u.id],
                });
                await channel.watch();
                setActiveChannel(channel);
                window.dispatchEvent(new CustomEvent('toggle-mobile-chat', { detail: true }));
                toast.dismiss(toastId);
            } catch (err) {
                console.error(err);
                toast.error('Erro ao abrir conversa', { id: toastId });
            }
        } else {
            // Desktop logic if needed, or just let them start a chat
            window.dispatchEvent(new CustomEvent('open-new-chat', { detail: { userId: u.id } }));
        }
    };

    return (
        <div className="flex overflow-x-auto hide-scrollbar px-6 pb-4 gap-4 border-b border-white/5 mb-4 pt-2">
            {onlineUsers.map((u) => (
                <div
                    key={u.id}
                    onClick={() => handleUserClick(u)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                >
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

    // Robust other member extraction
    const members = Object.values(channel.state?.members || {});
    const otherMember = members.find(m => m.user?.id !== currentUser?.id) || members[0];
    const otherUser = otherMember?.user;
    const otherUserId = otherUser?.id || channel.id.replace('messaging:', '').replace(currentUser?.id, '').replace('-', '');

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

    const isMobile = useIsMobile();
    const navigate = useNavigate();

    return (
        <div
            onClick={() => {
                const targetId = otherUser?.id || otherUserId;
                console.log('[Navigation] Mobile click, target:', targetId, 'isMobile:', isMobile);
                if (isMobile && targetId) {
                    setActiveChannel(channel);
                    window.dispatchEvent(new CustomEvent('toggle-mobile-chat', { detail: true }));
                } else {
                    setActiveChannel(channel);
                }
            }}
            className={`flex gap-3 cursor-pointer p-3 md:p-2.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${active && !isMobile ? 'bg-white/10 border border-white/5 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}
        >
            <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${imgUrl}')` }}></div>
                {isOnline && <div className="absolute bottom-0 right-0 size-3 border-2 border-[#0D2137] rounded-full bg-success"></div>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-[15px] truncate text-white">{name}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{time}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[13px] text-slate-400 truncate pr-2 flex-1">
                        {isOtherUserTyping ? (
                            <span className="text-success italic animate-pulse">Digitando...</span>
                        ) : (
                            lastMsgText || "Comece a conversar"
                        )}
                    </p>
                    {unseenCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg">
                            {unseenCount}
                        </span>
                    )}
                    {isMobile && (
                        <span className="material-symbols-outlined text-slate-500 text-[20px] ml-1 opacity-50">
                            chevron_right
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const NewChatModal = ({ isOpen, onClose }) => {
    const { client, setActiveChannel } = useChatContext();
    const currentUser = client.user;
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setLoadingUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setLoadingUsers([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery?.trim().length > 1) {
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
                    setLoadingUsers(mappedUsers.slice(0, 8));
                } catch (e) {
                    console.error('Error searching users', e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoadingUsers([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isOpen, client]);

    const handleStartChat = async (selectedUser) => {
        const toastId = toast.loading('Iniciando conversa...');
        try {
            const channel = client.channel('messaging', {
                members: [client.user.id, selectedUser.id],
            });
            await channel.watch();

            if (isMobile) {
                toast.success('Abrindo chat...', { id: toastId });
                setActiveChannel(channel);
                window.dispatchEvent(new CustomEvent('toggle-mobile-chat', { detail: true }));
            } else {
                toast.dismiss(toastId);
                setActiveChannel(channel);
            }
            onClose();
        } catch (e) {
            console.error('Error starting chat', e);
            toast.error('Erro ao iniciar conversa', { id: toastId });
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

const ContactsSidebarSkeleton = () => (
    <div className="flex flex-col h-full bg-[#0D2137]">
        <div className="p-6">
            <div className="h-8 bg-white/5 rounded-lg w-1/3 mb-6 animate-pulse" />
            <div className="h-12 bg-white/5 rounded-xl w-full mb-8 animate-pulse" />
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex gap-3 mb-4 animate-pulse">
                        <div className="size-12 rounded-full bg-white/5 shrink-0"></div>
                        <div className="flex-1 py-1 space-y-2">
                            <div className="h-3 bg-white/5 rounded w-1/2"></div>
                            <div className="h-3 bg-white/5 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ContactsSidebarContent = ({ isLoading }) => {
    // Only call context hook if we are not loading (guards against early render outside provider)
    const chatContext = useChatContext();
    const { client } = chatContext || {};
    const currentUser = client?.user;
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [channelSearch, setChannelSearch] = useState("");

    if (isLoading) return <ContactsSidebarSkeleton />;

    // Safely extract userId - MUST be a valid string for Stream SDK
    const userId = currentUser?.id;

    const filters = useMemo(() => ({
        type: 'messaging',
        members: { $in: [userId || '__placeholder__'] }
    }), [userId]);

    const sort = useMemo(() => ({ last_message_at: -1 }), []);
    const options = useMemo(() => ({
        limit: 20,
        watch: true,
        state: true,
        presence: true
    }), []);

    // Debug Logs
    useEffect(() => {
        console.log('[Mobile] currentUser:', userId);
        console.log('[Mobile] currentUser id type:', typeof userId);
        console.log('[Mobile] Stream client connected:', client?.userID);
        console.log('[Mobile] ChannelList filters:', JSON.stringify(filters));
    }, [userId, client?.userID, filters]);

    useEffect(() => {
        const handleOpen = () => setIsNewChatOpen(true);
        window.addEventListener('open-new-chat', handleOpen);
        return () => window.removeEventListener('open-new-chat', handleOpen);
    }, []);

    // A custom list filter to only show channels that match the client-side search text.
    const channelRenderFilterFn = (channels) => {
        if (!channelSearch?.trim()) return channels;
        const lowSearch = (channelSearch?.toLowerCase() || '');
        return channels.filter(c => {
            const otherMember = Object.values(c.state.members || {}).find(m => m.user.id !== userId);
            const name = c.data?.name || otherMember?.user?.name || '';
            return (name?.toLowerCase() || '').includes(lowSearch);
        });
    };

    const isMobile = useIsMobile();

    // Guard: Don't render ChannelList until userId and Client are ready
    if (!userId || !client?.userID || typeof userId !== 'string') {
        console.log('[Mobile] ChannelList not ready yet (userID mismatch or missing), waiting...');
        return (
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
        );
    }

    return (
        <div className="h-full bg-transparent flex flex-col w-full text-white relative overflow-hidden">
            <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />

            <div className="px-5 md:px-6 pt-5 md:pt-6 pb-2 flex items-center justify-between">
                <h2 className="text-2xl md:text-2xl font-bold tracking-tight text-white mb-1">{isMobile ? "NativeTalk 🌐" : "Mensagens"}</h2>
                <div className="flex items-center gap-2">
                    {isMobile && (
                        <button onClick={() => window.dispatchEvent(new CustomEvent('open-new-chat'))} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">search</span>
                        </button>
                    )}
                    <button onClick={() => setIsNewChatOpen(true)} className={`${isMobile ? 'size-10 bg-transparent' : 'size-10 bg-white/5 border border-white/10'} rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors shadow-sm active:scale-95`}>
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                    </button>
                </div>
            </div>

            <OnlineUsersRow />

            <div className={`${isMobile ? 'px-3 mb-2 mt-1' : 'px-6 mb-4 mt-2'} relative`}>
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className={`w-full bg-black/20 border border-white/5 rounded-xl ${isMobile ? 'py-2 pl-9 pr-3 text-[13px]' : 'py-3 pl-11 pr-4 text-[13px]'} text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors`}
                />
                <span className={`absolute ${isMobile ? 'left-6 text-[16px]' : 'left-9 text-[18px]'} top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500`}>search</span>
            </div>

            {/* Floating Action Button (Mobile Only) */}
            {isMobile && !channelSearch && (
                <button
                    onClick={() => setIsNewChatOpen(true)}
                    className="fixed right-6 bottom-24 size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-[100] active:scale-90 transition-all hover:bg-primary-focus group"
                    aria-label="Nova Conversa"
                >
                    <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform">add_comment</span>
                    <div className="absolute -top-1 -right-1 size-3 bg-accent rounded-full border-2 border-[#0D2137]"></div>
                </button>
            )}

            {/* Version & Debug Info (Dev only) */}
            {import.meta.env.DEV && (
                <div className="fixed left-4 bottom-4 z-50 pointer-events-none opacity-30 text-[10px] text-white bg-black/50 px-2 py-1 rounded-md border border-white/5">
                    {BUILD_ID} | {isMobile ? 'MOBILE' : 'DESKTOP'} | {window.innerWidth}px
                </div>
            )}

            <div
                className="flex-1 overflow-y-auto hide-scrollbar px-2 md:px-4 pb-4"
                style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
            >
                <div className="flex items-center gap-2 mb-3 px-2 text-slate-400 opacity-80 pt-2 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">forum</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Todas as Conversas</span>
                </div>

                <div className="relative w-full" style={{ flex: '1 1 auto', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    <ChannelList
                        filters={filters}
                        sort={sort}
                        options={options}
                        Preview={CustomConversationRow}
                        channelRenderFilterFn={channelRenderFilterFn}
                        EmptyStateIndicator={() => (
                            <div className="text-center text-slate-400 mt-16 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="bg-white/5 size-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                                    <span className="material-symbols-outlined text-[40px] opacity-40">chat_bubble</span>
                                </div>
                                <h3 className="text-white text-lg font-semibold mb-2">Suas conversas</h3>
                                <p className="mb-8 text-[14px] max-w-[200px] mx-auto text-slate-400 leading-relaxed font-normal">
                                    {channelSearch ? "Nenhuma conversa encontrada." : "Suas conversas recentes aparecerão aqui."}
                                </p>
                                <button
                                    onClick={() => setIsNewChatOpen(true)}
                                    className="bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-full text-[14px] font-bold shadow-xl active:scale-95 transition-all flex items-center gap-2 mx-auto"
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                    Encontrar Pessoas
                                </button>
                            </div>
                        )}
                        LoadingErrorIndicator={() => <div className="p-4 text-red-500 font-bold bg-red-500/10 rounded-lg border border-red-500/20 text-center m-4">Sem conexão com o chat! Verifique sua rede.</div>}
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
    const confidence = translationData?.confidence;

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
            <div className="flex flex-col items-end gap-1 ml-auto max-w-[80%] md:max-w-[70%] mb-4">
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
        <div className="flex gap-3 max-w-[80%] md:max-w-[70%] mb-4 group">
            <div className="size-10 shrink-0 rounded-full bg-cover bg-center mt-1 shadow-md" style={{ backgroundImage: `url('${message.user?.image || "https://ui-avatars.com/api/?name=" + (message.user?.name || 'U')}')` }}></div>
            <div className="flex flex-col gap-1 items-start">
                <span className="text-[13px] font-bold text-[#0D7377] ml-1">{message.user?.name || 'Guest'}</span>
                <div className="bg-[#1E2A3A] text-white rounded-[18px] rounded-tl-[4px] p-4 shadow-lg border border-white/5 relative">

                    {translation && translation !== message.text ? (
                        <>
                            <p className="text-[12px] text-white/50 italic mb-1.5 leading-relaxed">
                                {message.text}
                            </p>
                            <div className="pt-1.5 border-t border-white/10 flex flex-col items-start gap-1">
                                <div className="flex items-start gap-2 w-full">
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
                                {confidence !== undefined && (
                                    <span style={{
                                        fontSize: '11px',
                                        color: confidence > 70 ? '#2ECC71' :
                                            confidence > 40 ? '#F4D03F' : '#E74C3C'
                                    }}>
                                        {confidence > 70 ? '✓ Tradução precisa' :
                                            confidence > 40 ? '~ Tradução aproximada' :
                                                '⚠ Baixa confiança'}
                                    </span>
                                )}
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

const CustomChatHeader = ({ onStartVoiceCall, onStartVideoCall }) => {
    const { channel } = useChatContext();
    const { client } = useChatContext();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [showSearch, setShowSearch] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const otherMember = Object.values(channel?.state?.members || {}).find(m => m.user.id !== client.user.id);
    const otherUser = otherMember?.user;

    if (!channel) return <div className="h-[88px] shrink-0 border-b border-white/5"></div>;

    const name = channel.data?.name || otherUser?.name || 'Unknown';
    const imgUrl = channel.data?.image || otherUser?.image;
    const isOnline = otherUser?.online;

    return (
        <div className="h-[88px] shrink-0 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-transparent relative">
            <div className="flex items-center gap-2 md:gap-4">
                {isMobile && (
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-chat', { detail: false }))}
                        className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors mr-1"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <div className="relative">
                    <div className="size-10 md:size-12 rounded-full bg-cover bg-center shadow-lg border-2 border-[#111D2E]" style={{ backgroundImage: `url('${imgUrl || "https://ui-avatars.com/api/?name=" + name}')` }}></div>
                    {isOnline && <div className="absolute bottom-0 right-0 size-3 md:size-3.5 border-[2px] md:border-[2.5px] border-[#111D2E] rounded-full bg-success"></div>}
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
                                if (e.key === 'Enter' && e?.target?.value?.trim()) {
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
                <button onClick={() => onStartVideoCall(otherUser)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                </button>
                <button onClick={() => onStartVoiceCall(otherUser)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
                <div className="relative">
                    <button onClick={() => setShowOptions(!showOptions)} className="ml-2 size-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95" aria-label="More options">
                        <span className="material-symbols-outlined text-[22px]">more_vert</span>
                    </button>
                    {showOptions && (
                        <div className="absolute right-0 top-12 w-56 bg-[#1E2A3A] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-fadeIn flex flex-col">
                            <button
                                onClick={() => { setShowProfile(true); setShowOptions(false); }}
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
            {/* Profile Modal */}
            <UserProfileModal
                user={otherUser}
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
            />

            {/* Click outside detection hack for options menu usually requires a ref, this is a quick visual implementation */}
            {showOptions && <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)}></div>}
        </div>
    );
};

const UserProfileModal = ({ user, isOpen, onClose }) => {
    const [fullProfile, setFullProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.id) {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const data = await getUserProfile(user.id);
                    if (data) setFullProfile(data);
                } catch (err) {
                    console.error("Error fetching full profile:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        } else if (!isOpen) {
            setFullProfile(null);
        }
    }, [isOpen, user?.id]);

    if (!isOpen || !user) return null;

    // Use fullProfile if available, fallback to Stream user data
    const profileData = fullProfile || {
        name: user.name,
        id: user.id,
        image: user.image,
        bio: user.bio,
        location: user.location,
        native_language: user.native_language
    };

    const langCode = profileData.native_language || 'en';
    const flag = LANGUAGE_FLAGS[langCode] || '🌐';
    const langLabel = LANGUAGES.find(l => l.code === langCode)?.label || langCode;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-[#111D2E] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative">
                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-br from-[#0D7377]/30 to-transparent relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 size-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all active:scale-90 z-10"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Avatar */}
                <div className="px-8 -mt-16 relative">
                    <div className="size-32 rounded-[28px] border-4 border-[#111D2E] bg-cover bg-center shadow-xl mb-6 bg-slate-800"
                        style={{ backgroundImage: `url('${profileData.image || profileData.avatar_url || "https://ui-avatars.com/api/?name=" + profileData.name}')` }}>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
                            <span className="text-xl" title={`Idioma: ${langCode}`}>{flag}</span>
                        </div>
                        <p className="text-slate-400 font-medium pb-2 border-b border-white/5">@{profileData.id}</p>
                    </div>

                    <div className="space-y-6 pb-10">
                        {loading ? (
                            <div className="flex justify-center py-4"><span className="loading loading-spinner text-[#0D7377]"></span></div>
                        ) : (
                            <>
                                {profileData.bio && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-[#0D7377] uppercase tracking-wider">Sobre</label>
                                        <p className="text-slate-300 text-[15px] leading-relaxed italic">"{profileData.bio}"</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <span className="material-symbols-outlined text-[#0D7377] text-[20px] mb-2">location_on</span>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Localização</p>
                                        <p className="text-white text-[14px] font-medium truncate">{profileData.location || "Não informada"}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <span className="material-symbols-outlined text-[#0D7377] text-[20px] mb-2">language</span>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Idioma Nativo</p>
                                        <p className="text-white text-[14px] font-medium truncate">{langLabel}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-[#0D7377] hover:bg-[#0a5a5e] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#0D7377]/20 active:scale-[0.98] mt-4"
                        >
                            Fechar Perfil
                        </button>
                    </div>
                </div>
            </div>
            <div className="fixed inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};

const ChatInput = () => {
    const [text, setText] = useState('');
    const { sendMessage } = useChannelActionContext();
    const { channel } = useChatContext();
    const { authUser } = useAuthUser();
    const fileInputRef = useRef(null);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);

    const handleSend = async () => {
        if (!text.trim() || !channel) return;
        const messageText = text;
        setText(''); // Clear immediately for UX
        try {
            console.log('[ChatInput] Sending message to channel:', channel.id);
            await channel.sendMessage({
                text: messageText,
                originalLanguage: authUser?.native_language || 'pt'
            });
        } catch (err) {
            console.error("[ChatInput] Failed to send message:", err);
            toast.error("Erro ao enviar mensagem");
            setText(messageText); // Restore on failure
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSendAudio = async (audioBlob, _, duration) => {
        if (!channel) return;
        setIsProcessingAudio(true);
        const toastId = toast.loading('🎤 Processando áudio...', { id: 'audio-flow' });
        try {
            const processedBlob = await preprocessAudio(audioBlob);
            toast.loading('☁️ Enviando áudio...', { id: toastId });
            const uploadResult = await uploadAudio(processedBlob, 'audio/wav');
            const audioUrl = uploadResult?.url || uploadResult;
            if (!audioUrl) throw new Error("Erro ao fazer upload do áudio");
            
            const otherMemberId = Object.keys(channel.state.members).find(id => id !== authUser.id);
            const otherMember = channel.state.members[otherMemberId]?.user;
            const toLang = getLanguageCode(
                otherMember?.native_language ||
                otherMember?.nativeLanguage ||
                otherMember?.language ||
                'en'
            );

            // 🎙️ TRANSCRIÇÃO LOCAL (CLIENT-SIDE)
            toast.loading('🧠 Transcrevendo localmente...', { id: toastId });
            
            let transcript = '';
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await processedBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const audioData = audioBuffer.getChannelData(0); // Float32Array
                
                transcript = await translationEngine.transcribe(audioData);
                console.log('✅ Local Transcription:', transcript);
            } catch (sttError) {
                console.error('[Audio] Local STT Error:', sttError);
                // Fallback silencioso para texto vazio se falhar feio
            }

            if (!transcript) {
                toast.error('Não foi possível entender o áudio.', { id: toastId });
                throw new Error("Falha na transcrição local");
            }

            // 🌐 TRADUÇÃO LOCAL (OPCIONAL/SERVER FALLBACK)
            toast.loading('🇧🇷 Traduzindo...', { id: toastId });
            const detectedLang = authUser?.native_language || 'pt';
            const translatedText = await translationEngine.translate(transcript, detectedLang, toLang) || transcript;

            await channel.sendMessage({
                text: transcript,
                originalLanguage: detectedLang,
                nativeLanguage: detectedLang,
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
            console.error('[Audio] Error:', error);
            const errorMessage = error.message.includes('Failed to fetch') || error.message.includes('inacessível') 
                ? 'Serviço de áudio indisponível no momento' 
                : error.message;
            toast.error(errorMessage || 'Erro ao processar áudio', { id: toastId });
        } finally {
            setIsProcessingAudio(false);
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
                        onClick={handleSend}
                        className="flex items-center justify-center size-12 rounded-full bg-[#0D7377] text-white hover:bg-[#0a5a5e] transition-all organic-press cursor-pointer shadow-lg"
                        style={{ boxShadow: '0 4px 14px -2px rgba(13, 115, 119, 0.4)' }}
                    >
                        <span className="material-symbols-outlined text-[22px] translate-x-[2px]">send</span>
                    </button>
                ) : isProcessingAudio ? (
                    <div className="flex items-center justify-center size-12 rounded-full bg-[#0D7377]/30 animate-pulse">
                        <span className="animate-spin material-symbols-outlined text-[22px] text-[#0D7377]">sync</span>
                    </div>
                ) : (
                    <AudioRecorder onSendAudio={handleSendAudio} />
                )}
            </div>
        </div>
    );
};

const MainChatAreaContent = ({ translations, onTranslate, onStartVoiceCall, onStartVideoCall, isLoading }) => {
    const { channel } = useChatContext() || {};
    const { typing } = useTypingContext() || {};
    const { authUser } = useAuthUser();

    if (isLoading) return <SkeletonChat />;

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
            <CustomChatHeader onStartVoiceCall={onStartVoiceCall} onStartVideoCall={onStartVideoCall} />

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
                <ChatInput />
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

// --- Skeletons ---
const SkeletonRow = () => (
    <div className="flex items-center gap-3 p-4 animate-pulse">
        <div className="size-12 rounded-2xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
    </div>
);

const SkeletonChat = () => (
    <div className="flex flex-col h-full w-full animate-pulse bg-transparent">
        <div className="h-[88px] border-b border-white/5 flex items-center px-8 gap-4">
            <div className="size-12 rounded-full bg-white/5" />
            <div className="h-4 bg-white/5 rounded w-32" />
        </div>
        <div className="flex-1 p-8 space-y-6">
            <div className="flex gap-3"><div className="size-8 rounded-full bg-white/5" /><div className="h-12 bg-white/5 rounded-2xl w-2/3" /></div>
            <div className="flex gap-3 justify-end"><div className="h-12 bg-white/5 rounded-2xl w-1/2" /><div className="size-8 rounded-full bg-white/5" /></div>
            <div className="flex gap-3"><div className="size-8 rounded-full bg-white/5" /><div className="h-12 bg-white/5 rounded-2xl w-1/3" /></div>
        </div>
        <div className="p-6 border-t border-white/5">
            <div className="h-14 bg-white/5 rounded-[2rem] w-full" />
        </div>
    </div>
);

if (!STREAM_API_KEY) {
    console.error('[Stream] CRITICAL: VITE_STREAM_API_KEY is missing from environment variables!');
}

const StitchChat = () => {
    const { authUser: user, isLoading: authLoading } = useAuthUser();
    const [chatClient, setChatClient] = useState(null);
    const [videoClient, setVideoClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [streamReady, setStreamReady] = useState(false);
    const [translations, setTranslations] = useState({});
    const translatingRef = useRef(new Set());
    const isMobile = useIsMobile();

    // Unified Stream Readiness effect
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    useEffect(() => {
        const handleToggle = (e) => {
            console.log('[Mobile] Toggle chat:', e.detail);
            setIsMobileChatOpen(e.detail);
        };
        window.addEventListener('toggle-mobile-chat', handleToggle);
        return () => window.removeEventListener('toggle-mobile-chat', handleToggle);
    }, []);

    useEffect(() => {
        // Only wait for chatClient to be ready, videoClient is secondary and slower
        if (chatClient?.userID) {
            console.log('[Stream] System ready for ID:', chatClient.userID);
            setStreamReady(true);
        } else {
            setStreamReady(false);
        }
    }, [chatClient?.userID]);

    const clientRef = useRef(null);
    if (!clientRef.current) {
        clientRef.current = StreamChat.getInstance(STREAM_API_KEY);
    }

    // Stream Video Call States
    const [callScreen, setCallScreen] = useState(null); // 'incoming', 'calling', 'voice', 'video'
    const [activeCall, setActiveCall] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [caller, setCaller] = useState(null);
    const [contactUser, setContactUser] = useState(null);

    const handleTranslate = React.useCallback(async (message) => {
        if (!message || message.user?.id === user?.id) return;

        const cacheKey = `${message.id}-${user?.id}`;
        if (translatingRef.current.has(cacheKey)) return;

        const senderLang = getLanguageCode(
            message.user?.nativeLanguage ||
            message.user?.native_language ||
            message.user?.language ||
            'en'
        );
        const readerLang = getLanguageCode(user?.native_language || 'en');

        if (senderLang === readerLang) return;

        translatingRef.current.add(cacheKey);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_BASE_URL}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message.text, from: senderLang, to: readerLang })
            });
            if (response.ok) {
                const data = await response.json();
                const translatedText = data.translated || data.translatedText;
                if (translatedText && translatedText !== message.text) {
                    setTranslations(prev => {
                        if (prev[cacheKey]) return prev;
                        return { ...prev, [cacheKey]: { translatedText, translation: { text: translatedText, language: readerLang } } };
                    });
                }
            }
        } catch (e) {
            console.warn(`[Translation] Server request failed for ${cacheKey}:`, e.message);
        } finally {
            translatingRef.current.delete(cacheKey);
        }
    }, [user]);

    const { data: tokenData } = useQuery({
        queryKey: ["streamToken", user?.id],
        queryFn: getStreamToken,
        enabled: !!user?.id,
        staleTime: 20 * 60 * 1000,
    });

    const tokenString = tokenData?.token;
    const userId = user?.id;
    const userLang = user?.native_language || user?.nativeLanguage;

    useEffect(() => {
        if (!tokenString || !userId) return;
        const client = clientRef.current;
        let cleanup = false;

        const initChat = async () => {
            try {
                const langCode = getLanguageCode(userLang);
                console.log(`[Stream] Connecting user ${userId} with nativeLanguage: ${langCode}`);

                // Validate token before passing to Stream SDK
                if (!tokenString || typeof tokenString !== 'string') {
                    console.error('[Stream] Invalid token, skipping connect:', tokenString);
                    setLoading(false);
                    return;
                }

                await client.connectUser(
                    {
                        id: userId,
                        name: user.name,
                        image: getAvatarUrl(user.avatar_url, user.name),
                        native_language: langCode,
                        nativeLanguage: langCode
                    },
                    tokenString
                );

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
                if (!cleanup) setLoading(false);
            }
        };

        if (!chatClient || !client.user) {
            initChat();
        }

        return () => {
            cleanup = true;
            // Only disconnect if we are actually unmounting or identity changes
            if (client) client.disconnectUser();
            if (chatClient && chatClient !== client) chatClient.disconnectUser();
            if (videoClient) videoClient.disconnectUser();
        };
    }, [tokenString, userId, userLang]);

    // Listen for incoming video calls
    useEffect(() => {
        if (!videoClient) return;
        const unsubscribe = videoClient.on('call.ring', async (event) => {
            try {
                const incomingCall = videoClient.call(event.call.type, event.call.id);
                await incomingCall.get(); // fetch full call data first

                // Wait for state to be populated
                await new Promise(resolve => setTimeout(resolve, 500));

                // Safe access with fallback
                const createdBy = incomingCall.state?.createdBy ||
                    event.call?.created_by ||
                    { id: 'unknown', name: 'Alguém', image: null };

                console.log('[Call] Incoming from:', createdBy);

                setIncomingCall(incomingCall);
                setCaller(createdBy.custom || createdBy);
                setCallScreen('incoming');
            } catch (e) {
                console.error("Incoming ring error:", e);
            }
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [videoClient]);

    const startVideoCall = async (contact) => {
        if (!videoClient || !user || !contact) return;
        try {
            const shortId = [user.id, contact.id]
                .sort()
                .join('-')
                .replace(/-/g, '')
                .substring(0, 50);
            const callId = `v-${shortId}`;
            console.log('[Call] callId length:', callId.length, callId);

            const call = videoClient.call('default', callId);
            await call.getOrCreate({
                ring: true,
                data: { members: [{ user_id: user.id }, { user_id: contact.id }] }
            });
            await call.join();
            setContactUser(contact);
            setActiveCall(call);
            setCallScreen('video');
        } catch (e) {
            console.error("Video call failed:", e);
            toast.error("Erro ao iniciar chamada de vídeo");
        }
    };

    const startVoiceCall = async (contact) => {
        if (!videoClient || !user || !contact) return;
        try {
            const shortId = [user.id, contact.id]
                .sort()
                .join('-')
                .replace(/-/g, '')
                .substring(0, 50);
            const callId = `a-${shortId}`;
            console.log('[Call] callId length:', callId.length, callId);

            const call = videoClient.call('audio_room', callId);
            await call.getOrCreate({
                ring: true,
                data: { members: [{ user_id: user.id }, { user_id: contact.id }] }
            });
            await call.join();
            setContactUser(contact);
            setActiveCall(call);
            setCallScreen('voice');
        } catch (e) {
            console.error("Voice call failed:", e);
            toast.error("Erro ao iniciar chamada de voz");
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A1A2F] text-slate-400">
                <div className="text-center">
                    <div className="size-12 rounded-full border-t-2 border-primary animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    const navigationSidebar = <NavigationSidebar />;
    const contactsSidebar = <ContactsSidebarContent isLoading={loading || !streamReady} />;
    const mainChatArea = (
        <Channel>
            <Window>
                <MainChatAreaContent
                    translations={translations}
                    onTranslate={handleTranslate}
                    onStartVoiceCall={startVoiceCall}
                    onStartVideoCall={startVideoCall}
                    isLoading={loading || !streamReady}
                />
            </Window>
        </Channel>
    );

    const skeletonMainChatArea = <MainChatAreaContent isLoading={true} />;

    // Render logic: Show structure immediately, wrap in Stream providers only when ready
    if (!chatClient || !streamReady) {
        const skeletonContacts = <ContactsSidebarSkeleton />;
        return (
            <div className="str-chat__theme-dark">
                {isMobile ? (
                    <MobileChatLayout
                        isChatOpen={isMobileChatOpen}
                        navigationSidebar={navigationSidebar}
                        contactsSidebar={skeletonContacts}
                        mainChatArea={skeletonMainChatArea}
                    />
                ) : (
                    <DesktopChatLayout
                        navigationSidebar={navigationSidebar}
                        contactsSidebar={skeletonContacts}
                        mainChatArea={skeletonMainChatArea}
                    />
                )}
            </div>
        );
    }

    return (
        <Chat client={chatClient} theme="str-chat__theme-dark">
                {/* 1. Overlays for call screens */}
                {callScreen === 'incoming' && incomingCall && caller && (
                    <IncomingCallScreen
                        call={incomingCall}
                        caller={caller}
                        onAccept={async () => {
                            try {
                                if (!incomingCall) return;
                                await incomingCall.accept();
                                await incomingCall.join();
                                setActiveCall(incomingCall);
                                setCallScreen(incomingCall.type === 'audio_room' ? 'voice' : 'video');
                            } catch (err) {
                                console.error('[Call] Accept error:', err);
                                setCallScreen(null);
                                setIncomingCall(null);
                            }
                        }}
                        onReject={async () => {
                            await incomingCall.leave();
                            await incomingCall.reject();
                            setCallScreen(null);
                            setIncomingCall(null);
                        }}
                    />
                )}

                {callScreen === 'calling' && activeCall && (
                    <CallingScreen
                        call={activeCall}
                        contact={contactUser}
                        onEnd={async () => {
                            await activeCall.leave();
                            setCallScreen(null);
                        }}
                    />
                )}

                {callScreen === 'voice' && activeCall && (
                    <VoiceCallScreen
                        call={activeCall}
                        contact={contactUser}
                        currentUser={user}
                        onEnd={async () => {
                            await activeCall.leave();
                            setCallScreen(null);
                        }}
                    />
                )}

                {callScreen === 'video' && activeCall && (
                    <VideoCallScreen
                        call={activeCall}
                        contact={contactUser}
                        currentUser={user}
                        onEnd={async () => {
                            await activeCall.leave();
                            setCallScreen(null);
                        }}
                    />
                )}

                {isMobile ? (
                    <MobileChatLayout
                        isChatOpen={isMobileChatOpen}
                        contactsSidebar={contactsSidebar}
                        mainChatArea={mainChatArea}
                    />
                ) : (
                    <DesktopChatLayout
                        navigationSidebar={navigationSidebar}
                        contactsSidebar={contactsSidebar}
                        mainChatArea={mainChatArea}
                    />
                )}
        </Chat>
    );
};

export default StitchChat;
