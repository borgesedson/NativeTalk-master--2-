import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdatePrompt = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const [showUpdateToast, setShowUpdateToast] = useState(false);

    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline!', {
                icon: '📱',
                duration: 3000,
            });
            setOfflineReady(false);
        }

        if (needRefresh && !showUpdateToast) {
            setShowUpdateToast(true);

            toast(
                (t) => (
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        <div className="flex-1">
                            <p className="font-semibold">New version available!</p>
                            <p className="text-sm text-base-content/70">Update now for the latest features</p>
                        </div>
                        <button
                            onClick={() => {
                                updateServiceWorker(true);
                                toast.dismiss(t.id);
                            }}
                            className="btn btn-primary btn-sm"
                        >
                            Update
                        </button>
                    </div>
                ),
                {
                    duration: Infinity,
                    position: 'bottom-center',
                    style: {
                        maxWidth: '500px',
                    },
                }
            );
        }
    }, [offlineReady, needRefresh, setOfflineReady, updateServiceWorker, showUpdateToast]);

    return null;
};

export default UpdatePrompt;
