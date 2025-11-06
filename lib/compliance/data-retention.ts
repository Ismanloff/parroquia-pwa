/**
 * Data Retention Policies
 *
 * Defines and enforces data retention policies for GDPR and SOC 2 compliance.
 *
 * Retention Periods:
 * - Audit Logs: 1 year (anonymized after)
 * - Conversations/Messages: 90 days after soft delete
 * - Documents: Manual deletion (owner decides)
 * - User Data: Immediate on GDPR request
 * - Sessions: 30 days inactive
 *
 * @module lib/compliance/data-retention
 */

import { supabaseAdmin } from '@/app/lib/supabase';

/**
 * Data retention periods in days
 */
export const RETENTION_PERIODS = {
  AUDIT_LOGS: 365,              // 1 year (then anonymized)
  SOFT_DELETED_CONTENT: 90,     // 90 days (then hard deleted)
  INACTIVE_SESSIONS: 30,        // 30 days
  DOCUMENTS: -1,                // Manual deletion (no automatic retention)
  GDPR_EXPORT_FILES: 7,         // 7 days (if we store exports)
} as const;

/**
 * Data retention policy for a resource type
 */
export interface RetentionPolicy {
  resourceType: string;
  retentionPeriodDays: number;
  description: string;
  isAutomatic: boolean;
  cleanupFunction?: string;
}

/**
 * Get all retention policies
 */
export function getRetentionPolicies(): RetentionPolicy[] {
  return [
    {
      resourceType: 'audit_logs',
      retentionPeriodDays: RETENTION_PERIODS.AUDIT_LOGS,
      description: 'Audit logs are anonymized after 1 year (PII removed, logs retained for compliance)',
      isAutomatic: true,
      cleanupFunction: 'anonymize_old_audit_logs()',
    },
    {
      resourceType: 'conversations',
      retentionPeriodDays: RETENTION_PERIODS.SOFT_DELETED_CONTENT,
      description: 'Soft-deleted conversations are hard deleted after 90 days',
      isAutomatic: true,
      cleanupFunction: 'cleanup_old_soft_deleted()',
    },
    {
      resourceType: 'messages',
      retentionPeriodDays: RETENTION_PERIODS.SOFT_DELETED_CONTENT,
      description: 'Soft-deleted messages are hard deleted after 90 days',
      isAutomatic: true,
      cleanupFunction: 'cleanup_old_soft_deleted()',
    },
    {
      resourceType: 'documents',
      retentionPeriodDays: RETENTION_PERIODS.DOCUMENTS,
      description: 'Documents are retained until manually deleted by owner (no automatic deletion)',
      isAutomatic: false,
    },
    {
      resourceType: 'sessions',
      retentionPeriodDays: RETENTION_PERIODS.INACTIVE_SESSIONS,
      description: 'Inactive sessions are automatically cleaned up after 30 days',
      isAutomatic: true,
      cleanupFunction: 'cleanup_stale_sessions()',
    },
  ];
}

/**
 * Check if data is eligible for deletion based on retention policy
 */
export function isEligibleForDeletion(
  resourceType: keyof typeof RETENTION_PERIODS,
  deletedAt: Date | string
): boolean {
  const retentionPeriod = RETENTION_PERIODS[resourceType];

  // Manual deletion (no automatic retention)
  if (retentionPeriod === -1) {
    return false;
  }

  const deletedDate = typeof deletedAt === 'string' ? new Date(deletedAt) : deletedAt;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);

  return deletedDate < cutoffDate;
}

/**
 * Get retention status for a workspace
 *
 * Returns summary of data awaiting deletion/anonymization.
 */
