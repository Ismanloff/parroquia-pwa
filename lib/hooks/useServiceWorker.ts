'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Hook robusto para detectar actualizaciones del Service Worker
 *
 * Mejoras sobre la versión anterior:
 * - Verificación periódica cada 60 segundos
 * - Mejor detección del estado "waiting"
 * - Menos dependencia de eventos que pueden fallar
 * - Logging mejorado para debugging
 * - Manejo de iOS Safari (que no soporta SW updates igual)
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isReady, setIsReady] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshingRef = useRef(false);

  // Verificar si hay un SW waiting
  const checkForWaitingWorker = useCallback((reg: ServiceWorkerRegistration | null) => {
    if (!reg) return false;

    if (reg.waiting) {
      console.log('🔄 [SW] Update waiting to be installed');
      setUpdateAvailable(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // Solo en cliente y si Service Worker está soportado
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported');
      return;
    }

    let mounted = true;

    const setup = async () => {
      try {
        // Registrar o obtener el service worker existente
        const reg = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none', // Siempre verificar actualizaciones del SW
        });

        if (!mounted) return;

        setRegistration(reg);
        setIsReady(true);
        console.log('✅ [SW] Registration successful:', reg.scope);

        // Verificar si ya hay un SW esperando
        if (checkForWaitingWorker(reg)) return;

        // Escuchar cuando se encuentra una actualización
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('🔍 [SW] Update found, new worker installing...');

          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            console.log('📊 [SW] New worker state:', newWorker.state);

            if (newWorker.state === 'installed') {
              // Hay un nuevo SW instalado
              if (navigator.serviceWorker.controller) {
                // Ya había un SW controlando, esto es una actualización
                console.log('✅ [SW] New version ready! Waiting for activation.');
                setUpdateAvailable(true);
              } else {
                // Primera instalación
                console.log('🎉 [SW] First install complete');
              }
            }
          });
        });

        // Verificar actualizaciones inmediatamente
        await reg.update();
        console.log('🔄 [SW] Initial update check complete');

        // Verificar periódicamente (cada 60 segundos)
        checkIntervalRef.current = setInterval(async () => {
          try {
            await reg.update();
            checkForWaitingWorker(reg);
            console.log('🔄 [SW] Periodic update check');
          } catch {
            // Silently fail on periodic checks
          }
        }, 60 * 1000);
      } catch (error) {
        console.error('❌ [SW] Registration failed:', error);
      }
    };

    setup();

    // Verificar cuando la app gana focus
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && registration) {
        console.log('👀 [SW] App visible, checking for updates...');
        try {
          await registration.update();
          checkForWaitingWorker(registration);
        } catch {
          // Ignore errors
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Escuchar cuando el nuevo SW toma control
    const handleControllerChange = () => {
      if (!refreshingRef.current) {
        console.log('🔄 [SW] New controller active, reloading...');
        refreshingRef.current = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkForWaitingWorker, registration]);

  /**
   * Aplicar actualización inmediatamente
   * Envía mensaje SKIP_WAITING al SW
   */
  const updateServiceWorker = useCallback(() => {
    const waiting = registration?.waiting;

    if (!waiting) {
      console.warn('⚠️ [SW] No waiting worker to activate');

      // Intentar un reload de emergencia
      if (registration) {
        registration.update().then(() => {
          window.location.reload();
        });
      }
      return;
    }

    console.log('📤 [SW] Sending SKIP_WAITING to service worker');
    waiting.postMessage({ type: 'SKIP_WAITING' });

    // Fallback: Si no hay controllerchange en 3 segundos, recargar manualmente
    setTimeout(() => {
      if (!refreshingRef.current) {
        console.log('⏰ [SW] Fallback reload triggered');
        window.location.reload();
      }
    }, 3000);
  }, [registration]);

  /**
   * Forzar verificación manual de actualizaciones
   */
  const checkForUpdates = useCallback(async () => {
    if (!registration) {
      console.warn('⚠️ [SW] No registration available');
      return false;
    }

    try {
      await registration.update();
      const hasUpdate = checkForWaitingWorker(registration);
      console.log('🔍 [SW] Manual check complete, update available:', hasUpdate);
      return hasUpdate;
    } catch (error) {
      console.error('❌ [SW] Update check failed:', error);
      return false;
    }
  }, [registration, checkForWaitingWorker]);

  return {
    /** Indica si hay una actualización disponible */
    updateAvailable,

    /** Aplicar actualización (recarga la página) */
    updateServiceWorker,

    /** Verificar manualmente si hay actualizaciones */
    checkForUpdates,

    /** Service Worker registration */
    registration,

    /** El hook está listo (SW registrado) */
    isReady,
  };
}
