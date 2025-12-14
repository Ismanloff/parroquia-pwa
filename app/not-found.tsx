'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50 dark:bg-slate-900">
      <h1 className="text-6xl font-bold text-slate-800 dark:text-slate-200 mb-4">404</h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Página no encontrada</p>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        Volver al inicio
      </Link>
    </div>
  );
}
