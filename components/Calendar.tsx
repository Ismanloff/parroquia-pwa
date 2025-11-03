'use client';

import { Calendar as CalendarIcon } from 'lucide-react';

export function Calendar() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-8 shadow-lg border border-white/20 dark:border-slate-700/30 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-6">
          <CalendarIcon className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Calendario
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Vista de calendario próximamente
        </p>
      </div>
    </div>
  );
}
