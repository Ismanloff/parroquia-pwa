import { useState, useEffect, useCallback } from 'react';

interface Conversation {
  id: string;
  workspace_id: string;
  user_id: string;
  channel: string;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  // Extended properties from API joins
  workspace_name?: string;
  user_email?: string;
  messages_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
}

export function useConversations(workspaceId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!workspaceId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/conversations/list?workspaceId=${workspaceId}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refresh: fetchConversations,
  };
}

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/conversations/${conversationId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setConversation(data.conversation);
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    isLoading,
    error,
    refresh: fetchConversation,
  };
}
