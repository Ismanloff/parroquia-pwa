/**
 * Audit Module - FASE 3
 *
 * Módulo centralizado para audit logging, compliance y trazabilidad.
 *
 * @module lib/audit
 */

// Events & Types
export {
  AuditAction,
  ResourceType,
  EventSeverity,
  type AuditEvent,
  type AuditLog,
  type AuditLogQuery,
  type AuditLogQueryResult,
  CRITICAL_SECURITY_EVENTS,
  PII_SENSITIVE_ACTIONS,
  PII_SENSITIVE_RESOURCES,
  isCriticalSecurityEvent,
  isPIISensitiveAction,
  isPIISensitiveResource,
  getAuditEventDescription,
  getEventSeverity,
  isAuditAction,
  isResourceType,
} from './events';

// Logger Functions
export {
  logAuditEvent,
  logCreate,
  logRead,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  logExport,
  logPermissionChange,
  logGDPRDeletion,
  logGDPRExport,
  logSecurityEvent,
  logRateLimitHit,
  getAuditLogs,
  getSecurityEvents,
} from './logger';
