import { useEffect, useRef } from 'react';
import { usePushNotifications } from './usePushNotifications';

export interface BackgroundNotificationConfig {
  enabled?: boolean;
  interval?: number; // em milissegundos
  onQueueUpdate?: (count: number) => void;
  onCaseUpdate?: (count: number) => void;
}

/**
 * Hook que monitora notificações em background mesmo quando a aba está inativa
 * Usa Service Worker para enviar notificações push em qualquer aba
 */
export function useBackgroundNotifications(config: BackgroundNotificationConfig = {}) {
  const {
    enabled = true,
    interval = 2000, // 2 segundos
    onQueueUpdate,
    onCaseUpdate,
  } = config;

  const { sendLocalNotification } = usePushNotifications();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousQueueCountRef = useRef<number>(0);
  const previousCaseCountRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  // Monitorar visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      console.log('[Background Notifications] Tab visibility:', isVisibleRef.current ? 'visible' : 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Enviar notificação push (funciona em qualquer aba)
  const notifyQueueUpdate = async (count: number) => {
    if (count > previousQueueCountRef.current) {
      console.log('[Background Notifications] Queue updated:', count);
      await sendLocalNotification({
        title: 'Novo Chamado de Operador',
        body: `Você tem ${count} operador(es) na fila aguardando atendimento`,
        tag: 'queue-notification',
        requireInteraction: true,
        data: { type: 'queue', count },
      });
      onQueueUpdate?.(count);
    }
    previousQueueCountRef.current = count;
  };

  const notifyCaseUpdate = async (count: number) => {
    if (count > previousCaseCountRef.current) {
      console.log('[Background Notifications] Cases updated:', count);
      await sendLocalNotification({
        title: 'Novo Caso Criado',
        body: `Você tem ${count} caso(s) pendente(s) aguardando atendimento`,
        tag: 'cases-notification',
        requireInteraction: true,
        data: { type: 'cases', count },
      });
      onCaseUpdate?.(count);
    }
    previousCaseCountRef.current = count;
  };

  // Iniciar polling de notificações
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('[Background Notifications] Polling already running');
      return;
    }

    console.log('[Background Notifications] Starting polling with interval:', interval);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Aqui você faria requisições para o servidor para buscar atualizações
        // Por enquanto, apenas registramos que o polling está ativo
        if (!isVisibleRef.current) {
          console.log('[Background Notifications] Polling active (tab hidden)');
        }
      } catch (error) {
        console.error('[Background Notifications] Polling error:', error);
      }
    }, interval);
  };

  // Parar polling de notificações
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('[Background Notifications] Polling stopped');
    }
  };

  // Iniciar/parar polling baseado em enabled
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, interval]);

  return {
    notifyQueueUpdate,
    notifyCaseUpdate,
    startPolling,
    stopPolling,
    isTabVisible: isVisibleRef.current,
  };
}
