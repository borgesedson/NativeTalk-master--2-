import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Languages, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatStats = ({ channel, translations }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalMessages: 0,
    translatedMessages: 0,
    myMessages: 0,
    theirMessages: 0,
    todayMessages: 0,
    averageResponseTime: 0,
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!channel) return;

    const calculateStats = () => {
      const messages = channel.state.messages || [];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let myMessages = 0;
      let theirMessages = 0;
      let todayMessages = 0;
      const responseTimes = [];

      messages.forEach((msg, index) => {
        if (msg.user?.id === channel._client.userID) {
          myMessages++;
        } else {
          theirMessages++;
        }

        const msgDate = new Date(msg.created_at);
        if (msgDate >= todayStart) {
          todayMessages++;
        }

        // Calcular tempo de resposta
        if (index > 0) {
          const prevMsg = messages[index - 1];
          if (prevMsg.user?.id !== msg.user?.id) {
            const timeDiff = msgDate - new Date(prevMsg.created_at);
            if (timeDiff < 3600000) { // Menos de 1 hora
              responseTimes.push(timeDiff);
            }
          }
        }
      });

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      setStats({
        totalMessages: messages.length,
        translatedMessages: Object.keys(translations || {}).length,
        myMessages,
        theirMessages,
        todayMessages,
        averageResponseTime: Math.round(avgResponseTime / 1000 / 60), // em minutos
      });
    };

    calculateStats();

    // Atualizar stats quando novas mensagens chegarem
    const handleNewMessage = () => {
      setTimeout(calculateStats, 100);
    };

    channel.on('message.new', handleNewMessage);

    return () => {
      channel.off('message.new', handleNewMessage);
    };
  }, [channel, translations]);

  if (!showStats) {
    return (
      <button
        onClick={() => setShowStats(true)}
        className="fixed bottom-20 right-4 z-40 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all"
        title="Ver estatísticas do chat"
      >
        <BarChart3 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[90vw]">
      <div className="bg-base-100 rounded-xl shadow-2xl border border-base-300 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-content p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-bold">{t('chatStats') || 'Estatísticas do Chat'}</h3>
          </div>
          <button
            onClick={() => setShowStats(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-4 space-y-3">
          {/* Total de Mensagens */}
          <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{t('totalMessages') || 'Total de Mensagens'}</span>
            </div>
            <span className="text-lg font-bold">{stats.totalMessages}</span>
          </div>

          {/* Mensagens Traduzidas */}
          <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">{t('translatedMessages') || 'Traduzidas'}</span>
            </div>
            <span className="text-lg font-bold text-blue-500">{stats.translatedMessages}</span>
          </div>

          {/* Minhas vs Deles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('myMessages') || 'Minhas'}
              </div>
              <div className="text-xl font-bold text-success">{stats.myMessages}</div>
            </div>
            <div className="p-3 bg-info/10 rounded-lg text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('theirMessages') || 'Deles'}
              </div>
              <div className="text-xl font-bold text-info">{stats.theirMessages}</div>
            </div>
          </div>

          {/* Hoje */}
          <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">{t('todayMessages') || 'Hoje'}</span>
            </div>
            <span className="text-lg font-bold text-warning">{stats.todayMessages}</span>
          </div>

          {/* Tempo Médio de Resposta */}
          {stats.averageResponseTime > 0 && (
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">{t('avgResponseTime') || 'Tempo Médio'}</span>
              </div>
              <span className="text-lg font-bold text-emerald-500">
                {stats.averageResponseTime}min
              </span>
            </div>
          )}

          {/* Taxa de Tradução */}
          {stats.theirMessages > 0 && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('translationRate') || 'Taxa de Tradução'}
              </div>
              <div className="flex items-center gap-2">
                <progress
                  className="progress progress-primary w-full"
                  value={stats.translatedMessages}
                  max={stats.theirMessages}
                ></progress>
                <span className="text-sm font-bold">
                  {Math.round((stats.translatedMessages / stats.theirMessages) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatStats;
