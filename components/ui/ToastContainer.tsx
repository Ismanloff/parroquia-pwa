'use client';

import { useToastStore } from '@/stores/useToastStore';
import type { Toast } from '@/stores/useToastStore';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { haptics } from '@/lib/haptics';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-700';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700';
    }
  };

  const getIconColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const handleDismiss = (id: string) => {
    haptics.light();
    removeToast(id);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] pointer-events-none max-w-md w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col gap-3 px-4">
        {toasts.map((t, index) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`
              pointer-events-auto
              flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border
              backdrop-blur-xl
              transition-all duration-300 ease-out
              ${getStyles(t.type)}
            `}
            style={{
              animation: `toast-slide-in 0.3s ease-out ${index * 0.05}s both`,
              backdropFilter: 'blur(16px) saturate(180%)',
            }}
          >
            <div className={`flex-shrink-0 mt-0.5 ${getIconColor(t.type)}`}>
              {getIcon(t.type)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
