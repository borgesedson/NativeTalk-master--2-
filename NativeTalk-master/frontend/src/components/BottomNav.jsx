import { useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: 'chat', label: 'Conversas', path: '/dashboard' },
        { icon: 'group', label: 'Contatos', path: '/contacts' },
        { icon: 'groups', label: 'Grupos', path: '/groups' },
        { icon: 'notifications', label: 'Avisos', path: '/notifications', hasNotification: true },
        { icon: 'settings', label: 'Ajustes', path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/messages';
        return location.pathname.startsWith(path);
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-white/10 backdrop-blur-xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
            <div className="flex items-center justify-around w-full h-16">
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${active ? 'text-primary' : 'text-slate-500'}`}
                        >
                            <div className="relative">
                                <span
                                    className={`material-symbols-outlined text-[24px] transition-colors`}
                                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.icon}
                                </span>
                                {item.hasNotification && (
                                    <div className="absolute top-0 -right-1 size-2 bg-[#F4845F] rounded-full border border-slate-900"></div>
                                )}
                            </div>
                            <span className={`text-[9px] font-semibold uppercase tracking-tight leading-none ${active ? 'text-primary' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-t-full"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
