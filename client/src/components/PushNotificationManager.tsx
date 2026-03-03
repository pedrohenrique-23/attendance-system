import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

export function PushNotificationManager() {
  const {
    requestPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    getCurrentSubscription,
    isSupported,
    permission,
  } = usePushNotifications();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar subscription ao montar
  useEffect(() => {
    const checkSubscription = async () => {
      const subscription = await getCurrentSubscription();
      setIsSubscribed(!!subscription);
    };

    if (isSupported) {
      checkSubscription();
    }
  }, [isSupported, getCurrentSubscription]);

  const handleToggleNotifications = async () => {
    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Desinscrever
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
        }
      } else {
        // Solicitar permissão
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          console.warn('[Push Notifications] Permission denied');
          setIsLoading(false);
          return;
        }

        // Inscrever
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('[Push Notifications] Toggle failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleNotifications}
      disabled={isLoading}
      title={isSubscribed ? 'Desativar notificações' : 'Ativar notificações'}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notificações ativas</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          <span className="hidden sm:inline">Ativar notificações</span>
        </>
      )}
    </Button>
  );
}
