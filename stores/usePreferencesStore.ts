/**
 * User Preferences Store - Zustand State Management
 * 2025 Best Practices: Personalization Engine with Supabase sync
 *
 * Features:
 * - Theme (dark/light/system)
 * - Sidebar state (collapsed/expanded)
 * - Notification preferences
 * - Language selection
 * - Display density (compact/comfortable/spacious)
 * - Animations on/off
 * - Auto-sync to Supabase user metadata
 * - Load on app startup
 *
 * @see https://www.aalpha.net/blog/personalization-in-ux-best-practices/
 * @see https://www.restack.io/docs/supabase-knowledge-supabase-zustand-integration
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/useToastStore';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'es' | 'en';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  desktop: boolean;
  sound: boolean;
  newMessages: boolean;
  documentUploads: boolean;
  conversationUpdates: boolean;
  weeklyDigest: boolean;
}

export interface DisplayPreferences {
  density: Density;
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface SidebarPreferences {
  collapsed: boolean;
  position: 'left' | 'right';
  width: number; // in pixels
}

export interface PrivacyPreferences {
  analytics: boolean;
  crashReports: boolean;
  marketingEmails: boolean;
  dataSharing: boolean;
}

export interface UserPreferences {
  theme: Theme;
  language: Language;
  sidebar: SidebarPreferences;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  privacy: PrivacyPreferences;
  lastSyncedAt: string | null;
}

interface PreferencesStore {
  preferences: UserPreferences;
  isLoading: boolean;
  isSyncing: boolean;
  lastError: Error | null;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  setDisplayPreference: (key: keyof DisplayPreferences, value: boolean | Density) => void;
  setPrivacyPreference: (key: keyof PrivacyPreferences, value: boolean) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Sync operations
  loadFromSupabase: () => Promise<void>;
  syncToSupabase: (preferences: UserPreferences) => Promise<void>;
  resetToDefaults: () => void;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'es',
  sidebar: {
    collapsed: false,
    position: 'left',
    width: 280,
  },
  notifications: {
    email: true,
    inApp: true,
    desktop: true,
    sound: true,
    newMessages: true,
    documentUploads: true,
    conversationUpdates: true,
    weeklyDigest: false,
  },
  display: {
    density: 'comfortable',
    animations: true,
    reducedMotion: false,
    highContrast: false,
  },
  privacy: {
    analytics: true,
    crashReports: true,
    marketingEmails: false,
    dataSharing: false,
  },
  lastSyncedAt: null,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      isLoading: false,
      isSyncing: false,
      lastError: null,

      // Theme
      setTheme: (theme) => {
        set((state) => ({
          preferences: { ...state.preferences, theme },
        }));
        get().syncToSupabase(get().preferences);
        trackEvent(ANALYTICS_EVENTS.THEME_CHANGED, { theme });
      },

      // Language
      setLanguage: (language) => {
        set((state) => ({
          preferences: { ...state.preferences, language },
        }));
        get().syncToSupabase(get().preferences);
        trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { setting: 'language' });
      },

      // Sidebar
      setSidebarCollapsed: (collapsed) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            sidebar: { ...state.preferences.sidebar, collapsed },
          },
        }));
        get().syncToSupabase(get().preferences);
      },

      setSidebarWidth: (width) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            sidebar: { ...state.preferences.sidebar, width },
          },
        }));
        get().syncToSupabase(get().preferences);
      },

      // Notifications
      setNotificationPreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: { ...state.preferences.notifications, [key]: value },
          },
        }));
        get().syncToSupabase(get().preferences);
        trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { setting: `notification_${key}` });
      },

      // Display
      setDisplayPreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            display: { ...state.preferences.display, [key]: value },
          },
        }));
        get().syncToSupabase(get().preferences);
        trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { setting: `display_${key}` });
      },

      // Privacy
      setPrivacyPreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            privacy: { ...state.preferences.privacy, [key]: value },
          },
        }));
        get().syncToSupabase(get().preferences);
        trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { setting: `privacy_${key}` });
      },

      // Bulk update
      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
        get().syncToSupabase(get().preferences);
      },

      // Load from Supabase
      loadFromSupabase: async () => {
        if (!supabase) {
          console.warn('[Preferences] Supabase not initialized');
          return;
        }

        try {
          set({ isLoading: true, lastError: null });

          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.warn('[Preferences] No authenticated user');
            set({ isLoading: false });
            return;
          }

          // Load preferences from user metadata
          const metadata = user.user_metadata;
          const savedPreferences = metadata?.preferences as UserPreferences | undefined;

          if (savedPreferences) {
            // Merge with defaults to handle new fields
            set({
              preferences: {
                ...DEFAULT_PREFERENCES,
                ...savedPreferences,
                sidebar: {
                  ...DEFAULT_PREFERENCES.sidebar,
                  ...(savedPreferences.sidebar || {}),
                },
                notifications: {
                  ...DEFAULT_PREFERENCES.notifications,
                  ...(savedPreferences.notifications || {}),
                },
                display: {
                  ...DEFAULT_PREFERENCES.display,
                  ...(savedPreferences.display || {}),
                },
                privacy: {
                  ...DEFAULT_PREFERENCES.privacy,
                  ...(savedPreferences.privacy || {}),
                },
              },
              isLoading: false,
            });
            console.log('[Preferences] Loaded from Supabase:', savedPreferences);
          } else {
            // No saved preferences, use defaults
            set({ isLoading: false });
            console.log('[Preferences] Using defaults (no saved preferences)');
          }
        } catch (err) {
          const error = err as Error;
          console.error('[Preferences] Load error:', error);
          set({ lastError: error, isLoading: false });
        }
      },

      // Sync to Supabase
      syncToSupabase: async (preferences) => {
        if (!supabase) {
          console.warn('[Preferences] Supabase not initialized');
          return;
        }

        try {
          set({ isSyncing: true, lastError: null });

          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.warn('[Preferences] No authenticated user for sync');
            set({ isSyncing: false });
            return;
          }

          // Update user metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              preferences: {
                ...preferences,
                lastSyncedAt: new Date().toISOString(),
              },
            },
          });

          if (updateError) throw updateError;

          set({
            preferences: {
              ...preferences,
              lastSyncedAt: new Date().toISOString(),
            },
            isSyncing: false,
          });

          console.log('[Preferences] Synced to Supabase');
        } catch (err) {
          const error = err as Error;
          console.error('[Preferences] Sync error:', error);
          set({ lastError: error, isSyncing: false });
          toast.error('Failed to sync preferences');
        }
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({ preferences: DEFAULT_PREFERENCES });
        get().syncToSupabase(DEFAULT_PREFERENCES);
        toast.success('Preferences reset to defaults');
        trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { setting: 'reset_preferences' });
      },
    }),
    {
      name: 'resply-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

/**
 * Initialize preferences on app startup
 * Call this in your root layout or app component
 */
export function initializePreferences() {
  const store = usePreferencesStore.getState();
  store.loadFromSupabase();
}
