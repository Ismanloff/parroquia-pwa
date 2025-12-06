# 📱 PWA - Progressive Web App

Tu aplicación ahora está configurada como PWA y puede instalarse en móviles y escritorio como una app nativa.

---

## ✅ Qué se configuró

### 1. **Manifest.json** (`public/manifest.json`)
- Define nombre, iconos, colores de la app
- Permite instalación "Add to Home Screen"
- Configuración de pantalla completa (standalone)

### 2. **Service Worker** (`public/service-worker.js`)
- Cache de assets estáticos (funciona offline)
- Cache inteligente de API calls
- Notificaciones push (listas para configurar)
- Sincronización en background

### 3. **Registro automático** (`utils/registerServiceWorker.ts`)
- Registra SW cuando corre en web
- Detecta cuando app se puede instalar
- Maneja actualizaciones de versión
- Solicita permisos de notificaciones

### 4. **HTML personalizado** (`web/index.html`)
- Meta tags para PWA
- Configuración iOS específica
- SEO optimizado
- Loading spinner inicial

### 5. **Iconos PWA** (`public/icons/`)
- ⚠️ Actualmente son placeholders (mismo icono en todos los tamaños)
- Necesitan regenerarse en tamaños correctos (ver abajo)

### 6. **Página offline** (`public/offline.html`)
- Se muestra cuando no hay internet
- Detecta automáticamente cuando vuelve conexión
- Botón de reintentar

---

## 🚀 Cómo probar la PWA

### **Opción 1: Modo desarrollo (localhost)**

```bash
# 1. Iniciar servidor web
npm run web

# 2. Abrir en navegador
# Automáticamente abrirá: http://localhost:19006

# 3. Abrir DevTools (F12 o Cmd+Option+I)
# - Ve a Application > Service Workers
# - Verás que el SW se registró

# 4. Probar modo offline
# - En DevTools > Application > Service Workers
# - Marca "Offline"
# - Recargar página (debería funcionar desde cache)
```

**⚠️ Importante para desarrollo:**
- En desarrollo, el Service Worker puede no registrarse automáticamente
- Necesitas build de producción para funcionalidad completa
- La instalación PWA solo funciona con HTTPS (o localhost)

### **Opción 2: Build de producción (recomendado)**

```bash
# 1. Crear build optimizado
npx expo export:web

# 2. Servir con un servidor estático
npx serve web-build

# O usar otro servidor:
# npx http-server web-build -p 8080

# 3. Abrir en navegador
# http://localhost:8000 (o el puerto que use tu servidor)

# 4. Ahora SÍ verás:
# - Service Worker registrado
# - Banner "Instalar app" (en navegadores compatibles)
# - Funcionalidad offline completa
```

---

## 📲 Cómo instalar la PWA

### **En Android (Chrome)**

1. Abre la PWA en Chrome
2. Verás banner en la parte inferior: **"Agregar [App] a la pantalla de inicio"**
3. Toca "Agregar" o "Instalar"
4. Aparecerá icono en pantalla principal
5. Click en icono → Abre como app nativa (sin barra navegador)

**Método alternativo:**
- Menú (⋮) > "Agregar a pantalla de inicio"

### **En iOS (Safari)**

1. Abre la PWA en Safari
2. Toca botón "Compartir" (cuadrado con flecha hacia arriba)
3. Scroll hacia abajo → "Añadir a pantalla de inicio"
4. Personaliza nombre (opcional)
5. Toca "Añadir"
6. Aparecerá icono en pantalla principal

**⚠️ Limitaciones iOS:**
- No muestra banner automático (debe hacerse manual)
- Notificaciones push NO funcionan bien (limitación de Apple)
- Service Worker tiene restricciones

### **En Desktop (Chrome/Edge)**

1. Abre la PWA en Chrome o Edge
2. En la barra de URL, verás icono de instalación ⊕
3. Click en icono → "Instalar [App]"
4. Se abrirá ventana dedicada (sin barra navegador)
5. Acceso desde:
   - Escritorio (si seleccionaste)
   - Menú inicio
   - Barra de tareas

---

## 🛠️ Generar iconos PWA correctos

### **Opción 1: Usar script automático (Recomendado)**

```bash
# 1. Instalar sharp (librería de imágenes)
npm install --save-dev sharp

# 2. Generar iconos
node scripts/generate-pwa-icons.js

# 3. Verificar
ls -la public/icons/
# Deberías ver: icon-72x72.png, icon-96x96.png, ... icon-512x512.png
```

