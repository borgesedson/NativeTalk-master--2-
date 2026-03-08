import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

const OfflinePage = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    const handleRetry = () => {
        if (navigator.onLine) {
            window.location.reload();
        }
    };

    if (isOnline) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="bg-base-300 p-6 rounded-full">
                        <WifiOff className="w-16 h-16 text-base-content/50" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">You're Offline</h1>
                    <p className="text-base-content/70">
                        No internet connection detected. Please check your network and try again.
                    </p>
                </div>

                {/* Status indicator */}
                <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Network Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                            <span className="text-sm text-error">Disconnected</span>
                        </div>
                    </div>
                </div>

                {/* Retry button */}
                <button
                    onClick={handleRetry}
                    className="btn btn-primary btn-wide gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>

                {/* Help text */}
                <div className="text-sm text-base-content/60 space-y-1">
                    <p>Some features may still work offline:</p>
                    <ul className="list-disc list-inside text-left inline-block">
                        <li>View cached messages</li>
                        <li>Browse your profile</li>
                        <li>Access saved content</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default OfflinePage;
