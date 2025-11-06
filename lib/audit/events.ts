/**
 * Audit Event Types - FASE 3
 *
 * Tipos y constantes para audit logging.
 * Define las 12 acciones auditables según SOC 2 y GDPR.
 *
 * @see supabase/migrations/20251106_001_create_audit_logs.sql
 */

/**
 * Tipos de acciones auditables
 */
export enum AuditAction {
  // CRUD Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',

  // Data Operations
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',

  // Access Control
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // GDPR Specific
  GDPR_DELETION = 'GDPR_DELETION',
  GDPR_EXPORT = 'GDPR_EXPORT',

  // Security
  SECURITY_EVENT = 'SECURITY_EVENT',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
}

/**
 * Tipos de recursos auditables
 */
export enum ResourceType {
  // Users & Auth
  USER = 'user',
  WORKSPACE = 'workspace',
  WORKSPACE_MEMBER = 'workspace_member',

  // Core Data
  CONVERSATION = 'conversation',
  MESSAGE = 'message',
  DOCUMENT = 'document',
  DOCUMENT_CHUNK = 'document_chunk',

  // Integrations
  CHANNEL = 'channel',
  WEBHOOK = 'webhook',
  OAUTH_TOKEN = 'oauth_token',

  // Settings & Billing
  WORKSPACE_SETTINGS = 'workspace_settings',
  BILLING_SUBSCRIPTION = 'billing_subscription',

  // Security
  API_KEY = 'api_key',
}

/**
 * Interfaz para el evento de auditoría
 */
export interface AuditEvent {
  /** Usuario que realizó la acción (puede ser undefined para eventos del sistema) */
  userId?: string;

  /** Workspace afectado (para multi-tenancy) */
  workspaceId?: string;

  /** Tipo de acción realizada */
  action: AuditAction;

  /** Tipo de recurso afectado */
  resourceType: ResourceType;

  /** ID del recurso específico */
  resourceId: string;

  /** Metadata adicional (debe tener PII redactado) */
  details?: Record<string, any>;

  /** IP address del cliente */
  ipAddress?: string;

  /** User agent del cliente */
  userAgent?: string;

  /** Si la operación fue exitosa */
  success?: boolean;

  /** Mensaje de error si success = false */
  errorMessage?: string;
}

/**
 * Interfaz para el registro almacenado en DB
 */
export interface AuditLog extends AuditEvent {
  id: string;
  timestamp: Date;
}

/**
 * Opciones para queries de audit logs
 */
export interface AuditLogQuery {
  userId?: string;
  workspaceId?: string;
  action?: AuditAction | AuditAction[];
  resourceType?: ResourceType | ResourceType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Resultado de query de audit logs
 */
export interface AuditLogQueryResult {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}

/**
 * Eventos de seguridad críticos que requieren alerta inmediata
 */
export const CRITICAL_SECURITY_EVENTS = [
  AuditAction.SECURITY_EVENT,
  AuditAction.RATE_LIMIT_HIT,
  AuditAction.GDPR_DELETION,
  AuditAction.PERMISSION_CHANGE,
] as const;

/**
 * Acciones que involucran PII y requieren especial cuidado
 */
export const PII_SENSITIVE_ACTIONS = [
  AuditAction.CREATE,
  AuditAction.READ,
  AuditAction.EXPORT,
  AuditAction.GDPR_EXPORT,
] as const;

/**
 * Recursos que típicamente contienen PII
 */
export const PII_SENSITIVE_RESOURCES = [
  ResourceType.USER,
  ResourceType.CONVERSATION,
  ResourceType.MESSAGE,
  ResourceType.DOCUMENT, // Documents can contain PII
  ResourceType.CHANNEL,
] as const;

/**
 * Helper: Verifica si un evento es de seguridad crítica
 */
export function isCriticalSecurityEvent(action: AuditAction): boolean {
  return CRITICAL_SECURITY_EVENTS.includes(action as any);
}

/**
 * Helper: Verifica si una acción involucra PII
 */
export function isPIISensitiveAction(action: AuditAction): boolean {
  return PII_SENSITIVE_ACTIONS.includes(action as any);
}

/**
 * Helper: Verifica si un recurso típicamente contiene PII
 */
export function isPIISensitiveResource(resourceType: ResourceType): boolean {
  return PII_SENSITIVE_RESOURCES.includes(resourceType as any);
}

/**
 * Severidad del evento para alerting
 */
export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info', // Alias for LOW (backwards compatibility)
  WARNING = 'warning', // Alias for HIGH (backwards compatibility)
  ERROR = 'error', // For failed operations
}

