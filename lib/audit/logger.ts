/**
 * Audit Logger - FASE 3
 *
 * Sistema centralizado de audit logging para SOC 2 y GDPR compliance.
 * Registra todas las acciones críticas en la tabla audit_logs.
 *
 * @see lib/audit/events.ts - Type definitions
 * @see supabase/migrations/20251106_001_create_audit_logs.sql
 */

import { createClient } from '@supabase/supabase-js';
import { detectPII } from '../security/pii-detector';
import {
  AuditEvent,
  AuditLog,
  AuditAction,
  ResourceType,
  isPIISensitiveAction,
  isPIISensitiveResource,
  isCriticalSecurityEvent,
  getEventSeverity,
} from './events';

/**
 * Cliente Supabase con service role (bypass RLS para logs)
 */
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Opciones para logging
 */
interface LogOptions {
  /** Si debe redactar PII automáticamente en details */
  redactPII?: boolean;
  /** Si debe loggear a console también */
  logToConsole?: boolean;
  /** Si debe alertar en eventos críticos */
  sendAlerts?: boolean;
}

const DEFAULT_OPTIONS: LogOptions = {
  redactPII: true,
  logToConsole: process.env.NODE_ENV === 'development',
  sendAlerts: true,
};

/**
 * Función principal: Registra un evento de auditoría
 */
export async function logAuditEvent(
  event: AuditEvent,
  options: LogOptions = {}
): Promise<{ success: boolean; logId?: string; error?: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 1. Validar evento
    if (!event.action || !event.resourceType || !event.resourceId) {
      throw new Error('Missing required fields: action, resourceType, resourceId');
    }

    // 2. Redactar PII en details si es necesario
    let sanitizedDetails = event.details;
    if (
      opts.redactPII &&
      event.details &&
      (isPIISensitiveAction(event.action) || isPIISensitiveResource(event.resourceType))
    ) {
      sanitizedDetails = await redactPIIFromDetails(event.details);
    }

    // 3. Preparar registro para DB
    const logEntry = {
      user_id: event.userId || null,
      workspace_id: event.workspaceId || null,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      details: sanitizedDetails || {},
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      success: event.success !== false, // Default true
      error_message: event.errorMessage || null,
      timestamp: new Date().toISOString(),
    };

    // 4. Insertar en DB
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('audit_logs').insert(logEntry).select('id').single();

    if (error) {
      throw new Error(`Failed to insert audit log: ${error.message}`);
    }

    // 5. Log a console en desarrollo
    if (opts.logToConsole) {
      const severity = getEventSeverity(event);
      console.log(`[AUDIT] [${severity.toUpperCase()}]`, {
        action: event.action,
        resource: `${event.resourceType}:${event.resourceId}`,
        user: event.userId || 'SYSTEM',
        workspace: event.workspaceId,
      });
    }

    // 6. Enviar alertas para eventos críticos
    if (opts.sendAlerts && isCriticalSecurityEvent(event.action)) {
      await sendSecurityAlert(event, data.id);
    }

    return { success: true, logId: data.id };
  } catch (error) {
    console.error('[AUDIT] Failed to log event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper: Redacta PII de details usando PII detector de FASE 1
 */
async function redactPIIFromDetails(details: Record<string, any>): Promise<Record<string, any>> {
  const redacted: Record<string, any> = {};

  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      // Detectar y redactar PII en strings
      const piiResult = detectPII(value);
      redacted[key] = piiResult.hasPII ? piiResult.redactedText : value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursivo para objetos anidados
      redacted[key] = await redactPIIFromDetails(value);
    } else {
      // Otros tipos (números, booleanos, etc.) pasan sin cambios
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Helper: Envía alerta para eventos de seguridad críticos
 * (Por ahora solo logging, en producción integrar con Slack/PagerDuty)
 */
async function sendSecurityAlert(event: AuditEvent, logId: string): Promise<void> {
  console.warn('[SECURITY ALERT]', {
    action: event.action,
    resource: `${event.resourceType}:${event.resourceId}`,
    user: event.userId || 'SYSTEM',
    workspace: event.workspaceId,
    logId,
    timestamp: new Date().toISOString(),
  });

  // TODO: Integrar con sistema de alertas (Slack, PagerDuty, etc)
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await notifySlack({...})
  // }
}

/**
 * Helpers convenientes para acciones específicas
 */

export async function logCreate(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.CREATE,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logRead(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  workspaceId?: string
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.READ,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    success: true,
  });
}

export async function logUpdate(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.UPDATE,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logDelete(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.DELETE,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logLogin(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.LOGIN,
    resourceType: ResourceType.USER,
    resourceId: userId,
    userId,
    success,
    ipAddress,
    userAgent,
    errorMessage,
  });
}

export async function logLogout(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.LOGOUT,
    resourceType: ResourceType.USER,
    resourceId: userId,
    userId,
    success: true,
    ipAddress,
    userAgent,
  });
}

export async function logExport(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.EXPORT,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logPermissionChange(
  resourceType: ResourceType,
  resourceId: string,
  userId: string,
  workspaceId: string,
  details: { oldRole?: string; newRole?: string; targetUserId?: string }
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.PERMISSION_CHANGE,
    resourceType,
    resourceId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logGDPRDeletion(
  userId: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.GDPR_DELETION,
    resourceType: ResourceType.USER,
    resourceId: userId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logGDPRExport(
  userId: string,
  workspaceId?: string,
  details?: Record<string, any>
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.GDPR_EXPORT,
    resourceType: ResourceType.USER,
    resourceId: userId,
    userId,
    workspaceId,
    details,
    success: true,
  });
}

export async function logSecurityEvent(
  details: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    [key: string]: any;
  },
  userId?: string,
  workspaceId?: string,
  ipAddress?: string
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.SECURITY_EVENT,
    resourceType: ResourceType.USER,
    resourceId: userId || 'SYSTEM',
    userId,
    workspaceId,
    details,
    ipAddress,
    success: true,
  });
}

export async function logRateLimitHit(
  userId?: string,
  workspaceId?: string,
  details?: { endpoint?: string; limit?: number; attempts?: number }
): Promise<{ success: boolean; logId?: string }> {
  return logAuditEvent({
    action: AuditAction.RATE_LIMIT_HIT,
    resourceType: ResourceType.USER,
    resourceId: userId || 'ANONYMOUS',
    userId,
    workspaceId,
    details,
    success: false, // Rate limit hit es un failure
  });
}

/**
 * Query helpers para recuperar audit logs
 */

export async function getAuditLogs(
  workspaceId: string,
  options: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<AuditLog[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('timestamp', { ascending: false });

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.action) {
    query = query.eq('action', options.action);
  }

  if (options.startDate) {
    query = query.gte('timestamp', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('timestamp', options.endDate.toISOString());
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AUDIT] Failed to fetch logs:', error);
    return [];
  }

  return data as AuditLog[];
}

export async function getSecurityEvents(
  workspaceId?: string,
  hoursAgo: number = 24
): Promise<AuditLog[]> {
  const supabase = getSupabaseAdmin();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hoursAgo);

  let query = supabase
    .from('audit_logs')
    .select('*')
    .in('action', [AuditAction.SECURITY_EVENT, AuditAction.RATE_LIMIT_HIT])
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AUDIT] Failed to fetch security events:', error);
    return [];
  }

  return data as AuditLog[];
}
