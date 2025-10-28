'use client';

import { useState } from 'react';
import { Send, Bell, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from '@/lib/toast';

interface NotificationForm {
  title: string;
  body: string;
  url: string;
}

export default function AdminNotificationsPage() {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    url: '/',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          url: form.url,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar notificaciones');
      }

      setLastResult(result);

      if (result.total === 0) {
        toast.error(
          result.message ||
            'No hay dispositivos registrados. Los usuarios deben activar las notificaciones primero.'
        );
      } else {
        toast.success(`Notificaciones enviadas: ${result.successful}/${result.total}`);
        // Limpiar formulario solo si se enviaron notificaciones
        setForm({
          title: '',
          body: '',
          url: '/',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Nuevo evento',
      body: 'Se ha agregado un nuevo evento al calendario',
      url: '/calendario',
    },
    {
      title: 'Misa especial',
      body: 'Mañana habrá misa especial a las 19:00',
      url: '/calendario',
    },
    {
      title: 'Evangelio del día',
      body: 'Ya está disponible el evangelio de hoy',
      url: '/evangelio',
    },
  ];

  const applyQuickAction = (action: (typeof quickActions)[0]) => {
    setForm(action);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Panel de Notificaciones
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Envía notificaciones push a todos los dispositivos
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Enviar notificación
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Título de la notificación"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={50}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {form.title.length}/50 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Contenido de la notificación"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  maxLength={150}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {form.body.length}/150 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  URL destino
                </label>
                <select
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                >
                  <option value="/">Inicio</option>
                  <option value="/evangelio">Evangelio</option>
                  <option value="/santo">Santo del día</option>
                  <option value="/calendario">Calendario</option>
                  <option value="/chat">Chat</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !form.title.trim() || !form.body.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar a todos
                  </>
                )}
              </button>
            </form>

            {/* Resultado */}
            {lastResult && (
              <div
                className={`mt-6 p-4 rounded-xl ${
                  lastResult.total === 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastResult.total === 0 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        lastResult.total === 0
                          ? 'text-yellow-900 dark:text-yellow-100'
                          : 'text-green-900 dark:text-green-100'
                      }`}
                    >
                      {lastResult.total === 0
                        ? 'No hay dispositivos registrados'
                        : 'Notificaciones enviadas'}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        lastResult.total === 0
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}
                    >
                      {lastResult.total === 0
                        ? 'Los usuarios deben activar las notificaciones desde /configuracion/notificaciones'
                        : `${lastResult.successful} exitosas de ${lastResult.total} dispositivos${lastResult.failed > 0 ? ` (${lastResult.failed} fallidas)` : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Plantillas rápidas
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickAction(action)}
                    disabled={isLoading}
                    className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {action.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{action.body}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                    Información importante
                  </h3>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Solo usuarios con PWA instalada recibirán notificaciones</li>
                    <li>• Las notificaciones se envían a todos los dispositivos activos</li>
                    <li>• El título máximo es 50 caracteres</li>
                    <li>• El mensaje máximo es 150 caracteres</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
