import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotificationManager = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState(Notification.permission);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar se notificações são suportadas
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificações não suportadas neste navegador');
      return;
    }

    // Mostrar prompt se ainda não foi decidido
    if (Notification.permission === 'default') {
      // Aguardar 10 segundos antes de mostrar o prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);

      if (result === 'granted') {
        console.log('✅ Permissão de notificações concedida');
        
        // Enviar notificação de teste
        new Notification('NativeTalk', {
          body: t('notificationsEnabled') || 'Notificações ativadas! Você será avisado de novas mensagens.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'welcome',
        });
      } else {
        console.log('❌ Permissão de notificações negada');
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
    }
  };

  // Não mostrar nada se notificações não são suportadas
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <>
      {showPrompt && permission === 'default' && (
        <div className="toast toast-top toast-center z-[9999]">
          <div className="alert alert-info shadow-lg max-w-md">
            <Bell className="w-6 h-6" />
            <div>
              <h3 className="font-bold">{t('enableNotifications') || 'Ativar Notificações'}</h3>
              <div className="text-xs">
                {t('notificationsDescription') || 'Receba alertas de novas mensagens e chamadas'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={requestPermission} className="btn btn-sm btn-primary">
                {t('enable') || 'Ativar'}
              </button>
              <button onClick={() => setShowPrompt(false)} className="btn btn-sm btn-ghost">
                {t('notNow') || 'Agora não'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Função helper para enviar notificações
export const sendNotification = (title, options = {}) => {
  console.log('🔔 sendNotification called:', { title, options });
  
  if (!('Notification' in window)) {
    console.warn('⚠️ Notificações não suportadas neste navegador');
    return;
  }

  console.log('🔔 Notification permission:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('✅ Permission granted - creating notification');
    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      ...options,
    });

    console.log('✅ Notification created:', notification);

    // Auto-fechar após 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } else {
    console.warn('⚠️ Notification permission not granted:', Notification.permission);
    if (Notification.permission === 'default') {
      console.log('💡 Dica: Clique em "Ativar" quando o prompt aparecer');
    }
  }
};

// Função helper para solicitar permissão
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notificações não suportadas neste navegador');
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão:', error);
    return false;
  }
};

export default NotificationManager;
