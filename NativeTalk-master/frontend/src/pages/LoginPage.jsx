import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { login as apiLogin } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Por favor, forneça e-mail e senha.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiLogin(formData.email, formData.password);
      authLogin(response.user, response.token);
      toast.success(`Bem-vindo, ${response.user.name || 'Usuário'}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || "Falha na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen relative overflow-x-hidden">
      {/* Back Button with Safe Area Support */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-4 sm:left-6 z-50 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5 backdrop-blur-md"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      {/* Floating Decoration Emojis */}
      <div className="absolute pointer-events-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-0 text-4xl top-[10%] left-[10%] opacity-40">🇧🇷</div>
      <div className="absolute pointer-events-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-0 text-3xl top-[25%] right-[15%] opacity-30">🇺🇸</div>
      <div className="absolute pointer-events-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-0 text-4xl bottom-[30%] left-[5%] opacity-20">🇯🇵</div>
      <div className="absolute pointer-events-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-0 text-3xl bottom-[15%] right-[10%] opacity-40">🇫🇷</div>
      <div className="absolute pointer-events-none filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-0 text-4xl top-[50%] right-[5%] opacity-10">🇩🇪</div>

      {/* Background Gradient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-coral/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-12 max-w-md mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/')}
          className="w-full text-center mt-8 cursor-pointer"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl">globe</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">NativeTalk</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Language Exchange</p>
        </motion.div>

        {/* Login Form Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Bem-vindo de volta</h2>
            <p className="text-slate-400">Entre para continuar sua jornada</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.03] backdrop-blur-[12px] border border-white/10 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-4 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/[0.03] backdrop-blur-[12px] border border-white/10 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pr-2">
              <a href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 flex items-center justify-center bg-accent-coral hover:brightness-110 text-white font-bold rounded-2xl shadow-xl shadow-accent-coral/20 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar"
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

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full text-center mt-8 pb-[env(safe-area-inset-bottom)]"
        >
          <p className="text-slate-400 text-sm">
            Não tem conta?
            <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4 ml-1">Cadastrar</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
