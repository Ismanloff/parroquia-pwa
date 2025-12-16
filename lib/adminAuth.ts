import type { NextRequest } from 'next/server';

/**
 * Admin secret:
 * - Obligatorio en producción (ADMIN_SECRET)
 * - En desarrollo permite un fallback para facilitar pruebas locales
 */
export function getAdminSecret(): string | null {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  if (process.env.NODE_ENV !== 'production') return 'parroquia-admin-2025';
  return null;
}

export function isAdminRequestAuthorized(request: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;

  const cookieSecret = request.cookies.get('admin-auth')?.value;
  const headerSecret = request.headers.get('x-admin-secret');

  return cookieSecret === secret || headerSecret === secret;
}
