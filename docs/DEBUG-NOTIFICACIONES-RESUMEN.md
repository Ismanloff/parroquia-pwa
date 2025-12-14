# Resumen del Debug de Notificaciones iOS - 29 Oct 2025 [ACTUALIZADO]

## 🎯 Problema Principal

Las notificaciones **NO llegan al iPhone** cuando se envían desde el panel de administración, aunque:

- ✅ La PWA está instalada correctamente
- ✅ Los permisos fueron concedidos
- ✅ El token FCM se registró exitosamente
- ✅ APNs está configurado en Firebase Console
- ✅ **Antes SÍ funcionaba** (confirmado por el usuario)

## 🆕 HERRAMIENTAS NUEVAS CREADAS (29 Oct 2025)

### 1. Sistema de Gestión de Tokens

- **Página de administración**: [/admin/tokens](../app/admin/tokens/page.tsx)
- **Endpoint API**: [/api/notifications/tokens](../app/api/notifications/tokens/route.ts)
- **Funcionalidades**:
  - ✅ Ver todos los tokens con información detallada del dispositivo
  - ✅ Identificar plataforma (iOS/Android/macOS/Windows)
  - ✅ Ver última vez usado y días de inactividad
  - ✅ Eliminar tokens específicos
  - ✅ Limpiar automáticamente tokens inválidos (verifica con Firebase)

### 2. Logging Detallado Mejorado

- **Archivo modificado**: [/api/notifications/send/route.ts](../app/api/notifications/send/route.ts)
- **Mejoras**:
  - ✅ Identifica plataforma de cada dispositivo (iOS/Android/etc)
  - ✅ Muestra preview del token y user agent
  - ✅ Log detallado de errores con recomendaciones
  - ✅ Detecta tokens inválidos automáticamente
  - ✅ Respuesta JSON incluye detalles de cada envío

### 3. Diagnóstico Mejorado con APNs

- **Página mejorada**: [/diagnostico/notificaciones](../app/diagnostico/notificaciones/page.tsx)
- **Nuevas funcionalidades**:
  - ✅ Envía notificación de prueba automáticamente después del setup
  - ✅ Información específica sobre errores de APNs
  - ✅ Link directo a gestión de tokens
  - ✅ Guías contextuales sobre problemas comunes

### 4. Guías de Documentación Completas

- **[REGENERAR-TOKEN-IPHONE.md](REGENERAR-TOKEN-IPHONE.md)**: Guía paso a paso para regenerar token del iPhone
- **[VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)**: Cómo verificar APNs en Firebase Console

## 📊 Estado Actual

### Configuración Verificada ✅

1. **Firebase Config**: Todas las variables de entorno correctas
   - VAPID Key: `BO6OgR6uFyaAK1...`
   - Project ID: `app-parro-pwa`
   - Firebase Admin SDK configurado con Service Account

2. **Service Worker**: [public/firebase-messaging-sw.js](../public/firebase-messaging-sw.js)
   - Configurado correctamente con Firebase 10.7.1
   - Maneja notificaciones en background
   - Maneja clicks en notificaciones

3. **Supabase**: Base de datos `push_tokens` funcionando
   - 3 tokens registrados actualmente
   - RLS policies configuradas

4. **Vercel**: Proyecto desplegado en producción
   - URL: https://parroquia-pwa.vercel.app
   - Todas las variables de entorno configuradas
   - Última implementación: hace 2 horas

### Entorno de Desarrollo

- **Servidor local**: http://192.168.1.44:3000 (corriendo en background)
- **Producción**: https://parroquia-pwa.vercel.app
- **OS**: macOS Darwin 25.0.0
- **iPhone**: iOS 16.4+ (confirmado por usuario)

## 🔍 Hallazgos del Debug

### Envío de Notificaciones (Producción)

Cuando se envía desde `/admin/notifications`:

```
📤 Enviando notificación a 3 dispositivos
✅ 2 exitosas
❌ 1 fallida: "Error: Requested entity was not found"
```

**Análisis del error:**

- Este error indica que 1 de los 3 tokens es inválido o no puede ser procesado por Firebase
- **Probable causa**: Token de iOS que no puede comunicarse con APNs
- Los otros 2 tokens funcionan (probablemente Android o Desktop)

