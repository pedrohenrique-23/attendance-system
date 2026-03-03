import { useEffect, useRef, useCallback } from 'react';

export interface BroadcastMessage {
  type: 'queue-update' | 'case-update' | 'monitor-attended' | 'case-completed' | 'notification-click';
  data: any;
  timestamp: number;
}

/**
 * Hook que gerencia Broadcast Channel API para comunicação entre abas
 * Permite que todas as abas abertas do sistema se comuniquem em tempo real
 */
export function useBroadcastChannel(channelName: string = 'attendance-system') {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const listenersRef = useRef<Map<string, Set<(message: BroadcastMessage) => void>>>(new Map());

  // Inicializar Broadcast Channel
  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel(channelName);
        console.log('[Broadcast Channel] Conectado ao canal:', channelName);

        // Listener para mensagens do canal
        channelRef.current.onmessage = (event) => {
          const message: BroadcastMessage = event.data;
          console.log('[Broadcast Channel] Mensagem recebida:', message);

          // Chamar todos os listeners registrados para este tipo de mensagem
          const listeners = listenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach((listener) => {
              try {
                listener(message);
              } catch (error) {
                console.error('[Broadcast Channel] Erro ao executar listener:', error);
              }
            });
          }
        };

        // Listener para erros
        channelRef.current.onerror = (error) => {
          console.error('[Broadcast Channel] Erro:', error);
        };

        return () => {
          if (channelRef.current) {
            channelRef.current.close();
            console.log('[Broadcast Channel] Canal fechado');
          }
        };
      } else {
        console.warn('[Broadcast Channel] API não suportada neste navegador');
      }
    } catch (error) {
      console.error('[Broadcast Channel] Erro ao inicializar:', error);
    }
  }, [channelName]);

  // Enviar mensagem para todas as abas
  const broadcast = useCallback((message: Omit<BroadcastMessage, 'timestamp'>) => {
    if (channelRef.current) {
      const fullMessage: BroadcastMessage = {
        ...message,
        timestamp: Date.now(),
      };
      console.log('[Broadcast Channel] Enviando mensagem:', fullMessage);
      channelRef.current.postMessage(fullMessage);
    } else {
      console.warn('[Broadcast Channel] Canal não inicializado');
    }
  }, []);

  // Registrar listener para um tipo de mensagem
  const on = useCallback((messageType: string, listener: (message: BroadcastMessage) => void) => {
    if (!listenersRef.current.has(messageType)) {
      listenersRef.current.set(messageType, new Set());
    }
    listenersRef.current.get(messageType)!.add(listener);

    // Retornar função para remover listener
    return () => {
      const listeners = listenersRef.current.get(messageType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }, []);

  // Remover listener para um tipo de mensagem
  const off = useCallback((messageType: string, listener: (message: BroadcastMessage) => void) => {
    const listeners = listenersRef.current.get(messageType);
    if (listeners) {
      listeners.delete(listener);
    }
  }, []);

  return {
    broadcast,
    on,
    off,
    isSupported: 'BroadcastChannel' in window,
  };
}
