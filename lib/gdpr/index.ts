/**
 * GDPR Compliance Module
 *
 * Módulo centralizado para cumplimiento GDPR (Reglamento General de Protección de Datos).
 *
 * Implementa:
 * - Article 17: Right to Deletion (Derecho al olvido)
 * - Article 20: Right to Data Portability (Derecho a la portabilidad)
 *
 * @module lib/gdpr
 */

// Types
export type {
  DeletionResult,
  ExportResult,
  DeletionOptions,
  ExportOptions,
  UserExportData,
  WorkspaceExportData,
  ConversationExportData,
  MessageExportData,
  DocumentExportData,
  AuditLogExportData,
} from './types';

// Right to Deletion (Article 17)
export {
  deleteUserData,
  getDeletionStatus,
} from './right-to-deletion';

// Right to Data Portability (Article 20)
export {
  exportUserData,
  convertToCSV,
} from './data-export';
