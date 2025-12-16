'use client';

import { WifiOff, RefreshCw, Home, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-slate-500 dark:text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Sin conexión</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta
            nuevamente.
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-6"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar conexión
        </button>

        {/* Offline Content Available */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Contenido disponible offline
          </h2>
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Inicio</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Navegar al inicio</p>
              </div>
            </Link>

            <Link
              href="/evangelio"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  Evangelio del día
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Última versión guardada
                </p>
              </div>
            </Link>

            <Link
              href="/?tab=calendar"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Calendario</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Eventos guardados</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
            <span className="font-semibold">Nota:</span> Algunos contenidos pueden estar
            desactualizados mientras estés sin conexión. Los cambios se sincronizarán
            automáticamente cuando vuelvas a conectarte.
          </p>
        </div>
      </div>
    </div>
  );
}
