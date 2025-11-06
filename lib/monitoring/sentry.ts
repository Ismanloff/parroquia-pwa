/**
 * Sentry Monitoring Helpers
 *
 * Funciones auxiliares para capturar errores y eventos en Sentry
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Captura un error y lo envía a Sentry
 *
 * @param error - El error a capturar
 * @param context - Contexto adicional (userId, workspaceId, etc.)
 */
export function captureError(
  error: Error | unknown,
  context?: {
    userId?: string;
    workspaceId?: string;
    endpoint?: string;
    method?: string;
    additionalData?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    contexts: {
      user: context?.userId ? { id: context.userId } : undefined,
      workspace: context?.workspaceId ? { id: context.workspaceId } : undefined,
      endpoint: context?.endpoint ? { url: context.endpoint, method: context.method } : undefined,
    },
    extra: context?.additionalData,
  });
}

/**
 * Captura un mensaje de información en Sentry
 *
 * @param message - Mensaje a capturar
 * @param level - Nivel de severidad
 * @param context - Contexto adicional
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Wrapper para API routes que captura errores automáticamente
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   return withSentryErrorHandler(async () => {
 *     // Tu lógica aquí
 *     return NextResponse.json({ success: true });
 *   }, {
 *     endpoint: '/api/documents/upload',
 *     method: 'POST',
 *   });
 * }
 * ```
 */
export async function withSentryErrorHandler<T>(
  handler: () => Promise<T>,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    workspaceId?: string;
  }
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    captureError(error, context);
    throw error; // Re-throw para que la API pueda manejarlo
  }
}

/**
 * Añade información del usuario al contexto de Sentry
 */
export function setUserContext(userId: string, email?: string, workspaceId?: string) {
  Sentry.setUser({
    id: userId,
    email,
    workspace_id: workspaceId,
  });
}

/**
 * Limpia el contexto del usuario (útil en logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Añade tags personalizados al contexto
 */
export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

/**
 * Añade breadcrumbs (migajas de pan) para debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Inicia una transaction para performance monitoring
 *
 * @example
 * ```typescript
 * const transaction = startTransaction('document-processing', 'task');
 * try {
 *   await processDocument();
 *   transaction.finish();
 * } catch (error) {
 *   transaction.setStatus('error');
 *   transaction.finish();
 * }
 * ```
 */
export function startTransaction(name: string, op: string) {
  // Note: startTransaction is deprecated in Sentry v8+
  // For new code, prefer using Sentry.startSpan()
  // However, we keep this wrapper for backward compatibility
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}
