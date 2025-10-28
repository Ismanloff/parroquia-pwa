import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  StaleWhileRevalidate,
  NetworkFirst,
  CacheFirst,
  NetworkOnly,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

// TypeScript declarations
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Estrategias de caché personalizadas para App Parroquial PWA
 *
 * Estrategias disponibles:
 * - CacheFirst: Usa caché primero, network como fallback (assets estáticos)
 * - NetworkFirst: Usa network primero, caché como fallback (contenido dinámico)
 * - StaleWhileRevalidate: Devuelve caché inmediatamente, actualiza en background
 * - NetworkOnly: Solo network, sin caché (APIs críticas)
 * - CacheOnly: Solo caché, sin network (contenido precacheado)
 */
const customCache = [
  ...defaultCache,

  // Evangelio del día - Cache con revalidación en background (cambia diariamente)
  {
    matcher: ({ url }: { url: URL }) => url.pathname.match(/\/api\/gospel\/today$/) !== null,
    handler: new StaleWhileRevalidate({
      cacheName: 'gospel-daily',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 7, // Últimos 7 días
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // Santo del día - Cache con revalidación en background (cambia diariamente)
  {
    matcher: ({ url }: { url: URL }) => url.pathname.match(/\/api\/saints\/today$/) !== null,
    handler: new StaleWhileRevalidate({
      cacheName: 'saints-daily',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 7, // Últimos 7 días
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // Eventos del calendario - Network primero con fallback a caché
  // Se actualiza frecuentemente (cada 2 minutos en el servidor)
  {
    matcher: ({ url }: { url: URL }) => url.pathname.includes('/api/calendar/events'),
    handler: new NetworkFirst({
      cacheName: 'calendar-events',
      networkTimeoutSeconds: 5, // Si network tarda >5s, usar caché
      plugins: [
        new ExpirationPlugin({
          maxEntries: 20, // Últimas 20 consultas
          maxAgeSeconds: 5 * 60, // 5 minutos
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // Supabase APIs - Network primero para datos en tiempo real
  {
    matcher: ({ url }: { url: URL }) => url.hostname.includes('.supabase.co'),
    handler: new NetworkFirst({
      cacheName: 'supabase-api',
      networkTimeoutSeconds: 10,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hora
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // Google Calendar ICS - Network primero (source externo)
  {
    matcher: ({ url }: { url: URL }) => url.hostname === 'calendar.google.com',
    handler: new NetworkFirst({
      cacheName: 'google-calendar-ics',
      networkTimeoutSeconds: 15,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 5,
          maxAgeSeconds: 5 * 60, // 5 minutos
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // Imágenes externas - Cache primero (no cambian frecuentemente)
  {
    matcher: ({ url, request }: { url: URL; request: Request }) =>
      request.destination === 'image' ||
      /\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'external-images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        }),
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  },

  // APIs de chat - SOLO network (no cachear conversaciones)
  {
    matcher: ({ url }: { url: URL }) => url.pathname.includes('/api/chat'),
    handler: new NetworkOnly(),
  },
];

// Inicializar Serwist con configuración personalizada
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  // NO skipWaiting automático - lo controlamos con mensaje del cliente
  skipWaiting: false,

  // NO clientsClaim automático - esperar confirmación del usuario
  clientsClaim: false,

  // Habilitar navigation preload para mejor performance
  navigationPreload: true,

  // Aplicar estrategias de caché personalizadas
  runtimeCaching: customCache,

  // Fallback para rutas offline
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

// Escuchar mensaje SKIP_WAITING del cliente (UpdateBanner)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Usuario confirmó actualización, activar nuevo service worker
    self.skipWaiting();
  }
});

// Cuando el nuevo SW toma control, cliente hará reload automático
self.addEventListener('activate', (event) => {
  // Limpiar cachés antiguas
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Eliminar cachés que no estén en la lista actual
              return (
                !cacheName.includes('gospel-daily') &&
                !cacheName.includes('saints-daily') &&
                !cacheName.includes('calendar-events') &&
                !cacheName.includes('supabase-api') &&
                !cacheName.includes('google-calendar-ics') &&
                !cacheName.includes('external-images') &&
                !cacheName.startsWith('serwist-')
              );
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        // Forzar el nuevo SW a tomar control de todos los clientes inmediatamente
        return self.clients.claim();
      })
  );
});

// Registrar event listeners de Serwist
serwist.addEventListeners();
