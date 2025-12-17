'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Home as HomeComponent } from '@/components/Home';
import { TabNavigation } from '@/components/TabNavigation';
import { InstallBanner } from '@/components/install';
import { useNavigationStore, type TabType } from '@/lib/store/navigationStore';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/Loading';

// Lazy loading de componentes pesados - se cargan solo cuando se necesitan
const Calendar = dynamic(() => import('@/components/Calendar'), {
  loading: () => (
    <div className="flex flex-col h-screen bg-background p-6">
      <Loading message="Cargando calendario..." />
    </div>
  ),
  ssr: false,
});

const Settings = dynamic(
  () => import('@/components/Settings').then((mod) => ({ default: mod.Settings })),
  {
    loading: () => (
      <div className="flex flex-col h-screen bg-background p-6">
        <Loading message="Cargando ajustes..." />
      </div>
    ),
    ssr: false,
  }
);

import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { activeTab, setActiveTab } = useNavigationStore();
  const { loading, isSupabaseConfigured } = useAuth();

  // ✅ PWA 2025: Detectar parámetro ?tab=X para shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');

    // Validar que el tab existe y cambiar si es necesario
    if (tabParam && ['home', 'calendar', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);

      // Limpiar URL sin recargar (opcional, para que quede limpio)
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      window.history.replaceState({}, '', url);
    }
  }, [setActiveTab]);

  // Mostrar loading mientras se verifica la sesión
  if (loading && isSupabaseConfigured) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loading message="Verificando sesión..." />
      </div>
    );
  }

  // 🎉 PWA PÚBLICA: No requerimos autenticación
  // Si Supabase está configurado y no hay usuario, permitimos el acceso igual

  // Usuario autenticado o Supabase no configurado (modo demo): mostrar la app
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      {/* Contenido principal - con animaciones premium */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1], // Apple-style ease out
            }}
            className="absolute inset-0 overflow-hidden"
          >
            {activeTab === 'home' && <HomeComponent />}
            {activeTab === 'calendar' && <Calendar />}
            {activeTab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación por tabs (bottom navigation) */}
      <TabNavigation />

      {/* Banner de instalación - solo se muestra cuando toca */}
      <InstallBanner delay={30} position="bottom" />
    </div>
  );
}
