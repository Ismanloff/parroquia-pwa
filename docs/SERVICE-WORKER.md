# 📱 Service Worker & Sistema de Actualizaciones

Documentación completa del Service Worker y el sistema de notificaciones de actualización de la App Parroquial PWA.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Estrategias de Caché](#estrategias-de-caché)
4. [Sistema de Actualizaciones](#sistema-de-actualizaciones)
5. [Cómo Funciona](#cómo-funciona)
6. [Debugging](#debugging)
7. [Modificar Estrategias](#modificar-estrategias)
8. [FAQ](#faq)

---

## 🎯 Descripción General

### ¿Qué es un Service Worker?

Un Service Worker es un script que el navegador ejecuta en segundo plano, separado de la página web. Permite:

- **Modo Offline**: App funciona sin internet
- **Cache Inteligente**: Contenido se carga instantáneamente
- **Actualizaciones Automáticas**: Usuario recibe notificación de nueva versión
- **Menor Consumo de Datos**: Solo descarga lo que cambió

### ¿Por qué Serwist?

**Serwist** es un fork moderno de Workbox (de Google) con:

- ✅ Compatible con Next.js 16
- ✅ TypeScript nativo
- ✅ Mantenimiento activo
- ✅ Configuración más simple

---

## 🏗️ Arquitectura

### Componentes del Sistema

```
┌─────────────────────────────────────────┐
│         App Parroquial PWA              │
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │  app/sw.ts   │◄──│next.config.ts │  │
│  │Service Worker│   │   Serwist     │  │
│  └──────┬───────┘   └───────────────┘  │
│         │                               │
│         ▼                               │
│  ┌──────────────────────────────────┐  │
│  │  useServiceWorker Hook           │  │
│  │  - Detecta actualizaciones       │  │
│  │  - Envía mensaje SKIP_WAITING    │  │
│  └──────────┬───────────────────────┘  │
│         │                               │
│         ▼                               │
│  ┌──────────────────────────────────┐  │
│  │  UpdateBanner Component          │  │
│  │  - Muestra notificación          │  │
│  │  - Usuario decide actualizar     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Archivos Clave

| Archivo                         | Propósito                                |
| ------------------------------- | ---------------------------------------- |
| `app/sw.ts`                     | Service Worker con estrategias de caché  |
| `lib/hooks/useServiceWorker.ts` | Hook React para detectar actualizaciones |
| `components/UpdateBanner.tsx`   | Banner de notificación UI                |
| `next.config.ts`                | Configuración de Serwist                 |
| `app/layout.tsx`                | Integración del UpdateBanner             |

---

## 💾 Estrategias de Caché

### Estrategias Disponibles

#### 1. **CacheFirst** (Cache Primero)

```
Usuario → Caché → ¿Existe? → Sí → Devolver
                    ↓
                   No
                    ↓
               Network → Guardar en caché → Devolver
```

**Uso**: Assets estáticos (imágenes, fuentes, CSS, JS)

#### 2. **NetworkFirst** (Network Primero)

```
Usuario → Network → ¿Éxito? → Sí → Guardar en caché → Devolver
                      ↓
                     No
                      ↓
                   Caché → Devolver
```

**Uso**: APIs que cambian frecuentemente (calendario)

#### 3. **StaleWhileRevalidate** (Stale While Revalidate)

```
Usuario → Caché → Devolver inmediatamente
           ↓
        Network → Actualizar caché en background
```

**Uso**: Contenido que cambia diariamente (evangelio, santo)

#### 4. **NetworkOnly** (Solo Network)

```
Usuario → Network → Devolver
```

**Uso**: APIs que NO deben cachearse (chat, autenticación)

### Configuración Actual

```typescript
// app/sw.ts

const customCache = [
  // Evangelio del día - StaleWhileRevalidate
  {
    urlPattern: /\/api\/gospel\/today$/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'gospel-daily',
      expiration: {
        maxEntries: 7, // Últimos 7 días
        maxAgeSeconds: 86400, // 24 horas
      },
    },
  },

  // Santo del día - StaleWhileRevalidate
  {
    urlPattern: /\/api\/saints\/today$/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'saints-daily',
      expiration: {
        maxEntries: 7,
        maxAgeSeconds: 86400,
      },
    },
  },

  // Calendario - NetworkFirst (actualiza frecuentemente)
  {
    urlPattern: /\/api\/calendar\/events/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'calendar-events',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 300, // 5 minutos
      },
      networkTimeoutSeconds: 5, // Si tarda >5s, usar caché
    },
  },

  // Chat - NetworkOnly (NO cachear)
  {
    urlPattern: /\/api\/chat/,
    handler: 'NetworkOnly',
  },
];
```

### Resultado del Caché

| API             | Estrategia           | Cache Duration | Offline              |
| --------------- | -------------------- | -------------- | -------------------- |
| Evangelio       | StaleWhileRevalidate | 24h            | ✅ Funciona          |
| Santo           | StaleWhileRevalidate | 24h            | ✅ Funciona          |
| Calendario      | NetworkFirst         | 5min           | ✅ Funciona          |
| Chat            | NetworkOnly          | -              | ❌ Requiere internet |
| Assets (JS/CSS) | CacheFirst           | 7 días         | ✅ Funciona          |

---

## 🔄 Sistema de Actualizaciones

### Flujo Completo

```
1. Usuario abre la app
   ↓
2. useServiceWorker hook se ejecuta
   ↓
3. Hook registra Service Worker (/sw.js)
   ↓
4. Hook verifica si hay actualización (reg.update())
   ↓
5. ¿Hay nueva versión?
   ├─ No → Continúa normal
   ├─ Sí → Service Worker nuevo se instala
   │        ↓
   │     SW nuevo entra en estado "waiting"
   │        ↓
   │     Hook detecta SW "waiting"
   │        ↓
   │     setUpdateAvailable(true)
   │        ↓
   │     UpdateBanner aparece
   │        ↓
   │     Usuario ve: "🎉 Nueva versión disponible"
   │        ↓
   │     Usuario decide:
   │     ├─ "Actualizar" → Llamar updateServiceWorker()
   │     │                    ↓
   │     │                 Enviar mensaje SKIP_WAITING
   │     │                    ↓
   │     │                 SW ejecuta skipWaiting()
   │     │                    ↓
   │     │                 SW toma control (clientsClaim)
   │     │                    ↓
   │     │                 Evento 'controllerchange'
   │     │                    ↓
   │     │                 window.location.reload()
   │     │                    ↓
   │     │                 ✅ App actualizada
   │     │
   │     └─ "Más tarde" → Ocultar banner
   │                      (volverá a aparecer al abrir app)
```

### Código del Hook

```typescript
// lib/hooks/useServiceWorker.ts

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Registrar Service Worker
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setRegistration(reg);

      // Detectar nueva versión instalándose
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión esperando
            setUpdateAvailable(true);
          }
        });
      });

      // Verificar actualizaciones cuando app gana focus
      window.addEventListener('focus', () => reg.update());

      // Verificar inmediatamente
      reg.update();
    });

    // Recargar cuando nuevo SW toma control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const updateServiceWorker = () => {
    // Enviar mensaje SKIP_WAITING
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return { updateAvailable, updateServiceWorker };
}
```

### Código del Service Worker

```typescript
// app/sw.ts

