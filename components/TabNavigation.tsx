'use client';

import { MessageCircle, Calendar, Home, Settings } from 'lucide-react';
import { useNavigationStore, type TabType } from '@/lib/store/navigationStore';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useEffect, useState } from 'react';

const tabs = [
  {
    id: 'home' as TabType,
    label: 'Inicio',
    icon: Home,
    ariaLabel: 'Inicio - Ver evangelio y santo del día',
  },
  {
    id: 'calendar' as TabType,
    label: 'Calendario',
    icon: Calendar,
    ariaLabel: 'Calendario - Ver eventos parroquiales',
  },
  {
    id: 'chat' as TabType,
    label: 'Chat',
    icon: MessageCircle,
    ariaLabel: 'Chat - Preguntar al asistente parroquial',
  },
  {
    id: 'settings' as TabType,
    label: 'Ajustes',
    icon: Settings,
    ariaLabel: 'Ajustes - Configurar la aplicación',
  },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useNavigationStore();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Detectar cuando el teclado aparece en iOS usando Visual Viewport API
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Si el viewport height es significativamente menor que window.innerHeight, el teclado está visible
      const keyboardVisible = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardVisible(keyboardVisible);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Ocultar el nav cuando el teclado está visible
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      className="fixed left-4 right-4 z-50"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        maxWidth: 'calc(100vw - 2rem)',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <div
        className="rounded-[35px] shadow-lg overflow-hidden border border-white/50 dark:border-slate-700/50"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <style jsx>{`
          @supports not (backdrop-filter: blur(12px)) {
            div {
              background-color: rgba(255, 255, 255, 0.95) !important;
            }
          }
          @media (prefers-color-scheme: dark) {
            div {
              background-color: rgba(30, 41, 59, 0.72) !important;
            }
          }
        `}</style>
        <div className="flex justify-around px-2 dark:bg-slate-800/0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptics.light();
                  setActiveTab(tab.id);
                }}
                aria-label={tab.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 px-3 transition-all duration-300 relative',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn('transition-all duration-300', isActive ? 'w-7 h-7' : 'w-6 h-6')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-[10px] transition-all duration-300',
                    isActive ? 'font-bold' : 'font-medium'
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
