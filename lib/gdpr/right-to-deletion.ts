/**
 * GDPR Right to Deletion - Article 17
 *
 * Implements complete user data deletion across all systems for GDPR compliance.
 *
 * Process:
 * 1. Soft delete user content (conversations, messages, documents)
 * 2. Delete Pinecone vector data (all workspace namespaces)
 * 3. Remove user from workspaces
 * 4. Anonymize audit logs (retain for legal requirements)
 * 5. Delete auth.users record
 *
 * @see https://gdpr-info.eu/art-17-gdpr/ - Right to erasure
 * @module lib/gdpr/right-to-deletion
 */

import { supabaseAdmin } from '@/app/lib/supabase';
import { pinecone } from '@/app/lib/pinecone';
import { logGDPRDeletion } from '@/lib/audit';
import type { DeletionResult, DeletionOptions } from './types';

/**
 * Delete all user data across the platform (GDPR Article 17)
 *
 * This is a multi-step process that ensures complete data erasure:
 * - Soft deletes content (with 90-day retention for legal purposes)
 * - Hard deletes vector embeddings from Pinecone
 * - Anonymizes audit logs (retains for 1 year per legal requirements)
 * - Removes authentication data
 *
 * @param userId - User ID to delete
 * @param options - Deletion options
 * @returns Deletion result with summary of deleted data
 */
export async function deleteUserData(
  userId: string,
  options: DeletionOptions = {}
): Promise<DeletionResult> {
  const {
    hardDelete = false,
    anonymizeAuditLogs: shouldAnonymizeAuditLogs = true,
    deletePineconeData: shouldDeletePineconeData = true,
    reason = 'GDPR Article 17 - Right to Deletion',
    deletedBy = userId, // Self-service deletion by default
  } = options;

  const errors: string[] = [];
  const result: DeletionResult = {
    success: false,
    deleted: {
      authUser: false,
      workspaces: 0,
      conversations: 0,
      messages: 0,
      documents: 0,
      documentChunks: 0,
      pineconeNamespaces: [],
      auditLogsAnonymized: 0,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    // Log the start of deletion process
    await logGDPRDeletion(
      userId,
      undefined, // No specific workspace
      { reason, initiated_by: deletedBy }
    );

    console.log(`🗑️  Starting GDPR deletion for user: ${userId}`);

    // STEP 1: Get user's workspaces (needed for Pinecone cleanup)
    const { data: workspaces } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId);

    const workspaceIds = workspaces?.map((w) => w.workspace_id) || [];
    console.log(`📂 User belongs to ${workspaceIds.length} workspace(s)`);

    // STEP 2: Soft delete user content
    const contentResult = await softDeleteUserContent(userId, hardDelete);
    result.deleted.conversations = contentResult.conversations;
    result.deleted.messages = contentResult.messages;
    result.deleted.documents = contentResult.documents;
    result.deleted.documentChunks = contentResult.documentChunks;
    console.log(
      `📝 Deleted: ${contentResult.conversations} conversations, ${contentResult.messages} messages, ${contentResult.documents} documents`
    );

    // STEP 3: Delete Pinecone vector data
    if (shouldDeletePineconeData && workspaceIds.length > 0) {
      try {
        const deletedNamespaces = await deletePineconeUserData(userId, workspaceIds);
        result.deleted.pineconeNamespaces = deletedNamespaces;
        console.log(`🔢 Deleted Pinecone data from ${deletedNamespaces.length} namespace(s)`);
      } catch (error: any) {
        errors.push(`Pinecone deletion failed: ${error.message}`);
        console.error('❌ Pinecone deletion error:', error);
      }
    }

    // STEP 4: Remove user from all workspaces
    const workspacesRemoved = await removeFromWorkspaces(userId);
    result.deleted.workspaces = workspacesRemoved;
    console.log(`🏢 Removed from ${workspacesRemoved} workspace(s)`);

    // STEP 5: Anonymize audit logs (legal retention requirement)
    if (shouldAnonymizeAuditLogs) {
      const anonymized = await anonymizeAuditLogs(userId);
      result.deleted.auditLogsAnonymized = anonymized;
      console.log(`📋 Anonymized ${anonymized} audit log(s)`);
    }

    // STEP 6: Delete auth.users record (final step)
    const authDeleted = await deleteAuthUser(userId);
    result.deleted.authUser = authDeleted;
    console.log(`👤 Auth user deleted: ${authDeleted}`);

    // Mark as successful if auth user was deleted
    result.success = authDeleted;

    if (errors.length > 0) {
      result.errors = errors;
    }

    console.log(`✅ GDPR deletion completed for user: ${userId}`);
    return result;
  } catch (error: any) {
    console.error('❌ GDPR deletion failed:', error);
    errors.push(`Deletion process failed: ${error.message}`);
    result.errors = errors;
    return result;
  }
}

/**
 * Soft delete all user content (conversations, messages, documents)
 *
 * Uses soft delete to maintain data integrity for 90 days (GDPR allows
 * reasonable retention for legal/operational purposes).
 *
 * @param userId - User ID
 * @param hardDelete - Whether to hard delete immediately
 * @returns Count of deleted items
 */
