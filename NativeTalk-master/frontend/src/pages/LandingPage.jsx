import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuthUser from '../hooks/useAuthUser';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();

  useEffect(() => {
    if (authUser) {
      navigate('/dashboard');
    }
  }, [authUser, navigate]);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 2, -2, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const floatingVariantsReverse = {
    animate: {
      y: [0, 15, 0],
      rotate: [0, -2, 2, 0],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b1213] text-slate-100 font-sans selection:bg-[#0D7377]/30 overflow-x-hidden">

      {/* 🌟 NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0b1213]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-[#1C1929] border border-white/10 rounded-[8px] shadow-lg shadow-[#704FF7]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#704FF7]/20 to-transparent"></div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-landing)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 11H16M10 7H14" stroke="url(#chat-landing)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="chat-landing" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A688FA" />
                  <stop offset="1" stopColor="#704FF7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NativeTalk</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Como Funciona</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="hidden sm:block text-[14px] font-medium text-slate-300 hover:text-white transition-colors">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="bg-[#F4845F] hover:bg-[#ff9f80] text-white px-5 py-2 rounded-full text-[14px] font-bold transition-all shadow-lg shadow-[#F4845F]/20 active:scale-95">
            Começar
          </button>
        </div>
      </nav>

      {/* 🌟 HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-[1400px] mx-auto overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F4845F]/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0D7377]/10 rounded-full blur-[120px] -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center justify-between gap-16 relative"
        >
          {/* Hero Text Content */}
          <div className="flex-1 flex flex-col items-start gap-8 z-10 max-w-2xl">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#F4845F] text-[13px] font-bold tracking-wide uppercase">
              <span className="material-symbols-outlined text-[16px]">translate</span>
              Tradução em Tempo Real
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Fale na sua língua. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7377] to-[#40E0D0]">
                O mundo entende.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
              Conecte-se globalmente sem barreiras. Chamadas de vídeo, áudio e chat de texto traduzidos instantaneamente para o seu idioma nativo.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <button onClick={() => navigate('/register')} className="bg-[#F4845F] hover:bg-[#ff9f80] text-white h-14 px-8 rounded-full text-[16px] font-bold transition-all shadow-xl shadow-[#F4845F]/20 active:scale-95 flex items-center justify-center gap-2">
                Criar Conta Gratuita <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 px-8 rounded-full text-[16px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">play_circle</span> Ver Demonstração
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-4 mt-6">
              <div className="flex -space-x-3">
                {['men/32', 'women/44', 'men/85', 'women/91'].map((img, i) => (
                  <img key={i} src={`https://randomuser.me/api/portraits/${img}.jpg`} className="size-10 rounded-full border-2 border-[#0b1213]" alt="User avatar" />
                ))}
              </div>
              <div className="text-[13px] text-slate-400 font-medium">
                Junte-se a <strong className="text-white">+500.000</strong> usuários ativos.
              </div>
            </motion.div>
          </div>

          {/* Hero Visuals (Floating Chat UI Mockup) */}
          <motion.div variants={itemVariants} className="flex-1 relative w-full h-[500px] flex items-center justify-center">

            {/* Central UI Mockup */}
            <div className="absolute w-[320px] h-[400px] bg-[#1E2A3A]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-4 flex flex-col z-20">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" className="size-10 rounded-full" alt="Yuki" />
                <div>
                  <h3 className="text-white font-bold text-[14px]">Yuki Takahashi</h3>
                  <p className="text-[#0D7377] text-[11px] font-medium flex items-center gap-1">🇯🇵 Japão</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-4 py-4">
                {/* Received msg */}
                <div className="self-start max-w-[85%] bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-sm">
                  <p className="text-slate-400 text-[11px] mb-1 italic">こんにちは、元気ですか？</p>
                  <p className="text-white text-[14px] font-medium">Olá, como você está?</p>
                </div>
                {/* Sent msg */}
                <div className="self-end max-w-[85%] bg-gradient-to-br from-[#0D7377] to-[#0a5a5e] p-3 rounded-2xl rounded-tr-sm shadow-lg shadow-[#0D7377]/20">
                  <p className="text-white text-[14px] font-medium">Estou bem! Ansioso pelo projeto.</p>
                </div>
                {/* Received msg 2 */}
                <div className="self-start max-w-[85%] bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-sm relative">
                  <div className="absolute -bottom-3 -right-2 bg-[#F4845F] text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-[#1E2A3A] flex items-center gap-1 shadow-md">
                    <span className="material-symbols-outlined text-[12px]">favorite</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-1 italic">私もです！始めましょう！</p>
                  <p className="text-white text-[14px] font-medium">Eu também! Vamos começar!</p>
                </div>
              </div>
              {/* Input Bar */}
              <div className="w-full bg-white/5 border border-white/5 rounded-full h-12 flex items-center px-4 gap-2">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">mic</span>
                <span className="text-slate-500 text-[13px] flex-1">Digite em Português...</span>
                <div className="size-8 rounded-full bg-[#F4845F] flex items-center justify-center"><span className="material-symbols-outlined text-white text-[16px] ml-0.5">send</span></div>
              </div>
            </div>

            {/* Floating Elements (Background) */}
            <motion.div variants={floatingVariants} className="absolute -top-4 right-10 z-30">
              <div className="bg-white text-[#0b1213] px-4 py-2 rounded-2xl rounded-bl-sm font-bold shadow-xl border border-white/10 text-sm">
                "Let's grab coffee!" ☕
              </div>
            </motion.div>

            <motion.div variants={floatingVariantsReverse} className="absolute top-1/2 -left-12 z-30">
              <div className="bg-[#40E0D0] text-[#0b1213] px-3 py-2 rounded-2xl rounded-br-sm font-bold shadow-xl border border-black/10 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">volume_up</span> ¿Vamos tomar un café?
              </div>
            </motion.div>

            <motion.div variants={floatingVariants} className="absolute -bottom-8 right-20 z-30">
              <div className="size-16 bg-[#F4845F] rounded-full flex items-center justify-center shadow-lg shadow-[#F4845F]/30 border-4 border-[#0b1213] text-2xl">
                🔥
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 🌟 HIGHLIGHT FEATURES (BENTO GRID) */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Expressão sem limites</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Nossas ferramentas garantem que sua mensagem seja recebida na íntegra, com toda a emoção, em qualquer idioma.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1 */}
          <div className="md:col-span-2 bg-gradient-to-br from-[#1E2A3A] to-[#111D2E] rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D7377]/10 rounded-full blur-[60px] group-hover:bg-[#0D7377]/20 transition-colors"></div>
            <div className="flex flex-col h-full relative z-10">
              <div className="size-14 rounded-2xl bg-[#0D7377]/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#40E0D0] text-[28px]">g_translate</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Chat Traduzido Instantaneamente</h3>
              <p className="text-slate-400 text-[15px] leading-relaxed max-w-md">Escreva na ponta dos seus dedos. Nosso motor alimentado por IA (Argos VPS) traduz suas mensagens em tempo real com contexto gramatical preciso.</p>

              <div className="mt-8 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 self-start shadow-xl">
                <span className="text-2xl">🇧🇷</span>
                <span className="material-symbols-outlined text-slate-500">sync_alt</span>
                <span className="text-2xl">🇯🇵</span>
                <span className="material-symbols-outlined text-slate-500">sync_alt</span>
                <span className="text-2xl">🇰🇷</span>
                <span className="material-symbols-outlined text-slate-500">sync_alt</span>
                <span className="text-2xl">🇺🇸</span>
                <span className="text-sm font-bold text-slate-300 ml-2">+100 Idiomas</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="bg-gradient-to-br from-[#F4845F]/10 to-transparent border border-[#F4845F]/20 rounded-3xl p-8 flex flex-col">
            <div className="size-14 rounded-2xl bg-[#F4845F]/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[#F4845F] text-[28px]">graphic_eq</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Áudio STT Inteligente</h3>
            <p className="text-slate-400 text-[14px] leading-relaxed mb-6">Mande áudios como sempre fez. Nós os transcrevemos nativamente (Whisper STT) e os enviamos já traduzidos em texto e voz sintetizada.</p>
            <div className="mt-auto h-12 w-full bg-white/5 rounded-full flex items-center px-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F4845F]/20 to-transparent animate-[shimmer_2s_infinite]"></div>
              <div className="flex-1 flex gap-1 h-4 items-center justify-center">
                {[1, 3, 2, 5, 3, 1, 4, 5, 2, 1].map((h, i) => (
                  <div key={i} className="w-1.5 bg-[#F4845F] rounded-full" style={{ height: `${h * 4}px` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Bento Card 3 */}
          <div className="bg-[#1E2A3A] border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-slate-300 text-[28px]">videocam</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Calls Globais</h3>
              <p className="text-slate-400 text-[14px]">Videochamadas peer-to-peer de alta qualidade, preparadas para legendagem em tempo real em breve.</p>
            </div>
          </div>

          {/* Bento Card 4 */}
          <div className="md:col-span-2 bg-[#0D2137] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
            <div className="flex-1">
              <div className="inline-flex px-3 py-1 rounded-full bg-success/20 text-success text-[12px] font-bold mb-4 border border-success/30">
                Privacidade Absolute
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Sua voz, suas regras.</h3>
              <p className="text-slate-400 text-[15px] max-w-sm">Criptografia em trânsito com isolamento de metadados via Supabase + segurança baseada em tokens.</p>
            </div>
            {/* UI Graphic */}
            <div className="w-[200px] h-[120px] bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-success/20 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-success text-[16px]">lock</span></div>
                <div className="flex-1">
                  <div className="h-2 w-full bg-white/10 rounded-full mb-1"></div>
                  <div className="h-2 w-2/3 bg-white/10 rounded-full"></div>
                </div>
              </div>
              <div className="h-8 bg-white/5 rounded-lg border border-white/5 flex items-center px-3 gap-2">
                <div className="size-2 bg-success rounded-full"></div>
                <span className="text-[10px] text-slate-400">Cache Seguro Local</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 FOOTER CTA */}
      <section className="py-24 px-6 relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D7377]/20 to-transparent -z-10"></div>
        <div className="text-center max-w-3xl z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Quebre a barreira do idioma hoje.</h2>
          <p className="text-xl text-slate-400 mb-10">Crie seu perfil, escolha seu idioma nativo e comece a conversar com o mundo inteiro como se estivessem na mesma sala.</p>
          <button onClick={() => navigate('/register')} className="bg-[#F4845F] hover:bg-[#ff9f80] text-white h-16 px-12 rounded-full text-lg font-bold transition-all shadow-2xl shadow-[#F4845F]/30 active:scale-95 inline-flex items-center gap-3">
            Start NativeTalk Free <span className="material-symbols-outlined">rocket_launch</span>
          </button>
        </div>
      </section>

      {/* 🌟 FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 bg-[#0b1213]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-[#1C1929] border border-white/10 rounded-[6px] shadow-lg shadow-[#704FF7]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#704FF7]/20 to-transparent"></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-footer)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 11H16M10 7H14" stroke="url(#chat-footer)" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="chat-footer" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#A688FA" />
                    <stop offset="1" stopColor="#704FF7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-[15px] font-bold text-white">NativeTalk</span>
          </div>

          <div className="flex gap-6 text-[13px] text-slate-500 font-medium tracking-wide">
            <a href="#" className="hover:text-white transition-colors">Termos & Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">API & Docs</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>

          <p className="text-[12px] text-slate-600">© 2026 NativeTalk Inc. Inspired globally.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;