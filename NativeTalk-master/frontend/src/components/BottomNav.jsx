import { useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: 'chat', label: 'Conversas', path: '/dashboard', hasNotification: true },
        { icon: 'group', label: 'Contatos', path: '/contacts' },
        { icon: 'notifications', label: 'Notificações', path: '/notifications' },
        { icon: 'settings', label: 'Ajustes', path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/messages';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="md:hidden fixed bottom-1 left-4 right-4 z-50 flex items-center justify-around bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl pb-[env(safe-area-inset-bottom)] h-20 px-2 transition-all duration-300">
            <div className="flex items-center justify-around w-full">
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-1.5 organic-press min-w-[72px] min-h-[64px] rounded-xl transition-all ${active ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                        >
                            <div className="relative">
                                <span
                                    className={`material-symbols-outlined text-[28px] transition-colors ${active ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`}
                                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.icon}
                                </span>
                                {item.hasNotification && (
                                    <div className="absolute top-0 -right-1 size-2.5 bg-[#F4845F] rounded-full border-2 border-slate-900"></div>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${active ? 'text-primary' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
