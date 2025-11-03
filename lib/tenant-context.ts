/**
 * Tenant Context Management
 *
 * ⚠️ TEMPORAL: Esta implementación usa una variable global y NO es thread-safe.
 * En producción, reemplazar con AsyncLocalStorage para garantizar isolation entre requests.
 * Ver: https://nodejs.org/api/async_context.html#class-asynclocalstorage
 */

let currentTenantId: string | null = null;

/**
 * Establece el tenant_id para el contexto actual
 */
export function setCurrentTenantId(tenantId: string): void {
  currentTenantId = tenantId;
}

/**
 * Obtiene el tenant_id del contexto actual
 * @throws Error si no hay tenant_id establecido
 */
export function getCurrentTenantId(): string {
  if (!currentTenantId) {
    throw new Error('tenant_id not found in current context. This is a bug.');
  }
  return currentTenantId;
}

/**
 * Limpia el tenant_id del contexto actual
 */
export function clearCurrentTenantId(): void {
  currentTenantId = null;
}
