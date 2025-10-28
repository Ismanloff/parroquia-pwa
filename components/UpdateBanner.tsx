'use client';

import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Banner de notificación de actualización de PWA
 *
 * Se muestra cuando hay una nueva versión de la app disponible.
 * El usuario puede elegir actualizar inmediatamente o posponer.
 *
 * Características:
 * - Aparece automáticamente cuando detecta actualización
 * - Botón "Actualizar" recarga la app con nueva versión
 * - Botón "Más tarde" oculta el banner (volverá a aparecer)
 * - Diseño moderno con efecto glass y animación
 * - Se posiciona sobre el menú de navegación
 */
export function UpdateBanner() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  // No mostrar si no hay actualización o si fue desestimado
  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    console.log('📦 User clicked update');
    updateServiceWorker();
    // La página se recargará automáticamente en unos segundos
  };

  const handleDismiss = () => {
    console.log('⏭️ User dismissed update banner');
    setDismissed(true);
    // El banner volverá a aparecer la próxima vez que abra la app
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Efecto glass morphism */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Ícono de descarga animado */}
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-bounce-slow">
              <Download className="w-5 h-5" />
            </div>

            {/* Contenido principal */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1">🎉 ¡Nueva versión disponible!</h3>
              <p className="text-xs text-white/90 mb-3">
                Actualiza para ver mejoras y correcciones
              </p>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                  aria-label="Actualizar aplicación"
                >
                  Actualizar
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95"
                  aria-label="Actualizar más tarde"
                >
                  Más tarde
                </button>
              </div>
            </div>

            {/* Botón cerrar (X) */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors active:scale-90"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de progreso sutil */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-white/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
