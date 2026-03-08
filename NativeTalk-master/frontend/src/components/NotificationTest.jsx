import { useState } from 'react';
import { Bell, TestTube } from 'lucide-react';
import { sendNotification } from './NotificationManager';

const NotificationTest = () => {
  const [permission, setPermission] = useState(Notification?.permission || 'default');

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notificações não suportadas neste navegador');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    console.log('🔔 Permission result:', result);
  };

  const testNotification = () => {
    console.log('🧪 Testing notification...');
    sendNotification('Teste de Notificação', {
      body: 'Esta é uma mensagem de teste do NativeTalk!',
      tag: 'test-notification',
    });
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-base-100 rounded-lg shadow-xl border border-base-300">
      <div className="flex items-center gap-2 mb-3">
        <TestTube className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Teste de Notificações</h3>
      </div>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-semibold">Status: </span>
          <span className={`badge ${
            permission === 'granted' ? 'badge-success' : 
            permission === 'denied' ? 'badge-error' : 
            'badge-warning'
          }`}>
            {permission === 'granted' ? '✅ Permitido' : 
             permission === 'denied' ? '❌ Negado' : 
             '⚠️ Não solicitado'}
          </span>
        </div>

        {permission === 'default' && (
          <button
            onClick={requestPermission}
            className="btn btn-primary btn-sm w-full"
          >
            <Bell className="w-4 h-4" />
            Solicitar Permissão
          </button>
        )}

        {permission === 'granted' && (
          <button
            onClick={testNotification}
            className="btn btn-success btn-sm w-full"
          >
            <TestTube className="w-4 h-4" />
            Testar Notificação
          </button>
        )}

        {permission === 'denied' && (
          <div className="text-xs text-error">
            Permissão negada. Habilite nas configurações do navegador.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTest;
