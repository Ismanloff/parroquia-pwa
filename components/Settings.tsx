'use client';

import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Smartphone,
  Bell,
  Calendar,
  BookOpen,
  Sparkles,
  LogOut,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { InstallButton } from '@/components/install';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { setupPushNotifications } from '@/lib/firebase/messaging';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function Settings() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const { isInstalled } = useInstallPrompt();
  const { updateAvailable, updateServiceWorker, checkForUpdates } = useServiceWorker();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [eventNotifications, setEventNotifications] = useState(true);
  const [dailyGospelNotifications, setDailyGospelNotifications] = useState(true);
  const [saintNotifications, setSaintNotifications] = useState(true);

  useEffect(() => {
    queueMicrotask(async () => {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
        setNotificationsEnabled(Notification.permission === 'granted');
      }
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
    try {
      const success = await setupPushNotifications();
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
      if (success) {
        haptics.success();
        toast.success('Notificaciones activadas');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al activar notificaciones');
    }
  };

  const toggleSetting = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
    haptics.light();
  };

  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await signOut();
      haptics.success();
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    haptics.light();

    try {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        toast.success('¡Nueva versión encontrada!');
      } else {
        toast.success('Estás usando la última versión');
      }
    } catch {
      toast.error('Error al buscar actualizaciones');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleForceUpdate = () => {
    haptics.success();
    updateServiceWorker();
  };

  const themeOptions = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Oscuro', icon: Moon },
    { id: 'system', label: 'Sistema', icon: Smartphone },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Premium Header */}
      <div
        className="px-6 pt-12 pb-5 sticky top-0 z-10"
        style={{
          background: 'var(--glass-background)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <h1 className="text-4xl font-black text-foreground tracking-tight">Ajustes</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-8">
        {/* Appearance Section */}
        <section>
          <h2 className="section-title">Apariencia</h2>
          <Card variant="flat" padding="none" className="overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setThemeMode(option.id);
                    haptics.light();
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center py-4 gap-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    themeMode === option.id && 'bg-blue-50/50 dark:bg-blue-900/10'
                  )}
                >
                  <option.icon
                    className={cn(
                      'w-6 h-6',
                      themeMode === option.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      themeMode === option.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-500'
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="section-title">Notificaciones</h2>
          {notificationPermission !== 'granted' ? (
            <Card
              variant="flat"
              className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Activar avisos</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300/80">
                    Recibe el evangelio y recordatorios.
                  </p>
                </div>
                <button
                  onClick={handleRequestNotifications}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors"
                >
                  Activar
                </button>
              </div>
            </Card>
          ) : (
            <Card
              variant="flat"
              padding="none"
              className="divide-y divide-slate-100 dark:divide-slate-800"
            >
              {[
                {
                  label: 'Eventos',
                  desc: 'Recordatorios de calendario',
                  val: eventNotifications,
                  setter: (v: boolean) =>
                    toggleSetting('notifications_events', v, setEventNotifications),
                  icon: Calendar,
                  color: 'text-blue-500',
                },
                {
                  label: 'Evangelio',
                  desc: 'Diario a las 7:00 AM',
                  val: dailyGospelNotifications,
                  setter: (v: boolean) =>
                    toggleSetting('notifications_gospel', v, setDailyGospelNotifications),
                  icon: BookOpen,
                  color: 'text-purple-500',
                },
                {
                  label: 'Santoral',
                  desc: 'Santo del día',
                  val: saintNotifications,
                  setter: (v: boolean) =>
                    toggleSetting('notifications_saints', v, setSaintNotifications),
                  icon: Sparkles,
                  color: 'text-amber-500',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div
                    className={cn('p-2 rounded-lg bg-slate-50 dark:bg-slate-800 mr-4', item.color)}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div
                    onClick={() => item.setter(!item.val)}
                    className={cn(
                      'w-12 h-7 rounded-full p-1 transition-colors cursor-pointer',
                      item.val ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                        item.val ? 'translate-x-5' : ''
                      )}
                    />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>

        {/* Updates Section */}
        <section>
          <h2 className="section-title">Actualizaciones</h2>
          <Card
            variant="flat"
            padding="none"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {/* Check for Updates */}
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors disabled:opacity-50"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                <RefreshCw className={cn('w-5 h-5', checkingUpdate && 'animate-spin')} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Buscar actualizaciones</p>
                <p className="text-xs text-slate-500">Verificar nueva versión</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

            {/* Apply Update - Only shown when update is available */}
            {updateAvailable && (
              <button
                onClick={handleForceUpdate}
                className="w-full flex items-center p-4 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg mr-4">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    ¡Nueva versión lista!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Toca para actualizar ahora
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  NUEVO
                </span>
              </button>
            )}
          </Card>
        </section>

        {/* Support & Install */}
        <section className="space-y-4">
          <InstallButton variant="settings" />

          <Card
            variant="flat"
            padding="none"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            <a
              href="https://wa.me/14155982433?text=Hola"
              target="_blank"
              rel="noreferrer"
              className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg mr-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Asistente WhatsApp</p>
                <p className="text-xs text-slate-500">Ayuda 24/7 con IA</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </a>
          </Card>
        </section>

        {/* Account */}
        {isSupabaseConfigured && user && (
          <section>
            <button
              onClick={handleLogout}
              className="w-full text-red-600 font-medium text-sm p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión ({user.email})
            </button>
          </section>
        )}

        <div className="text-center pb-8 pt-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            Versión 2.0.0
          </p>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">© 2025 Parroquia</p>
        </div>
      </div>
    </div>
  );
}
