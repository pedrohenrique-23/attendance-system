import { useEffect, useState, useRef } from 'react';

export interface NotificationOptions {
  title: string;
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
  };
}

type NotificationType = 'call' | 'case' | 'attend' | 'resolved';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Verificar se a API de notificações é suportada
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }

    // Criar elemento de áudio para notificações
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('Notification API não é suportada neste navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
        return false;
      }
    }

    return false;
  };

  const playSound = (type: NotificationType) => {
    try {
      if (!audioRef.current) return;

      const soundMap: Record<NotificationType, string> = {
        call: '/notification-call.wav',
        case: '/notification-case.wav',
        attend: '/notification-attend.wav',
        resolved: '/notification-resolved.wav',
      };

      const soundPath = soundMap[type];
      audioRef.current.src = soundPath;
      audioRef.current.volume = 0.7;
      
      // Tentar reproduzir som
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Erro ao reproduzir som de notificação:', error);
        });
      }
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
    }
  };

  const notify = (
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      soundType?: NotificationType;
    }
  ) => {
    if (!isSupported) {
      console.warn('Notification API não é suportada');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return null;
    }

    try {
      // Reproduzir som se especificado
      if (options?.soundType) {
        playSound(options.soundType);
      }

      const { soundType, ...notificationOptions } = options || {};

      const notification = new Notification(title, {
        icon: '/icon.svg',
        badge: '/badge.svg',
        requireInteraction: true, // Manter notificação até usuário interagir
        ...notificationOptions,
      });

      // Auto-fechar notificação após 8 segundos
      setTimeout(() => {
        notification.close();
      }, 8000);

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
    playSound,
  };
}
