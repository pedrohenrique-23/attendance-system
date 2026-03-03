import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

export const usePushSubscription = () => {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    subscription: null,
    error: null,
  });

  // Verificar suporte a Push Notifications
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.warn('[Push] Push Notifications não suportadas neste navegador');
    }
  }, []);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('[Push] Push não suportado');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('[Push] Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('[Push] Erro ao registrar Service Worker:', error);
      setState((prev) => ({
        ...prev,
        error: 'Erro ao registrar Service Worker',
      }));
      return null;
    }
  }, [state.isSupported]);

  // Solicitar permissão de notificação
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Push Notifications não suportadas');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Permissão de notificações negada. Habilite nas configurações do navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Permissão concedida! Você receberá notificações.');
        return true;
      } else {
        toast.error('Permissão de notificações negada');
        return false;
      }
    } catch (error) {
      console.error('[Push] Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão de notificações');
      return false;
    }
  }, [state.isSupported]);

  // Inscrever em Push Notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Push Notifications não suportadas');
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Solicitar permissão
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Registrar Service Worker
      const registration = await registerServiceWorker();
      if (!registration) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Falha ao registrar Service Worker',
        }));
        return false;
      }

      // Inscrever em push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
      });

      console.log('[Push] Inscrição criada:', subscription);

      // Enviar subscription para backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userType: localStorage.getItem('userType') || 'operator',
          userId: localStorage.getItem('operatorId') || localStorage.getItem('monitorId'),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar subscrição no servidor');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isLoading: false,
        error: null,
      }));

      toast.success('Notificações push ativadas!');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao inscrever:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao ativar notificações';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      toast.error(errorMsg);
      return false;
    }
  }, [state.isSupported, requestPermission, registerServiceWorker]);

  // Desinscrever de Push Notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return false;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await state.subscription.unsubscribe();

      // Notificar backend
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: state.subscription.endpoint,
        }),
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      }));

      toast.success('Notificações push desativadas');
      return true;
    } catch (error) {
      console.error('[Push] Erro ao desinscrever:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error('Erro ao desativar notificações');
      return false;
    }
  }, [state.subscription]);

  // Verificar status de subscrição ao montar
  useEffect(() => {
    const checkSubscription = async () => {
      if (!state.isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          setState((prev) => ({
            ...prev,
            isSubscribed: true,
            subscription,
          }));
          console.log('[Push] Subscrição existente encontrada');
        }
      } catch (error) {
        console.error('[Push] Erro ao verificar subscrição:', error);
      }
    };

    checkSubscription();
  }, [state.isSupported]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    registerServiceWorker,
  };
};
