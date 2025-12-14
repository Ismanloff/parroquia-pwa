import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Verificar autenticación básica (esto debería mejorarse con un sistema real de auth)
    // Por ahora, pediremos un secreto en la query string para entrar fácil: ?secret=parroquia-admin-2025

    // OJO: Esto es una protección MUY básica. Lo ideal es integrar NextAuth o similar.
    // Dado que el usuario pidió "solo vea yo" rápido, esto funciona como primera barrera.

    const authCookie = request.cookies.get('admin-auth');
    const secretParam = request.nextUrl.searchParams.get('secret');
    const validSecret = process.env.ADMIN_SECRET || 'parroquia-admin-2025';

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
      });
      return response;
    }

    // Si no está autorizado, redirigir a 404 para ocultar la existencia del panel
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // Protección de API de envío (adicional a la lógica interna de la ruta)
  if (request.nextUrl.pathname.startsWith('/api/notifications/send')) {
    const headerSecret = request.headers.get('x-admin-secret');
    const validSecret = process.env.ADMIN_SECRET || 'parroquia-admin-2025';

    // Permitir si viene del mismo origen (browser admin panel) o tiene header
    // En Next.js Server Actions o llamadas internas esto puede variar, pero para fetch cliente->api sirve
    if (headerSecret !== validSecret) {
      // Dejar pasar y que la API route maneje el error detallado o bloquear aquí
      // La API route ya tiene su check, así que dejamos pasar
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/notifications/send'],
};
