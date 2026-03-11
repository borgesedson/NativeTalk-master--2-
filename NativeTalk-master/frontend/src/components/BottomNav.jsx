import { useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: 'chat', label: 'Conversas', path: '/dashboard', hasNotification: true },
        { icon: 'group', label: 'Contatos', path: '/contacts' },
        { icon: 'translate', label: 'Intérprete', path: '/interpreter' },
        { icon: 'notifications', label: 'Notificações', path: '/notifications' },
        { icon: 'settings', label: 'Ajustes', path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/messages';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-3 bg-background-light/95 dark:bg-background-dark/95 border-t border-primary/20 backdrop-blur-lg pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <div className="flex items-center justify-around w-full max-w-md mx-auto">
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1 group organic-press transition-colors`}
                        >
                            <div className="relative">
                                <span
                                    className={`material-symbols-outlined text-2xl transition-colors ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary'}`}
                                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.icon}
                                </span>
                                {item.hasNotification && (
                                    <div className="absolute -top-1 -right-1 size-2 bg-primary rounded-full"></div>
                                )}
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider ${active ? 'font-bold text-primary' : 'font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary'}`}>
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
