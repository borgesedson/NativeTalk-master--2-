"use client";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
    return (
        <AppLayout activeTab="notifications">
            <div className="flex-grow flex items-center justify-center bg-[#121214]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Bell className="text-primary" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
                    <p className="text-white/40">Stay updated with your latest alerts.</p>
                </div>
            </div>
        </AppLayout>
    );
}
