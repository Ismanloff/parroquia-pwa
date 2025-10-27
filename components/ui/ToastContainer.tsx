'use client';

import { useEffect, useState } from 'react';
import { toast, Toast } from '@/lib/toast';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { haptics } from '@/lib/haptics';

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

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
        return 'bg-green-500/95 text-white border-green-400/30';
      case 'error':
        return 'bg-red-500/95 text-white border-red-400/30';
      case 'warning':
        return 'bg-amber-500/95 text-white border-amber-400/30';
      case 'info':
        return 'bg-blue-500/95 text-white border-blue-400/30';
    }
  };

  const handleDismiss = (id: string) => {
    haptics.light();
    toast.dismiss(id);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col gap-2 p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`
              pointer-events-auto
              flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg
              backdrop-blur-xl border
              animate-toast-slide-down
              ${getStyles(t.type)}
            `}
            style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
          >
            <div className="flex-shrink-0">
              {getIcon(t.type)}
            </div>
            <p className="flex-1 text-sm font-medium leading-tight">
              {t.message}
            </p>
            <button
              onClick={() => handleDismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
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