const serwist = new Serwist({
  skipWaiting: false, // NO automático
  clientsClaim: false, // NO automático
  // ...
});

// Escuchar mensaje del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Tomar control después de activación
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
```

---

## 🛠️ Cómo Funciona

### Cuando Usuario Abre la App

1. **Primera Vez**:
   - Service Worker se registra
   - Assets se cachean
   - App carga normal

2. **Siguientes Veces (Sin Actualización)**:
   - Service Worker sirve desde caché
   - App carga instantáneamente
   - Evangelio/Santo se muestran offline

3. **Siguientes Veces (Con Actualización)**:
   - Service Worker detecta nueva versión
   - Nuevo SW se instala en background
   - Banner aparece: "Nueva versión disponible"
   - Usuario actualiza → App se recarga

### Modo Offline

**Escenario**: Usuario pierde conexión

```
1. Usuario abre app SIN internet
   ↓
2. Service Worker intercept requests
   ↓
3. Sirve desde caché:
   - HTML, CSS, JS → CacheFirst
   - Evangelio → StaleWhileRevalidate (último cacheado)
   - Santo → StaleWhileRevalidate (último cacheado)
   - Calendario → NetworkFirst (intenta network, fallback caché)
   ↓
4. APIs que requieren network (Chat):
   - Muestran mensaje "Sin conexión"
   - No rompen la app
