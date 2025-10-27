'use client';

// Empty States - PWA Best Practices 2025
// Estados vacíos informativos (SIN botones de crear, solo mensajes)

import { LucideIcon, Calendar, MessageSquare, RefreshCw, WifiOff } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const handleAction = () => {
    if (action?.onClick) {
      haptics.medium();
      action.onClick();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[28px] p-8 max-w-sm w-full border border-white/20 dark:border-slate-700/30 shadow-lg text-center animate-spring-in">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {description}
        </p>

        {action && (
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl shadow-lg transition-all active:scale-95"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Predefined empty states
export function EmptyCalendar({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No hay eventos esta semana"
      description="No hay eventos programados para esta semana. Revisa otras fechas o vuelve más tarde."
      action={
        onRefresh
          ? {
              label: 'Actualizar',
              onClick: onRefresh,
            }
          : undefined
      }
    />
  );
}

export function EmptyChat() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Haz tu primera pregunta"
      description="Pregunta sobre horarios de misa, sacramentos, actividades parroquiales o la fe católica."
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="Sin conexión"
      description="Revisa tu conexión a internet e intenta de nuevo."
      action={
        onRetry
          ? {
              label: 'Reintentar',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Error al cargar"
      description="No se pudo cargar el contenido. Por favor, intenta de nuevo."
      action={
        onRetry
          ? {
              label: 'Reintentar',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}