### Problema Identificado 🚨

**El usuario confirma que las notificaciones antes SÍ llegaban al iPhone**, pero ahora no.

Posibles causas:

1. ❓ Token del iPhone se invalidó (app reinstalada, permisos revocados, etc.)
2. ❓ APNs Authentication Key expiró o fue revocado
3. ❓ Bundle ID incorrecto en Firebase Console
4. ❓ La PWA fue reinstalada desde una URL diferente (localhost vs IP local)

## 📱 Archivos Clave del Sistema

### 1. Configuración de Firebase

- [lib/firebase/config.ts](../lib/firebase/config.ts) - Firebase client config
- [lib/firebase/messaging.ts](../lib/firebase/messaging.ts) - Push notifications setup
- [lib/firebase/admin.ts](../lib/firebase/admin.ts) - Firebase Admin SDK

### 2. Service Workers

- [public/firebase-messaging-sw.js](../public/firebase-messaging-sw.js) - Firebase messaging SW
- [lib/hooks/useServiceWorker.ts](../lib/hooks/useServiceWorker.ts) - Hook para SW

### 3. Componentes de UI

- [components/NotificationPrompt.tsx](../components/NotificationPrompt.tsx) - Prompt de activación
- [components/Settings.tsx](../components/Settings.tsx) - Configuración de notificaciones
- [app/configuracion/notificaciones/page.tsx](../app/configuracion/notificaciones/page.tsx) - Página de config

### 4. API Routes

- [app/api/notifications/send/route.ts](../app/api/notifications/send/route.ts) - Envío de notificaciones
- [app/api/notifications/test/route.ts](../app/api/notifications/test/route.ts) - Testing endpoint

### 5. Diagnóstico

- [app/diagnostico/notificaciones/page.tsx](../app/diagnostico/notificaciones/page.tsx) - **NUEVA** página de diagnóstico completo

## 🛠️ Herramientas Creadas

### Página de Diagnóstico

**URL**: `/diagnostico/notificaciones`

**Funciones:**

- ✅ Verifica soporte del navegador
- ✅ Detecta plataforma (iOS/Android/Desktop)
- ✅ Verifica estado de PWA instalada
- ✅ Valida versión de iOS
- ✅ Verifica Service Worker
- ✅ Valida variables de entorno
- ✅ Solicita y prueba permisos
- ✅ Ejecuta setup completo con logs detallados
- ✅ Muestra logs en tiempo real con códigos de color

**Cómo usar:**

1. Abrir la PWA instalada en el iPhone
2. Navegar a `/diagnostico/notificaciones`
3. Click en "Iniciar Diagnóstico"
4. Observar los logs detallados paso a paso

## 🔧 Cambios Realizados en esta Sesión

### 1. Restricción de Notificaciones a PWA Instalada

**Problema**: Las opciones de notificaciones aparecían en la web online

**Solución**: Modificados los siguientes archivos para mostrar opciones solo cuando la PWA está instalada:

- [components/UpdateBanner.tsx](../components/UpdateBanner.tsx) - Banner de actualización
- [components/NotificationPrompt.tsx](../components/NotificationPrompt.tsx) - Prompt de notificaciones
- [components/Settings.tsx](../components/Settings.tsx) - Configuración
- [app/configuracion/notificaciones/page.tsx](../app/configuracion/notificaciones/page.tsx) - Página de config

**Implementación**: Se usa el hook `useInstallPrompt()` que detecta:

```typescript
const { isInstalled } = useInstallPrompt();
// isInstalled = true cuando:
// - window.matchMedia('(display-mode: standalone)').matches (Android/Chrome)
// - window.navigator.standalone === true (iOS)
```

### 2. Página de Diagnóstico Completa

Creada nueva página con verificación paso a paso y logs en tiempo real.

## 📝 Pasos Recomendados para Resolver el Problema

### 🎯 PASO 1: Identificar el Token Inválido

1. **Ve a la página de gestión de tokens**:

   ```
   https://parroquia-pwa.vercel.app/admin/tokens
   ```

