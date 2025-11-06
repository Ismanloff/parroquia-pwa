/**
 * useRealtimeConversations Hook
 *
 * Real-time subscription to conversations and messages using Supabase Realtime
 * 2025 Best Practices: Proper cleanup, error handling, and optimistic updates
 *
 * Features:
 * - Live conversation updates (INSERT, UPDATE, DELETE)
 * - Live message updates within conversations
 * - Automatic reconnection on network issues
 * - Proper subscription cleanup
 * - Type-safe with TypeScript
 *
 * @see https://supabase.com/docs/guides/realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/useToastStore';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

export interface Conversation {
  id: string;
  workspace_id: string;
  channel_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  customer_metadata: any;
  assigned_agent_id: string | null;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Computed fields
  messages_count?: number;
  last_message?: string;
  workspace_name?: string;
  user_email?: string;
}

interface UseRealtimeConversationsOptions {
  workspaceId?: string;
  enabled?: boolean;
}

export function useRealtimeConversations(options: UseRealtimeConversationsOptions = {}) {
  const { workspaceId, enabled = true } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial conversations
  const fetchConversations = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('conversations')
        .select(`
          *,
          workspace:workspaces(name),
          messages(content, created_at)
        `)
        .order('last_message_at', { ascending: false });

      // Filter by workspace if provided
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match our interface
      const transformedData = (data || []).map((conv: any) => ({
        ...conv,
        workspace_name: conv.workspace?.name || 'Unknown Workspace',
        messages_count: conv.messages?.length || 0,
        last_message: conv.messages?.[0]?.content || 'No messages yet',
        user_email: conv.customer_phone || 'Unknown User',
      }));

      setConversations(transformedData);
      trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, { page: 'conversations' });
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error loading conversations: ${error.message}`);
      trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'fetch_conversations' });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!enabled || !supabase) {
      setIsLoading(false);
      return;
    }

    fetchConversations();

    // Create Realtime channel
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversations',
          ...(workspaceId && { filter: `workspace_id=eq.${workspaceId}` }),
        },
        (payload) => {
          console.log('[Realtime] Conversation change:', payload);

          if (payload.eventType === 'INSERT') {
            // New conversation created
            const newConv = payload.new as Conversation;
            setConversations((prev) => [newConv, ...prev]);
            toast.success('New conversation received!');
            trackEvent(ANALYTICS_EVENTS.CONVERSATION_STARTED);
          } else if (payload.eventType === 'UPDATE') {
            // Conversation updated
            const updatedConv = payload.new as Conversation;
            setConversations((prev) =>
              prev.map((conv) => (conv.id === updatedConv.id ? updatedConv : conv))
            );
          } else if (payload.eventType === 'DELETE') {
            // Conversation deleted
            const deletedConv = payload.old as Conversation;
            setConversations((prev) => prev.filter((conv) => conv.id !== deletedConv.id));
            toast.info('Conversation removed');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Realtime] New message:', payload);

          // Update conversation's last_message_at and message count
          const message = payload.new as any;
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === message.conversation_id) {
                return {
                  ...conv,
                  last_message_at: message.created_at,
                  last_message: message.content,
                  messages_count: (conv.messages_count || 0) + 1,
                };
              }
              return conv;
            })
          );

          // Show toast notification for new messages
          toast.info('New message received');
          trackEvent(ANALYTICS_EVENTS.MESSAGE_RECEIVED);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Real-time connected');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('❌ Real-time disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error('Real-time connection error');
          trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'realtime_error' });
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (supabase) {
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [enabled, workspaceId, fetchConversations]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    isConnected,
    refresh,
  };
}
