'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';
import { setupPushNotifications, onMessageListener } from '@/lib/firebase/messaging';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { toast } from '@/lib/toast';
import Link from 'next/link';

export default function NotificationsSettingsPage() {
  const { isInstalled } = useInstallPrompt();
  const [notificationStatus, setNotificationStatus] = useState<
    'loading' | 'granted' | 'denied' | 'default'
  >('loading');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationStatus('denied');
      return;
    }

    const permission = Notification.permission;
    setNotificationStatus(permission as 'granted' | 'denied' | 'default');

    // Si ya tiene permiso, configurar listener
    if (permission === 'granted') {
      onMessageListener((payload) => {
        const title = payload.notification?.title || 'Nueva notificación';
        const body = payload.notification?.body;
        toast.success(body ? `${title}: ${body}` : title);
      });
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);

    try {
      const success = await setupPushNotifications();

      if (success) {
        toast.success('Notificaciones activadas correctamente');
        setNotificationStatus('granted');

        // Configurar listener
        onMessageListener((payload) => {
          const title = payload.notification?.title || 'Nueva notificación';
          const body = payload.notification?.body;
          toast.success(body ? `${title}: ${body}` : title);
        });
      } else {
        toast.error('No se pudieron activar las notificaciones. Verifica los permisos');
      }
    } catch (error) {
      console.error('Error al activar notificaciones:', error);
      toast.error('Error al activar notificaciones');
    } finally {
      setIsActivating(false);
    }
  };

  // Si no está instalada, mostrar mensaje informativo
  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Instala la aplicación
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Las notificaciones solo están disponibles cuando instalas la aplicación en tu
              dispositivo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header con botón de volver */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Configura las notificaciones push
              </p>
            </div>
          </div>
        </div>

        {/* Estado actual */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Estado actual</h2>

          {notificationStatus === 'loading' && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <Loader className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">Verificando estado...</span>
            </div>
          )}

          {notificationStatus === 'granted' && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Notificaciones activadas
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Recibirás avisos de eventos importantes, misas especiales y más
                </p>
              </div>
            </div>
          )}

          {notificationStatus === 'denied' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <BellOff className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Notificaciones bloqueadas
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Para activarlas, ve a la configuración del navegador y habilita las notificaciones
                  para este sitio
                </p>
              </div>
            </div>
          )}

          {notificationStatus === 'default' && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Notificaciones desactivadas
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Activa las notificaciones para recibir avisos importantes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botón de activación */}
        {notificationStatus !== 'granted' && notificationStatus !== 'loading' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Activar notificaciones
            </h2>

            <button
              onClick={handleActivate}
              disabled={isActivating || notificationStatus === 'denied'}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isActivating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Activar notificaciones
                </>
              )}
            </button>

            {notificationStatus === 'denied' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Las notificaciones están bloqueadas en tu navegador. Ve a la configuración del
                navegador para habilitarlas.
              </p>
            )}
          </div>
        )}

        {/* Información sobre las notificaciones */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            ¿Qué notificaciones recibirás?
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Nuevos eventos agregados al calendario</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Misas especiales y celebraciones importantes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Evangelio del día y contenido espiritual</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Avisos importantes de la parroquia</span>
            </li>
          </ul>
        </div>

        {/* Instrucciones para navegadores */}
        {notificationStatus === 'denied' && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Cómo habilitar notificaciones
            </h3>

            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold mb-2">En Chrome (PC):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click en el ícono de candado junto a la URL</li>
                  <li>Busca &quot;Notificaciones&quot; y cambia a &quot;Permitir&quot;</li>
                  <li>Recarga la página</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-2">En Safari (iOS):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ve a Ajustes → Safari → Notificaciones</li>
                  <li>Busca parroquia-pwa.vercel.app</li>
                  <li>Activa &quot;Permitir notificaciones&quot;</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-2">En Chrome (Android):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ve a Ajustes → Apps → Chrome → Notificaciones</li>
                  <li>Busca parroquia-pwa.vercel.app</li>
                  <li>Activa las notificaciones</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
