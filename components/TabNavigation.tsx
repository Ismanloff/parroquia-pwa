'use client';

import { Calendar, Home, Settings } from 'lucide-react';
import { useNavigationStore, type TabType } from '@/lib/store/navigationStore';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

const tabs = [
  {
    id: 'home' as TabType,
    label: 'Inicio',
    icon: Home,
  },
  {
    id: 'calendar' as TabType,
    label: 'Calendario',
    icon: Calendar,
  },
  {
    id: 'settings' as TabType,
    label: 'Ajustes',
    icon: Settings,
  },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useNavigationStore();

  return (
    <nav
      className="tab-navigation-bar fixed bottom-0 left-0 right-0 z-50 glass-panel"
      style={{
        background: 'var(--tab-background)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--glass-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center h-[56px] max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isActive) {
                  haptics.light();
                  setActiveTab(tab.id);
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300',
                'touch-feedback'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  'transition-all duration-200',
                  isActive
                    ? 'w-6 h-6 text-[var(--tab-active-text)] stroke-[2.2px]'
                    : 'w-6 h-6 text-[var(--tab-inactive-text)] stroke-[1.5px]'
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  'text-[11px] font-medium transition-all duration-200',
                  isActive ? 'text-[var(--tab-active-text)]' : 'text-[var(--tab-inactive-text)]'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
