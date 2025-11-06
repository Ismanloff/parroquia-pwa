'use client';

import { Settings, Bell, Shield, Key, Palette, Database, Globe, Monitor, Smartphone, Volume2, Eye, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import type { Theme, Language, Density } from '@/stores/usePreferencesStore';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'security' | 'privacy' | 'api' | 'database';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const {
    preferences,
    isSyncing,
    setTheme,
    setLanguage,
    setNotificationPreference,
    setDisplayPreference,
    setPrivacyPreference,
    resetToDefaults,
  } = usePreferencesStore();

  const tabs = [
    { id: 'general' as const, name: 'General', icon: Settings },
    { id: 'appearance' as const, name: 'Apariencia', icon: Palette },
    { id: 'notifications' as const, name: 'Notificaciones', icon: Bell },
    { id: 'privacy' as const, name: 'Privacidad', icon: Lock },
    { id: 'security' as const, name: 'Seguridad', icon: Shield },
    { id: 'api' as const, name: 'API Keys', icon: Key },
    { id: 'database' as const, name: 'Base de Datos', icon: Database },
  ];

  return (
    <div className="p-6 sm:p-8">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Personaliza tu experiencia con Resply
          </p>
        </div>
        {isSyncing && (
          <Badge variant="info" size="sm" className="animate-pulse">
            Sincronizando...
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="p-4 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Configuración General
                </h2>
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  Restaurar Predeterminados
                </Button>
              </div>

              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <Globe className="w-4 h-4" />
                    Idioma
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    El idioma de la interfaz se actualizará automáticamente
                  </p>
                </div>

                {/* Last Synced */}
                {preferences.lastSyncedAt && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Última sincronización: {new Date(preferences.lastSyncedAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Personalización Visual
              </h2>

              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <Monitor className="w-4 h-4" />
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setTheme(theme)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          preferences.theme === theme
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">
                            {theme === 'light' && '☀️'}
                            {theme === 'dark' && '🌙'}
                            {theme === 'system' && '💻'}
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Density */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <Eye className="w-4 h-4" />
                    Densidad de Visualización
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['compact', 'comfortable', 'spacious'] as Density[]).map((density) => (
                      <button
                        key={density}
                        onClick={() => setDisplayPreference('density', density)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          preferences.display.density === density
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize text-center">
                          {density === 'compact' ? 'Compacto' : density === 'comfortable' ? 'Cómodo' : 'Espacioso'}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Controla el espaciado entre elementos de la interfaz
                  </p>
                </div>

                {/* Animations */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Animaciones</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Habilita transiciones y efectos visuales
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDisplayPreference('animations', !preferences.display.animations)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.display.animations ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.display.animations ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Reduced Motion */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Movimiento Reducido</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Reduce animaciones para mejor accesibilidad
                      </p>
                    </div>
                    <button
                      onClick={() => setDisplayPreference('reducedMotion', !preferences.display.reducedMotion)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.display.reducedMotion ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.display.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Alto Contraste</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Aumenta el contraste de colores para mejor lectura
                      </p>
                    </div>
                    <button
                      onClick={() => setDisplayPreference('highContrast', !preferences.display.highContrast)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.display.highContrast ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.display.highContrast ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Preferencias de Notificaciones
              </h2>

              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Email</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Recibe notificaciones por correo electrónico
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationPreference('email', !preferences.notifications.email)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.notifications.email ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.notifications.email ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* In-App Notifications */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">In-App</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Toasts y notificaciones dentro de la aplicación
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationPreference('inApp', !preferences.notifications.inApp)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.notifications.inApp ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.notifications.inApp ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Desktop Notifications */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Escritorio</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Notificaciones del navegador (requiere permiso)
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationPreference('desktop', !preferences.notifications.desktop)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.notifications.desktop ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.notifications.desktop ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Sonido</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Reproduce sonido con notificaciones
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationPreference('sound', !preferences.notifications.sound)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.notifications.sound ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.notifications.sound ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Event-Specific Notifications */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white mb-4">
                    Notificarme cuando:
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.newMessages}
                        onChange={(e) => setNotificationPreference('newMessages', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Llega un nuevo mensaje
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.documentUploads}
                        onChange={(e) => setNotificationPreference('documentUploads', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Se sube un nuevo documento
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.conversationUpdates}
                        onChange={(e) => setNotificationPreference('conversationUpdates', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Se actualiza una conversación
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.weeklyDigest}
                        onChange={(e) => setNotificationPreference('weeklyDigest', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Resumen semanal de actividad
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Privacidad y Datos
              </h2>

              <div className="space-y-6">
                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Analytics</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Ayúdanos a mejorar compartiendo datos de uso anónimos
                    </p>
                  </div>
                  <button
                    onClick={() => setPrivacyPreference('analytics', !preferences.privacy.analytics)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.privacy.analytics ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.privacy.analytics ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Crash Reports */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Reportes de Errores</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Envía reportes automáticos cuando ocurre un error
                    </p>
                  </div>
                  <button
                    onClick={() => setPrivacyPreference('crashReports', !preferences.privacy.crashReports)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.privacy.crashReports ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.privacy.crashReports ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Emails de Marketing</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Recibe noticias, actualizaciones y ofertas especiales
                    </p>
                  </div>
                  <button
                    onClick={() => setPrivacyPreference('marketingEmails', !preferences.privacy.marketingEmails)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.privacy.marketingEmails ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.privacy.marketingEmails ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Data Sharing */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Compartir Datos</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Comparte datos con partners de confianza
                    </p>
                  </div>
                  <button
                    onClick={() => setPrivacyPreference('dataSharing', !preferences.privacy.dataSharing)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      preferences.privacy.dataSharing ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        preferences.privacy.dataSharing ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Security Settings - Keeping original */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Configuración de Seguridad
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                    Autenticación de Dos Factores
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">2FA Desactivado</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Protege tu cuenta con 2FA
                        </p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm">Activar</Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                    Cambiar Contraseña
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="primary">Actualizar Contraseña</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* API Keys & Database - Keeping original tabs */}
          {activeTab === 'api' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                API Keys
              </h2>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Las API keys te permiten integrar Resply con otras aplicaciones. Mantén tus keys seguras y no las compartas.
                </p>
              </div>
              <Button variant="primary" className="w-full mt-6 flex items-center justify-center gap-2">
                <Key className="w-4 h-4" />
                Generar Nueva API Key
              </Button>
            </Card>
          )}

          {activeTab === 'database' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                Base de Datos
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Estado</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    Conectado
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tamaño</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    2.4 GB
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
