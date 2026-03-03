# Configuração de Push Notifications Reais

## Requisitos Obrigatórios

### 1. HTTPS (Obrigatório)
Push Notifications **REQUEREM HTTPS** para funcionar. Isso é uma restrição de segurança do navegador.

- ✅ Em desenvolvimento local: `http://localhost:3000` funciona (exceção do navegador)
- ❌ Em qualquer outro domínio: **DEVE SER HTTPS**
- ❌ `http://seu-dominio.com` **NÃO FUNCIONA** - use `https://seu-dominio.com`

**Para produção em Vercel:**
- Vercel fornece HTTPS automaticamente ✅
- Seu domínio estará protegido com certificado SSL/TLS ✅

**Para backend em Railway/Render:**
- Ambos fornecem HTTPS automaticamente ✅
- Configure seu domínio customizado com HTTPS ✅

### 2. Permissões do Navegador
O usuário deve conceder permissão para notificações:
1. Sistema solicita permissão via `Notification.requestPermission()`
2. Usuário clica em "Permitir" no prompt do navegador
3. `Notification.permission === 'granted'`

**Importante:** Permissões são por domínio, não por aba.

### 3. Service Worker Ativo
O Service Worker deve estar:
- ✅ Registrado: `navigator.serviceWorker.register()`
- ✅ Ativado: Listening para eventos `push`
- ✅ Controlando a página: `clients.claim()`

## Arquitetura de Push Notifications

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegador (Background)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Service Worker (Sempre Ativo)              │  │
│  │                                                       │  │
│  │  - Escuta eventos 'push' do servidor                │  │
│  │  - Mostra notificações mesmo em background          │  │
│  │  - Funciona mesmo com aba minimizada                │  │
│  │  - Persiste mesmo com navegador fechado             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ (Push Message)
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│                                                              │
│  - Detecta evento (novo chamado, caso criado, etc)         │
│  - Obtém subscrição push do usuário                        │
│  - Envia notificação push via Web Push API                 │
│  - Notificação é entregue mesmo se aba estiver inativa    │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo Completo

### 1. Usuário Acessa o Sistema
```
Usuário abre sistema → Service Worker registrado → Solicita permissão
```

### 2. Usuário Concede Permissão
```
Usuário clica "Permitir" → Hook obtém subscrição push → Envia para backend
```

### 3. Backend Armazena Subscrição
```
Backend recebe subscrição → Armazena em banco de dados → Pronto para enviar notificações
```

### 4. Evento Ocorre (ex: Novo Chamado)
```
Operador chama monitor → Backend detecta evento → Busca subscrição do monitor
→ Envia notificação push → Service Worker recebe → Mostra notificação
```

### 5. Notificação Entregue em Qualquer Situação
- ✅ Aba ativa
- ✅ Aba em background
- ✅ Aba minimizada
- ✅ Navegador minimizado
- ✅ Navegador fechado (notificação fica pendente até abrir)

## Implementação Necessária

### Frontend (Já Implementado)
- ✅ Service Worker em `client/public/service-worker.js`
- ✅ Hook `usePushSubscription` para gerenciar subscrições
- ✅ Componente `PushNotificationControl` para UI

### Backend (Precisa Ser Conectado)
- ✅ Módulo `server/push-notifications.ts` com funções de envio
- ❌ **Falta:** Integrar envio de notificações nos eventos (chamado, caso criado, etc)
- ❌ **Falta:** Usar biblioteca `web-push` para envio real

### Próximos Passos

1. **Instalar web-push no backend:**
   ```bash
   cd server
   pnpm add web-push
   pnpm add -D @types/web-push
   ```

2. **Gerar VAPID keys (para Web Push API):**
   ```bash
   npx web-push generate-vapid-keys
   ```
   Salvar em variáveis de ambiente:
   - `VAPID_PUBLIC_KEY` (compartilhado com frontend)
   - `VAPID_PRIVATE_KEY` (secreto no backend)

3. **Integrar envio de notificações nos eventos:**
   - Quando operador chama: `sendPushNotification('monitor', monitorId, {...})`
   - Quando caso é criado: `broadcastPushNotification('monitor', {...})`
   - Quando monitor atende: `sendPushNotification('operator', operatorId, {...})`
   - Quando caso é resolvido: `sendPushNotification('operator', operatorId, {...})`

4. **Testar com navegador em background:**
   - Abrir sistema em aba
   - Conceder permissão de notificações
   - Minimizar aba ou abrir outra aba
   - Disparar evento (chamado, caso, etc)
   - Verificar se notificação aparece mesmo em background

## Validação de Funcionamento

### Checklist de Teste
- [ ] HTTPS ativo (ou localhost)
- [ ] Permissão de notificações concedida
- [ ] Service Worker registrado (DevTools → Application → Service Workers)
- [ ] Subscrição salva no backend
- [ ] Notificação recebida com aba ativa
- [ ] Notificação recebida com aba em background
- [ ] Notificação recebida com navegador minimizado
- [ ] Clique na notificação foca na aba correta

## Troubleshooting

### "Push Notifications não suportadas"
- Verificar suporte do navegador (Chrome, Edge, Firefox, Opera)
- Safari tem suporte limitado

### "Permissão negada"
- Usuário clicou em "Bloquear" no prompt
- Ir em Configurações do Navegador → Notificações → Permitir domínio

### "Service Worker não registrado"
- Verificar se arquivo `service-worker.js` existe em `client/public/`
- Verificar se há erros no console do navegador
- Limpar cache do navegador e recarregar

### "Notificação não aparece em background"
- Verificar se HTTPS está ativo (exceto localhost)
- Verificar se permissão foi concedida
- Verificar se subscrição foi salva no backend
- Verificar logs do Service Worker (DevTools → Application → Service Workers)

## Referências
- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
