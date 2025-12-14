// API Route para enviar Push Notifications via Firebase Cloud Messaging
// POST /api/notifications/send
// Usa Firebase Admin SDK (HTTP v1 API) en lugar de Server Key (legacy)

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { messaging, isFirebaseAdminConfigured } from '@/lib/firebase/admin';

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
    // Verificar configuración antes de proceder
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            'Supabase Admin no está configurado. Agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            'Firebase Admin no está configurado. Agrega FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.',
        },
        { status: 500 }
      );
    }

    const payload: NotificationPayload = await request.json();

    // Validar payload
    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Obtener todos los tokens de la base de datos con información del dispositivo
    const { data: tokens, error: dbError } = await supabase
      .from('push_tokens')
      .select('id, token, user_agent, created_at, last_used');

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

    // Helper para detectar plataforma desde user agent
    const getPlatformFromUA = (userAgent: string | null): string => {
      if (!userAgent) return 'Desconocido';
      const ua = userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
      if (/android/.test(ua)) return 'Android';
      if (/macintosh/.test(ua)) return 'macOS';
      if (/windows/.test(ua)) return 'Windows';
      if (/linux/.test(ua)) return 'Linux';
      return 'Desconocido';
    };

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
              image: payload.image || undefined, // Soporte para imagen en notification panel
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

    // Log detallado de cada envío
    const detailedResults = results.map((result, index) => {
      const tokenData = tokens[index];
      if (!tokenData) {
        console.error(`❌ Token ${index} no encontrado en el array`);
        return null;
      }

      const platform = getPlatformFromUA(tokenData.user_agent);
      const tokenPreview = tokenData.token.substring(0, 20) + '...';

      if (result.status === 'fulfilled') {
        console.log(`✅ [${platform}] Token ${tokenPreview} - Enviado exitosamente`);
        return {
          success: true,
          platform,
          tokenId: tokenData.id,
          tokenPreview,
          userAgent: tokenData.user_agent,
          lastUsed: tokenData.last_used,
        };
      } else {
        const error = result.reason;
        const errorMessage = error?.message || String(error);
        console.error(`❌ [${platform}] Token ${tokenPreview} - Error: ${errorMessage}`);
        console.error(`   User Agent: ${tokenData.user_agent}`);
        console.error(`   Token ID: ${tokenData.id}`);
        console.error(`   Last Used: ${tokenData.last_used}`);

        // Detectar errores específicos de iOS/APNs
        if (
          errorMessage.includes('Requested entity was not found') ||
          errorMessage.includes('registration-token-not-registered')
        ) {
          console.error(
            `   ⚠️  Token inválido o expirado - Se recomienda eliminarlo de la base de datos`
          );
        }

        return {
          success: false,
          platform,
          tokenId: tokenData.id,
          tokenPreview,
          userAgent: tokenData.user_agent,
          lastUsed: tokenData.last_used,
          error: errorMessage,
        };
      }
    });

    console.log(`✅ Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`);

    return NextResponse.json({
      success: true,
      total: tokens.length,
      successful,
      failed,
      details: detailedResults.filter(Boolean),
    });
  } catch (error) {
    console.error('❌ Error al enviar notificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
