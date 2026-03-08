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

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-[#0D2137] to-[#0A1A1F] font-display text-slate-100 antialiased overflow-hidden items-center justify-between p-8 sm:p-12">
      {/* Top Safe Area Spacer */}
      <div className="w-full pt-[max(2rem,env(safe-area-inset-top))]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center gap-8 w-full"
      >
        <div className="relative flex items-center justify-center">
          {/* Outer Pulse Effect */}
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl animate-pulse"></div>
          {/* Main Logo Box */}
          <div className="relative flex aspect-square w-32 h-32 items-center justify-center rounded-xl bg-primary shadow-2xl shadow-primary/40 border border-primary/50">
            <span className="material-symbols-outlined text-white text-[64px] font-light">
              public
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3 max-w-sm">
          <h1 className="text-white text-4xl font-bold tracking-tight text-center">
            NativeTalk
          </h1>
          <p className="text-primary/80 text-lg font-medium leading-relaxed text-center px-4">
            Fale na sua língua. <br />
            <span className="text-slate-300 font-normal">Seja entendido na dele.</span>
          </p>
        </div>
      </motion.div>

      {/* Bottom Action Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex flex-col w-full max-w-md items-center gap-4 pb-[env(safe-area-inset-bottom)] mb-8 z-10"
      >
        <button
          onClick={() => navigate('/login')}
          className="flex w-full min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-accent-coral hover:bg-accent-coral/90 text-white text-base font-bold leading-normal tracking-wide transition-all shadow-lg shadow-accent-coral/20 active:scale-[0.98]"
        >
          <span>Entrar</span>
        </button>
        <button
          onClick={() => navigate('/register')}
          className="flex w-full min-w-[200px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white/10 hover:bg-white/20 text-white text-base font-bold leading-normal tracking-wide transition-all active:scale-[0.98]"
        >
          <span>Criar Conta</span>
        </button>

        <div className="flex items-center gap-2 opacity-40 mt-4">
          <div className="h-[1px] w-8 bg-slate-100"></div>
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-slate-100">Premium Experience</p>
          <div className="h-[1px] w-8 bg-slate-100"></div>
        </div>
      </motion.div>

      {/* Background Decorative Elements */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
};

export default LandingPage;