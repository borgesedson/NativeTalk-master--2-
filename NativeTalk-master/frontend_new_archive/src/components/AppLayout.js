"use client";

import { motion } from "framer-motion";
import {
    MessageSquare,
    Users,
    Video,
    Settings,
    Bell,
    LogOut,
    Search,
    Plus,
    MoreVertical
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppLayout({ children, activeTab: initialTab }) {
    const { user, logout: authLogout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialTab || "chats");

    const logout = () => {
        authLogout();
        router.push("/login");
    };

    const sidebarItems = [
        { id: "chats", icon: <MessageSquare size={22} />, label: "Chats", href: "/dashboard" },
        { id: "connect", icon: <Search size={22} />, label: "Discover", href: "/connect" },
        { id: "groups", icon: <Users size={22} />, label: "Groups", href: "/groups" },
        { id: "calls", icon: <Video size={22} />, label: "Calls", href: "/calls" },
        { id: "notifications", icon: <Bell size={22} />, label: "Alerts", href: "/notifications" },
        { id: "settings", icon: <Settings size={22} />, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden font-inter">
            {/* Sidebar - Far Left */}
            <aside className="w-20 md:w-24 border-r border-white/5 flex flex-col items-center py-8 glass">
                <div className="w-10 h-10 primary-gradient rounded-xl mb-12 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-xl">N</span>
                </div>

                <nav className="flex flex-col gap-8 flex-grow">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setActiveTab(item.id)}
                            className={`p-3 rounded-2xl transition-all relative group ${activeTab === item.id
                                ? "bg-primary/10 text-primary"
                                : "text-white/40 hover:text-white/70"
                                }`}
                        >
                            {item.icon}
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                />
                            )}
                            {/* Tooltip */}
                            <span className="absolute left-full ml-4 px-2 py-1 bg-white text-[#0a0a0a] text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                <button
                    onClick={logout}
                    className="p-3 rounded-2xl text-white/40 hover:text-red-400 transition-all"
                >
                    <LogOut size={22} />
                </button>
            </aside>

            {/* Main Content Area - Full Width */}
            <main className="flex-grow flex shadow-2xl overflow-hidden">
                {children}
            </main>
        </div>
    );
}
