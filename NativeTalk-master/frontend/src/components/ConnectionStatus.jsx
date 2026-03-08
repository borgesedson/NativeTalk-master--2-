import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConnectionStatus = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState('checking'); // 'online', 'offline', 'checking'
  const [showDetails, setShowDetails] = useState(false);
  const [pendingQueue, setPendingQueue] = useState(0);

  // Verificar status da rede
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkApiStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setApiStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    if (isOnline) {
      checkApiStatus();
    }

    // Verificar periodicamente
    const interval = setInterval(() => {
      if (isOnline) {
        checkApiStatus();
      }
      checkPendingQueue();
    }, 30000); // A cada 30 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Verificar se a API está respondendo
  const checkApiStatus = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);

      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  // Verificar fila de sincronização pendente
  const checkPendingQueue = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Enviar mensagem para o service worker para verificar a fila
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_QUEUE',
        });
      }
    } catch (error) {
      console.error('Erro ao verificar fila:', error);
    }
  };

  // Receber mensagens do service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'QUEUE_SIZE') {
        setPendingQueue(event.data.size || 0);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Determinar cor e ícone baseado no status
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        color: 'error',
        icon: <WifiOff className="w-4 h-4" />,
        text: t('offline') || 'Offline',
        description: t('offlineDescription') || 'Sem conexão com a internet',
      };
    }

    if (apiStatus === 'offline') {
      return {
        color: 'warning',
        icon: <CloudOff className="w-4 h-4" />,
        text: t('apiOffline') || 'Servidor offline',
        description: t('apiOfflineDescription') || 'Não foi possível conectar ao servidor',
      };
    }

    if (apiStatus === 'checking') {
      return {
        color: 'info',
        icon: <Cloud className="w-4 h-4 animate-pulse" />,
        text: t('checking') || 'Verificando...',
        description: t('checkingDescription') || 'Verificando conexão com o servidor',
      };
    }

    return {
      color: 'success',
      icon: <Wifi className="w-4 h-4" />,
      text: t('online') || 'Online',
      description: t('onlineDescription') || 'Conectado ao servidor',
    };
  };

  const statusInfo = getStatusInfo();

  // Só mostrar se offline ou com problemas
  if (isOnline && apiStatus === 'online' && pendingQueue === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div
        className={`alert alert-${statusInfo.color} shadow-lg cursor-pointer transition-all`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2 flex-1">
          {statusInfo.icon}
          <div>
            <div className="font-bold text-sm">{statusInfo.text}</div>
            {showDetails && (
              <div className="text-xs mt-1">{statusInfo.description}</div>
            )}
          </div>
        </div>

        {pendingQueue > 0 && (
          <div className="badge badge-warning gap-1">
            <AlertCircle className="w-3 h-3" />
            {pendingQueue} {t('pending') || 'pendente(s)'}
          </div>
        )}
      </div>

      {/* Detalhes expandidos */}
      {showDetails && pendingQueue > 0 && (
        <div className="mt-2 p-3 bg-base-200 rounded-lg shadow-lg text-sm">
          <div className="font-semibold mb-2">
            {t('pendingActions') || 'Ações pendentes'}
          </div>
          <div className="text-xs opacity-70">
            {t('pendingActionsDescription') || 
             `${pendingQueue} ação(ões) serão sincronizadas quando a conexão for restaurada.`}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
