'use client';

import { useState } from 'react';
import {
  Send,
  Smartphone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    body: '',
    url: '/', // Default to home
    image: '',
    topic: 'all', // all | segments (future)
  });

  // Preview state
  const isPreview = true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Simple auth check header (in a real text this would be a real token)
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'parroquia-admin-2025',
        },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          data: {
            url: form.url,
            image: form.image,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Error al enviar la notificación');
      }

      setSuccess(true);
      // Reset form slightly but keep success message
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Panel de Notificaciones
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestiona y envía alertas push a todos los dispositivos registrados.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Nueva Notificación
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Evangelio del día disponible"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">{form.title.length}/50</p>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={150}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Escribe el contenido de la notificación..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">{form.body.length}/150</p>
                </div>

                {/* Opciones Avanzadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ruta de destino (URL)
                    </label>
                    <select
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="/">🏠 Inicio</option>
                      <option value="/?tab=calendar">📅 Calendario</option>
                      <option value="/?tab=settings">⚙️ Ajustes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Imagen (Opcional URL)
                    </label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                      <input
                        type="url"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Notificación
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Feedback States */}
              {success && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-green-800 dark:text-green-300 font-medium">
                    ¡Notificación enviada con éxito!
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Preview */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Vista Previa
            </h3>

            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

              {/* Pantalla Simulada */}
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-50 dark:bg-slate-900 relative">
                {/* Status Bar */}
                <div className="h-10 bg-black/20 flex justify-between items-center px-6 text-[10px] text-white font-medium">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 bg-white rounded-full opacity-60"></span>
                    <span className="w-3 h-3 bg-white rounded-full opacity-60"></span>
                    <span className="w-3 h-3 bg-white rounded-full"></span>
                  </div>
                </div>

                {/* Notification Banner Simulator */}
                <div className="mt-4 mx-2">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-gray-100 flex gap-3 animate-in slide-in-from-top-4 duration-700">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                      P
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-gray-900 truncate pr-2">
                          {form.title || 'Título de ejemplo'}
                        </h4>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">Ahora</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {form.body ||
                          'Aquí aparecerá el contenido de tu mensaje push cuando lo escribas...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fondo de pantalla difuminado */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Próximamente
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                La programación de envíos y estadísticas de apertura estarán disponibles en la v2.0
                del panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
