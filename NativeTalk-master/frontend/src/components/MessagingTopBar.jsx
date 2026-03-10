import { Search, Edit3 } from 'lucide-react';
import Logo from './Logo';

const MessagingTopBar = ({ onSearchClick }) => {
    return (
        <header className="flex items-center justify-between px-6 py-5 border-b border-primary/20 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-3 organic-press">
                <div className="flex items-center justify-center w-8 h-8 bg-[#1C1929] border border-white/10 rounded-[8px] shadow-lg shadow-[#704FF7]/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#704FF7]/20 to-transparent"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        <path d="M4 14C4 16.2091 5.79086 18 8 18H9V21L13.5 18H16C18.2091 18 20 16.2091 20 14V8C20 5.79086 18.2091 4 16 4H8C5.79086 4 4 5.79086 4 8V14Z" stroke="url(#chat-topbar)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 11H16M10 7H14" stroke="url(#chat-topbar)" strokeWidth="2.5" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="chat-topbar" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#A688FA" />
                                <stop offset="1" stopColor="#704FF7" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">NativeTalk</h1>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onSearchClick}
                    className="p-2 rounded-full hover:bg-primary/20 text-slate-600 dark:text-slate-300 transition-colors organic-press relative"
                >
                    <span className="material-symbols-outlined">search</span>
                </button>
                <button
                    className="p-2 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity organic-press"
                >
                    <span className="material-symbols-outlined">chat_add_on</span>
                </button>
            </div>
        </header>
    );
};

export default MessagingTopBar;
