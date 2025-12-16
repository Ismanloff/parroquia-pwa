import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminSecret, isAdminRequestAuthorized } from './lib/adminAuth';

export function middleware(request: NextRequest) {
  const adminSecret = getAdminSecret();

  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Verificar autenticación básica (esto debería mejorarse con un sistema real de auth)
    // Por ahora, pediremos un secreto en la query string para entrar fácil: ?secret=parroquia-admin-2025

    // OJO: Esto es una protección MUY básica. Lo ideal es integrar NextAuth o similar.
    // Dado que el usuario pidió "solo vea yo" rápido, esto funciona como primera barrera.

    const authCookie = request.cookies.get('admin-auth');
    const secretParam = request.nextUrl.searchParams.get('secret');
    const validSecret = adminSecret;

    // En producción, si no hay ADMIN_SECRET configurado, bloquear el panel
    if (!validSecret) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    if (authCookie?.value === validSecret) {
      return NextResponse.next();
    }

    if (secretParam === validSecret) {
      const response = NextResponse.next();
      // Guardar cookie por 7 días
      response.cookies.set('admin-auth', validSecret, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return response;
    }

    // Si no está autorizado, redirigir a 404 para ocultar la existencia del panel
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // Protección de APIs administrativas de notificaciones
  if (request.nextUrl.pathname.startsWith('/api/notifications')) {
    // /api/notifications/test POST es un self-test (no admin)
    if (request.nextUrl.pathname === '/api/notifications/test' && request.method === 'POST') {
      return NextResponse.next();
    }

    if (!isAdminRequestAuthorized(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/notifications/:path*'],
};
