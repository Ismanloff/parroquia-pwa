/**
 * Registro de Service Worker para PWA
 *
 * Este archivo se ejecuta en el navegador y registra el Service Worker
 * para habilitar funcionalidad offline y notificaciones push
 */

// Variable para el prompt de instalación
let deferredPrompt: any = null;

/**
 * Registra el Service Worker
 */
export async function registerServiceWorker() {
  // Solo registrar en producción y si está disponible
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    process.env.NODE_ENV !== 'production'
  ) {
    console.log('⚠️ Service Worker no disponible o en desarrollo');
    return null;
  }

  try {
    console.log('🔧 Registrando Service Worker...');

    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('✅ Service Worker registrado:', registration.scope);

    // Actualizar SW si hay nueva versión
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🆕 Nueva versión de Service Worker encontrada');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 Nueva versión disponible. Recargando...');
          // Notificar al usuario que hay actualización
          showUpdateNotification();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error);
    return null;
  }
}

/**
 * Desregistra el Service Worker (útil para desarrollo)
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const unregistered = await registration.unregister();
      console.log('🗑️ Service Worker desregistrado:', unregistered);
      return unregistered;
    }
    return false;
  } catch (error) {
    console.error('❌ Error desregistrando Service Worker:', error);
    return false;
  }
}

/**
 * Verifica si el Service Worker está activo
 */
export function isServiceWorkerActive(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return !!navigator.serviceWorker.controller;
}

/**
 * Muestra notificación cuando hay actualización disponible
 */
function showUpdateNotification() {
  // Aquí puedes agregar UI personalizada
  // Por ahora solo log
  console.log('💡 Hay una actualización disponible');

  // Opción 1: Recargar automáticamente (puede ser disruptivo)
  // window.location.reload();

  // Opción 2: Mostrar banner/toast al usuario
  // showToast('Nueva versión disponible', { action: 'Actualizar' });
}

/**
 * Solicita permiso para notificaciones push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('⚠️ Notificaciones no soportadas');
    return false;
  }

  // Si ya tiene permiso
  if (Notification.permission === 'granted') {
    console.log('✅ Permiso de notificaciones ya concedido');
    return true;
  }

  // Si ya fue denegado
  if (Notification.permission === 'denied') {
    console.log('❌ Permiso de notificaciones denegado');
    return false;
  }

  // Solicitar permiso
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Permiso de notificaciones concedido');
      return true;
    } else {
      console.log('❌ Permiso de notificaciones denegado');
      return false;
    }
  } catch (error) {
    console.error('❌ Error solicitando permiso:', error);
    return false;
  }
}

/**
 * Suscribe al usuario a notificaciones push
 * (Requiere VAPID keys configuradas en backend)
 */
export async function subscribeToPushNotifications(
  vapidPublicKey?: string
): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Esperar a que el SW esté listo
    const registration = await navigator.serviceWorker.ready;

    // Verificar si ya está suscrito
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('✅ Ya suscrito a notificaciones push');
      return existingSubscription;
    }

    // Si no hay VAPID key, no podemos suscribir
    if (!vapidPublicKey) {
      console.log('⚠️ VAPID key no configurada');
      return null;
    }

    // Solicitar permiso primero
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Suscribirse
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('✅ Suscrito a notificaciones push');

    // Aquí enviarías la suscripción a tu backend
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify(subscription),
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return subscription;
  } catch (error) {
    console.error('❌ Error suscribiendo a push:', error);
    return null;
  }
}

/**
 * Convierte VAPID key de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================
// INSTALACIÓN PWA (Add to Home Screen)
// ============================================

/**
 * Captura el evento beforeinstallprompt
 */
export function initInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Evento beforeinstallprompt capturado');

    // Prevenir mini-infobar automático
    e.preventDefault();

    // Guardar evento para usarlo después
    deferredPrompt = e;

    // Emitir evento custom para que la UI pueda reaccionar
    window.dispatchEvent(new Event('pwa-install-available'));
  });

  // Detectar cuando se instala
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalada exitosamente');
    deferredPrompt = null;

    // Emitir evento custom
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

/**
 * Muestra el prompt de instalación
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('⚠️ Prompt de instalación no disponible');
    return false;
  }

  try {
    // Mostrar prompt nativo
    deferredPrompt.prompt();

    // Esperar respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} instalar`);

    // Limpiar
    deferredPrompt = null;

    return outcome === 'accepted';
  } catch (error) {
    console.error('❌ Error mostrando prompt de instalación:', error);
    return false;
  }
}

/**
 * Verifica si la PWA está instalada
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Detectar si está corriendo en modo standalone (instalada)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Limpia cache (útil para debugging)
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log('🗑️ Todos los caches limpiados');
  } catch (error) {
    console.error('❌ Error limpiando caches:', error);
  }
}
