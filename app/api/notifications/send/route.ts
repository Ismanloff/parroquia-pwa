// API Route para enviar Push Notifications via Firebase Cloud Messaging
// POST /api/notifications/send
// Usa Firebase Admin SDK (HTTP v1 API) en lugar de Server Key (legacy)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messaging } from '@/lib/firebase/admin';

// Cliente Supabase con service_role para acceder a tokens
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  badge?: string;
}

/**
 * Envía push notification a todos los dispositivos registrados
 * Usa Firebase Admin SDK (HTTP v1 API)
 */
export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();

    // Validar payload
    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 });
    }

    // Obtener todos los tokens de la base de datos
    const { data: tokens, error: dbError } = await supabase.from('push_tokens').select('token');

    if (dbError) {
      console.error('Error al obtener tokens:', dbError);
      return NextResponse.json({ error: 'Error al obtener tokens' }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        {
          success: true,
          total: 0,
          successful: 0,
          failed: 0,
          message:
            'No hay dispositivos registrados. Los usuarios deben activar las notificaciones primero.',
        },
        { status: 200 }
      );
    }

    console.log(`📤 Enviando notificación a ${tokens.length} dispositivos`);

    // Enviar notificaciones usando Firebase Admin SDK
    const results = await Promise.allSettled(
      tokens.map((tokenData) =>
        messaging.send({
          token: tokenData.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            url: payload.url || '/',
          },
          webpush: {
            notification: {
              icon: payload.icon || '/icons/icon-192x192.png',
              badge: payload.badge || '/icons/icon-72x72.png',
            },
            fcmOptions: {
              link: payload.url || '/',
            },
          },
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Log errores específicos
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Token ${index} falló:`, result.reason);
      }
    });

    console.log(`✅ Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`);

    return NextResponse.json({
      success: true,
      total: tokens.length,
      successful,
      failed,
    });
  } catch (error) {
    console.error('❌ Error al enviar notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
