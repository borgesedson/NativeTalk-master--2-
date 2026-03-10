import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { register, verifyOTP } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await register(
        signupData.fullName,
        signupData.email,
        signupData.password,
        'pt' // Default native language
      );

      if (!response.token) {
        setIsOtpSent(true);
        toast.success("Identity registrada! Verifique seu e-mail para o código de verificação.");
      } else {
        authLogin(response.user, response.token);
        toast.success("Identity estabelecida! Abrindo protocolo de boas-vindas...");
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error(error.message || "Falha no registro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await verifyOTP(signupData.email, otpCode);
      authLogin(response.user, response.token);
      toast.success("Identity verificada! Iniciando...");
      navigate('/onboarding');
    } catch (error) {
      toast.error(error.message || "Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-display bg-[#0F0C16] text-slate-100 min-h-screen relative flex flex-col items-center justify-center overflow-x-hidden p-6">
      {/* Top Background Gradient Effect */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[50%] bg-[#704FF7]/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 w-full px-6 md:px-12 py-6 flex items-center justify-between z-50">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="flex items-center justify-center w-10 h-10 bg-[#1C1929] border border-white/10 rounded-xl shadow-lg shadow-[#704FF7]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#704FF7]/20 to-transparent"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-signup)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 11H16M10 7H14" stroke="url(#chat-signup)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="chat-signup" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A688FA" />
                  <stop offset="1" stopColor="#704FF7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">NativeTalk</h1>
        </div>

        <button className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/5 border border-white/10 text-[#A688FA] font-medium text-[13px] hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[18px]">public</span>
          PT-BR
        </button>
      </div>

      {/* Divider beneath navbar */}
      <div className="absolute top-[88px] left-0 w-full border-b border-white/5"></div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center mt-12 mb-8">

        {/* Flags Cluster */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center relative isolation-auto">
            {['BR', 'US', 'JP', 'FR', 'DE'].map((countryCode, index) => (
              <div
                key={index}
                className="w-[52px] h-[52px] rounded-full border border-white/5 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] -ml-[14px] first:ml-0 overflow-hidden bg-[#1A1827] flex items-center justify-center"
                style={{ zIndex: 10 - index }}
              >
                <img
                  src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
                  alt={`${countryCode} flag`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center w-full mb-8"
        >
          {isOtpSent ? (
            <>
              <h2 className="text-[28px] font-bold text-white mb-2">Verificar Email</h2>
              <p className="text-[#A688FA] text-[15px] font-semibold">Insira o código enviado ao seu e-mail</p>
            </>
          ) : (
            <>
              <h2 className="text-[28px] font-bold text-white mb-2">Criar Conta</h2>
              <p className="text-[#A688FA] text-[15px] font-semibold">Junte-se à nossa comunidade global</p>
            </>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!isOtpSent ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <form onSubmit={handleSignup} className="space-y-5">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-300 ml-1">Nome</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">person</span>
                    <input
                      type="text"
                      className="w-full h-[52px] pl-[42px] pr-4 rounded-xl bg-[#1C1929] border border-white/5 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#704FF7] outline-none transition-all text-[15px]"
                      placeholder="Digite seu nome"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-300 ml-1">E-mail</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">mail</span>
                    <input
                      type="email"
                      className="w-full h-[52px] pl-[42px] pr-4 rounded-xl bg-[#1C1929] border border-white/5 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#704FF7] outline-none transition-all text-[15px]"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-slate-300 ml-1">Senha</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full h-[52px] pl-[42px] pr-12 rounded-xl bg-[#1C1929] border border-white/5 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#704FF7] outline-none transition-all text-[15px]"
                      placeholder="Crie uma senha forte"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-500 hover:text-slate-300 flex items-center justify-center p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] mt-6 flex items-center justify-center gap-2 bg-[#704FF7] hover:bg-[#5E3EE3] text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(112,79,247,0.2)] disabled:opacity-50 text-[16px]"
                >
                  {isLoading ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Criar Conta
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider & Social Login */}
              <div className="relative py-6 flex items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[13px] font-medium">ou continue com</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button className="w-full h-[52px] flex items-center justify-center gap-3 bg-[#1C1929] hover:bg-[#252236] text-white font-medium rounded-xl border border-white/5 transition-all active:scale-[0.98] text-[15px]">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-[18px] h-[18px]" />
                Google
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-8"
            >
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">gpp_good</span>
                    <input
                      type="text"
                      placeholder="123456"
                      className="w-full h-[60px] pl-[42px] pr-4 bg-[#1C1929] border border-[#704FF7]/30 rounded-xl text-center tracking-[0.5em] text-white focus:outline-none focus:ring-1 focus:ring-[#704FF7] transition-all font-black text-2xl placeholder:opacity-40"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-[52px] flex items-center justify-center bg-[#704FF7] hover:bg-[#5E3EE3] text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(112,79,247,0.2)] transition-all transform active:scale-[0.98] disabled:opacity-50 text-[16px]"
                  type="submit"
                >
                  {isLoading ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    "Verificar Código"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full text-center mt-8 space-y-6"
        >
          <p className="text-slate-400 text-[14px]">
            Já tem uma conta?
            <Link to="/login" className="text-[#A688FA] font-semibold hover:text-white transition-colors ml-1.5">Fazer Login</Link>
          </p>

          <p className="text-[11px] text-slate-500 max-w-[320px] mx-auto leading-relaxed">
            Ao se inscrever, você concorda com nossos <br />
            <Link to="#" className="underline hover:text-slate-400 transition-colors">Termos de Serviço</Link> e <Link to="#" className="underline hover:text-slate-400 transition-colors">Política de Privacidade</Link>.
          </p>
        </motion.div>
      </div>

      {/* Global Footer */}
      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-[10px] text-slate-600 font-medium">© 2024 NativeTalk. Connect, Learn, Speak.</p>
      </div>
    </div>
  );
};

export default SignUpPage;
