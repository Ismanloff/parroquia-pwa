// API Route para diagnosticar configuración de Firebase
// GET /api/notifications/test

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminSecret, isAdminRequestAuthorized } from '@/lib/adminAuth';
import { isFirebaseAdminConfigured, messaging } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  // Auth admin (defense-in-depth, además del middleware)
  if (!getAdminSecret()) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET no está configurado. Bloqueando endpoint administrativo.' },
      { status: 500 }
    );
  }

  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {} as Record<string, any>,
  };

  // 1. Verificar variables de entorno de Firebase Admin SDK
  diagnostics.checks.firebaseAdminConfig = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    values: {
      projectId: process.env.FIREBASE_PROJECT_ID || 'MISSING',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    },
  };

  // 2. Verificar variables de Supabase
  diagnostics.checks.supabaseConfig = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    values: {
      url: process.env.SUPABASE_URL || 'MISSING',
    },
  };

  // 3. Intentar inicializar Firebase Admin
  try {
    const { messaging } = await import('@/lib/firebase/admin');
    diagnostics.checks.firebaseAdminInit = {
      success: true,
      message: 'Firebase Admin SDK inicializado correctamente',
    };
  } catch (error: any) {
    diagnostics.checks.firebaseAdminInit = {
      success: false,
      error: error.message,
    };
  }

  // 4. Verificar conexión a Supabase y contar tokens
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error, count } = await supabase
      .from('push_tokens')
      .select('*', { count: 'exact', head: false });

    if (error) {
      diagnostics.checks.supabaseConnection = {
        success: false,
        error: error.message,
      };
    } else {
      diagnostics.checks.supabaseConnection = {
        success: true,
        tokensCount: count || 0,
        sampleTokens: data?.slice(0, 2).map((t: any) => ({
          id: t.id,
          tokenPreview: t.token.substring(0, 20) + '...',
          created_at: t.created_at,
        })),
      };
    }
  } catch (error: any) {
    diagnostics.checks.supabaseConnection = {
      success: false,
      error: error.message,
    };
  }

  // 5. Resumen
  const allChecks = Object.values(diagnostics.checks);
  const passedChecks = allChecks.filter((check: any) => check.success !== false).length;

  diagnostics.checks.summary = {
    total: allChecks.length,
    passed: passedChecks,
    failed: allChecks.length - passedChecks,
    status: passedChecks === allChecks.length ? 'ALL_GOOD' : 'ISSUES_FOUND',
  };

  return NextResponse.json(diagnostics, { status: 200 });
}

/**
 * POST: self-test (no admin) - envía una notificación de prueba a UN token
 *
 * Esto permite que un usuario verifique su configuración sin exponer endpoints
 * administrativos que envían a todos los dispositivos.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Firebase Admin no está configurado. Agrega FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.',
        },
        { status: 500 }
      );
    }

    const body: { token?: unknown } = await request.json();
    const token = typeof body.token === 'string' ? body.token : null;

    if (!token || token.length < 50) {
      return NextResponse.json(
        { success: false, error: 'token inválido o faltante' },
        { status: 400 }
      );
    }

    await messaging.send({
      token,
      notification: {
        title: 'Prueba de notificaciones',
        body: 'Si ves esto, las notificaciones funcionan correctamente.',
      },
      data: {
        url: '/',
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        },
        fcmOptions: {
          link: '/',
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al enviar self-test push:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
