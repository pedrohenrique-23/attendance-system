// Simulação de armazenamento de subscrições em memória
// Em produção, usar banco de dados
interface StoredSubscription {
  endpoint: string;
  auth: string;
  p256dh: string;
  userType: 'operator' | 'monitor';
  userId: string;
  createdAt: Date;
}

const subscriptions = new Map<string, StoredSubscription>();

export const pushSubscriptions = {
  // Salvar subscrição
  save: (subscription: any, userType: string, userId: string) => {
    const key = `${userType}-${userId}`;
    const stored: StoredSubscription = {
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
      userType: userType as 'operator' | 'monitor',
      userId,
      createdAt: new Date(),
    };
    subscriptions.set(key, stored);
    console.log(`[Push] Subscrição salva para ${key}:`, stored);
    return stored;
  },

  // Remover subscrição
  remove: (endpoint: string) => {
    let found = false;
    subscriptions.forEach((sub, key) => {
      if (sub.endpoint === endpoint) {
        subscriptions.delete(key);
        console.log(`[Push] Subscrição removida: ${key}`);
        found = true;
      }
    });
    return found;
  },

  // Obter subscrições de um tipo de usuário
  getByUserType: (userType: string) => {
    const result: StoredSubscription[] = [];
    subscriptions.forEach((sub) => {
      if (sub.userType === userType) {
        result.push(sub);
      }
    });
    return result;
  },

  // Obter subscrição de um usuário específico
  getByUserId: (userType: string, userId: string) => {
    const key = `${userType}-${userId}`;
    return subscriptions.get(key);
  },

  // Obter todas as subscrições
  getAll: () => {
    const result: StoredSubscription[] = [];
    const iterator = subscriptions.values();
    let item = iterator.next();
    while (!item.done) {
      result.push(item.value);
      item = iterator.next();
    }
    return result;
  },

  // Limpar subscrições expiradas (simulado)
  cleanup: () => {
    let removed = 0;
    const keysToDelete: string[] = [];
    subscriptions.forEach((sub, key) => {
      const age = Date.now() - sub.createdAt.getTime();
      // Remover subscrições com mais de 30 dias
      if (age > 30 * 24 * 60 * 60 * 1000) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => subscriptions.delete(key));
    removed = keysToDelete.length;
    console.log(`[Push] ${removed} subscrições antigas removidas`);
    return removed;
  },
};
