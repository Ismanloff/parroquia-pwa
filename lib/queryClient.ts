/**
 * TanStack Query Client Configuration
 * 2025 Best Practices: Optimistic updates, error handling, retry logic
 *
 * @see https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (data considered fresh for 5 min)
      staleTime: 5 * 60 * 1000,

      // Refetch on window focus (good for real-time apps)
      refetchOnWindowFocus: true,

      // Refetch on mount if data is stale
      refetchOnMount: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Retry failed requests
      retry: 1,

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime in v4

      // Error handling
      throwOnError: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Error handling
      throwOnError: false,

      // Global mutation handlers (can be overridden per mutation)
      onError: (error) => {
        console.error('[Mutation Error]', error);
      },
    },
  },
});

/**
 * Query Keys - Centralized for consistency
 * Following best practices: ['entity', ...filters]
 */
export const queryKeys = {
  // Documents
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (workspaceId?: string) =>
      [...queryKeys.documents.lists(), workspaceId] as const,
    detail: (id: string) => [...queryKeys.documents.all, 'detail', id] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (workspaceId?: string) =>
      [...queryKeys.conversations.lists(), workspaceId] as const,
    detail: (id: string) =>
      [...queryKeys.conversations.all, 'detail', id] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.workspaces.all, 'detail', id] as const,
  },

  // User preferences
  preferences: {
    all: ['preferences'] as const,
    user: (userId?: string) =>
      [...queryKeys.preferences.all, 'user', userId] as const,
  },
} as const;
