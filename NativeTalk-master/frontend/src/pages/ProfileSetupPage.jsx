import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES } from "../constants";
import { motion } from "framer-motion";

const ProfileSetupPage = () => {
    const { authUser } = useAuthUser();
    const queryClient = useQueryClient();

    const [formState, setFormState] = useState({
        name: "",
        bio: "",
        native_language: "",
        location: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (authUser) {
            setFormState({
                name: authUser.name || "",
                bio: authUser.bio || "",
                native_language: authUser.native_language || "",
                location: authUser.location || "",
                avatar_url: authUser.avatar_url || "",
            });
        }
    }, [authUser]);

    const { mutate: onboardingMutation, isPending } = useMutation({
        mutationFn: completeOnboarding,
        onSuccess: () => {
            toast.success('Perfil concluído!');
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            window.location.href = '/dashboard';
        },
        onError: (error) => {
            toast.error(error.message || "Falha ao concluir onboarding");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.native_language) {
            toast.error('Selecione seu idioma nativo');
            return;
        }
        onboardingMutation(formState);
    };

    const handleRandomAvatar = () => {
        const idx = Math.floor(Math.random() * 10000);
        const randomAvatar = `https://avatar.vercel.sh/${idx}.png?size=256`;
        setFormState({ ...formState, avatar_url: randomAvatar });
        toast.success('Avatar gerado!');
    };

    return (
        <div className="font-display bg-gradient-to-b from-[#112122] to-background-dark text-slate-100 min-h-screen relative overflow-x-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 bg-primary/5 rounded-full blur-[120px] pointer-events-none w-full h-1/2 top-[-10%] left-0"></div>

            <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-12 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-md mx-auto pt-[max(2rem,calc(env(safe-area-inset-top)+1.5rem))]">

                {/* Top Header/Navigation like the design nativetalk_sele_o_de_idiomas_refined */}
                <header className="flex items-center w-full justify-between mb-2">
                    <button
                        onClick={() => window.history.back()}
                        className="text-slate-100 hover:bg-primary/20 p-2 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-4">Registro</h2>
                    <div className="w-10"></div>
                </header>

                {/* Progress Indicator */}
                <div className="flex w-full flex-row items-center justify-center gap-3 py-4 mb-4">
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-12 rounded-full bg-primary"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-6"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Configure seu Perfil</h1>
                        <p className="text-slate-400">Personalize sua experiência</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Avatar Selection */}
                        <div className="flex flex-col items-center gap-2 mb-6">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative group cursor-pointer"
                                onClick={handleRandomAvatar}
                            >
                                <div className="size-28 rounded-full border-2 border-primary/30 p-1 bg-gradient-to-br from-primary/20 to-accent-coral/10">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                                        {formState.avatar_url ? (
                                            <img src={formState.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-slate-500">photo_camera</span>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 bg-accent-coral p-2 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-white text-sm block">shuffle</span>
                                </div>
                            </motion.div>
                            <p className="text-xs text-slate-500 font-medium">Toque para gerar</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Nome Completo</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</span>
                                <input
                                    type="text"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[#1a2e2f] border-none text-slate-100 placeholder:text-primary/60 focus:ring-2 focus:ring-primary focus:bg-[#1a2e2f] transition-all outline-none"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Localização</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">location_on</span>
                                <input
                                    type="text"
                                    value={formState.location}
                                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[#1a2e2f] border-none text-slate-100 placeholder:text-primary/60 focus:ring-2 focus:ring-primary focus:bg-[#1a2e2f] transition-all outline-none"
                                    placeholder="New York, USA (Opcional)"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Idioma Nativo</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">language</span>
                                <select
                                    value={formState.native_language}
                                    onChange={(e) => setFormState({ ...formState, native_language: e.target.value })}
                                    className="w-full appearance-none h-14 pl-12 pr-10 rounded-2xl bg-[#1a2e2f] border-none text-slate-100 focus:ring-2 focus:ring-primary focus:bg-[#1a2e2f] transition-all outline-none"
                                    required
                                >
                                    <option value="" className="bg-[#0A1A1F]">Selecione um idioma</option>
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code} className="bg-[#0A1A1F]">
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-500">expand_more</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Bio (Opcional)</label>
                            <div className="relative">
                                <textarea
                                    value={formState.bio}
                                    onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                                    className="w-full bg-[#1a2e2f] border-none rounded-2xl p-4 text-slate-100 placeholder:text-primary/60 focus:ring-2 focus:ring-primary focus:bg-[#1a2e2f] transition-all outline-none h-28 resize-none"
                                    placeholder="Escreva algo sobre você..."
                                />
                            </div>
                        </div>

                        <button
                            disabled={isPending}
                            className="w-full h-14 flex items-center justify-center gap-2 bg-accent-coral hover:brightness-110 text-white font-bold rounded-2xl shadow-xl shadow-accent-coral/20 transition-all active:scale-[0.98] mt-8 disabled:opacity-50"
                        >
                            {isPending ? (
                                <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Continuar</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
