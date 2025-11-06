/**
 * useRealtimeDocuments Hook
 *
 * Real-time subscription to documents using Supabase Realtime
 * 2025 Best Practices: Upload progress tracking, status updates, error handling
 *
 * Features:
 * - Live document updates (INSERT, UPDATE, DELETE)
 * - Real-time upload progress (pending → processing → completed)
 * - Real-time error notifications
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

export interface Document {
  id: string;
  workspace_id: string | null;
  filename: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  status: string | null;
  error_message: string | null;
  chunk_count: number | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  processed_at: string | null;
  updated_at?: string;
}

interface UseRealtimeDocumentsOptions {
  workspaceId?: string;
  enabled?: boolean;
}

export function useRealtimeDocuments(options: UseRealtimeDocumentsOptions = {}) {
  const { workspaceId, enabled = true } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Fetch initial documents
  const fetchDocuments = useCallback(async () => {
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      // Filter by workspace if provided
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform null to undefined for updated_at to match Document type
      const transformedData = (data || []).map(doc => ({
        ...doc,
        updated_at: doc.updated_at ?? undefined
      }));

      setDocuments(transformedData);

      // Count uploading/processing documents
      const uploading = (data || []).filter(
        (doc) => doc.status === 'pending' || doc.status === 'processing'
      ).length;
      setUploadingCount(uploading);

      trackEvent(ANALYTICS_EVENTS.PAGE_VIEWED, { page: 'documents' });
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error loading documents: ${error.message}`);
      trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'fetch_documents' });
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

    fetchDocuments();

    // Create Realtime channel
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'documents',
          ...(workspaceId && { filter: `workspace_id=eq.${workspaceId}` }),
        },
        (payload) => {
          console.log('[Realtime] Document change:', payload);

          if (payload.eventType === 'INSERT') {
            // New document uploaded
            const newDoc = payload.new as Document;
            setDocuments((prev) => [newDoc, ...prev]);
            setUploadingCount((prev) => prev + 1);
            toast.info(`📄 Uploading "${newDoc.filename}"...`);
            trackEvent(ANALYTICS_EVENTS.DOCUMENT_UPLOADED, {
              type: newDoc.mime_type || 'unknown',
            });
          } else if (payload.eventType === 'UPDATE') {
            // Document status updated (processing, completed, error)
            const updatedDoc = payload.new as Document;
            const oldDoc = payload.old as Document;

            setDocuments((prev) =>
              prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
            );

            // Show notifications based on status changes
            if (oldDoc.status !== updatedDoc.status) {
              if (updatedDoc.status === 'processing') {
                toast.info(`⚙️ Processing "${updatedDoc.filename}"...`);
              } else if (updatedDoc.status === 'completed') {
                setUploadingCount((prev) => Math.max(0, prev - 1));
                toast.success(`✅ "${updatedDoc.filename}" ready!`);
                trackEvent(ANALYTICS_EVENTS.DOCUMENT_VIEWED);
              } else if (updatedDoc.status === 'error') {
                setUploadingCount((prev) => Math.max(0, prev - 1));
                toast.error(`❌ Error processing "${updatedDoc.filename}"`);
                trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
                  type: 'document_processing',
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Document deleted
            const deletedDoc = payload.old as Document;
            setDocuments((prev) => prev.filter((doc) => doc.id !== deletedDoc.id));
            toast.info(`🗑️ Document removed`);
            trackEvent(ANALYTICS_EVENTS.DOCUMENT_DELETED);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Real-time connected (Documents)');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('❌ Real-time disconnected (Documents)');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error('Real-time connection error');
          trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'realtime_error' });
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[Realtime] Cleaning up subscription (Documents)');
      if (supabase) {
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [enabled, workspaceId, fetchDocuments]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Delete document function - now uses API endpoint for complete cleanup
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!supabase) return;

      try {
        // Call API endpoint to delete from all locations:
        // - Supabase Storage (file)
        // - document_chunks table
        // - Pinecone vectors
        // - documents table
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete document');
        }

        const result = await response.json();
        console.log('Document deleted:', result);

        toast.success('Document deleted successfully from all locations');
      } catch (err) {
        const error = err as Error;
        toast.error(`Error deleting document: ${error.message}`);
        trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'delete_document' });
      }
    },
    [supabase]
  );

  return {
    documents,
    isLoading,
    error,
    isConnected,
    uploadingCount,
    refresh,
    deleteDocument,
  };
}
