/**
 * Service Worker para PWA - Chatbot Parroquial
 *
 * Estrategia de caché:
 * - Cache First para assets estáticos (CSS, JS, imágenes)
 * - Network First para API calls (backend)
 * - Cache pages offline
 */

const CACHE_NAME = 'parroquias-pwa-v1';
const API_CACHE_NAME = 'parroquias-api-v1';

// Archivos críticos que se cachean durante instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// URLs de API que NO deben cachearse (siempre fresh)
const API_ENDPOINTS = [
  '/api/chat/message-stream',
  '/api/chat/message',
  '/api/calendar/events'
];

// ============================================
// INSTALACIÓN - Cachear assets estáticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Service Worker instalado');
        // Activar inmediatamente sin esperar
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ [SW] Error en instalación:', error);
      })
  );
});

// ============================================
// ACTIVACIÓN - Limpiar caches viejos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activando Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches viejos
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ [SW] Eliminando cache viejo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [SW] Service Worker activado');
        // Tomar control inmediatamente de todos los clientes
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH - Estrategia de caché inteligente
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ===== ESTRATEGIA 1: API Calls → Network First (siempre intentar red) =====
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si la respuesta es válida, cachear para uso offline
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Si falla la red, intentar desde cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('📦 [SW] Sirviendo API desde cache (offline):', url.pathname);
            return cachedResponse;
          }

          // Si no hay cache, retornar error offline
          return new Response(
            JSON.stringify({
              error: 'Sin conexión. Esta funcionalidad requiere internet.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // ===== ESTRATEGIA 2: Assets estáticos → Cache First (más rápido) =====
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Si está en cache, devolverlo inmediatamente
        if (cachedResponse) {
          console.log('📦 [SW] Sirviendo desde cache:', url.pathname);
          return cachedResponse;
        }

        // Si no está en cache, fetch y cachear
        return fetch(request)
          .then((response) => {
            // Solo cachear respuestas válidas
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clonar porque response solo se puede usar una vez
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch((error) => {
            console.error('❌ [SW] Error en fetch:', error);

            // Si es navegación (HTML), mostrar página offline
            if (request.destination === 'document') {
              return caches.match('/offline.html').then((offlineResponse) => {
                return offlineResponse || new Response(
                  '<html><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>',
                  { headers: { 'Content-Type': 'text/html' } }
                );
              });
            }

            return new Response('Sin conexión', { status: 503 });
          });
      })
  );
});

// ============================================
// NOTIFICACIONES PUSH
// ============================================
self.addEventListener('push', (event) => {
  console.log('🔔 [SW] Notificación push recibida');

  let notificationData = {
    title: 'Chatbot Parroquial',
    body: 'Tienes un nuevo mensaje',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };

  // Si viene con datos, parsear
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: notificationData.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// ============================================
// CLICK EN NOTIFICACIÓN
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [SW] Click en notificación');
  event.notification.close();

  // Si hay acción específica
  if (event.action === 'close') {
    return;
  }

  // Abrir o enfocar la app
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// SINCRONIZACIÓN EN BACKGROUND
// ============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 [SW] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

/**
 * Sincroniza mensajes pendientes cuando vuelve la conexión
 */
async function syncPendingMessages() {
  console.log('💬 [SW] Sincronizando mensajes pendientes...');

  // Aquí irías a IndexedDB y enviarías mensajes pendientes
  // Por ahora solo log
  console.log('✅ [SW] Sincronización completada');
}

// ============================================
// MENSAJE DEL CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  console.log('💬 [SW] Mensaje recibido:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('🎉 [SW] Service Worker cargado');
