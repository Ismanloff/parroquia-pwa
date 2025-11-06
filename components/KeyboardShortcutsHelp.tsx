/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts organized by category
 *
 * Features:
 * - Auto-detects platform (Mac vs Windows/Linux)
 * - Grouped by categories
 * - Accessible (ARIA labels, keyboard navigation)
 * - Beautiful gradient design
 *
 * Usage:
 * <KeyboardShortcutsHelp isOpen={isOpen} onClose={() => setIsOpen(false)} />
 */

'use client';

import { X, Keyboard, Zap, Navigation, MousePointer, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  CATEGORY_LABELS,
  getShortcutsByCategory,
  type ShortcutDefinition,
} from '@/lib/keyboardShortcuts';
import { formatShortcut, getModifierKey } from '@/hooks/useKeyboardShortcut';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Get icon for category
 */
function getCategoryIcon(category: ShortcutDefinition['category']) {
  switch (category) {
    case 'general':
      return <Keyboard className="w-4 h-4" />;
    case 'navigation':
      return <Navigation className="w-4 h-4" />;
    case 'actions':
      return <Zap className="w-4 h-4" />;
    case 'modals':
      return <Layers className="w-4 h-4" />;
    default:
      return <MousePointer className="w-4 h-4" />;
  }
}

/**
 * Render keyboard key badge
 */
function KeyBadge({ keys }: { keys: string | string[] }) {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {keyArray.map((key, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mx-1">entonces</span>
          )}
          <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 shadow-sm">
            {formatShortcut(key)}
          </kbd>
        </div>
      ))}
    </div>
  );
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const modifierKey = getModifierKey();
  const categories: ShortcutDefinition['category'][] = ['general', 'navigation', 'actions'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="relative">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-6 py-8 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Keyboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Atajos de Teclado</h2>
                <p className="text-blue-100 dark:text-purple-100">
                  Navega más rápido con estos atajos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform indicator */}
          <div className="mt-4 flex items-center gap-2">
            <Badge
              variant="info"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30"
            >
              {modifierKey === '⌘' ? 'macOS' : 'Windows/Linux'}
            </Badge>
            <span className="text-xs text-blue-100 dark:text-purple-100">
              {modifierKey === '⌘' ? '⌘ = Cmd' : 'Ctrl = Control'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {categories.map((category) => {
              const shortcuts = getShortcutsByCategory(category);

              if (shortcuts.length === 0) return null;

              return (
                <div key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {CATEGORY_LABELS[category]}
                    </h3>
                  </div>

                  {/* Shortcuts list */}
                  <Card className="p-0 overflow-hidden">
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {shortcut.description}
                            </p>
                            {shortcut.scope && shortcut.scope !== 'global' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Disponible en: {shortcut.scope}
                              </p>
                            )}
                          </div>
                          <KeyBadge keys={shortcut.keys} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Footer tip */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 dark:bg-blue-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Consejo Pro
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-mono text-xs">{modifierKey}/</kbd> en
                  cualquier momento para ver esta ayuda. Los atajos secuenciales (como "g entonces
                  d") te permiten navegar sin usar el mouse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
