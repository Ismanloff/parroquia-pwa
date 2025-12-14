'use client';

import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Smartphone,
  Settings as SettingsIcon,
  Bell,
  BellOff,
  Calendar,
  BookOpen,
  Sparkles,
  LogOut,
  User,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { InstallButton } from '@/components/install';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';

import { setupPushNotifications } from '@/lib/firebase/messaging';

// ... (imports anteriores se mantienen igual, solo añadir el de arriba si falta)

export function Settings() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const { isInstalled } = useInstallPrompt();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Configuraciones de notificaciones específicas
  const [eventNotifications, setEventNotifications] = useState(true);
  const [dailyGospelNotifications, setDailyGospelNotifications] = useState(true);
  const [saintNotifications, setSaintNotifications] = useState(true);

  useEffect(() => {
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(async () => {
      // Verificar permisos actuales
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
        const isGranted = Notification.permission === 'granted';
        setNotificationsEnabled(isGranted);

        // AUTORECUPERACIÓN: Si ya tiene permiso pero borró datos o no se guardó el token
        // intentamos registrar el token silenciosamente
        if (isGranted) {
          console.log('🔄 Permiso existente detectado. Sincronizando token...');
          await setupPushNotifications();
        }
      }

      // Cargar preferencias desde localStorage
      const savedEventNotifs = localStorage.getItem('notifications_events');
      const savedGospelNotifs = localStorage.getItem('notifications_gospel');
      const savedSaintNotifs = localStorage.getItem('notifications_saints');

      if (savedEventNotifs !== null) setEventNotifications(savedEventNotifs === 'true');
      if (savedGospelNotifs !== null) setDailyGospelNotifications(savedGospelNotifs === 'true');
      if (savedSaintNotifs !== null) setSaintNotifications(savedSaintNotifs === 'true');
    });
  }, []);

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) return;

    setIsLoading(true);
    try {
      // Usar la función completa que pide permiso + obtiene token + guarda en BD
      const success = await setupPushNotifications();

      const permission = Notification.permission;
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === 'granted');

      if (success) {
        haptics.success();
        toast.success('Notificaciones activadas correctamente');
      } else if (permission === 'denied') {
        haptics.error();
        toast.error(
          'Has bloqueado las notificaciones. Habilítalas en los ajustes de tu navegador.'
        );
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotification = (type: 'events' | 'gospel' | 'saints', value: boolean) => {
    switch (type) {
      case 'events':
        setEventNotifications(value);
        localStorage.setItem('notifications_events', String(value));
        break;
      case 'gospel':
        setDailyGospelNotifications(value);
        localStorage.setItem('notifications_gospel', String(value));
        break;
      case 'saints':
        setSaintNotifications(value);
        localStorage.setItem('notifications_saints', String(value));
        break;
    }
  };

  const handleLogout = async () => {
    haptics.medium();

    // Confirmación antes de cerrar sesión
    const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?');

    if (!confirmed) return;

    try {
      await signOut();
      haptics.success();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      haptics.error();
      toast.error('Error al cerrar sesión');
      console.error('Error al cerrar sesión:', error);
    }
  };

  const themeOptions = [
    { id: 'light' as const, label: 'Claro', icon: Sun },
    { id: 'dark' as const, label: 'Oscuro', icon: Moon },
    { id: 'system' as const, label: 'Sistema', icon: Smartphone },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header - iOS 26 Liquid Glass Lite */}
      <div
        className="relative px-6 pt-5 pb-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #3B82F615 0%, #6366F125 100%)`,
        }}
      >
        {/* Efecto Liquid Glass sutil en el fondo */}
        <div
          className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl"
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md">
              <SettingsIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[34px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              Ajustes
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight ml-14">
            Personaliza tu experiencia
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
        {/* Selector de Tema */}
        <div
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6"
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
            Apariencia
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 tracking-tight">
            Elige el tema de la aplicación
          </p>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = themeMode === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setThemeMode(option.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {themeMode === 'system' && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                El tema se ajustará automáticamente según tu sistema
              </p>
            </div>
          )}
        </div>

        {/* Instalación de App */}
        <div className="mb-6">
          <InstallButton variant="settings" />
        </div>

        {/* Asistente Parroquial por WhatsApp */}
        <div
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6"
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
              Asistente Parroquial
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 tracking-tight">
            ¿Tienes dudas? Nuestro asistente IA está disponible 24/7 por WhatsApp
          </p>

          <a
            href="https://wa.me/14155982433?text=Hola,%20tengo%20una%20consulta%20sobre%20la%20parroquia"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl transition-all active:scale-95 shadow-md"
            onClick={() => haptics.medium()}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Abrir WhatsApp
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>

          <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
            Consultas sobre horarios, actividades, sacramentos y más
          </p>
        </div>

        {/* Notificaciones - Solo mostrar si la PWA está instalada */}
        {isInstalled && (
          <div
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6"
            style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
                ) : (
                  <BellOff className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </div>
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
                Notificaciones
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 tracking-tight">
              Recibe recordatorios de eventos y contenido diario
            </p>

            {/* Estado de permisos */}
            {notificationPermission === 'denied' && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de
                  tu navegador.
                </p>
              </div>
            )}

            {notificationPermission === 'default' && (
              <button
                onClick={handleRequestNotifications}
                className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                Activar notificaciones
              </button>
            )}

            {notificationPermission === 'granted' && (
              <div className="space-y-4">
                {/* Notificaciones de eventos */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Eventos del calendario
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Recordatorios de eventos próximos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('events', !eventNotifications)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      eventNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        eventNotifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Notificaciones de evangelio */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Evangelio del día
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Notificación diaria a las 7:00 AM
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('gospel', !dailyGospelNotifications)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      dailyGospelNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        dailyGospelNotifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Notificaciones de santo */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        Santo del día
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Notificación diaria a las 7:00 AM
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleNotification('saints', !saintNotifications)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      saintNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        saintNotifications ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información de la app */}
        <div
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6"
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Acerca de
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                Versión
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                1.0.0
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                Plataforma
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Web PWA
              </span>
            </div>
          </div>
        </div>

        {/* Cuenta de usuario y Cerrar Sesión - Solo si está autenticado */}
        {isSupabaseConfigured && user && (
          <div
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6"
            style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
          >
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Cuenta
            </h2>

            {/* Info del usuario */}
            <div className="mb-6 p-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Cuenta activa</p>
                </div>
              </div>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold rounded-2xl transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
