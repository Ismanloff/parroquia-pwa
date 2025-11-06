'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardGuardProps {
  children: ReactNode;
}

/**
 * DashboardGuard - Protege rutas del dashboard verificando autenticación
 * Redirige a la landing page si el usuario no está autenticado
 */
export function DashboardGuard({ children }: DashboardGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si terminó de cargar y no hay usuario
    if (!loading && !user) {
      console.log('[DashboardGuard] No authenticated user, redirecting to /');
      router.push('/');
    }
  }, [user, loading, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, mostrar mensaje
  // (el useEffect ya habrá iniciado la redirección)
  if (!user) {
    return null;
  }

  // Usuario autenticado, mostrar contenido del dashboard
  return <>{children}</>;
}
