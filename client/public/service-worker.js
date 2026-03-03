// Service Worker para Push Notifications
// Gerencia notificações push mesmo quando a aba está em background

const NOTIFICATION_TYPES = {
  CALL: 'call',
  CASE_CREATED: 'case_created',
  CASE_ATTENDED: 'case_attended',
  CASE_RESOLVED: 'case_resolved',
};

// Listener para mensagens push do servidor
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  if (!event.data) {
    console.warn('[Service Worker] Push sem dados');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.body || 'Nova notificação',
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      tag: data.tag || 'notification',
      requireInteraction: true, // Mantém notificação visível até usuário interagir
      data: {
        type: data.type,
        timestamp: new Date().toISOString(),
        ...data.data,
      },
      // Adicionar som se disponível
      ...(data.sound && { sound: data.sound }),
    };

    // Enviar notificação para todas as abas
    event.waitUntil(
      self.registration.showNotification(data.title || 'Sistema SupPaciente', options)
    );

    // Notificar todas as abas abertas via Broadcast Channel
    const channel = new BroadcastChannel('push-notifications');
    channel.postMessage({
      type: 'PUSH_RECEIVED',
      notification: data,
      timestamp: new Date().toISOString(),
    });
    channel.close();
  } catch (error) {
    console.error('[Service Worker] Erro ao processar push:', error);
  }
});

// Listener para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);

  event.notification.close();

  const data = event.notification.data;
  const clientUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Procurar por aba já aberta
      for (const client of clientList) {
        if (client.url === clientUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // Se nenhuma aba aberta, abrir nova
      if (clients.openWindow) {
        return clients.openWindow(clientUrl);
      }
    })
  );
});

// Listener para fechar notificações
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification);
});

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Listener para sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      fetch('/api/notifications/pending')
        .then((response) => response.json())
        .then((data) => {
          data.notifications?.forEach((notification) => {
            self.registration.showNotification(notification.title, {
              body: notification.body,
              tag: notification.tag,
              requireInteraction: true,
              data: notification.data,
            });
          });
        })
        .catch((error) => console.error('[Service Worker] Sync error:', error))
    );
  }
});

// Listener para ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// Listener para instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});
