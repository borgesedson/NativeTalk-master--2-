import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if user already dismissed the prompt
        const dismissed = localStorage.getItem('installPromptDismissed');
        const dismissedTime = localStorage.getItem('installPromptDismissedTime');

        // Show again after 7 days
        if (dismissed && dismissedTime) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);

            // Show the prompt after 30 seconds (non-intrusive)
            setTimeout(() => {
                setShowPrompt(true);
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', 'true');
        localStorage.setItem('installPromptDismissedTime', Date.now().toString());
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
            <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary to-secondary p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Install NativeTalk</h3>
                                <p className="text-white/90 text-sm">Get the full app experience</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
                            aria-label="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Works offline - chat anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Faster performance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Push notifications for messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Quick access from home screen</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleInstall}
                            className="btn btn-primary flex-1 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Install App
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="btn btn-ghost"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
