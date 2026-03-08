import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Verificar se o usuário já recusou antes
      const hasDeclined = localStorage.getItem("pwa-install-declined");
      if (!hasDeclined) {
        // Mostrar após 3 segundos de uso
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-declined", "true");
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-2xl">
          <div className="card-body p-4">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 btn btn-ghost btn-circle btn-sm"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 pr-6">
              <div className="bg-white/20 p-3 rounded-xl">
                <Smartphone className="w-8 h-8" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Install NativeTalk
                </h3>
                <p className="text-sm opacity-90 mb-3">
                  Add to your home screen for a better experience! Works offline and loads faster.
                </p>

                <div className="flex gap-2">
                  <motion.button
                    onClick={handleInstall}
                    className="btn btn-sm bg-white text-primary hover:bg-white/90 flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </motion.button>
                  
                  <motion.button
                    onClick={handleDismiss}
                    className="btn btn-sm btn-ghost text-white hover:bg-white/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Not now
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