2. **Identifica tokens de iOS**:
   - Busca dispositivos con plataforma "iOS" o "iPhone"
   - Revisa "Último uso" - tokens con muchos días de inactividad probablemente están inválidos
   - Anota el token que parece ser del iPhone con problemas

3. **Limpia tokens inválidos**:
   - Opción A: Click en "Limpiar tokens inválidos" (verifica automáticamente con Firebase)
   - Opción B: Elimina manualmente el token específico del iPhone

### 🎯 PASO 2: Regenerar Token del iPhone

Sigue la guía detallada: [REGENERAR-TOKEN-IPHONE.md](REGENERAR-TOKEN-IPHONE.md)

**Resumen rápido**:

1. Desinstalar la PWA del iPhone
2. Limpiar datos de Safari (opcional)
3. Reinstalar desde: https://parroquia-pwa.vercel.app (¡NO desde localhost!)
4. Abrir desde el ícono instalado
5. Activar notificaciones
6. Ejecutar diagnóstico en `/diagnostico/notificaciones`

### 🎯 PASO 3: Verificar APNs en Firebase Console

Sigue la guía detallada: [VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)

**Resumen rápido**:

1. Ir a Firebase Console → Project Settings → Cloud Messaging
2. Verificar sección "Apple app configuration"
3. Confirmar que hay un APNs Authentication Key (.p8) subido
4. Verificar Key ID, Team ID y Bundle ID
5. Si falta o está mal configurado, seguir la guía para re-configurar

### 🎯 PASO 4: Probar Notificaciones

1. **Enviar notificación de prueba**:

   ```
   https://parroquia-pwa.vercel.app/admin/notifications
   ```

2. **Ver logs mejorados**:
   - Los logs ahora muestran la plataforma de cada dispositivo
   - Busca: `✅ [iOS] Token xxx... - Enviado exitosamente`
   - O: `❌ [iOS] Token xxx... - Error: ...`

3. **Verificar en Vercel**:
   ```bash
   vercel logs https://parroquia-pwa.vercel.app
   ```

### 🎯 PASO 5: Si Aún No Funciona

Si después de seguir todos los pasos anteriores las notificaciones aún no llegan:

1. **Ejecuta diagnóstico completo**:
   - En el iPhone: `/diagnostico/notificaciones`
   - Toma screenshots de cada paso
   - Comparte los errores específicos

2. **Verifica logs de Firebase Console**:

   ```
   https://console.firebase.google.com/project/app-parro-pwa/logs
   ```

   - Filtra por "messaging" o "apns"
   - Busca errores relacionados con APNs

3. **Verifica la versión de iOS**:
   - Mínimo requerido: iOS 16.4
   - Settings → General → About → Software Version

4. **Verifica que la PWA está en modo standalone**:
   - NO debe verse la barra de Safari
   - Debe abrir como app independiente

## 🔑 Variables de Entorno Importantes

### En `.env.local` (local):