async function softDeleteUserContent(
  userId: string,
  hardDelete: boolean = false
): Promise<{
  conversations: number;
  messages: number;
  documents: number;
  documentChunks: number;
}> {
  const now = new Date().toISOString();

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Get user's conversations across all workspaces
  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .or(`created_by.eq.${userId}`); // Conversations created by user

  const conversationIds = conversations?.map((c) => c.id) || [];

  if (hardDelete) {
    // Hard delete (not recommended, breaks audit trail)
    const { data: messagesData } = await supabaseAdmin
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds)
      .select();

    const { data: conversationsData } = await supabaseAdmin
      .from('conversations')
      .delete()
      .in('id', conversationIds)
      .select();

    const { data: documentChunksData } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('created_by', userId)
      .select();

    const { data: documentsData } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('uploaded_by', userId)
      .select();

    return {
      conversations: conversationsData?.length || 0,
      messages: messagesData?.length || 0,
      documents: documentsData?.length || 0,
      documentChunks: documentChunksData?.length || 0,
    };
  } else {
    // Soft delete (recommended)
    // Messages in user's conversations
    const { data: messagesData } = await supabaseAdmin
      .from('messages')
      .update({ deleted_at: now })
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .select();

    // Conversations
    const { data: conversationsData } = await supabaseAdmin
      .from('conversations')
      .update({ deleted_at: now })
      .in('id', conversationIds)
      .is('deleted_at', null)
      .select();

    // Document chunks uploaded by user
    const { data: documentChunksData } = await supabaseAdmin
      .from('document_chunks')
      .update({ deleted_at: now })
      .eq('created_by', userId)
      .is('deleted_at', null)
      .select();

    // Documents uploaded by user
    const { data: documentsData } = await supabaseAdmin
      .from('documents')
      .update({ deleted_at: now })
      .eq('uploaded_by', userId)
      .is('deleted_at', null)
      .select();

    return {
      conversations: conversationsData?.length || 0,
      messages: messagesData?.length || 0,
      documents: documentsData?.length || 0,
      documentChunks: documentChunksData?.length || 0,
    };
  }
}

/**
 * Delete all user's vector embeddings from Pinecone
 *
 * Deletes data from all workspace namespaces the user belongs to.
 * This is a hard delete as vector data has no retention requirement.
 *
 * @param userId - User ID
 * @param workspaceIds - Workspace IDs to clean up
 * @returns List of deleted namespace IDs
 */
async function deletePineconeUserData(
  userId: string,
  workspaceIds: string[]
): Promise<string[]> {
  const deletedNamespaces: string[] = [];

  if (!pinecone || workspaceIds.length === 0) {
    return deletedNamespaces;
  }

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');

  for (const workspaceId of workspaceIds) {
    try {
      const namespace = `saas_tenant_${workspaceId}`;

      // Delete all vectors created by this user in this namespace
      // Use metadata filter: created_by = userId
      await index.namespace(namespace).deleteMany({
        created_by: userId,
      });

      deletedNamespaces.push(namespace);
      console.log(`🔢 Deleted Pinecone data for user ${userId} in namespace: ${namespace}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete Pinecone data in workspace ${workspaceId}:`, error);
      // Continue with other workspaces even if one fails
    }
  }

  return deletedNamespaces;
}

/**
 * Remove user from all workspaces
 *
 * Deletes workspace_members records. If user is the last owner of a workspace,
 * the workspace should be handled separately (either deleted or ownership transferred).
 *
 * @param userId - User ID
 * @returns Count of workspace memberships removed
 */
async function removeFromWorkspaces(userId: string): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // TODO: Check if user is the last owner of any workspace
  // For now, we'll just remove the memberships
  const { data } = await supabaseAdmin
    .from('workspace_members')
    .delete()
    .eq('user_id', userId)
    .select();

  return data?.length || 0;
}

/**
 * Anonymize audit logs for a user
 *
 * GDPR requires deletion of personal data, but legal compliance often requires
 * retaining audit logs. We anonymize by:
 * - Setting user_id to NULL
 * - Redacting IP addresses
 * - Keeping action/resource type for compliance reporting
 *
 * Logs are retained for 1 year as per SOC 2 requirements.
 *
 * @param userId - User ID to anonymize
 * @returns Count of anonymized logs
 */
async function anonymizeAuditLogs(userId: string): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Anonymize by setting user_id to NULL and redacting IP
  const { data } = await supabaseAdmin
    .from('audit_logs')
    .update({
      user_id: null,
      ip_address: null,
      user_agent: null,
      details: { _anonymized: true, _anonymized_at: new Date().toISOString() },
    })
    .eq('user_id', userId)
    .select();

  return data?.length || 0;
}

/**
 * Delete user from auth.users table
 *
 * This is the final step in the deletion process. Once this is done,
 * the user can no longer authenticate.
 *
 * @param userId - User ID to delete
 * @returns True if deletion was successful
 */
async function deleteAuthUser(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('❌ Failed to delete auth user:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('❌ Exception deleting auth user:', error);
    return false;
  }
}

/**
 * Get deletion status for a user
 *
 * Checks if a user has been deleted or is in the process of deletion.
 *
 * @param userId - User ID to check
 * @returns Deletion status information
 */
export async function getDeletionStatus(userId: string): Promise<{
  isDeleted: boolean;
  softDeletedContent?: {
    conversations: number;
    messages: number;
    documents: number;
  };
  anonymizedAuditLogs?: boolean;
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Check if auth user exists
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (!authUser.user) {
    // User is fully deleted
    return { isDeleted: true };
  }

  // Check for soft-deleted content
  const { count: softDeletedConversations } = await supabaseAdmin
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .or(`created_by.eq.${userId}`)
    .not('deleted_at', 'is', null);

  const { count: softDeletedMessages } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .not('deleted_at', 'is', null);

  const { count: softDeletedDocuments } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('uploaded_by', userId)
    .not('deleted_at', 'is', null);

  // Check if audit logs have been anonymized
  const { count: anonymizedLogs } = await supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null)
    .filter('details', 'cs', '{"_anonymized":true}');

  return {
    isDeleted: false,
    softDeletedContent: {
      conversations: softDeletedConversations || 0,
      messages: softDeletedMessages || 0,
      documents: softDeletedDocuments || 0,
    },
    anonymizedAuditLogs: (anonymizedLogs || 0) > 0,
  };
}
