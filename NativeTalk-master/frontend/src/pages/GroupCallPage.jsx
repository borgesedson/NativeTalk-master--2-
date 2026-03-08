import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    CallControls,
    SpeakerLayout,
    StreamTheme,
    useCallStateHooks,
    CallingState,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import AutoTranscription from "../components/AutoTranscription";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Languages, Zap, ArrowLeft, MoreHorizontal, User, ShieldCheck } from "lucide-react";
import { getAvatarUrl } from "../lib/utils";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const GroupCallPage = () => {
    const { groupId } = useParams();
    const { authUser, isLoading: authLoading } = useAuthUser();
    const { data: tokenData } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!authUser,
        staleTime: 20 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [subtitle, setSubtitle] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!tokenData?.token || !authUser || !groupId) return;

        let mounted = true;
        const init = async () => {
            try {
                const user = {
                    id: authUser.id,
                    name: authUser.name,
                    image: getAvatarUrl(authUser.avatar_url, authUser.name),
                };
                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user,
                    token: tokenData.token,
                });

                const callInstance = videoClient.call("default", `group-${groupId}`);
                await callInstance.join({ create: true });

                if (mounted) {
                    setClient(videoClient);
                    setCall(callInstance);
                }
            } catch (err) {
                console.error("Error joining group call:", err);
                toast.error("Could not join the group call.");
                navigate("/groups");
            } finally {
                if (mounted) setIsConnecting(false);
            }
        };

        init();

        return () => {
            mounted = false;
            if (client) client.disconnectUser();
        };
    }, [tokenData, authUser, groupId]);

    if (authLoading || isConnecting) return <PageLoader />;

    const handleTranscription = (result) => {
        setSubtitle(result.translatedTranscription);
        setTimeout(() => setSubtitle(null), 5000);
    };

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-display selection:bg-primary/30">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] size-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] size-[40%] bg-accent-coral/5 rounded-full blur-[100px]" />
            </div>

            {/* TOP BAR - Consistent with CallPage */}
            <header className="absolute top-0 inset-x-0 z-[100] p-8 flex items-center justify-between pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/5 px-6 py-3 rounded-2xl pointer-events-auto"
                >
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="size-5" />
                    </button>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs ring-1 ring-primary/30">
                            TRB
                        </div>
                        <div>
                            <h2 className="text-sm font-black truncate max-w-[150px]">Tribe Session</h2>
                            <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase flex items-center gap-1.5">
                                <ShieldCheck className="size-2 text-green-500" /> Secure Protocol
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="hidden md:flex bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase">
                        <Zap className="size-3 fill-primary" />
                        Multi-Node Exchange
                    </div>
                    <button className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="size-5" />
                    </button>
                </div>
            </header>

            {/* MAIN VIDEO AREA */}
            <main className="flex-1 relative p-6 flex items-center justify-center pt-24 pb-32">
                <div className="w-full h-full max-w-7xl relative mx-auto rounded-[3rem] overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    {client && call ? (
                        <StreamVideo client={client}>
                            <StreamCall call={call}>
                                <div className="h-full w-full stream-video-container-premium">
                                    <SpeakerLayout />
                                </div>
                            </StreamCall>
                        </StreamVideo>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">Establishing Neural Link...</p>
                        </div>
                    )}

                    {/* Subtitle Overlay (The "Stitch" experience) */}
                    <AnimatePresence>
                        {subtitle && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="absolute bottom-12 inset-x-12 z-[150] pointer-events-none"
                            >
                                <div className="max-w-3xl mx-auto bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Globe className="size-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Synthesis</span>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight text-center">
                                        "{subtitle}"
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* CONTROLS AREA */}
            {client && call && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/60 backdrop-blur-3xl border border-white/5 p-4 rounded-[3rem] shadow-2xl flex items-center justify-center"
                    >
                        <StreamVideo client={client}>
                            <StreamCall call={call}>
                                <CallControls onLeave={() => navigate(-1)} />
                            </StreamCall>
                        </StreamVideo>
                    </motion.div>
                </div>
            )}

            {/* Auto transcription (captures local mic) */}
            <AutoTranscription
                currentUserId={authUser.id}
                otherUserId={null}
                onTranscription={handleTranscription}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .str-video__speaker-layout {
                    background: transparent !important;
                    height: 100% !important;
                    border-radius: 3rem !important;
                }
                .str-video__participants-grid {
                    background: transparent !important;
                }
                .str-video__participant-view {
                    border-radius: 2rem !important;
                    overflow: hidden !important;
                    border: 4px solid #0a0a0a !important;
                    box-shadow: 0 4px 50px rgba(0,0,0,0.5) !important;
                }
                .str-video__call-controls {
                    background: transparent !important;
                    gap: 1.5rem !important;
                }
                .str-video__call-controls__button {
                    background: rgba(255,255,255,0.05) !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    width: 64px !important;
                    height: 64px !important;
                    border-radius: 20px !important;
                    transition: all 0.3s ease !important;
                }
                .str-video__call-controls__button:hover {
                    background: rgba(255,255,255,0.1) !important;
                    border-color: var(--primary) !important;
                }
                .str-video__call-controls__button--hangup {
                    background: #ef4444 !important;
                    width: 80px !important;
                    height: 80px !important;
                    border-radius: 30px !important;
                    margin: 0 1rem !important;
                }
            `}} />
        </div>
    );
};

export default GroupCallPage;
