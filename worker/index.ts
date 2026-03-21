/// <reference lib="webworker" />

export default null;
declare var self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  const notification = (self as any).Notification;
  if (!notification || notification.permission !== 'granted') {
    return;
  }

  try {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Nova Mensagem';
    const options: any = {
      body: data.body || 'Alguém interagiu com sua lista!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200, 100, 400], // Padrão mais forte: curto, curto, longo
      data: {
        url: data.url || '/'
      },
      tag: 'nudge-notification', // Evita empilhar várias notificações iguais
      renotify: true // Vibra novamente se uma nova chegar com a mesma tag
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Erro ao processar push:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList && clientList.length > 0) {
        let client: any = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if ((clientList[i] as any).focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data.url);
    })
  );
});
