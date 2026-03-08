"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Languages, Video, Globe, Zap, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 primary-gradient rounded-lg flex items-center justify-center">
                            <Languages className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">NativeTalk</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
                    </div>
                    <Link
                        href="/login"
                        className="px-5 py-2 rounded-full primary-gradient text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow pt-32">
                <section className="max-w-7xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient leading-tight">
                            Speak your language,<br />understand theirs.
                        </h1>
                        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Break language barriers with real-time translation for chat and video calls.
                            The future of global communication is here.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-8 py-4 rounded-full primary-gradient text-white font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
                            >
                                Start for Free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#demo"
                                className="w-full sm:w-auto px-8 py-4 rounded-full glass text-white font-semibold hover:bg-white/5 transition-colors"
                            >
                                Watch Demo
                            </Link>
                        </div>
                    </motion.div>

                    {/* Feature Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 mb-20"
                    >
                        {[
                            {
                                icon: <Zap className="text-primary" />,
                                title: "Real-time Translation",
                                desc: "Instant translation for messages and video transcripts with DeepL precision."
                            },
                            {
                                icon: <Video className="text-primary" />,
                                title: "HD Video Calls",
                                desc: "Crystal clear video powered by GetStream, optimized for global connectivity."
                            },
                            {
                                icon: <Globe className="text-primary" />,
                                title: "100+ Languages",
                                desc: "Support for all major world languages with dialect-aware translation."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="glass-card p-8 text-left hover:border-primary/30 transition-colors"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/50 leading-relaxed text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 glass mt-20">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 grayscale brightness-200 opacity-50">
                        <Languages className="w-5 h-5" />
                        <span className="font-bold">NativeTalk</span>
                    </div>
                    <p className="text-white/30 text-sm">© 2026 NativeTalk. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