```env
# Firebase Client (público)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBZpJGZZJkBmEIpB5wIz3WyL6z4L1UvehA
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app-parro-pwa
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BO6OgR6uFyaAK1j9Avxmo_xE9ov4BTz6vPfAo4G1-TQ5836W7ypb4A613JIp6jeIYWMfgQ7I_uxXy2-L6FWe5Fo

# Firebase Admin (privado)
FIREBASE_PROJECT_ID=app-parro-pwa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@app-parro-pwa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Supabase
SUPABASE_URL=https://fqixdguidesjgovbwkua.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### En Vercel (producción):

Todas las variables están configuradas correctamente ✅

## 📞 Comandos Útiles

### Monitorear Logs de Vercel en Tiempo Real:

```bash
cd "/Users/admin/Movies/APP PARRO PWA"
vercel logs https://parroquia-bpe7f1lef-chatbot-parros-projects.vercel.app
```

### Ver Tokens en Supabase:

Ir a: https://supabase.com/dashboard/project/fqixdguidesjgovbwkua/editor

- Tabla: `push_tokens`
- Ver columnas: `token`, `user_agent`, `created_at`, `last_used`

### Limpiar Tokens Inválidos:

Si hay tokens viejos, puedes eliminarlos desde Supabase Dashboard o con:

```sql
DELETE FROM push_tokens WHERE last_used < NOW() - INTERVAL '7 days';
```

## 🔍 Preguntas para Continuar el Debug

1. **¿Cuándo dejó de funcionar?**
   - ¿Después de reinstalar la PWA?
   - ¿Después de actualizar iOS?
   - ¿Después de desplegar cambios?

2. **¿En qué dispositivos funcionan las notificaciones?**
   - Solo iPhone está fallando
   - ¿Android funciona? ¿Desktop?

3. **¿El token del iPhone está en Supabase?**
   - Ver tabla `push_tokens`
   - ¿Cuándo fue `last_used`?
   - ¿El `user_agent` corresponde al iPhone?

4. **¿Hay múltiples tokens del mismo dispositivo?**
   - Puede haber duplicados si reinstalaste la PWA varias veces

## 📚 Documentación Relevante

- [FIREBASE-APNS-IOS-SETUP.md](FIREBASE-APNS-IOS-SETUP.md) - Guía completa de configuración APNs
- [FIREBASE-IOS-APP-SETUP-VISUAL.md](FIREBASE-IOS-APP-SETUP-VISUAL.md) - Registro de app iOS en Firebase
- [IOS-DEBUG.md](IOS-DEBUG.md) - Debug específico de iOS
- [FIX-IOS-NOTIFICATIONS.md](FIX-IOS-NOTIFICATIONS.md) - Soluciones a problemas comunes

## 💡 Recomendación Principal

Dado que **antes funcionaba** y ahora no, sigue estos pasos en orden:

1. **Usar la gestión de tokens** (`/admin/tokens`) para identificar y eliminar el token inválido del iPhone
2. **Verificar APNs** en Firebase Console usando la guía [VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)
3. **Regenerar el token** del iPhone siguiendo [REGENERAR-TOKEN-IPHONE.md](REGENERAR-TOKEN-IPHONE.md)
4. **Ejecutar diagnóstico completo** en `/diagnostico/notificaciones` desde el iPhone
5. **Enviar notificación de prueba** desde `/admin/notifications`

## 🎯 Objetivo Final

Lograr que las notificaciones lleguen consistentemente al iPhone cuando se envían desde `/admin/notifications`.

## 📊 Resumen de URLs Importantes

### Herramientas de Usuario

- **Diagnóstico completo**: https://parroquia-pwa.vercel.app/diagnostico/notificaciones
- **Configuración de notificaciones**: https://parroquia-pwa.vercel.app/configuracion/notificaciones

### Herramientas de Administración

- **Gestión de tokens**: https://parroquia-pwa.vercel.app/admin/tokens
- **Enviar notificaciones**: https://parroquia-pwa.vercel.app/admin/notifications

### Endpoints API

- **GET /api/notifications/tokens**: Listar todos los tokens
- **DELETE /api/notifications/tokens**: Eliminar tokens (específico o inválidos)
- **POST /api/notifications/send**: Enviar notificación a todos
- **POST /api/notifications/test**: Enviar notificación de prueba

### Firebase & Vercel

- **Firebase Console**: https://console.firebase.google.com/project/app-parro-pwa
- **Vercel Logs**: `vercel logs https://parroquia-pwa.vercel.app`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/fqixdguidesjgovbwkua

---

**Última actualización**: 29 Octubre 2025, 2:00 PM
**Estado del servidor local**: Corriendo en http://192.168.1.44:3000
**Estado de producción**: Desplegado y funcionando en Vercel

## 🎉 ¿Qué se logró en esta sesión?

✅ Sistema completo de gestión de tokens con eliminación automática de tokens inválidos
✅ Logging detallado que identifica plataforma de cada dispositivo (iOS/Android/macOS/etc)
✅ Diagnóstico mejorado con notificación de prueba automática
✅ Guías paso a paso para regenerar token del iPhone y verificar APNs
✅ Detección automática de errores específicos de iOS/APNs
✅ Interfaz visual para administrar tokens desde el navegador

**Todo está listo para resolver el problema de notificaciones en iPhone. Sigue los pasos recomendados en orden!**
