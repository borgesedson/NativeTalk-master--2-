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
    <div className="font-display bg-[#0F0C16] text-slate-100 min-h-screen relative flex flex-col items-center justify-center overflow-x-hidden p-6">
      {/* Top Background Gradient Effect */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[50%] bg-[#704FF7]/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Language / Globe top right button */}
      <div className="absolute top-6 right-6">
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-xl">language</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mb-10 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-[#1C1929] border border-white/10 rounded-xl shadow-lg shadow-[#704FF7]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#704FF7]/20 to-transparent"></div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-login)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 11H16M10 7H14" stroke="url(#chat-login)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="chat-login" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A688FA" />
                  <stop offset="1" stopColor="#704FF7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">NativeTalk</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold text-white mb-2">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-[15px]">Entre para continuar sua jornada</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-300 ml-1">E-mail</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-[52px] pl-[42px] pr-4 rounded-xl bg-[#1C1929] border border-white/5 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#704FF7] outline-none transition-all text-[15px]"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[13px] font-medium text-slate-300">Senha</label>
                <button type="button" className="text-[13px] font-medium text-[#704FF7] hover:text-white transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-[52px] pl-[42px] pr-12 rounded-xl bg-[#1C1929] border border-white/5 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-[#704FF7] outline-none transition-all text-[15px] tracking-widest placeholder:tracking-normal"
                  placeholder="••••••••"
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
              className="w-full h-[52px] mt-6 flex items-center justify-center bg-[#704FF7] hover:bg-[#5E3EE3] text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(112,79,247,0.2)] disabled:opacity-50 text-[16px]"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar"
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

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full text-center mt-8 pb-[env(safe-area-inset-bottom)]"
        >
          <p className="text-slate-400 text-[14px]">
            Não tem conta?
            <Link to="/register" className="text-[#704FF7] font-semibold hover:text-white transition-colors ml-1.5">
              Cadastrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

