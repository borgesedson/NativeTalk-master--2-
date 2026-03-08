import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { sendNotification, requestNotificationPermission } from './NotificationManager';

const NotificationSetup = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        // Check if we should show the prompt
        const hasSeenPrompt = localStorage.getItem('notificationPromptSeen');
        const isLoggedIn = localStorage.getItem('chat-user'); // Adjust based on your auth

        // Show prompt only if:
        // 1. User is logged in
        // 2. Haven't seen the prompt before
        // 3. Permission is default (not granted or denied)
        if (isLoggedIn && !hasSeenPrompt && permission === 'default') {
            // Show after 10 seconds (after user has explored the app a bit)
            setTimeout(() => {
                setShowPrompt(true);
            }, 10000);
        }
    }, [permission]);

    const handleEnable = async () => {
        const granted = await requestNotificationPermission();

        if (granted) {
            setPermission('granted');
            setShowPrompt(false);
            localStorage.setItem('notificationPromptSeen', 'true');

            // Send a welcome notification
            sendNotification('Notifications Enabled! 🎉', {
                body: 'You\'ll now receive notifications for new messages',
                icon: '/pwa-192x192.png',
            });
        } else {
            setPermission('denied');
            setShowPrompt(false);
            localStorage.setItem('notificationPromptSeen', 'true');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('notificationPromptSeen', 'true');
    };

    // Don't show if browser doesn't support notifications
    if (!('Notification' in window)) return null;

    // Don't show if already granted or denied
    if (permission !== 'default') return null;

    if (!showPrompt) return null;

    return (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
            <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-info to-primary p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Stay Connected</h3>
                                <p className="text-white/90 text-sm">Never miss a message</p>
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
                <div className="p-4 space-y-4">
                    <p className="text-sm text-base-content/80">
                        Enable notifications to get instant alerts when you receive new messages, even when the app is closed.
                    </p>

                    {/* Benefits */}
                    <div className="bg-base-200 rounded-xl p-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Instant message alerts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Video call notifications</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                            <span>Friend request updates</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            className="btn btn-primary flex-1 gap-2"
                        >
                            <Bell className="w-4 h-4" />
                            Enable Notifications
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="btn btn-ghost gap-2"
                        >
                            <BellOff className="w-4 h-4" />
                            Not Now
                        </button>
                    </div>

                    <p className="text-xs text-base-content/60 text-center">
                        You can change this anytime in your browser settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationSetup;
