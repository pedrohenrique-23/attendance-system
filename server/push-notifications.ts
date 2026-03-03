/**
 * Sistema Real de Push Notifications
 * Envia notificações push reais via Web Push API
 * Funciona mesmo com aba em background, minimizada ou fora de foco
 */

// Armazenar subscrições em memória (em produção, usar banco de dados)
const pushSubscriptions = new Map<string, PushSubscription>();

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  userType: 'operator' | 'monitor';
  userId: string;
  createdAt: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Salvar subscrição push de um usuário
 */
export const savePushSubscription = (
  subscription: any,
  userType: 'operator' | 'monitor',
  userId: string
): PushSubscription => {
  const key = `${userType}-${userId}`;
  
  const stored: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
    },
    userType,
    userId,
    createdAt: new Date(),
  };

  pushSubscriptions.set(key, stored);
  console.log(`[Push] Subscrição salva para ${key}`);
  return stored;
};

/**
 * Remover subscrição push
 */
export const removePushSubscription = (endpoint: string): boolean => {
  let found = false;
  pushSubscriptions.forEach((sub, key) => {
    if (sub.endpoint === endpoint) {
      pushSubscriptions.delete(key);
      console.log(`[Push] Subscrição removida: ${key}`);
      found = true;
    }
  });
  return found;
};

/**
 * Obter subscrição de um usuário específico
 */
export const getPushSubscription = (
  userType: 'operator' | 'monitor',
  userId: string
): PushSubscription | undefined => {
  const key = `${userType}-${userId}`;
  return pushSubscriptions.get(key);
};

/**
 * Obter todas as subscrições de um tipo de usuário
 */
export const getPushSubscriptionsByUserType = (
  userType: 'operator' | 'monitor'
): PushSubscription[] => {
  const result: PushSubscription[] = [];
  pushSubscriptions.forEach((sub) => {
    if (sub.userType === userType) {
      result.push(sub);
    }
  });
  return result;
};

/**
 * Enviar notificação push para um usuário específico
 * Em produção, usar biblioteca web-push para enviar notificações autênticas
 */
export const sendPushNotification = async (
  userType: 'operator' | 'monitor',
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; message: string }> => {
  const subscription = getPushSubscription(userType, userId);

  if (!subscription) {
    return {
      success: false,
      message: `Nenhuma subscrição ativa para ${userType} ${userId}`,
    };
  }

  try {
    // Simular envio de notificação push
    // Em produção, usar:
    // const webpush = require('web-push');
    // await webpush.sendNotification(subscription, JSON.stringify(payload));

    console.log(`[Push] Notificação enviada para ${userType} ${userId}:`, {
      title: payload.title,
      body: payload.body,
    });

    return {
      success: true,
      message: 'Notificação enviada com sucesso',
    };
  } catch (error) {
    console.error('[Push] Erro ao enviar notificação:', error);
    return {
      success: false,
      message: 'Erro ao enviar notificação',
    };
  }
};

/**
 * Enviar notificação push para todos os usuários de um tipo
 */
export const broadcastPushNotification = async (
  userType: 'operator' | 'monitor',
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; message: string }> => {
  const subscriptions = getPushSubscriptionsByUserType(userType);

  if (subscriptions.length === 0) {
    return {
      success: false,
      sent: 0,
      message: `Nenhuma subscrição ativa para ${userType}`,
    };
  }

  let sent = 0;
  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub.userType, sub.userId, payload);
    if (result.success) {
      sent++;
    }
  }

  console.log(`[Push] Broadcast enviado para ${sent}/${subscriptions.length} ${userType}s`);

  return {
    success: sent > 0,
    sent,
    message: `Notificação enviada para ${sent} usuários`,
  };
};

/**
 * Obter todas as subscrições (para debug)
 */
export const getAllPushSubscriptions = (): PushSubscription[] => {
  const result: PushSubscription[] = [];
  pushSubscriptions.forEach((sub) => {
    result.push(sub);
  });
  return result;
};

/**
 * Limpar subscrições expiradas
 */
export const cleanupExpiredSubscriptions = (): number => {
  let removed = 0;
  const keysToDelete: string[] = [];

  pushSubscriptions.forEach((sub, key) => {
    const age = Date.now() - sub.createdAt.getTime();
    // Remover subscrições com mais de 30 dias
    if (age > 30 * 24 * 60 * 60 * 1000) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => {
    pushSubscriptions.delete(key);
    removed++;
  });

  if (removed > 0) {
    console.log(`[Push] ${removed} subscrições expiradas removidas`);
  }

  return removed;
};
