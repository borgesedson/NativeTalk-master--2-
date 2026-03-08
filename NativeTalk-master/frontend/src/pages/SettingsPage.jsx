import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import imageCompression from "browser-image-compression";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfile as apiUpdateProfile, uploadProfilePic } from "../lib/api";
import toast from "react-hot-toast";
import { LANGUAGES } from "../constants";
import { useNavigate } from "react-router";

const SettingsPage = () => {
  const { t } = useTranslation();
  const { authUser, logout } = useAuthUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    native_language: "",
    avatar_url: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || "",
        bio: authUser.bio || "",
        location: authUser.location || "",
        native_language: authUser.native_language || "",
        avatar_url: authUser.avatar_url || "",
      });
      setPreviewUrl(authUser.avatar_url || "");
    }
  }, [authUser]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data) => {
      let finalAvatarUrl = data.avatar_url;

      if (selectedFile) {
        setIsUploading(true);
        try {
          finalAvatarUrl = await uploadProfilePic(selectedFile);
        } catch (error) {
          toast.error("Erro ao subir imagem");
          throw error;
        } finally {
          setIsUploading(false);
        }
      }

      return await apiUpdateProfile({
        ...data,
        avatar_url: finalAvatarUrl
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success(t("profileUpdated") || "Perfil atualizado com sucesso!");
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        setSelectedFile(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(compressedFile);
        setFormData({ ...formData, avatar_url: "" });
      } catch (error) {
        toast.error("Erro ao processar imagem");
      }
    }
  };

  const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'open-peeps', 'personas', 'pixel-art'];

  const generateRandomAvatar = () => {
    const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const seed = `${formData.name || 'user'}-${Date.now()}`;
    const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=256`;
    setPreviewUrl(url);
    setSelectedFile(null);
    setFormData({ ...formData, avatar_url: url });
    toast.success('Avatar gerado!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display selection:bg-primary/30 pb-[env(safe-area-inset-bottom)]">

      {/* Top Navigation Bar exactly matching design */}
      <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <div
          onClick={() => navigate(-1)}
          className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors cursor-pointer organic-press"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Configurações</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">

        {/* Profile Section */}
        <div className="flex p-6 justify-center">
          <div className="flex w-full flex-col gap-6 items-center">
            <div className="flex gap-4 flex-col items-center">

              <div className="relative group/avatar cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 ring-4 ring-primary/20 bg-slate-200 dark:bg-surface-dark transition-transform organic-press"
                  style={{ backgroundImage: `url("${previewUrl || '/avatar.png'}")` }}
                >
                </div>
                {/* Verified Badge / Camera Icon */}
                <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-1.5 flex items-center justify-center border-4 border-background-light dark:border-background-dark shadow-md">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                </div>
                <input id="avatar-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight tracking-tight">
                  {formData.name || authUser?.name || 'Seu Nome'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-primary text-xs font-bold px-2.5 py-1 bg-primary/10 rounded-full uppercase tracking-wider cursor-pointer organic-press" onClick={generateRandomAvatar}>
                    Gerar Avatar 🎲
                  </span>
                  {authUser?.email && (
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">• {authUser.email}</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Settings Form Groups */}
        <form onSubmit={handleSubmit} className="px-4 space-y-6 max-w-2xl mx-auto">

          {/* Account Section */}
          <section>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 mb-3">Conta</h3>
            <div className="flex flex-col gap-px overflow-hidden rounded-2xl bg-primary/10 border border-primary/10">

              <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 group focus-within:bg-primary/5 transition-colors">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wider">Nome</p>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-slate-500 dark:text-slate-400 text-base focus:ring-0 focus:outline-none placeholder:text-slate-400"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 group focus-within:bg-primary/5 transition-colors">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">language</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="text-slate-900 dark:text-slate-100 text-sm font-bold uppercase tracking-wider">Idioma Nativo</p>
                    <select
                      value={formData.native_language}
                      onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-slate-500 dark:text-slate-400 text-base focus:ring-0 focus:outline-none appearance-none"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 shrink-0">unfold_more</span>
                </div>
              </div>

            </div>
          </section>

          {/* Details Section */}
          <section>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 mb-3">Detalhes</h3>
            <div className="flex flex-col gap-px overflow-hidden rounded-2xl bg-primary/10 border border-primary/10">

              <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 group focus-within:bg-primary/5 transition-colors">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-slate-100 text-base focus:ring-0 focus:outline-none placeholder:text-slate-400"
                      placeholder="Sua localização (ex: São Paulo, BR)"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 group focus-within:bg-primary/5 transition-colors">
                <div className="flex items-start gap-4 w-full">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">edit_note</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-slate-100 text-base focus:ring-0 focus:outline-none placeholder:text-slate-400 resize-none h-20"
                      placeholder="Escreva algo sobre você..."
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending || isUploading}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center gap-2 transition-all organic-press disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isPending || isUploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>

          {/* Logout Button */}
          <div className="pt-2 pb-8">
            <button
              type="button"
              onClick={logout}
              className="w-full py-4 rounded-xl bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral font-bold flex items-center justify-center gap-2 border border-accent-coral/20 transition-all organic-press"
            >
              <span className="material-symbols-outlined">logout</span>
              Sair da conta
            </button>
            <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-6 mb-4 font-medium uppercase tracking-widest">
              NativeTalk PWA • Produzido com amor
            </p>
          </div>

        </form>
      </main>
    </div>
  );
};

export default SettingsPage;

