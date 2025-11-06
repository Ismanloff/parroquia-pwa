/**
 * Custom Hook for Keyboard Shortcuts
 * Based on best practices from react-hotkeys-hook and web accessibility standards
 *
 * Features:
 * - Global keyboard shortcuts
 * - Automatic cleanup on unmount
 * - Prevention of conflicts with screen readers
 * - Support for modifier keys (Ctrl, Cmd, Alt, Shift)
 * - Sequential keys support (like "g then d" for Gmail-style navigation)
 *
 * Usage:
 * useKeyboardShortcut('cmd+k', () => openCommandPalette(), { description: 'Open command palette' })
 * useKeyboardShortcut(['g', 'd'], () => navigate('/dashboard'), { description: 'Go to dashboard' })
 *
 * @see https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutOptions {
  /**
   * Description of what this shortcut does (for help UI)
   */
  description?: string;

  /**
   * Category for grouping shortcuts in help UI
   */
  category?: string;

  /**
   * Enable/disable the shortcut
   * @default true
   */
  enabled?: boolean;

  /**
   * Prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Stop event propagation
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * Only trigger when target is not an input/textarea
   * @default true
   */
  ignoreInputs?: boolean;

  /**
   * Timeout for sequential key combinations (in ms)
   * @default 1000
   */
  sequenceTimeout?: number;
}

interface ParsedKey {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Parse keyboard shortcut string
 * Examples:
 * - "cmd+k" → { key: "k", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }
 * - "ctrl+shift+p" → { key: "p", ctrlKey: true, shiftKey: true, metaKey: false, altKey: false }
 * - "escape" → { key: "Escape", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
 */
function parseShortcut(shortcut: string): ParsedKey {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1] || '';

  return {
    key: key === 'escape' ? 'Escape' : key,
    ctrlKey: parts.includes('ctrl'),
    metaKey: parts.includes('cmd') || parts.includes('meta'),
    shiftKey: parts.includes('shift'),
    altKey: parts.includes('alt'),
  };
}

/**
 * Check if event matches the parsed shortcut
 */
function matchesShortcut(event: KeyboardEvent, parsed: ParsedKey): boolean {
  return (
    event.key.toLowerCase() === parsed.key.toLowerCase() &&
    event.ctrlKey === parsed.ctrlKey &&
    event.metaKey === parsed.metaKey &&
    event.shiftKey === parsed.shiftKey &&
    event.altKey === parsed.altKey
  );
}

/**
 * Check if target element is an input field
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Hook for single keyboard shortcut
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
  } = options;

  const callbackRef = useRef(callback);
  const parsedRef = useRef(parseShortcut(shortcut));

  // Update refs when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
    parsedRef.current = parseShortcut(shortcut);
  }, [callback, shortcut]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input field
      if (ignoreInputs && isInputElement(event.target)) {
        return;
      }

      // Check if event matches the shortcut
      if (matchesShortcut(event, parsedRef.current)) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        callbackRef.current(event);
      }
    },
    [enabled, ignoreInputs, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for sequential keyboard shortcuts (like Gmail's "g then d")
 */
export function useSequentialShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
    sequenceTimeout = 1000,
  } = options;

  const callbackRef = useRef(callback);
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update refs when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const resetSequence = useCallback(() => {
    sequenceRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input field
      if (ignoreInputs && isInputElement(event.target)) {
        resetSequence();
        return;
      }

      // Ignore modifier keys
      if (event.ctrlKey || event.metaKey || event.altKey) {
        resetSequence();
        return;
      }

      const key = event.key.toLowerCase();

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add key to sequence
      sequenceRef.current.push(key);

      // Check if sequence matches
      if (sequenceRef.current.length === keys.length) {
        const matches = keys.every((k, i) => k.toLowerCase() === sequenceRef.current[i]);

        if (matches) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }

          callbackRef.current(event);
        }

        resetSequence();
      } else {
        // Set timeout to reset sequence
        timeoutRef.current = setTimeout(resetSequence, sequenceTimeout);
      }
    },
    [enabled, ignoreInputs, keys, preventDefault, stopPropagation, sequenceTimeout, resetSequence]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resetSequence();
    };
  }, [enabled, handleKeyDown, resetSequence]);
}

/**
 * Utility: Get platform-specific modifier key label
 * @returns "⌘" on Mac, "Ctrl" on Windows/Linux
 */
export function getModifierKey(): '⌘' | 'Ctrl' {
  if (typeof window === 'undefined') return 'Ctrl';
  return navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}

/**
 * Utility: Format shortcut for display
 * Example: "cmd+k" → "⌘K" (Mac) or "Ctrl+K" (Windows)
 */
export function formatShortcut(shortcut: string): string {
  const parts = shortcut.split('+');
  const modifierKey = getModifierKey();

  return parts
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === 'cmd' || lower === 'meta') return modifierKey;
      if (lower === 'ctrl') return 'Ctrl';
      if (lower === 'shift') return 'Shift';
      if (lower === 'alt') return 'Alt';
      if (lower === 'escape') return 'Esc';
      return part.toUpperCase();
    })
    .join('+');
}
