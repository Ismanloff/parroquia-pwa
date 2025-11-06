/**
 * Optimistic UI Hook for Documents
 * TanStack Query v5 with Optimistic Updates
 *
 * Features:
 * - Instant UI updates (optimistic)
 * - Automatic rollback on error
 * - Multi-component sync via cache
 * - Toast notifications
 *
 * @see https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
 */

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/useToastStore';
import { queryKeys } from '@/lib/queryClient';
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

interface UseOptimisticDocumentsOptions {
  workspaceId?: string;
}

/**
 * Fetch documents from Supabase
 */
async function fetchDocuments(workspaceId?: string): Promise<Document[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  let query = supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Document[];
}

/**
 * Delete document from Supabase
 */
async function deleteDocument(documentId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from('documents').delete().eq('id', documentId);

  if (error) throw error;
}

/**
 * Hook with optimistic updates for documents
 */
export function useOptimisticDocuments(options: UseOptimisticDocumentsOptions = {}) {
  const { workspaceId } = options;
  const queryClient = useQueryClient();
  const queryKey = queryKeys.documents.list(workspaceId);

  // Query: Fetch documents
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchDocuments(workspaceId),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation: Delete document with optimistic update
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,

    // Optimistic update: Remove document immediately from UI
    onMutate: async (documentId) => {
      // Cancel outgoing refetches (so they don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<Document[]>(queryKey);

      // Optimistically update cache (remove document)
      queryClient.setQueryData<Document[]>(queryKey, (old) =>
        old ? old.filter((doc) => doc.id !== documentId) : []
      );

      // Show optimistic toast
      toast.info('Eliminando documento...');

      // Return context with previous value (for rollback)
      return { previousDocuments };
    },

    // On error: Rollback to previous state
    onError: (err, _documentId, context) => {
      // Rollback cache to previous state
      if (context?.previousDocuments) {
        queryClient.setQueryData(queryKey, context.previousDocuments);
      }

      const error = err as Error;
      toast.error(`Error al eliminar: ${error.message}`);
      trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, { type: 'delete_document' });
    },

    // On success: Confirm deletion
    onSuccess: () => {
      toast.success('Documento eliminado exitosamente');
      trackEvent(ANALYTICS_EVENTS.DOCUMENT_DELETED);
    },

    // Always refetch after success or error to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