/**
 * Helper: Genera descripción human-readable de un evento
 * @overload
 */
export function getAuditEventDescription(event: AuditEvent): string;
export function getAuditEventDescription(action: AuditAction, resourceType: ResourceType, resourceId: string): string;
export function getAuditEventDescription(
  eventOrAction: AuditEvent | AuditAction,
  resourceType?: ResourceType,
  resourceId?: string
): string {
  let action: AuditAction;
  let resource: ResourceType;
  let id: string;

  if (typeof eventOrAction === 'object') {
    // Called with AuditEvent
    action = eventOrAction.action;
    resource = eventOrAction.resourceType;
    id = eventOrAction.resourceId;
  } else {
    // Called with individual parameters
    action = eventOrAction;
    resource = resourceType!;
    id = resourceId!;
  }

  // Capitalize first letter and format action name
  const actionName = action.charAt(0) + action.slice(1).toLowerCase().replace('_', ' ');
  const resourceName = resource.replace('_', ' ');

  // Special handling for GDPR actions
  if (action === AuditAction.GDPR_DELETION) {
    return `GDPR Article 17: Right to deletion - ${resourceName} ${id.substring(0, 8)}`;
  }
  if (action === AuditAction.GDPR_EXPORT) {
    return `GDPR Article 20: Data portability export for ${resourceName}`;
  }

  return `${actionName}d ${resourceName} ${id.substring(0, 8)}`;
}

/**
 * Helper: Determina severidad de un evento o acción
 * @overload
 */
export function getEventSeverity(event: AuditEvent): EventSeverity;
export function getEventSeverity(action: AuditAction): EventSeverity;
export function getEventSeverity(eventOrAction: AuditEvent | AuditAction): EventSeverity {
  let action: AuditAction;
  let success: boolean | undefined;

  if (typeof eventOrAction === 'object') {
    // Called with AuditEvent
    action = eventOrAction.action;
    success = eventOrAction.success;
  } else {
    // Called with AuditAction
    action = eventOrAction;
    success = undefined;
  }

  // Eventos fallidos son errores
  if (success === false) {
    return EventSeverity.ERROR;
  }

  // Eventos de seguridad críticos
  if (action === AuditAction.SECURITY_EVENT || action === AuditAction.GDPR_DELETION) {
    return EventSeverity.CRITICAL;
  }

  // Permission changes are HIGH severity
  if (action === AuditAction.PERMISSION_CHANGE) {
    return EventSeverity.HIGH;
  }

  // Operaciones destructivas son HIGH
  if (action === AuditAction.DELETE) {
    return EventSeverity.HIGH;
  }

  // Exports y Updates son MEDIUM
  if (action === AuditAction.EXPORT || action === AuditAction.UPDATE) {
    return EventSeverity.MEDIUM;
  }

  // Read operations y Login son LOW
  if (action === AuditAction.READ || action === AuditAction.LOGIN) {
    return EventSeverity.LOW;
  }

  // Todo lo demás es LOW por defecto
  return EventSeverity.LOW;
}

/**
 * Type guards
 */
export function isAuditAction(value: string): value is AuditAction {
  return Object.values(AuditAction).includes(value as AuditAction);
}

export function isResourceType(value: string): value is ResourceType {
  return Object.values(ResourceType).includes(value as ResourceType);
}
