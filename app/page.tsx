'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Home as HomeComponent } from '@/components/Home';
import { TabNavigation } from '@/components/TabNavigation';
import { AuthScreen } from '@/components/auth';
import { InstallBanner } from '@/components/install';
import { useNavigationStore, type TabType } from '@/lib/store/navigationStore';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/Loading';

// Lazy loading de componentes pesados - se cargan solo cuando se necesitan
const Calendar = dynamic(
  () => import('@/components/Calendar').then((mod) => ({ default: mod.Calendar })),
  {
    loading: () => (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loading message="Cargando calendario..." />
      </div>
    ),
    ssr: false,
  }
);

const Chat = dynamic(() => import('@/components/Chat').then((mod) => ({ default: mod.Chat })), {
  loading: () => (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Loading message="Cargando chat..." />
    </div>
  ),
  ssr: false,
});

const Settings = dynamic(
  () => import('@/components/Settings').then((mod) => ({ default: mod.Settings })),
  {
    loading: () => (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loading message="Cargando ajustes..." />
      </div>
    ),
    ssr: false,
  }
);

export default function Home() {
  const { activeTab, setActiveTab } = useNavigationStore();
  const { user, loading, isSupabaseConfigured } = useAuth();

  // ✅ PWA 2025: Detectar parámetro ?tab=X para shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');

    // Validar que el tab existe y cambiar si es necesario
    if (tabParam && ['home', 'calendar', 'chat', 'settings'].includes(tabParam)) {
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

  // Si Supabase está configurado y no hay usuario, mostrar pantallas de auth
  if (isSupabaseConfigured && !user) {
    return <AuthScreen />;
  }

  // Usuario autenticado o Supabase no configurado (modo demo): mostrar la app
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Contenido principal - cambia según el tab activo */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeComponent />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'settings' && <Settings />}
      </div>

      {/* Navegación por tabs (bottom navigation) */}
      <TabNavigation />

      {/* Banner de instalación (aparece después de 30 segundos) */}
      <InstallBanner delay={30} position="bottom" />
    </div>
  );
}