export async function getRetentionStatus(workspaceId?: string): Promise<{
  softDeletedContent: {
    conversations: number;
    messages: number;
    documents: number;
    eligibleForHardDelete: {
      conversations: number;
      messages: number;
      documents: number;
    };
  };
  auditLogs: {
    total: number;
    eligibleForAnonymization: number;
  };
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_PERIODS.SOFT_DELETED_CONTENT);
  const cutoffDateISO = cutoffDate.toISOString();

  const auditCutoffDate = new Date();
  auditCutoffDate.setDate(auditCutoffDate.getDate() - RETENTION_PERIODS.AUDIT_LOGS);
  const auditCutoffDateISO = auditCutoffDate.toISOString();

  // Conversations
  let conversationsQuery = supabaseAdmin
    .from('conversations')
    .select('*')
    .not('deleted_at', 'is', null);

  let conversationsOldQuery = supabaseAdmin
    .from('conversations')
    .select('*')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffDateISO);

  if (workspaceId) {
    conversationsQuery = conversationsQuery.eq('workspace_id', workspaceId);
    conversationsOldQuery = conversationsOldQuery.eq('workspace_id', workspaceId);
  }

  const { data: conversationsData } = await conversationsQuery;
  const { data: conversationsOldData } = await conversationsOldQuery;
  const totalConversations = conversationsData?.length || 0;
  const oldConversations = conversationsOldData?.length || 0;

  // Messages (need conversation IDs if filtering by workspace)
  let messagesQuery = supabaseAdmin
    .from('messages')
    .select('*')
    .not('deleted_at', 'is', null);

  let messagesOldQuery = supabaseAdmin
    .from('messages')
    .select('*')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffDateISO);

  if (workspaceId) {
    // Get conversation IDs for this workspace
    const { data: workspaceConversations } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('workspace_id', workspaceId);

    const conversationIds = workspaceConversations?.map(c => c.id) || [];
    if (conversationIds.length > 0) {
      messagesQuery = messagesQuery.in('conversation_id', conversationIds);
      messagesOldQuery = messagesOldQuery.in('conversation_id', conversationIds);
    }
  }

  const { data: messagesData } = await messagesQuery;
  const { data: messagesOldData } = await messagesOldQuery;
  const totalMessages = messagesData?.length || 0;
  const oldMessages = messagesOldData?.length || 0;

  // Documents
  let documentsQuery = supabaseAdmin
    .from('documents')
    .select('*')
    .not('deleted_at', 'is', null);

  let documentsOldQuery = supabaseAdmin
    .from('documents')
    .select('*')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffDateISO);

  if (workspaceId) {
    documentsQuery = documentsQuery.eq('workspace_id', workspaceId);
    documentsOldQuery = documentsOldQuery.eq('workspace_id', workspaceId);
  }

  const { data: documentsData } = await documentsQuery;
  const { data: documentsOldData } = await documentsOldQuery;
  const totalDocuments = documentsData?.length || 0;
  const oldDocuments = documentsOldData?.length || 0;

  // Audit logs
  let auditQuery = supabaseAdmin
    .from('audit_logs')
    .select('*');

  let auditOldQuery = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .lt('timestamp', auditCutoffDateISO)
    .not('user_id', 'is', null); // Only count non-anonymized logs

  if (workspaceId) {
    auditQuery = auditQuery.eq('workspace_id', workspaceId);
    auditOldQuery = auditOldQuery.eq('workspace_id', workspaceId);
  }

  const { data: auditData } = await auditQuery;
  const { data: auditOldData } = await auditOldQuery;
  const totalAuditLogs = auditData?.length || 0;
  const oldAuditLogs = auditOldData?.length || 0;

  return {
    softDeletedContent: {
      conversations: totalConversations || 0,
      messages: totalMessages || 0,
      documents: totalDocuments || 0,
      eligibleForHardDelete: {
        conversations: oldConversations || 0,
        messages: oldMessages || 0,
        documents: oldDocuments || 0,
      },
    },
    auditLogs: {
      total: totalAuditLogs || 0,
      eligibleForAnonymization: oldAuditLogs || 0,
    },
  };
}

/**
 * Manually trigger cleanup of old soft-deleted content
 *
 * This can be used by admins to manually trigger cleanup outside of
 * the scheduled pg_cron job.
 *
 * @returns Summary of deleted records
 */
