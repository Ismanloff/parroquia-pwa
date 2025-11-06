'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  FileText,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
  Plus,
  Home,
  LogOut,
  Moon,
} from 'lucide-react';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import './CommandPalette.css';

interface CommandAction {
  id: string;
  label: string;
  keywords?: string[];
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Toggle with ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => {
          const newState = !open;
          if (newState) {
            trackEvent(ANALYTICS_EVENTS.COMMAND_PALETTE_OPENED);
          }
          return newState;
        });
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
      setIsOpen(false);
      setSearch('');
    },
    [router]
  );

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.classList.remove('dark', 'light');
    html.classList.add(newTheme);
    localStorage.setItem('theme-mode', newTheme);
    setIsOpen(false);
  }, []);

  const commands: CommandAction[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Ir al Dashboard',
      keywords: ['dashboard', 'home', 'inicio'],
      icon: Home,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_home' });
        handleNavigate('/dashboard');
      },
    },
    {
      id: 'nav-conversations',
      label: 'Ver Conversaciones',
      keywords: ['conversations', 'chat', 'mensajes', 'messages'],
      icon: MessageSquare,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_conversations' });
        handleNavigate('/dashboard/conversations');
      },
    },
    {
      id: 'nav-analytics',
      label: 'Ver Analytics',
      keywords: ['analytics', 'estadísticas', 'métricas', 'stats'],
      icon: BarChart3,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_analytics' });
        handleNavigate('/dashboard/analytics');
      },
    },
    {
      id: 'nav-documents',
      label: 'Gestionar Documentos',
      keywords: ['documents', 'docs', 'archivos', 'files'],
      icon: FileText,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_documents' });
        handleNavigate('/dashboard/documents');
      },
    },
    {
      id: 'nav-settings',
      label: 'Ir a Configuración',
      keywords: ['settings', 'config', 'configuración', 'ajustes'],
      icon: Settings,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_settings' });
        handleNavigate('/dashboard/settings');
      },
    },
    {
      id: 'nav-workspaces',
      label: 'Ver Workspaces',
      keywords: ['workspaces', 'espacios', 'organizaciones'],
      icon: Users,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'nav_workspaces' });
        handleNavigate('/workspaces');
      },
    },
    // Actions
    {
      id: 'action-new-workspace',
      label: 'Crear Nuevo Workspace',
      keywords: ['new', 'create', 'nuevo', 'crear', 'workspace'],
      icon: Plus,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.COMMAND_EXECUTED, { command: 'new_workspace' });
        handleNavigate('/workspaces/new');
      },
      shortcut: '⌘N',
    },
    {
      id: 'action-toggle-theme',
      label: 'Cambiar Tema',
      keywords: ['theme', 'dark', 'light', 'modo', 'oscuro', 'claro'],
      icon: Moon,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.THEME_CHANGED);
        toggleTheme();
      },
    },
    {
      id: 'action-logout',
      label: 'Cerrar Sesión',
      keywords: ['logout', 'sign out', 'salir', 'cerrar sesión'],
      icon: LogOut,
      action: () => {
        trackEvent(ANALYTICS_EVENTS.USER_LOGGED_OUT);
        handleNavigate('/logout');
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <Command
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div className="command-palette-header">
          <Search className="command-palette-search-icon" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar acciones... (⌘K)"
            className="command-palette-input"
            autoFocus
          />
        </div>

        <Command.List className="command-palette-list">
          <Command.Empty className="command-palette-empty">
            No se encontraron resultados para "{search}"
          </Command.Empty>

          <Command.Group heading="Navegación" className="command-palette-group">
            {commands
              .filter((cmd) => cmd.id.startsWith('nav-'))
              .map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.id}
                    onSelect={cmd.action}
                    className="command-palette-item"
                    keywords={cmd.keywords}
                  >
                    <Icon className="command-palette-item-icon" />
                    <span className="command-palette-item-label">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="command-palette-item-shortcut">{cmd.shortcut}</span>
                    )}
                  </Command.Item>
                );
              })}
          </Command.Group>

          <Command.Separator className="command-palette-separator" />

          <Command.Group heading="Acciones" className="command-palette-group">
            {commands
              .filter((cmd) => cmd.id.startsWith('action-'))
              .map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.id}
                    onSelect={cmd.action}
                    className="command-palette-item"
                    keywords={cmd.keywords}
                  >
                    <Icon className="command-palette-item-icon" />
                    <span className="command-palette-item-label">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="command-palette-item-shortcut">{cmd.shortcut}</span>
                    )}
                  </Command.Item>
                );
              })}
          </Command.Group>
        </Command.List>

        <div className="command-palette-footer">
          <div className="command-palette-footer-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd> para navegar
          </div>
          <div className="command-palette-footer-hint">
            <kbd>↵</kbd> para seleccionar
          </div>
          <div className="command-palette-footer-hint">
            <kbd>esc</kbd> para cerrar
          </div>
        </div>
      </Command>
    </div>
  );
}

// Export hook for opening from anywhere
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { isOpen, setIsOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
