'use client';

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-8 shadow-lg border border-white/20 dark:border-slate-700/30">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Bienvenido a Resply
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
          Asistente de Atención al Cliente con IA
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Dashboard en construcción. Próximamente: panel de administración completo con métricas, gestión de workspaces y más.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
