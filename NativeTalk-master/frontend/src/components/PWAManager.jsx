import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { X, RefreshCw, Download, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PWAManager = () => {
  const { t } = useTranslation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  // Gerenciar atualizações do Service Worker
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado');
    },
    onRegisterError(error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    },
  });

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isInstalled]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdate = () => updateServiceWorker(true);

  return (
    <>
      {/* 🟢 Refined Native Bottom Sheet for PWA Installation */}
      {showInstallPrompt && !isInstalled && (
        <>
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-background-dark/40 backdrop-blur-sm z-[9990] animate-in fade-in duration-300"
            onClick={() => setShowInstallPrompt(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] transform fluid-enter">
            <div className="bg-surface-dark rounded-[2rem] p-6 shadow-2xl border border-primary/20 w-full max-w-md mx-auto relative overflow-hidden flex flex-col items-center">
              {/* iOS style drag indicator */}
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-6" />

              <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
                <Download size={32} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 text-center">
                Get the Full App Experience
              </h3>
              <p className="text-slate-400 text-center mb-6 text-sm">
                Install NativeTalk to your home screen for instant access, fullscreen chat, and completely offline communication.
              </p>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold organic-press active:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Install Application
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-full py-3.5 bg-white/5 text-slate-300 rounded-xl font-medium organic-press active:bg-white/10"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🔴 Non-intrusive Offline Banner */}
      {!isOnline && (
        <div className="fixed top-[env(safe-area-inset-top,0)] left-0 right-0 z-[9991] animate-in slide-in-from-top duration-300">
          <div className="bg-accent-coral text-white text-xs font-semibold py-1.5 text-center flex items-center justify-center gap-2">
            <WifiOff size={14} />
            {t('offline') || 'Offline Mode - Connect to send messages'}
          </div>
        </div>
      )}

      {/* 🔵 Update Available - Bottom floating banner */}
      {needRefresh && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[9998] fluid-enter max-w-md mx-auto">
          <div className="bg-surface-dark border border-primary/30 rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div className="size-10 bg-primary/20 rounded-full flex shrink-0 items-center justify-center text-primary">
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{t('updateAvailable') || 'Update Ready'}</h4>
              <p className="text-xs text-slate-400">Restart app to apply the latest features</p>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold organic-press"
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAManager;
