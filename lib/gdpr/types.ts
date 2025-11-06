/**
 * GDPR Types & Interfaces
 *
 * Type definitions for GDPR compliance operations.
 *
 * @module lib/gdpr/types
 */

/**
 * Result of a GDPR deletion operation
 */
export interface DeletionResult {
  success: boolean;
  deleted: {
    authUser: boolean;
    workspaces: number;
    conversations: number;
    messages: number;
    documents: number;
    documentChunks: number;
    pineconeNamespaces: string[];
    auditLogsAnonymized: number;
  };
  errors?: string[];
  timestamp: string;
}

/**
 * Result of a GDPR data export operation
 */
export interface ExportResult {
  success: boolean;
  data?: {
    user: UserExportData;
    workspaces: WorkspaceExportData[];
    conversations: ConversationExportData[];
    documents: DocumentExportData[];
    auditLogs: AuditLogExportData[];
  };
  error?: string;
  timestamp: string;
}

/**
 * User data for export
 */
export interface UserExportData {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Workspace data for export
 */
export interface WorkspaceExportData {
  id: string;
  name: string;
  role: string;
  joined_at: string;
  settings?: Record<string, any>;
}

/**
 * Conversation data for export
 */
export interface ConversationExportData {
  id: string;
  workspace_id: string;
  channel_id?: string;
  status: string;
  created_at: string;
  last_message_at?: string;
  messages: MessageExportData[];
}

/**
 * Message data for export
 */
export interface MessageExportData {
  id: string;
  content: string;
  role: string;
  created_at: string;
}

/**
 * Document data for export
 */
export interface DocumentExportData {
  id: string;
  workspace_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  uploaded_at: string;
}

/**
 * Audit log data for export
 */
export interface AuditLogExportData {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  success: boolean;
  details?: Record<string, any>;
}

/**
 * GDPR deletion options
 */
export interface DeletionOptions {
  /**
   * Whether to hard delete immediately (default: false, uses soft delete)
   */
  hardDelete?: boolean;

  /**
   * Whether to anonymize audit logs (default: true)
   */
  anonymizeAuditLogs?: boolean;

  /**
   * Whether to delete Pinecone data (default: true)
   */
  deletePineconeData?: boolean;

  /**
   * Reason for deletion (for audit trail)
   */
  reason?: string;

  /**
   * Admin user ID initiating deletion (if not self-service)
   */
  deletedBy?: string;
}

/**
 * GDPR export options
 */
export interface ExportOptions {
  /**
   * Format for export (default: 'json')
   */
  format?: 'json' | 'csv';

  /**
   * Whether to include audit logs (default: true)
   */
  includeAuditLogs?: boolean;

  /**
   * Whether to include deleted data (default: false)
   */
  includeDeleted?: boolean;

  /**
   * Date range for export
   */
  dateRange?: {
    from?: string;
    to?: string;
  };
}
