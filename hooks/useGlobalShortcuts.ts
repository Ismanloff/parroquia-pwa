/**
 * Global Keyboard Shortcuts Hook
 * Registers all application-wide keyboard shortcuts
 *
 * Features:
 * - Navigation shortcuts (g+d, g+c, etc.)
 * - Action shortcuts (cmd+/, cmd+b, etc.)
 * - Help modal toggle
 * - Analytics tracking
 *
 * Usage (in DashboardLayout):
 * const { isHelpOpen, closeHelp } = useGlobalShortcuts();
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useKeyboardShortcut, useSequentialShortcut } from './useKeyboardShortcut';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

interface UseGlobalShortcutsReturn {
  /**
   * Whether the keyboard shortcuts help modal is open
   */
  isHelpOpen: boolean;

  /**
   * Open the help modal
   */
  openHelp: () => void;

  /**
   * Close the help modal
   */
  closeHelp: () => void;
}

export function useGlobalShortcuts(): UseGlobalShortcutsReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Track shortcut usage
  const trackShortcut = useCallback(
    (shortcut: string, action: string) => {
      trackEvent(ANALYTICS_EVENTS.NAVIGATION_USED, {
        type: 'keyboard_shortcut',
        shortcut,
        action,
        from: pathname,
      });
    },
    [pathname]
  );

  // === GENERAL SHORTCUTS ===

  // cmd+/ or ctrl+/ - Show keyboard shortcuts help
  useKeyboardShortcut(
    'cmd+/',
    useCallback(() => {
      setIsHelpOpen((prev) => !prev);
      trackShortcut('cmd+/', 'toggle_shortcuts_help');
    }, [trackShortcut]),
    {
      description: 'Toggle keyboard shortcuts help',
      category: 'general',
    }
  );

  // Escape - Close help modal
  useKeyboardShortcut(
    'escape',
    useCallback(() => {
      if (isHelpOpen) {
        setIsHelpOpen(false);
        trackShortcut('escape', 'close_shortcuts_help');
      }
    }, [isHelpOpen, trackShortcut]),
    {
      description: 'Close modals',
      category: 'general',
      enabled: isHelpOpen, // Only enabled when modal is open
    }
  );

  // === NAVIGATION SHORTCUTS (Gmail-style) ===

  // g then d - Go to Dashboard
  useSequentialShortcut(
    ['g', 'd'],
    useCallback(() => {
      router.push('/dashboard');
      trackShortcut('g+d', 'navigate_dashboard');
    }, [router, trackShortcut]),
    {
      description: 'Go to Dashboard',
      category: 'navigation',
    }
  );

  // g then c - Go to Conversations
  useSequentialShortcut(
    ['g', 'c'],
    useCallback(() => {
      router.push('/dashboard/conversations');
      trackShortcut('g+c', 'navigate_conversations');
    }, [router, trackShortcut]),
    {
      description: 'Go to Conversations',
      category: 'navigation',
    }
  );

  // g then a - Go to Analytics
  useSequentialShortcut(
    ['g', 'a'],
    useCallback(() => {
      router.push('/dashboard/analytics');
      trackShortcut('g+a', 'navigate_analytics');
    }, [router, trackShortcut]),
    {
      description: 'Go to Analytics',
      category: 'navigation',
    }
  );

  // g then f - Go to Documents (Files)
  useSequentialShortcut(
    ['g', 'f'],
    useCallback(() => {
      router.push('/dashboard/documents');
      trackShortcut('g+f', 'navigate_documents');
    }, [router, trackShortcut]),
    {
      description: 'Go to Documents',
      category: 'navigation',
    }
  );

  // g then s - Go to Settings
  useSequentialShortcut(
    ['g', 's'],
    useCallback(() => {
      router.push('/dashboard/settings');
      trackShortcut('g+s', 'navigate_settings');
    }, [router, trackShortcut]),
    {
      description: 'Go to Settings',
      category: 'navigation',
    }
  );

  // === ACTION SHORTCUTS ===

  // cmd+, - Open Settings (macOS convention)
  useKeyboardShortcut(
    'cmd+,',
    useCallback(() => {
      router.push('/dashboard/settings');
      trackShortcut('cmd+,', 'open_settings');
    }, [router, trackShortcut]),
    {
      description: 'Open Settings',
      category: 'actions',
    }
  );

  return {
    isHelpOpen,
    openHelp: useCallback(() => setIsHelpOpen(true), []),
    closeHelp: useCallback(() => setIsHelpOpen(false), []),
  };
}
