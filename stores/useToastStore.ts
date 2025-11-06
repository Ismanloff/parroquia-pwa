/**
 * Toast Store - Zustand State Management
 * 2025 Best Practices: Centralized toast notifications with Zustand
 *
 * Features:
 * - Auto-dismiss with WCAG 2.2 compliant durations (min 4s)
 * - Multiple toast types (success, error, warning, info)
 * - Stack toasts vertically
 * - Persistent until dismissed or timeout
 * - Accessible with ARIA live regions
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// Zustand store for toast state management
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // WCAG 2.2 compliant durations:
    // - Success/Info: 4s (minimum for reading)
    // - Warning: 5s (more important, needs attention)
    // - Error: 6s (critical, user must read)
    const defaultDuration =
      type === 'error' ? 6000 : type === 'warning' ? 5000 : 4000;

    const toast: Toast = {
      id,
      message,
      type,
      duration: duration ?? defaultDuration,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * Toast API - Simple helper functions for common use cases
 *
 * @example
 * toast.success('Workspace created!');
 * toast.error('Failed to load data');
 * toast.warning('You have unsaved changes');
 * toast.info('New features available');
 */
export const toast = {
  success: (message: string, duration?: number) => {
    return useToastStore.getState().addToast(message, 'success', duration);
  },

  error: (message: string, duration?: number) => {
    return useToastStore.getState().addToast(message, 'error', duration);
  },

  warning: (message: string, duration?: number) => {
    return useToastStore.getState().addToast(message, 'warning', duration);
  },

  info: (message: string, duration?: number) => {
    return useToastStore.getState().addToast(message, 'info', duration);
  },

  dismiss: (id: string) => {
    return useToastStore.getState().removeToast(id);
  },

  clear: () => {
    return useToastStore.getState().clearAll();
  },
};
