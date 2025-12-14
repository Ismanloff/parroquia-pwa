// Firebase Cloud Messaging Service Worker
// Este archivo se ejecuta en background y escucha notificaciones push
// ⚠️ IMPORTANTE: Este archivo DEBE estar en /public/ y ser JavaScript puro (no TypeScript)

// Importar Firebase scripts (versión 10.7.1 compatible)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Credenciales Firebase (mismo proyecto que .env.local)
firebase.initializeApp({
  apiKey: 'AIzaSyBZpJGZZJkBmEIpB5wIz3WyL6z4L1UvehA',
  authDomain: 'app-parro-pwa.firebaseapp.com',
  projectId: 'app-parro-pwa',
  storageBucket: 'app-parro-pwa.firebasestorage.app',
  messagingSenderId: '69430795605',
  appId: '1:69430795605:web:c4b700394107eeed5023dc',
  measurementId: 'G-GK2EKZHMSL',
});

const messaging = firebase.messaging();

// Manejar notificaciones cuando la app está en background o cerrada
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [Background] Notificación recibida:', payload);

  const notificationTitle = payload.notification?.title || 'App Parroquial';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'app-parroquial-notification',
    requireInteraction: false,
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  };

  // Mostrar notificación al usuario
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Click en notificación:', event.notification.tag);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Obtener URL de la notificación (default: home)
  const urlToOpen = event.notification.data?.url || '/';

  // Abrir la app en la URL especificada
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