export async function triggerManualCleanup(workspaceId?: string): Promise<{
  success: boolean;
  deleted: {
    conversations: number;
    messages: number;
    documents: number;
    documentChunks: number;
  };
  error?: string;
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_PERIODS.SOFT_DELETED_CONTENT);
    const cutoffDateISO = cutoffDate.toISOString();

    console.log(`🧹 Manual cleanup triggered for records older than ${cutoffDateISO}`);

    // Build base queries
    let messagesQuery = supabaseAdmin
      .from('messages')
      .delete()
      .lt('deleted_at', cutoffDateISO)
      .not('deleted_at', 'is', null);

    let conversationsQuery = supabaseAdmin
      .from('conversations')
      .delete()
      .lt('deleted_at', cutoffDateISO)
      .not('deleted_at', 'is', null);

    let chunksQuery = supabaseAdmin
      .from('document_chunks')
      .delete()
      .lt('deleted_at', cutoffDateISO)
      .not('deleted_at', 'is', null);

    let documentsQuery = supabaseAdmin
      .from('documents')
      .delete()
      .lt('deleted_at', cutoffDateISO)
      .not('deleted_at', 'is', null);

    // Filter by workspace if provided
    if (workspaceId) {
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .lt('deleted_at', cutoffDateISO)
        .not('deleted_at', 'is', null);

      const conversationIds = conversations?.map(c => c.id) || [];

      if (conversationIds.length > 0) {
        messagesQuery = messagesQuery.in('conversation_id', conversationIds);
        conversationsQuery = conversationsQuery.in('id', conversationIds);
      }

      documentsQuery = documentsQuery.eq('workspace_id', workspaceId);

      // Get document IDs to delete chunks
      const { data: documentsToDelete } = await supabaseAdmin
        .from('documents')
        .select('id')
        .eq('workspace_id', workspaceId)
        .lt('deleted_at', cutoffDateISO)
        .not('deleted_at', 'is', null);

      const documentIds = documentsToDelete?.map(d => d.id) || [];
      if (documentIds.length > 0) {
        chunksQuery = chunksQuery.in('document_id', documentIds);
      }
    }

    // Execute deletions
    const { data: messagesData } = await messagesQuery.select();
    const { data: conversationsData } = await conversationsQuery.select();
    const { data: chunksData } = await chunksQuery.select();
    const { data: documentsData } = await documentsQuery.select();

    const messagesDeleted = messagesData?.length || 0;
    const conversationsDeleted = conversationsData?.length || 0;
    const chunksDeleted = chunksData?.length || 0;
    const documentsDeleted = documentsData?.length || 0;

    console.log(`✅ Cleanup completed: ${conversationsDeleted} conversations, ${messagesDeleted} messages, ${documentsDeleted} documents, ${chunksDeleted} chunks`);

    return {
      success: true,
      deleted: {
        conversations: conversationsDeleted || 0,
        messages: messagesDeleted || 0,
        documents: documentsDeleted || 0,
        documentChunks: chunksDeleted || 0,
      },
    };
  } catch (error: any) {
    console.error('❌ Manual cleanup failed:', error);
    return {
      success: false,
      deleted: {
        conversations: 0,
        messages: 0,
        documents: 0,
        documentChunks: 0,
      },
      error: error.message,
    };
  }
}

/**
 * Get next scheduled cleanup dates
 */
export function getNextCleanupDates(): {
  softDeleteCleanup: Date;
  auditLogAnonymization: Date;
} {
  const now = new Date();

  // Next daily cleanup (2 AM UTC tomorrow)
  const softDeleteCleanup = new Date(now);
  softDeleteCleanup.setUTCDate(softDeleteCleanup.getUTCDate() + 1);
  softDeleteCleanup.setUTCHours(2, 0, 0, 0);

  // Next monthly audit log anonymization (3 AM UTC on 1st of next month)
  const auditLogAnonymization = new Date(now);
  auditLogAnonymization.setUTCMonth(auditLogAnonymization.getUTCMonth() + 1);
  auditLogAnonymization.setUTCDate(1);
  auditLogAnonymization.setUTCHours(3, 0, 0, 0);

  return {
    softDeleteCleanup,
    auditLogAnonymization,
  };
}
