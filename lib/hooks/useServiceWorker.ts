'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para detectar actualizaciones del Service Worker
 * y permitir al usuario actualizar la app
 *
 * Características:
 * - Detecta cuando hay nueva versión disponible
 * - Verifica actualizaciones al abrir/reactivar la app
 * - Permite al usuario decidir cuándo actualizar
 * - Recarga automática tras actualizar
 *
 * Uso:
 * ```tsx
 * const { updateAvailable, updateServiceWorker } = useServiceWorker();
 *
 * if (updateAvailable) {
 *   return <button onClick={updateServiceWorker}>Actualizar</button>
 * }
 * ```
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Solo en cliente y si Service Worker está soportado
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // Registrar service worker
    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg);

        console.log('✅ Service Worker registered', reg);

        // Verificar si ya hay un SW esperando activación
        if (reg.waiting) {
          console.log('⚠️ Update already waiting');
          setUpdateAvailable(true);
        }

        // Escuchar evento 'updatefound' - nueva versión detectada
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('🔄 Update found, installing new SW');

          if (!newWorker) return;

          // Escuchar cambios de estado del nuevo SW
          newWorker.addEventListener('statechange', () => {
            console.log('🔄 New SW state:', newWorker.state);

            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión instalada, pero esperando activación
              console.log('✅ New version installed, waiting for activation');
              setUpdateAvailable(true);
            }
          });
        });

        // Verificar actualizaciones cuando la app gana focus
        // (usuario vuelve a la app después de estar en otra pestaña/app)
        const checkForUpdates = () => {
          console.log('👀 Checking for updates...');
          reg.update();
        };

        window.addEventListener('focus', checkForUpdates);
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        });

        // Verificar inmediatamente al montar
        reg.update();

        // Cleanup
        return () => {
          window.removeEventListener('focus', checkForUpdates);
        };
      } catch (error) {
        console.error('❌ SW registration failed:', error);
      }
    };

    registerServiceWorker();

    // Escuchar cuando el nuevo SW toma control (después de skipWaiting)
    // Esto ocurre cuando el usuario acepta actualizar
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('🔄 New SW took control, reloading page');
        refreshing = true;
        // Recargar página para usar nueva versión
        window.location.reload();
      }
    });
  }, []);

  /**
   * Actualizar el Service Worker inmediatamente
   * Envía mensaje SKIP_WAITING al SW para activarse
   * La página se recargará automáticamente tras la activación
   */
  const updateServiceWorker = () => {
    if (!registration || !registration.waiting) {
      console.warn('⚠️ No update available or registration missing');
      return;
    }

    console.log('📤 Sending SKIP_WAITING message to SW');

    // Enviar mensaje SKIP_WAITING al Service Worker
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // El SW ejecutará skipWaiting() y tomará control
    // El evento 'controllerchange' recargará la página automáticamente
  };

  return {
    /**
     * Indica si hay una actualización disponible
     */
    updateAvailable,

    /**
     * Función para actualizar el Service Worker inmediatamente
     * La página se recargará automáticamente después
     */
    updateServiceWorker,

    /**
     * Service Worker registration (para debugging)
     */
    registration,
  };
}
