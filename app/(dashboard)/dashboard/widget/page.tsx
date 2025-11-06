'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { Copy, Check, Code, Palette, Save, Eye, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

interface WidgetSettings {
  primary_color: string;
  secondary_color: string;
  bot_name: string;
  bot_avatar: string;
  welcome_message: string;
  position: 'bottom-right' | 'bottom-left';
  auto_open: boolean;
  auto_open_delay: number;
  show_branding: boolean;
  play_sound: boolean;
}

export default function WidgetPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<WidgetSettings>({
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    bot_name: 'Asistente IA',
    bot_avatar: 'R',
    welcome_message: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    position: 'bottom-right',
    auto_open: false,
    auto_open_delay: 3,
    show_branding: true,
    play_sound: false,
  });

  // Fetch settings on mount
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchSettings();
    }
  }, [activeWorkspaceId]);

  const fetchSettings = async () => {
    if (!activeWorkspaceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/widget/settings?workspaceId=${activeWorkspaceId}`);
      const data = await response.json();

      if (data.success && data.settings) {
        setSettings({
          primary_color: data.settings.primary_color,
          secondary_color: data.settings.secondary_color,
          bot_name: data.settings.bot_name,
          bot_avatar: data.settings.bot_avatar,
          welcome_message: data.settings.welcome_message,
          position: data.settings.position,
          auto_open: data.settings.auto_open,
          auto_open_delay: data.settings.auto_open_delay,
          show_branding: data.settings.show_branding,
          play_sound: data.settings.play_sound,
        });
      }
    } catch (error) {
      console.error('Error fetching widget settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!activeWorkspaceId) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/widget/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          ...settings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuración guardada exitosamente');
      } else {
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving widget settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = (platform: 'html' | 'wordpress' | 'shopify' | 'webflow' | 'react') => {
    const baseCode = `<script src="https://resply.vercel.app/widget/resply-widget.js"></script>
<script>
  ResplyWidget.init({
    workspaceId: '${activeWorkspaceId}'
  });
</script>`;

    switch (platform) {
      case 'html':
        return `<!-- Agrega este código antes del cierre </body> -->
${baseCode}`;

      case 'wordpress':
        return `<!-- En WordPress: Apariencia → Editor de temas → footer.php -->
<!-- O usar plugin "Insert Headers and Footers" -->
${baseCode}`;

      case 'shopify':
        return `<!-- En Shopify: -->
<!-- 1. Ve a Online Store → Themes → Actions → Edit code -->
<!-- 2. Abre theme.liquid -->
<!-- 3. Pega este código antes de </body> -->
${baseCode}`;

      case 'webflow':
        return `<!-- En Webflow: -->
<!-- 1. Project Settings → Custom Code → Footer Code -->
<!-- 2. Pega este código: -->
${baseCode}`;

      case 'react':
        return `// Opción 1: Script en public/index.html antes de </body>
${baseCode}

// Opción 2: Usar useEffect en App.tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://resply.vercel.app/widget/resply-widget.js';
  script.async = true;
  document.body.appendChild(script);

  script.onload = () => {
    (window as any).ResplyWidget.init({
      workspaceId: '${activeWorkspaceId}'
    });
  };

  return () => {
    document.body.removeChild(script);
  };
}, []);`;

      default:
        return baseCode;
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-400">Selecciona un workspace</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Widget de Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personaliza y embebe el chat en tu sitio web
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Apariencia
            </h2>

            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Principal
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-20 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bot Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Bot
                </label>
                <input
                  type="text"
                  value={settings.bot_name}
                  onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Asistente IA"
                />
              </div>

              {/* Bot Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar del Bot (Emoji o Letra)
                </label>
                <input
                  type="text"
                  value={settings.bot_avatar}
                  onChange={(e) => setSettings({ ...settings, bot_avatar: e.target.value })}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl"
                  placeholder="R"
                />
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje de Bienvenida
                </label>
                <textarea
                  value={settings.welcome_message}
                  onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="¡Hola! 👋 Soy tu asistente virtual."
                />
              </div>
            </div>
          </div>

          {/* Behavior Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Comportamiento
            </h2>

            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posición
                </label>
                <select
                  value={settings.position}
                  onChange={(e) => setSettings({ ...settings, position: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bottom-right">Abajo Derecha</option>
                  <option value="bottom-left">Abajo Izquierda</option>
                </select>
              </div>

              {/* Auto Open */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Abrir Automáticamente
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Abre el widget al cargar la página
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_open}
                    onChange={(e) => setSettings({ ...settings, auto_open: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Auto Open Delay */}
              {settings.auto_open && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delay de Apertura (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.auto_open_delay}
                    onChange={(e) => setSettings({ ...settings, auto_open_delay: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Show Branding */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar "Powered by Resply"
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Muestra el branding de Resply
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_branding}
                    onChange={(e) => setSettings({ ...settings, show_branding: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa
            </h2>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 relative h-[600px] border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
              Simulación del widget en tu sitio
            </p>

            {/* Widget Button */}
            <div
              className={`absolute ${settings.position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 w-16 h-16 rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105`}
              style={{ background: settings.primary_color }}
            >
              <span className="text-white text-2xl">{settings.bot_avatar}</span>
            </div>

            {/* Widget Window Preview */}
            <div
              className={`absolute ${settings.position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-24 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden`}
            >
              {/* Header */}
              <div
                className="p-4 flex items-center gap-3 text-white"
                style={{ background: settings.primary_color }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                  {settings.bot_avatar}
                </div>
                <div>
                  <div className="font-semibold">{settings.bot_name}</div>
                  <div className="text-xs opacity-90">En línea</div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 max-h-60 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  {settings.welcome_message}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900"
                />
                <button
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ background: settings.primary_color }}
                >
                  →
                </button>
              </div>

              {/* Branding */}
              {settings.show_branding && (
                <div className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  Powered by <span className="font-semibold">Resply</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Installation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Código de Instalación
        </h2>

        <div className="space-y-6">
          {/* HTML */}
          <InstallationSection
            title="HTML / Sitio Estático"
            code={generateCode('html')}
            onCopy={copyToClipboard}
            copied={copied}
          />

          {/* WordPress */}
          <InstallationSection
            title="WordPress"
            code={generateCode('wordpress')}
            onCopy={copyToClipboard}
            copied={copied}
          />

          {/* Shopify */}
          <InstallationSection
            title="Shopify"
            code={generateCode('shopify')}
            onCopy={copyToClipboard}
            copied={copied}
          />

          {/* Webflow */}
          <InstallationSection
            title="Webflow"
            code={generateCode('webflow')}
            onCopy={copyToClipboard}
            copied={copied}
          />

          {/* React */}
          <InstallationSection
            title="React / Next.js"
            code={generateCode('react')}
            onCopy={copyToClipboard}
            copied={copied}
          />
        </div>
      </div>

      {/* Test Link */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🧪 Probar Widget
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          Prueba el widget en acción:
        </p>
        <a
          href="https://resply.vercel.app/widget/example.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          https://resply.vercel.app/widget/example.html
        </a>
      </div>
    </div>
  );
}

// Component for each installation section
function InstallationSection({
  title,
  code,
  onCopy,
  copied,
}: {
  title: string;
  code: string;
  onCopy: (code: string) => void;
  copied: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button
          onClick={() => onCopy(code)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