### **Opción 2: Herramienta online (más fácil)**

1. Ve a: **https://realfavicongenerator.net/**
2. Sube: `assets/images/icon.png`
3. Configura opciones:
   - iOS: Standalone, colores personalizados
   - Android: Color theme #6366f1
   - Windows: Tiles opcionales
4. Genera y descarga ZIP
5. Extrae archivos en `public/icons/`

### **Opción 3: Manual con Photoshop/Figma**

Exporta el icono `assets/images/icon.png` en estos tamaños:
- 72x72px (Android Chrome)
- 96x96px (Android Chrome)
- 128x128px (Android Chrome)
- 144x144px (Windows tiles)
- 152x152px (iOS)
- 167x167px (iOS iPad)
- 180x180px (iOS iPhone)
- 192x192px (Android Chrome, required)
- 384x384px (Android Chrome)
- 512x512px (Android Chrome, required)

Guarda como PNG en `public/icons/icon-[tamaño]x[tamaño].png`

---

## 🧪 Testing checklist

Usa esta lista para verificar que todo funciona:

### **Funcionalidad básica**
- [ ] App carga en navegador
- [ ] Chat funciona correctamente
- [ ] Backend responde (API calls funcionan)
- [ ] Styling se ve correcto

### **Service Worker**
- [ ] SW se registra correctamente
  - DevTools > Application > Service Workers > Status: "activated and running"
- [ ] Cache funciona
  - Cerrar DevTools, recargar → debería cargar rápido desde cache
- [ ] Modo offline funciona
  - Activar "Offline" en DevTools
  - Recargar → debería mostrar contenido cacheado
  - Navegar → assets cargados

### **Instalación**
- [ ] Banner de instalación aparece (Android Chrome)
- [ ] Botón personalizado de instalación funciona (si lo agregaste)
- [ ] App se instala correctamente
- [ ] Icono aparece en pantalla principal
- [ ] App abre en modo standalone (sin barra navegador)

### **Iconos**
- [ ] Iconos se ven correctos en:
  - Banner de instalación
  - Pantalla principal
  - App switcher (multitarea)
  - Notificaciones (si usas push)

### **Notificaciones (opcional)**
- [ ] Permiso de notificaciones se solicita
- [ ] Usuario puede aceptar/rechazar
- [ ] Notificaciones se muestran correctamente
- [ ] Click en notificación abre app

### **Actualización**
- [ ] Cuando publicas nueva versión:
  - Nueva versión se descarga en background
  - Usuario es notificado (si implementaste UI)
  - Al recargar, nueva versión se activa

---

## 🎨 Personalización

### **Cambiar colores**

1. **Theme color** (barra superior Android):
   ```json
   // public/manifest.json
   "theme_color": "#6366f1"  ← Cambia este color
   ```

2. **Background color** (splash screen):
   ```json
   // public/manifest.json
   "background_color": "#ffffff"  ← Cambia este color
   ```

3. **Actualizar en HTML también**:
   ```html
   <!-- web/index.html -->
   <meta name="theme-color" content="#6366f1">
   ```

### **Cambiar nombre**

```json
// public/manifest.json
{
  "name": "Tu App Completo",           ← Nombre largo
  "short_name": "TuApp",               ← Nombre corto (12 chars max)
  "description": "Descripción aquí"
}
```

### **Agregar shortcuts** (accesos rápidos)

```json
// public/manifest.json
"shortcuts": [
  {
    "name": "Chat",
    "short_name": "Chat",
    "description": "Abrir chat directamente",
    "url": "/chat",
    "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]
  },
  {
    "name": "Calendario",
    "url": "/calendar"
  }
]
```

En Android, long-press en icono mostrará estos shortcuts.

---

## 🔔 Configurar notificaciones push (Avanzado)

Para enviar notificaciones push necesitas:

### 1. **Generar VAPID keys**

```bash
# Instalar web-push
npm install -g web-push

# Generar keys
web-push generate-vapid-keys

# Output:
# Public Key: BKxxx...
# Private Key: xxx...
```

### 2. **Configurar en backend**

```typescript
// backend/utils/push-notifications.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:tu@email.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string }
) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}
```

### 3. **Suscribir usuario (frontend)**

