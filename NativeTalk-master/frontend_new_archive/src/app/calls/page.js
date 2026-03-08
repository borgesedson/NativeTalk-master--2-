"use client";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Video } from "lucide-react";

export default function CallsPage() {
    return (
        <AppLayout activeTab="calls">
            <div className="flex-grow flex items-center justify-center bg-[#121214]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Video className="text-primary" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Calls</h1>
                    <p className="text-white/40">Video and Audio calls coming soon.</p>
                </div>
            </div>
        </AppLayout>
    );
}
