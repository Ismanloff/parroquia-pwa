'use client';

import { useState } from 'react';
import { Settings, User, Bell, Shield, Key, Palette, Database, Mail, Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'security' | 'api' | 'database';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const tabs = [
    { id: 'general' as const, name: 'General', icon: Settings },
    { id: 'appearance' as const, name: 'Apariencia', icon: Palette },
    { id: 'notifications' as const, name: 'Notificaciones', icon: Bell },
    { id: 'security' as const, name: 'Seguridad', icon: Shield },
    { id: 'api' as const, name: 'API Keys', icon: Key },
    { id: 'database' as const, name: 'Base de Datos', icon: Database },
  ];

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Configuración
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestiona la configuración del sistema
        </p>
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
            <>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  Información General
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nombre del Sistema
                    </label>
                    <input
                      type="text"
                      defaultValue="Resply"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      defaultValue="admin@resply.com"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Zona Horaria
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
                      <option>UTC-5 (America/New_York)</option>
                      <option>UTC-6 (America/Mexico_City)</option>
                      <option>UTC-8 (America/Los_Angeles)</option>
                      <option>UTC+0 (Europe/London)</option>
                      <option>UTC+1 (Europe/Madrid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Idioma
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
                      <option>Español</option>
                      <option>English</option>
                      <option>Português</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">Guardar Cambios</Button>
                </div>
              </Card>
            </>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  Personalización
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Modo Oscuro</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Activa el tema oscuro del sistema
                      </p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Color Principal
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {['#2563eb', '#7c3aed', '#dc2626', '#059669', '#ea580c', '#0891b2'].map((color) => (
                        <button
                          key={color}
                          className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Tamaño de Fuente
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white">
                      <option>Pequeño</option>
                      <option>Mediano (Predeterminado)</option>
                      <option>Grande</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">Guardar Cambios</Button>
                </div>
              </Card>
            </>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  Preferencias de Notificaciones
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Recibe notificaciones por correo electrónico
                      </p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Recibe notificaciones push en el navegador
                      </p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pushNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          pushNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <p className="font-medium text-slate-900 dark:text-white mb-4">
                      Notificarme cuando:
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Se crea un nuevo workspace
                        </span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Hay una nueva conversación
                        </span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Se sube un nuevo documento
                        </span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Se producen errores del sistema
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">Guardar Cambios</Button>
                </div>
              </Card>
            </>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <>
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
                          <p className="text-sm font-medium text-slate-900 dark:text-white">2FA Activado</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Última actualización: hace 2 días
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Activo</Badge>
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
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Sesiones Activas
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            MacBook Pro - Chrome
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            New York, USA • Activa ahora
                          </p>
                        </div>
                        <Badge variant="success" size="sm">Actual</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            iPhone 15 - Safari
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            New York, USA • Hace 2 horas
                          </p>
                        </div>
                        <Button variant="outline" className="text-xs px-3 py-1">
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button variant="primary">Actualizar Contraseña</Button>
                </div>
              </Card>
            </>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  API Keys
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Las API keys te permiten integrar Resply con otras aplicaciones. Mantén tus keys seguras y no las compartas.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Production API Key
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Creada hace 30 días
                          </p>
                        </div>
                        <Badge variant="success" size="sm">Activa</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white">
                          rsp_live_••••••••••••••••••••1a2b3c
                        </code>
                        <Button variant="outline" className="text-xs px-3 py-2">
                          Copiar
                        </Button>
                        <Button variant="outline" className="text-xs px-3 py-2 text-red-600 dark:text-red-400">
                          Revocar
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Development API Key
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Creada hace 15 días
                          </p>
                        </div>
                        <Badge variant="info" size="sm">Test</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white">
                          rsp_test_••••••••••••••••••••9x8y7z
                        </code>
                        <Button variant="outline" className="text-xs px-3 py-2">
                          Copiar
                        </Button>
                        <Button variant="outline" className="text-xs px-3 py-2 text-red-600 dark:text-red-400">
                          Revocar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                    <Key className="w-4 h-4" />
                    Generar Nueva API Key
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                  Base de Datos
                </h2>
                <div className="space-y-6">
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
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tablas</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        18
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Vectores</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        45,289
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Mantenimiento
                    </h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Database className="w-4 h-4" />
                        Optimizar Base de Datos
                      </Button>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Database className="w-4 h-4" />
                        Crear Backup
                      </Button>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        <Database className="w-4 h-4" />
                        Limpiar Datos Antiguos
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                      Último Backup
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            backup_2025_01_20.sql
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Hace 6 horas • 1.8 GB
                          </p>
                        </div>
                        <Button variant="outline" className="text-xs px-3 py-2">
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
