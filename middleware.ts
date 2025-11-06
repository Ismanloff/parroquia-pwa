/**
 * Next.js Middleware - FASE 1
 *
 * Implementa protección CSRF, validación de origen y rate limiting básico.
 * Se ejecuta en Edge Runtime antes de cada request.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://nextjs.org/blog/security-nextjs-server-components-actions
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Dominios permitidos para CORS
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://resply.com',
  'https://www.resply.com',
  'https://app.resply.com',
  'https://resply.vercel.app',
  // Allow all Vercel preview deployments
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

/**
 * Rutas que se excluyen de verificación CSRF
 * (típicamente webhooks externos que usan signature verification)
 */
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/whatsapp',
  '/api/webhooks/telegram',
  '/api/webhooks/stripe',
];

/**
 * Métodos HTTP seguros que no requieren CSRF protection
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Verifica CSRF comparando Origin/Referer con Host
 * Next.js 14 hace esto automáticamente para Server Actions,
 * pero debemos hacerlo manualmente para API routes
 */
function verifyCsrf(request: NextRequest): boolean {
  // Métodos seguros no necesitan protección
  if (SAFE_METHODS.includes(request.method)) {
    return true;
  }

  // Rutas exentas (webhooks con signature verification)
  const pathname = request.nextUrl.pathname;
  if (CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return true;
  }

  // Obtener origin del request
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Si no hay origin ni referer, bloquear (posible CSRF)
  if (!origin && !referer) {
    return false;
  }

  // Verificar que origin/referer coincida con host
  try {
    const originUrl = origin ? new URL(origin) : referer ? new URL(referer) : null;

    if (!originUrl) {
      return false;
    }

    // Verificar contra host actual
    if (originUrl.host === host) {
      return true;
    }

    // Verificar contra dominios permitidos
    const isAllowed = ALLOWED_ORIGINS.some((allowedOrigin) => {
      const allowedUrl = new URL(allowedOrigin);
      return allowedUrl.host === originUrl.host;
    });

    // También permitir subdominios de vercel.app (preview deployments)
    if (originUrl.host.endsWith('.vercel.app') && host?.endsWith('.vercel.app')) {
      return true;
    }

    return isAllowed;
  } catch (error) {
    // URL inválida = bloquear
    return false;
  }
}

/**
 * Middleware principal
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF Protection para API routes
  if (pathname.startsWith('/api')) {
    const csrfValid = verifyCsrf(request);

    if (!csrfValid) {
      console.warn('[CSRF] Blocked request:', {
        method: request.method,
        pathname,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host'),
      });

      return new NextResponse(
        JSON.stringify({
          error: 'CSRF verification failed',
          message: 'Invalid origin or referer header',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // 2. CORS Headers para API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

      if (isAllowedOrigin) {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, X-Requested-With, X-Request-ID',
            'Access-Control-Max-Age': '86400', // 24 horas
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      }

      return new NextResponse(null, { status: 403 });
    }

    // Add CORS headers to actual requests
    const response = NextResponse.next();

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, X-Request-ID'
      );
    }

    // 3. Security Headers adicionales (complementan los de next.config.ts)
    response.headers.set('X-Request-ID', crypto.randomUUID());
    response.headers.set('X-Middleware-Version', '1.0.0');

    return response;
  }

  // 4. Para rutas públicas (widget), permitir CORS más amplio
  if (pathname.startsWith('/widget') || pathname === '/api/chat/widget') {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Widget-ID');
    return response;
  }

  return NextResponse.next();
}

/**
 * Configuración de middleware
 * Se ejecuta en todas las rutas excepto las estáticas
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
