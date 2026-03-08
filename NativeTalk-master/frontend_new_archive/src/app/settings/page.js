"use client";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <AppLayout activeTab="settings">
            <div className="flex-grow flex items-center justify-center bg-[#121214]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Settings className="text-primary" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-white/40">Customize your NativeTalk experience.</p>
                </div>
            </div>
        </AppLayout>
    );
}