```

---

## 🐛 Debugging

### Chrome DevTools

1. **Abrir DevTools** → **Application** tab

2. **Service Workers**:
   - Ver SW activo
   - Estado: activated/waiting/installing
   - Botón "Update" para forzar actualización
   - Botón "Unregister" para eliminar SW

3. **Cache Storage**:
   - Ver todas las cachés
   - Inspeccionar contenido
   - Eliminar cachés individuales

4. **Console Logs**:
   ```
   ✅ Service Worker registered
   🔄 Update found, installing new SW
   🔄 New SW state: installed
   📤 Sending SKIP_WAITING message to SW
   🔄 New SW took control, reloading page
   ```

### Comandos Útiles

```javascript
// En Console de DevTools

// Ver SW activo
navigator.serviceWorker.controller;

// Ver todas las registraciones
navigator.serviceWorker.getRegistrations();

// Forzar actualización
navigator.serviceWorker.getRegistration().then((reg) => reg.update());

// Eliminar SW
navigator.serviceWorker.getRegistration().then((reg) => reg.unregister());

// Ver todas las cachés
caches.keys();

// Eliminar todas las cachés
caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
```

### Simular Actualización

1. Hacer cambio pequeño en código
2. `npm run build --webpack`
3. Abrir app en navegador
4. Esperar 5-10 segundos
5. Banner debería aparecer

---

## ⚙️ Modificar Estrategias

### Cambiar Duración de Caché

```typescript
// app/sw.ts

{
  urlPattern: /\/api\/gospel\/today$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'gospel-daily',
    expiration: {
      maxEntries: 30,         // Cambiar de 7 a 30 días
      maxAgeSeconds: 2592000, // 30 días en segundos
    },
  },
}
```

### Añadir Nueva Estrategia

```typescript
// app/sw.ts

const customCache = [
  ...defaultCache,

  // Nueva estrategia para imágenes de santos
  {
    urlPattern: /\/images\/saints\/.*/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'saints-images',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 2592000, // 30 días
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];
```

### Cambiar Estrategia

```typescript
// De NetworkFirst a StaleWhileRevalidate

// ANTES (más lento, siempre intenta network)
{
  urlPattern: /\/api\/calendar\/events/,
  handler: 'NetworkFirst',
  // ...
}

// DESPUÉS (más rápido, devuelve caché inmediatamente)
{
  urlPattern: /\/api\/calendar\/events/,
  handler: 'StaleWhileRevalidate',
  // ...
}
```

---

## ❓ FAQ

### ¿Por qué no usar Turbopack?

Serwist (y todas las soluciones PWA actuales) requieren **webpack plugins**. Turbopack NO soporta webpack plugins todavía. Por eso usamos `--webpack` flag.

**Impacto**: Dev ~2-3s más lento en primera compilación. Producción sin cambios.

### ¿Cómo forzar actualización en usuarios?

Los usuarios verán el banner automáticamente cuando hay actualización. Si quieres forzar:

```typescript
// app/sw.ts

const serwist = new Serwist({
  skipWaiting: true, // Activar inmediatamente
  clientsClaim: true, // Tomar control sin esperar
  // ...
});
```

⚠️ **Cuidado**: Puede recargar la app mientras usuario está escribiendo.

### ¿Cómo desactivar Service Worker?

```typescript
// next.config.ts

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: true, // Desactiva en todos los entornos
});
```

O solo en desarrollo:

```typescript
disable: process.env.NODE_ENV === "development",
```

### ¿Por qué el Chat no funciona offline?

El chat requiere API de OpenAI/Anthropic que necesita internet. Cachear conversaciones sería:

- Desactualizado rápidamente
- Ocuparía mucho espacio
- Daría falsa sensación de funcionamiento

Es mejor mostrar claramente "Sin conexión" que dar respuestas incorrectas.

### ¿Cómo probar en localhost?

Service Workers solo funcionan en:

- `https://` (producción)
- `http://localhost` (desarrollo)

Tu servidor dev en `http://localhost:3000` funciona correctamente.

Para probar en iPhone desde Mac:

- Usa la IP local: `http://192.168.1.X:3000`
- O usa https en dev (más complejo)

### ¿Los usuarios deben reinstalar la PWA?

**NO**. Los cambios de código se actualizan automáticamente:

1. Usuario abre app
2. Detecta actualización
3. Banner aparece
4. Usuario toca "Actualizar"
5. App se recarga con nueva versión

Solo necesitan reinstalar si cambia el `manifest.json` (iconos, nombre, etc).

---

## 📚 Recursos

### Documentación Oficial

- [Serwist Docs](https://serwist.pages.dev)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)

### Herramientas

- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Última actualización**: Octubre 2025
**Versión**: Serwist 9.2.1 + Next.js 16.0.0
