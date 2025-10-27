'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Smartphone, Settings as SettingsIcon, Bell, BellOff, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { InstallButton } from '@/components/install';

export function Settings() {
  const { themeMode, setThemeMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Configuraciones de notificaciones específicas
  const [eventNotifications, setEventNotifications] = useState(true);
  const [dailyGospelNotifications, setDailyGospelNotifications] = useState(true);
  const [saintNotifications, setSaintNotifications] = useState(true);

  useEffect(() => {
    // Verificar permisos actuales
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Cargar preferencias desde localStorage
    const savedEventNotifs = localStorage.getItem('notifications_events');
    const savedGospelNotifs = localStorage.getItem('notifications_gospel');
    const savedSaintNotifs = localStorage.getItem('notifications_saints');

    if (savedEventNotifs !== null) setEventNotifications(savedEventNotifs === 'true');
    if (savedGospelNotifs !== null) setDailyGospelNotifications(savedGospelNotifs === 'true');
    if (savedSaintNotifs !== null) setSaintNotifications(savedSaintNotifs === 'true');
  }, []);

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === 'granted');

      if (permission === 'granted') {
        // Mostrar notificación de prueba
        new Notification('Notificaciones activadas', {
          body: 'Recibirás recordatorios sobre eventos y contenido diario',
          icon: '/icons/icon-192x192.png',
        });
      }
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

  const themeOptions = [
    { id: 'light' as const, label: 'Claro', icon: Sun },
    { id: 'dark' as const, label: 'Oscuro', icon: Moon },
    { id: 'system' as const, label: 'Sistema', icon: Smartphone },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header - iOS 26 Liquid Glass Lite */}
      <div
        className="relative px-6 pt-5 pb-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #3B82F615 0%, #6366F125 100%)`,
        }}
      >
        {/* Efecto Liquid Glass sutil en el fondo */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl" style={{ backdropFilter: 'blur(20px) saturate(180%)' }} />

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
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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

        {/* Notificaciones */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30 mb-6" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
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
                Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.
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
                    eventNotifications
                      ? 'bg-blue-600'
                      : 'bg-slate-300 dark:bg-slate-600'
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
                    dailyGospelNotifications
                      ? 'bg-blue-600'
                      : 'bg-slate-300 dark:bg-slate-600'
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
                    saintNotifications
                      ? 'bg-blue-600'
                      : 'bg-slate-300 dark:bg-slate-600'
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

        {/* Información de la app */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-lg border border-white/20 dark:border-slate-700/30" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Acerca de
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">Versión</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">1.0.0</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">Plataforma</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Web PWA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