```typescript
import { subscribeToPushNotifications } from '@/utils/registerServiceWorker';

// Llamar después de que usuario acepte permisos
const subscription = await subscribeToPushNotifications(
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY
);

// Enviar subscription a tu backend para guardarlo
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription),
  headers: { 'Content-Type': 'application/json' }
});
```

### 4. **Enviar notificación desde backend**

```typescript
// Obtener suscripción del usuario desde DB
const userSubscription = await db.getSubscription(userId);

// Enviar notificación
await sendPushNotification(userSubscription, {
  title: '🔔 Nuevo mensaje',
  body: 'Tienes una respuesta del chatbot'
});
```

---

## 📊 Analytics PWA

Para trackear uso de PWA:

```typescript
// Detectar si está instalada
import { isPWAInstalled } from '@/utils/registerServiceWorker';

if (isPWAInstalled()) {
  console.log('Usuario usando PWA instalada');
  // analytics.track('pwa_session');
} else {
  console.log('Usuario usando navegador normal');
  // analytics.track('web_session');
}

// Trackear instalación
window.addEventListener('pwa-installed', () => {
  console.log('Usuario instaló PWA!');
  // analytics.track('pwa_installed');
});
```

---

## 🐛 Troubleshooting

### **Service Worker no se registra**

```bash
# Verificar:
1. ¿Estás en HTTPS o localhost? (requerido)
2. ¿Está en modo producción? (dev puede tener issues)
3. ¿El archivo existe en: /service-worker.js?

# Forzar actualización:
# En DevTools > Application > Service Workers > Update
```

### **App no se puede instalar**

```bash
# Verificar:
1. ¿manifest.json es válido? (usar validador online)
2. ¿Tiene iconos de 192x192 y 512x512? (obligatorios)
3. ¿start_url existe y es válida?
4. ¿Está en HTTPS? (localhost también funciona)

# Test manifest:
# Chrome DevTools > Application > Manifest
# Debe decir: "Installable - meets requirements"
```

### **Offline no funciona**

```bash
# Debug:
1. DevTools > Application > Cache Storage
   - Deberías ver caches con archivos
2. Activar "Offline" en DevTools
3. Reload → Si falla, cache no funcionó

# Fix común:
- Limpiar cache: DevTools > Application > Clear storage
- Desregistrar SW
- Reload
- SW se re-registra y cachea
```

### **Iconos no se ven**

```bash
# Verificar:
1. Archivos existen en: public/icons/
2. Tamaños correctos (72, 96, 128, 144, 192, 512)
3. Formato PNG (no JPG ni SVG para iconos principales)
4. Manifest.json apunta a rutas correctas

# Re-generar:
npm run generate:icons
# o manualmente con herramienta online
```

---

## 🚀 Deploy en producción

### **Vercel (Recomendado)**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Build
npx expo export:web

# 3. Deploy
vercel deploy web-build --prod
```

**Configurar en vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "web-build/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/service-worker.js",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate",
        "service-worker-allowed": "/"
      },
      "dest": "/service-worker.js"
    },
    {
      "src": "/(.*)",
      "dest": "/web-build/$1"
    }
  ]
}
```

### **Netlify**

```bash
# 1. Build
npx expo export:web

# 2. Deploy
netlify deploy --prod --dir=web-build
```

**Configurar en netlify.toml:**
```toml
[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📚 Recursos adicionales

- **PWA Checklist**: https://web.dev/pwa-checklist/
- **Workbox (Service Worker library)**: https://developers.google.com/web/tools/workbox
- **PWA Builder**: https://www.pwabuilder.com/
- **Testing PWA**: https://web.dev/pwa-testing/
- **Push notifications**: https://web.dev/push-notifications-overview/

---

## ✅ Siguiente pasos

1. **Probar PWA en localhost** (`npm run web`)
2. **Generar iconos correctos** (ver sección arriba)
3. **Hacer build de producción** (`npx expo export:web`)
4. **Probar instalación** en móvil Android/iOS
5. **Deploy a servidor HTTPS** (Vercel/Netlify)
6. **(Opcional) Configurar push notifications**
7. **(Opcional) Agregar to home screen prompt custom**

---

🎉 **¡Tu app ahora es una PWA completa!**

Cualquier duda, revisa los logs en:
- Browser DevTools > Console
- Application > Service Workers
- Network tab (para ver cache hits)
