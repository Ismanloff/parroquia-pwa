/**
 * Optimistic UI Hook for User Preferences
 * TanStack Query v5 with Optimistic Updates - UPDATE Example
 *
 * Features:
 * - Instant UI updates for theme, language, notifications
 * - Automatic rollback on Supabase sync failure
 * - Integrated with Zustand store
 * - No loading spinners (instant feedback)
 *
 * @see https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/useToastStore';
import { queryKeys } from '@/lib/queryClient';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { UserPreferences } from '@/stores/usePreferencesStore';

interface UpdatePreferencesInput {
  userId: string;
  preferences: Partial<UserPreferences>;
}

/**
 * Update user preferences in Supabase
 */
async function updateUserPreferences({
  preferences,
}: UpdatePreferencesInput): Promise<UserPreferences> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('No authenticated user');
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

  return {
    ...preferences,
    lastSyncedAt: new Date().toISOString(),
  } as UserPreferences;
}

/**
 * Hook with optimistic updates for preferences
 * Works alongside Zustand store for instant local updates
 */
export function useOptimisticPreferences(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.preferences.user(userId);

  // Mutation: Update preferences with optimistic update
  const updateMutation = useMutation({
    mutationFn: updateUserPreferences,

    // Optimistic update: Apply changes immediately
    onMutate: async ({ preferences }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData<UserPreferences>(queryKey);

      // Optimistically update cache
      queryClient.setQueryData<UserPreferences>(queryKey, (old) => ({
        ...old,
        ...preferences,
      } as UserPreferences));

      // Return context for rollback
      return { previousPreferences };
    },

    // On error: Rollback to previous state
    onError: (err, _variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(queryKey, context.previousPreferences);
      }

      const error = err as Error;
      toast.error(`Error al guardar preferencias: ${error.message}`);
      trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'update_preferences' });
    },

    // On success: Confirm update (silent - no toast needed, already applied)
    onSuccess: () => {
      // Silent success - user already saw the change
      trackEvent(ANALYTICS_EVENTS.SETTINGS_UPDATED, { method: 'optimistic' });
    },

    // Always refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Helper hook for quick theme updates (most common use case)
 */
export function useOptimisticTheme(userId?: string) {
  const { updatePreferences, isUpdating } = useOptimisticPreferences(userId);

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({
      userId: userId || '',
      preferences: { theme } as Partial<UserPreferences>,
    });
  };

  return { setTheme, isUpdating };
}
