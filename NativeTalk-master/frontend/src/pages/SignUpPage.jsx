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
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen relative overflow-x-hidden flex items-center justify-center p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+1rem))]">
      {/* Back Button with Safe Area Support */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-4 sm:left-6 z-50 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 backdrop-blur-md"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10 py-8">
        {/* Header / Logo Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8 w-full cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">public</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">NativeTalk</h1>
          </div>

          {/* Floating Decoration row from the design */}
          <div className="flex gap-4 mb-8">
            <span className="text-2xl bg-slate-800/50 p-2 rounded-full border border-slate-700">🇧🇷</span>
            <span className="text-2xl bg-slate-800/50 p-2 rounded-full border border-slate-700">🇺🇸</span>
            <span className="text-2xl bg-slate-800/50 p-2 rounded-full border border-slate-700">🇯🇵</span>
            <span className="text-2xl bg-slate-800/50 p-2 rounded-full border border-slate-700">🇫🇷</span>
            <span className="text-2xl bg-slate-800/50 p-2 rounded-full border border-slate-700">🇩🇪</span>
          </div>

          <div className="text-center">
            {isOtpSent ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Verificar Email</h2>
                <p className="text-slate-400">Insira o código enviado ao seu e-mail</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Criar Conta</h2>
                <p className="text-slate-400">Junte-se à nossa comunidade global</p>
              </>
            )}
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!isOtpSent ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-5"
            >
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-4 bg-surface-dark border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Seu nome"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">mail</span>
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-11 pr-4 py-4 bg-surface-dark border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-medium text-slate-300">Senha</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="block w-full pl-11 pr-12 py-4 bg-surface-dark border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent-coral hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] mt-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    "Criar Conta"
                  )}
                </button>
              </form>

              {/* Divider & Social Login */}
              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-slate-700/50"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-sm uppercase tracking-wider font-medium">ou</span>
                <div className="flex-grow border-t border-slate-700/50"></div>
              </div>

              <button className="w-full flex items-center justify-center gap-3 bg-surface-dark hover:bg-slate-700/50 text-white font-medium py-4 rounded-xl border border-slate-700 transition-all transform active:scale-[0.98]">
                <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                </div>
                Continuar com Google
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
              <form onSubmit={handleVerifyOTP} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">gpp_good</span>
                    <input
                      type="text"
                      placeholder="123456"
                      className="block w-full py-6 pl-12 pr-4 bg-surface-dark border border-slate-700/50 rounded-xl text-center tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all font-black text-2xl placeholder:opacity-0"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50"
                  type="submit"
                >
                  {isLoading ? (
                    <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    "Verificar Código"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full text-center mt-10 pb-[env(safe-area-inset-bottom)]"
        >
          <p className="text-slate-400">
            Já tem uma conta?
            <Link to="/login" className="text-primary font-bold hover:underline ml-1 transition-all">Entrar</Link>
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default SignUpPage;
