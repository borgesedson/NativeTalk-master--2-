import { useNavigate } from "react-router";

const OnboardingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="font-display bg-gradient-to-b from-[#112122] to-background-dark text-slate-100 min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Top App Bar / Header */}
      <div className="flex items-center p-6 justify-between pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))]">
        <button className="text-slate-400 hover:text-white transition-colors" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <button className="text-slate-400 hover:text-white transition-colors" onClick={() => navigate('/profile-setup')}>
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      {/* Illustration Section */}
      <div className="flex flex-col items-center justify-center grow px-6">
        <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
          {/* Abstract Globe Background */}
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="relative flex items-center justify-between w-full z-10">
            {/* Phone Left (Portuguese) */}
            <div className="w-1/3 aspect-[9/19] bg-slate-800 rounded-2xl border-2 border-slate-700 p-2 shadow-2xl transform -rotate-6">
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-start p-2 gap-2 overflow-hidden">
                <div className="w-4 h-1 bg-slate-700 rounded-full self-center mb-1"></div>
                <div className="text-[10px] text-primary font-bold">PT-BR 🇧🇷</div>
                <div className="bg-primary/20 p-2 rounded-lg text-[10px] text-slate-200 leading-tight">
                  Oi, tudo bem?
                </div>
              </div>
            </div>

            {/* Connecting Line & Globe */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-0.5 bg-gradient-to-r from-primary to-accent-coral shadow-[0_0_15px_rgba(12,115,121,0.5)]"></div>
                <div className="absolute flex items-center justify-center bg-background-dark border-2 border-primary/50 w-12 h-12 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-primary text-2xl">public</span>
                </div>
              </div>
            </div>

            {/* Phone Right (Japanese) */}
            <div className="w-1/3 aspect-[9/19] bg-slate-800 rounded-2xl border-2 border-slate-700 p-2 shadow-2xl transform rotate-6">
              <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-start p-2 gap-2 overflow-hidden">
                <div className="w-4 h-1 bg-slate-700 rounded-full self-center mb-1"></div>
                <div className="text-[10px] text-accent-coral font-bold">JA-JP 🇯🇵</div>
                <div className="bg-accent-coral/20 p-2 rounded-lg text-[10px] text-slate-200 leading-tight">
                  こんにちは！元気ですよ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col items-center">
        {/* Headlines */}
        <div className="space-y-1 mb-8">
          <h1 className="text-slate-100 tracking-tight text-3xl font-bold leading-tight text-center">
            Fale na sua língua.
          </h1>
          <h2 className="text-accent-coral tracking-tight text-3xl font-bold leading-tight text-center">
            Seja entendido na dele.
          </h2>
        </div>

        {/* Pagination Dots */}
        <div className="flex flex-row items-center justify-center gap-3 mb-10">
          <div className="h-2 w-2 rounded-full bg-accent-coral shadow-[0_0_8px_rgba(255,127,110,0.6)]"></div>
          <div className="h-2 w-2 rounded-full bg-slate-700"></div>
          <div className="h-2 w-2 rounded-full bg-slate-700"></div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/profile-setup')}
          className="w-full max-w-xs bg-accent-coral hover:bg-accent-coral/90 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-accent-coral/20"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
