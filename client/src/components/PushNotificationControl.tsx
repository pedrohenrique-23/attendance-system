import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export function PushNotificationControl() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushSubscription();
  const [showStatus, setShowStatus] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant={isSubscribed ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
        onMouseEnter={() => setShowStatus(true)}
        onMouseLeave={() => setShowStatus(false)}
      >
        {isSubscribed ? (
          <>
            <Bell size={16} />
            Notificações Ativas
          </>
        ) : (
          <>
            <BellOff size={16} />
            Ativar Notificações
          </>
        )}
      </Button>

      {showStatus && (
        <div className="absolute top-full mt-2 right-0 bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
          {isSubscribed
            ? 'Você receberá notificações mesmo fora da aba'
            : 'Clique para receber notificações push'}
        </div>
      )}
    </div>
  );
}
