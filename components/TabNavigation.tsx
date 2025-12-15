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
      className="tab-navigation-bar fixed bottom-0 left-0 right-0 z-50 glass-panel pb-safe"
      style={{
        background: 'var(--tab-background)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--glass-border)',
      }}
    >
      <div className="flex justify-around items-center h-[68px] max-w-lg mx-auto px-2">
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
                'relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300',
                'touch-feedback'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Pill Background */}
              <div
                className={cn(
                  'absolute inset-x-2 top-2 bottom-2 rounded-2xl transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-[var(--tab-active-bg)] scale-100 opacity-100'
                    : 'bg-transparent scale-90 opacity-0'
                )}
              />

              {/* Icon Container */}
              <div
                className={cn(
                  'relative z-10 p-1.5 rounded-xl transition-all duration-300',
                  isActive && 'transform -translate-y-0.5'
                )}
              >
                <Icon
                  className={cn(
                    'transition-all duration-300',
                    isActive
                      ? 'w-6 h-6 text-[var(--tab-active-text)] stroke-[2.5px]'
                      : 'w-5 h-5 text-[var(--tab-inactive-text)] stroke-[1.8px]'
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'relative z-10 text-[10px] font-semibold tracking-tight transition-all duration-300',
                  isActive
                    ? 'text-[var(--tab-active-text)] opacity-100'
                    : 'text-[var(--tab-inactive-text)] opacity-80'
                )}
              >
                {tab.label}
              </span>

              {/* Active Indicator Dot */}
              <div
                className={cn(
                  'absolute bottom-1.5 w-1 h-1 rounded-full bg-[var(--tab-active-text)] transition-all duration-300',
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
