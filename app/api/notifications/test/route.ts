// API Route para diagnosticar configuración de Firebase
// GET /api/notifications/test

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: 'production',
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
