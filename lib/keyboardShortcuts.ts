/**
 * Global Keyboard Shortcuts Registry
 * Centralized configuration for all keyboard shortcuts in the app
 *
 * Benefits:
 * - Single source of truth for shortcuts
 * - Easy to detect conflicts
 * - Automatic help UI generation
 * - Consistent across the app
 */

export interface ShortcutDefinition {
  /**
   * Keyboard shortcut key combination
   * Examples: "cmd+k", "ctrl+/", "escape", ["g", "d"]
   */
  keys: string | string[];

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Category for grouping in help UI
   */
  category: 'navigation' | 'actions' | 'general' | 'modals';

  /**
   * Where this shortcut is available
   */
  scope?: 'global' | 'dashboard' | 'chat' | 'settings';
}

/**
 * Global keyboard shortcuts configuration
 * Add new shortcuts here to automatically include them in help UI
 */
export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  // General
  {
    keys: 'cmd+/',
    description: 'Mostrar ayuda de atajos de teclado',
    category: 'general',
    scope: 'global',
  },
  {
    keys: 'cmd+k',
    description: 'Abrir paleta de comandos',
    category: 'general',
    scope: 'global',
  },
  {
    keys: 'escape',
    description: 'Cerrar modal o diálogo',
    category: 'general',
    scope: 'global',
  },

  // Navigation
  {
    keys: ['g', 'd'],
    description: 'Ir al Dashboard',
    category: 'navigation',
    scope: 'dashboard',
  },
  {
    keys: ['g', 'c'],
    description: 'Ir a Conversaciones',
    category: 'navigation',
    scope: 'dashboard',
  },
  {
    keys: ['g', 'a'],
    description: 'Ir a Analíticas',
    category: 'navigation',
    scope: 'dashboard',
  },
  {
    keys: ['g', 'f'],
    description: 'Ir a Documentos',
    category: 'navigation',
    scope: 'dashboard',
  },
  {
    keys: ['g', 's'],
    description: 'Ir a Configuración',
    category: 'navigation',
    scope: 'dashboard',
  },

  // Actions
  {
    keys: 'cmd+,',
    description: 'Abrir configuración',
    category: 'actions',
    scope: 'dashboard',
  },
  {
    keys: 'cmd+b',
    description: 'Toggle sidebar',
    category: 'actions',
    scope: 'dashboard',
  },
  {
    keys: 'cmd+n',
    description: 'Nueva conversación',
    category: 'actions',
    scope: 'dashboard',
  },
  {
    keys: 'cmd+u',
    description: 'Subir documento',
    category: 'actions',
    scope: 'dashboard',
  },
];

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  category: ShortcutDefinition['category']
): ShortcutDefinition[] {
  return KEYBOARD_SHORTCUTS.filter((shortcut) => shortcut.category === category);
}

/**
 * Get shortcuts by scope
 */
export function getShortcutsByScope(scope: ShortcutDefinition['scope']): ShortcutDefinition[] {
  return KEYBOARD_SHORTCUTS.filter((shortcut) => shortcut.scope === scope);
}

/**
 * Get all shortcut categories
 */
export function getCategories(): ShortcutDefinition['category'][] {
  return Array.from(new Set(KEYBOARD_SHORTCUTS.map((s) => s.category)));
}

/**
 * Category labels for UI
 */
export const CATEGORY_LABELS: Record<ShortcutDefinition['category'], string> = {
  general: 'General',
  navigation: 'Navegación',
  actions: 'Acciones',
  modals: 'Modales',
};
