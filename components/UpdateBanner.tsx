'use client';

import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { Download, X, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Banner de notificación de actualización de PWA
 *
 * MEJORADO:
 * - Se muestra tanto en PWA instalada como en navegador
 * - Verificación automática al montar
 * - Animación de entrada suave
 * - Botón de recarga si falla el update normal
 */
export function UpdateBanner() {
  const { updateAvailable, updateServiceWorker, isReady } = useServiceWorker();
  const { isInstalled } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Mostrar banner con delay para animación suave
  useEffect(() => {
    if (updateAvailable && !dismissed) {
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    } else {
      // Use queueMicrotask to avoid setState in effect body
      queueMicrotask(() => setShowBanner(false));
    }
  }, [updateAvailable, dismissed]);

  // Log para debugging
  useEffect(() => {
    if (isReady) {
      console.log(
        '🔔 [UpdateBanner] Ready, updateAvailable:',
        updateAvailable,
        'isInstalled:',
        isInstalled
      );
    }
  }, [isReady, updateAvailable, isInstalled]);

  // No mostrar si no hay actualización o fue descartado
  // NOTA: Removida la condición !isInstalled para que funcione también en navegador
  if (!updateAvailable || dismissed || !showBanner) {
    return null;
  }

  const handleUpdate = async () => {
    console.log('📦 [UpdateBanner] User clicked update');
    setIsUpdating(true);

    try {
      updateServiceWorker();
      // La página se recargará automáticamente
    } catch (error) {
      console.error('❌ [UpdateBanner] Update failed:', error);
      // Fallback: recargar manualmente
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    console.log('⏭️ [UpdateBanner] User dismissed update');
    setDismissed(true);
  };

  const handleForceReload = () => {
    console.log('🔄 [UpdateBanner] Force reload');
    window.location.reload();
  };

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Efecto glass morphism */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Ícono animado */}
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              {isUpdating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5 animate-bounce-slow" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1">
                {isUpdating ? '⏳ Actualizando...' : '🎉 ¡Nueva versión disponible!'}
              </h3>
              <p className="text-xs text-white/90 mb-3">
                {isUpdating
                  ? 'Por favor espera, la app se recargará automáticamente'
                  : 'Actualiza para ver mejoras y correcciones'}
              </p>

              {/* Botones */}
              {!isUpdating && (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    aria-label="Actualizar aplicación"
                  >
                    Actualizar ahora
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95"
                    aria-label="Actualizar más tarde"
                  >
                    Luego
                  </button>
                </div>
              )}

              {/* Botón de emergencia si está actualizando por mucho tiempo */}
              {isUpdating && (
                <button
                  onClick={handleForceReload}
                  className="w-full mt-2 px-4 py-2 rounded-lg text-xs bg-white/10 hover:bg-white/20 transition-all"
                >
                  ¿No funciona? Toca aquí para recargar
                </button>
              )}
            </div>

            {/* Botón cerrar */}
            {!isUpdating && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors active:scale-90"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Indicador de progreso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={`h-full bg-white/40 ${isUpdating ? 'animate-progress' : 'animate-pulse'}`}
          />
        </div>
      </div>
    </div>
  );
}
