import { Search, Edit3 } from 'lucide-react';
import Logo from './Logo';

const MessagingTopBar = ({ onSearchClick }) => {
    return (
        <header className="flex items-center justify-between px-6 py-5 border-b border-primary/20 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-3 organic-press">
                <div className="size-8 bg-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">translate</span>
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
