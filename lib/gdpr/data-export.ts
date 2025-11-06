/**
 * GDPR Right to Data Portability - Article 20
 *
 * Exports all user data in a structured, machine-readable format (JSON).
 *
 * Includes:
 * - User profile data
 * - Workspace memberships
 * - Conversations and messages
 * - Documents metadata
 * - Audit logs (last 90 days)
 *
 * @see https://gdpr-info.eu/art-20-gdpr/ - Right to data portability
 * @module lib/gdpr/data-export
 */

import { supabaseAdmin } from '@/app/lib/supabase';
import { logGDPRExport } from '@/lib/audit';
import type {
  ExportResult,
  ExportOptions,
  UserExportData,
  WorkspaceExportData,
  ConversationExportData,
  MessageExportData,
  DocumentExportData,
  AuditLogExportData,
} from './types';

/**
 * Export all user data (GDPR Article 20)
 *
 * Returns a complete export of the user's data in JSON format.
 * This data can be used by the user to:
 * - Review what data we store about them
 * - Port their data to another service
 * - Keep a personal backup
 *
 * @param userId - User ID to export data for
 * @param options - Export options (format, filters, etc.)
 * @returns Complete user data export
 */
export async function exportUserData(
  userId: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const {
    format = 'json',
    includeAuditLogs = true,
    includeDeleted = false,
    dateRange,
  } = options;

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    console.log(`📦 Starting GDPR data export for user: ${userId}`);

    // Log the export request
    await logGDPRExport(userId, undefined, {
      format,
      include_audit_logs: includeAuditLogs,
      include_deleted: includeDeleted,
      date_range: dateRange,
    });

    // STEP 1: Export user profile
    const user = await exportUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`👤 Exported user profile`);

    // STEP 2: Export workspace memberships
    const workspaces = await exportWorkspaces(userId);
    console.log(`🏢 Exported ${workspaces.length} workspace(s)`);

    // STEP 3: Export conversations and messages
    const conversations = await exportConversations(userId, {
      includeDeleted,
      dateRange,
    });
    console.log(`💬 Exported ${conversations.length} conversation(s)`);

    // STEP 4: Export documents
    const documents = await exportDocuments(userId, {
      includeDeleted,
      dateRange,
    });
    console.log(`📄 Exported ${documents.length} document(s)`);

    // STEP 5: Export audit logs (if requested)
    let auditLogs: AuditLogExportData[] = [];
    if (includeAuditLogs) {
      auditLogs = await exportAuditLogs(userId, dateRange);
      console.log(`📋 Exported ${auditLogs.length} audit log(s)`);
    }

    const result: ExportResult = {
      success: true,
      data: {
        user,
        workspaces,
        conversations,
        documents,
        auditLogs,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ GDPR data export completed for user: ${userId}`);

    return result;
  } catch (error: any) {
    console.error('❌ GDPR data export failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Export user profile data
 */
async function exportUserProfile(userId: string): Promise<UserExportData | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !user.user) {
    return null;
  }

  return {
    id: user.user.id,
    email: user.user.email || '',
    created_at: user.user.created_at,
    updated_at: user.user.updated_at,
    metadata: user.user.user_metadata,
  };
}

/**
 * Export workspace memberships
 */
async function exportWorkspaces(userId: string): Promise<WorkspaceExportData[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const { data: memberships, error } = await supabaseAdmin
    .from('workspace_members')
    .select(`
      role,
      joined_at,
      workspaces:workspace_id (
        id,
        name
      )
    `)
    .eq('user_id', userId);

  if (error || !memberships) {
    console.error('Error exporting workspaces:', error);
    return [];
  }

  return memberships.map((m: any) => ({
    id: m.workspaces?.id || '',
    name: m.workspaces?.name || 'Unknown Workspace',
    role: m.role,
    joined_at: m.joined_at,
  }));
}

/**
 * Export conversations and messages
 */
async function exportConversations(
  userId: string,
  options: { includeDeleted?: boolean; dateRange?: { from?: string; to?: string } }
): Promise<ConversationExportData[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Build query
  let query = supabaseAdmin
    .from('conversations')
    .select(`
      id,
      workspace_id,
      channel_id,
      status,
      created_at,
      last_message_at,
      deleted_at
    `)
    .or(`created_by.eq.${userId}`);

  // Filter by deleted status
  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  // Filter by date range
  if (options.dateRange?.from) {
    query = query.gte('created_at', options.dateRange.from);
  }
  if (options.dateRange?.to) {
    query = query.lte('created_at', options.dateRange.to);
  }

  const { data: conversations, error } = await query;

  if (error || !conversations) {
    console.error('Error exporting conversations:', error);
    return [];
  }

  // For each conversation, export messages
  const conversationsWithMessages: ConversationExportData[] = [];

  for (const conv of conversations) {
    const messages = await exportMessages(conv.id, options.includeDeleted);

    conversationsWithMessages.push({
      id: conv.id,
      workspace_id: conv.workspace_id || '',
      channel_id: conv.channel_id || undefined,
      status: conv.status || 'unknown',
      created_at: conv.created_at || '',
      last_message_at: conv.last_message_at || undefined,
      messages,
    });
  }

  return conversationsWithMessages;
}

/**
 * Export messages for a conversation
 */
async function exportMessages(
  conversationId: string,
  includeDeleted: boolean = false
): Promise<MessageExportData[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  let query = supabaseAdmin
    .from('messages')
    .select('id, content, sender_type, created_at, deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data: messages, error } = await query;

  if (error || !messages) {
    console.error('Error exporting messages:', error);
    return [];
  }

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    role: m.sender_type, // Map sender_type to role for export
    created_at: m.created_at || '',
  }));
}

/**
 * Export documents
 */
async function exportDocuments(
  userId: string,
  options: { includeDeleted?: boolean; dateRange?: { from?: string; to?: string } }
): Promise<DocumentExportData[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  let query = supabaseAdmin
    .from('documents')
    .select('id, workspace_id, filename, file_size, mime_type, status, uploaded_at, deleted_at')
    .eq('uploaded_by', userId)
    .order('uploaded_at', { ascending: false });

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  if (options.dateRange?.from) {
    query = query.gte('uploaded_at', options.dateRange.from);
  }
  if (options.dateRange?.to) {
    query = query.lte('uploaded_at', options.dateRange.to);
  }

  const { data: documents, error } = await query;

  if (error || !documents) {
    console.error('Error exporting documents:', error);
    return [];
  }

  return documents.map((d) => ({
    id: d.id,
    workspace_id: d.workspace_id || '',
    filename: d.filename,
    file_size: d.file_size || 0,
    mime_type: d.mime_type || 'application/octet-stream',
    status: d.status || 'unknown',
    uploaded_at: d.uploaded_at || '',
  }));
}

/**
 * Export audit logs
 *
 * GDPR requires providing audit logs related to the user's data.
 * We export the last 90 days by default.
 */
async function exportAuditLogs(
  userId: string,
  dateRange?: { from?: string; to?: string }
): Promise<AuditLogExportData[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Default: last 90 days
  const from = dateRange?.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const to = dateRange?.to || new Date().toISOString();

  const { data: logs, error } = await supabaseAdmin
    .from('audit_logs')
    .select('id, action, resource_type, resource_id, timestamp, success, details')
    .eq('user_id', userId)
    .gte('timestamp', from)
    .lte('timestamp', to)
    .order('timestamp', { ascending: false })
    .limit(1000); // Reasonable limit

  if (error || !logs) {
    console.error('Error exporting audit logs:', error);
    return [];
  }

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    timestamp: log.timestamp,
    success: log.success ?? true,
    details: log.details as Record<string, any> | undefined,
  }));
}

/**
 * Convert export data to CSV format
 *
 * Note: This is a simplified CSV export. For production, consider using
 * a proper CSV library like `papaparse` or `csv-stringify`.
 */
export function convertToCSV(data: ExportResult['data']): string {
  if (!data) {
    return '';
  }

  let csv = '';

  // User section
  csv += '# USER PROFILE\n';
  csv += 'id,email,created_at\n';
  csv += `${data.user.id},${data.user.email},${data.user.created_at}\n\n`;

  // Workspaces section
  csv += '# WORKSPACES\n';
  csv += 'id,name,role,joined_at\n';
  data.workspaces.forEach((w) => {
    csv += `${w.id},${w.name},${w.role},${w.joined_at}\n`;
  });
  csv += '\n';

  // Conversations section
  csv += '# CONVERSATIONS\n';
  csv += 'id,workspace_id,status,created_at,message_count\n';
  data.conversations.forEach((c) => {
    csv += `${c.id},${c.workspace_id},${c.status},${c.created_at},${c.messages.length}\n`;
  });
  csv += '\n';

  // Documents section
  csv += '# DOCUMENTS\n';
  csv += 'id,workspace_id,filename,file_size,mime_type,status,uploaded_at\n';
  data.documents.forEach((d) => {
    csv += `${d.id},${d.workspace_id},${d.filename},${d.file_size},${d.mime_type},${d.status},${d.uploaded_at}\n`;
  });
  csv += '\n';

  return csv;
}
