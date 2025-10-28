'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { setupPushNotifications, onMessageListener } from '@/lib/firebase/messaging';
import { toast } from '@/lib/toast';

const PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed';
const PROMPT_DISMISSED_TIMESTAMP_KEY = 'notification_prompt_dismissed_timestamp';
const DISMISSAL_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Verificar si ya tiene permisos concedidos
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Si ya tiene permiso, no mostrar prompt
    if (Notification.permission === 'granted') {
      // Configurar listener para notificaciones en foreground
      onMessageListener((payload) => {
        const title = payload.notification?.title || 'Nueva notificación';
        const body = payload.notification?.body;
        toast.success(body ? `${title}: ${body}` : title);
      });
      return;
    }

    // Si ya rechazó, no molestar
    if (Notification.permission === 'denied') {
      return;
    }

    // Verificar si el prompt fue dismissed recientemente
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    const timestamp = localStorage.getItem(PROMPT_DISMISSED_TIMESTAMP_KEY);

    if (dismissed === 'true' && timestamp) {
      const dismissedTime = parseInt(timestamp, 10);
      const now = Date.now();

      // Si han pasado menos de 30 días, no mostrar
      if (now - dismissedTime < DISMISSAL_DURATION) {
        return;
      }

      // Limpiar si ya pasaron 30 días
      localStorage.removeItem(PROMPT_DISMISSED_KEY);
      localStorage.removeItem(PROMPT_DISMISSED_TIMESTAMP_KEY);
    }

    // Mostrar prompt después de 5 segundos
    const timer = setTimeout(() => {
      setShowPrompt(true);
      setTimeout(() => setIsAnimating(true), 100);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleActivate = async () => {
    setIsLoading(true);

    try {
      const success = await setupPushNotifications();

      if (success) {
        toast.success('Notificaciones activadas. Recibirás avisos de eventos importantes');

        // Configurar listener para notificaciones en foreground
        onMessageListener((payload) => {
          const title = payload.notification?.title || 'Nueva notificación';
          const body = payload.notification?.body;
          toast.success(body ? `${title}: ${body}` : title);
        });

        handleDismiss();
      } else {
        toast.error(
          'No se pudieron activar las notificaciones. Verifica los permisos del navegador'
        );
      }
    } catch (error) {
      console.error('Error al activar notificaciones:', error);
      toast.error('Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
      localStorage.setItem(PROMPT_DISMISSED_TIMESTAMP_KEY, Date.now().toString());
    }, 300);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-40 transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-md mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
        </div>

        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-7 h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                <h3 className="font-bold text-white text-base leading-tight">
                  Activa las notificaciones
                </h3>
              </div>
              <p className="text-white/90 text-sm leading-relaxed mb-3">
                Recibe avisos de eventos, misas especiales y actividades de la parroquia
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-purple-600 rounded-xl font-semibold text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Activando...' : 'Activar'}
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-colors backdrop-blur-sm disabled:opacity-50"
                >
                  Más tarde
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors backdrop-blur-sm disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white/40 transition-all duration-1000"
            style={{ width: isAnimating ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
