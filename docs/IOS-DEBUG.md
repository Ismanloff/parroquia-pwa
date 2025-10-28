# Script de Diagnóstico para iOS

## Instrucciones

1. Abre tu PWA en iOS (la app instalada)
2. Presiona en Safari: Configuración > Safari > Avanzado > Web Inspector
3. O simplemente copia este código y pégalo en la consola de depuración de Safari en Mac conectando tu iPhone

## Script de Diagnóstico

```javascript
(async () => {
  console.log('=== DIAGNÓSTICO DE NOTIFICACIONES iOS ===');

  // 1. Información del sistema
  console.log('\n📱 INFORMACIÓN DEL DISPOSITIVO:');
  console.log('User Agent:', navigator.userAgent);
  console.log('Plataforma:', navigator.platform);
  console.log('Es PWA standalone:', window.matchMedia('(display-mode: standalone)').matches);

  // 2. Verificar soporte de notificaciones
  console.log('\n🔔 SOPORTE DE NOTIFICACIONES:');
  console.log('Notification en window:', 'Notification' in window);
  console.log('Permiso actual:', Notification?.permission || 'No soportado');
  console.log('Service Worker soportado:', 'serviceWorker' in navigator);
  console.log('PushManager soportado:', 'PushManager' in window);

  // 3. Verificar Service Workers registrados
  console.log('\n⚙️ SERVICE WORKERS:');
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Total Service Workers:', registrations.length);
    registrations.forEach((reg, i) => {
      console.log(`SW ${i + 1}:`, {
        scope: reg.scope,
        active: !!reg.active,
        installing: !!reg.installing,
        waiting: !!reg.waiting,
        updateViaCache: reg.updateViaCache,
      });
    });
  } catch (error) {
    console.error('Error al obtener Service Workers:', error);
  }

  // 4. Intentar registrar Firebase Service Worker
  console.log('\n🔥 FIREBASE SERVICE WORKER:');
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Firebase SW registrado:', registration.scope);

    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');
  } catch (error) {
    console.error('❌ Error al registrar Firebase SW:', error);
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
  }

  // 5. Verificar Firebase Messaging
  console.log('\n🔥 FIREBASE MESSAGING:');
  try {
    // Intentar importar dinamicamente
    const { getMessagingInstance } = await import('/lib/firebase/config.js');
    const messaging = await getMessagingInstance();

    if (messaging) {
      console.log('✅ Messaging instance obtenida');

      // Intentar obtener token
      const { getToken } = await import(
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js'
      );
      console.log(
        'VAPID Key:',
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...'
      );

      try {
        const swReg = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey:
            'BO6OgR6uFyaAK1j9Avxmo_xE9ov4BTz6vPfAo4G1-TQ5836W7ypb4A613JIp6jeIYWMfgQ7I_uxXy2-L6FWe5Fo',
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          console.log('✅ Token FCM obtenido:', token.substring(0, 30) + '...');
        } else {
          console.error('❌ No se pudo obtener token FCM');
        }
      } catch (tokenError) {
        console.error('❌ Error al obtener token:', tokenError);
        console.error('Tipo:', tokenError.name);
        console.error('Mensaje:', tokenError.message);
        console.error('Stack:', tokenError.stack);
      }
    } else {
      console.error('❌ No se pudo obtener messaging instance');
    }
  } catch (error) {
    console.error('❌ Error con Firebase Messaging:', error);
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
  }

  // 6. Verificar endpoint de Supabase
  console.log('\n🗄️ SUPABASE:');
  try {
    const { supabase } = await import('/lib/supabase.js');
    console.log('Supabase cliente:', !!supabase);

    if (supabase) {
      // Intentar hacer un SELECT de prueba
      const { data, error } = await supabase.from('push_tokens').select('count');
      if (error) {
        console.error('❌ Error en Supabase:', error);
      } else {
        console.log('✅ Conexión a Supabase OK');
      }
    }
  } catch (error) {
    console.error('❌ Error con Supabase:', error);
  }

  console.log('\n=== FIN DEL DIAGNÓSTICO ===');
  console.log('Por favor, copia TODA la salida y envíala para análisis');
})();
```

## Script Simplificado (si el anterior falla)

Si el script anterior es muy complejo, usa este más simple:

```javascript
console.log('=== DIAGNÓSTICO SIMPLE ===');
console.log('User Agent:', navigator.userAgent);
console.log('Es PWA:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Notification:', Notification?.permission);
console.log('ServiceWorker:', 'serviceWorker' in navigator);
console.log('PushManager:', 'PushManager' in window);

navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log('Service Workers registrados:', regs.length);
  regs.forEach((r) => console.log('- Scope:', r.scope));
});
```

## Qué buscar en los resultados

### ✅ Señales positivas:

- `Notification.permission: "granted"`
- `Service Worker soportado: true`
- `PushManager soportado: true`
- `Firebase SW registrado: [URL]`

### ❌ Señales de problemas:

- `Error al registrar Firebase SW` → El Service Worker de Firebase no funciona en iOS
- `Error al obtener token` → Firebase Messaging no es compatible
- `PushManager soportado: false` → iOS muy antiguo (necesita iOS 16.4+)

## Próximos pasos según resultados

**Si el Service Worker falla:**

- Implementar Web Push API nativo para iOS (sin Firebase)
- Mantener Firebase para Android/Chrome
- Detección automática de plataforma

**Si el token falla:**

- Similar a lo anterior, iOS necesita implementación diferente

**Si todo funciona pero no hay tokens:**

- Problema de permisos RLS en Supabase
- Problema de timing/async
