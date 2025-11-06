import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { logLogin } from '@/lib/audit';
import { captureError, setUserContext } from '@/lib/monitoring/sentry';
import { withRateLimit, withTiming, withErrorHandler, RATE_LIMITS } from '@/lib/performance/middleware';

export const runtime = 'edge';

async function handlePOST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    const { email, password } = await req.json();

    // Extraer IP y User Agent para audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Autenticar usuario
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);

      // AUDIT: Log failed login attempt
      await logLogin(
        email, // Use email as identifier since we don't have userId yet
        false, // failed
        ipAddress,
        userAgent,
        error.message
      );

      // Mensajes de error personalizados
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        );
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Por favor confirma tu email antes de iniciar sesión' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Error al iniciar sesión' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Error al iniciar sesión' },
        { status: 401 }
      );
    }

    // AUDIT: Log successful login
    await logLogin(
      data.user.id,
      true, // success
      ipAddress,
      userAgent
    );

    // Set user context in Sentry for future error tracking
    setUserContext(data.user.id, data.user.email || undefined);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in login endpoint:', error);

    // Capture error to Sentry
    captureError(error, {
      endpoint: '/api/auth/login',
      method: 'POST',
      additionalData: {
        errorMessage: error.message,
      },
    });

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 login attempts per minute) to prevent brute force
export async function POST(req: NextRequest) {
  return withRateLimit(
    req,
    RATE_LIMITS.AUTH,
    withTiming(() => withErrorHandler(() => handlePOST(req), {
      endpoint: '/api/auth/login',
      method: 'POST',
    }))
  );
}
