// API Route para gestionar tokens FCM
// GET: Lista todos los tokens con información detallada
// DELETE: Elimina tokens inválidos o específicos

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

// Helper para detectar plataforma
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

// Helper para extraer información del user agent
const parseUserAgent = (userAgent: string | null): { browser?: string; os?: string } => {
  if (!userAgent) return {};

  const ua = userAgent.toLowerCase();
  let browser = 'Desconocido';
  let os = 'Desconocido';

  // Detectar navegador
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  // Detectar OS
  if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('linux')) os = 'Linux';

  return { browser, os };
};

/**
 * GET: Lista todos los tokens con información detallada
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los tokens de la base de datos
    const { data: tokens, error: dbError } = await supabase
      .from('push_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error al obtener tokens:', dbError);
      return NextResponse.json({ error: 'Error al obtener tokens' }, { status: 500 });
    }

    // Enriquecer información de cada token
    const enrichedTokens = tokens.map((token) => {
      const platform = getPlatformFromUA(token.user_agent);
      const { browser, os } = parseUserAgent(token.user_agent);

      return {
        id: token.id,
        tokenPreview: token.token.substring(0, 30) + '...',
        platform,
        browser,
        os,
        userAgent: token.user_agent,
        createdAt: token.created_at,
        lastUsed: token.last_used,
        daysSinceLastUse: token.last_used
          ? Math.floor((Date.now() - new Date(token.last_used).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      total: tokens.length,
      tokens: enrichedTokens,
    });
  } catch (error) {
    console.error('❌ Error al listar tokens:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE: Elimina un token específico o tokens inválidos
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, deleteInvalid } = body;

    if (deleteInvalid) {
      // Verificar todos los tokens y eliminar los inválidos
      const { data: tokens, error: dbError } = await supabase.from('push_tokens').select('*');

      if (dbError) {
        console.error('Error al obtener tokens:', dbError);
        return NextResponse.json({ error: 'Error al obtener tokens' }, { status: 500 });
      }

      if (!tokens || tokens.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay tokens para verificar',
          deleted: 0,
        });
      }

      console.log(`🔍 Verificando ${tokens.length} tokens...`);

      const invalidTokenIds: number[] = [];

      // Verificar cada token enviando una notificación de prueba
      for (const tokenData of tokens) {
        try {
          // Intentar enviar mensaje de prueba (dry run)
          await messaging.send(
            {
              token: tokenData.token,
              notification: {
                title: 'Test',
                body: 'Test',
              },
            },
            true // dryRun: true - No envía realmente la notificación
          );
          console.log(`✅ Token ${tokenData.id} es válido`);
        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          if (
            errorMessage.includes('Requested entity was not found') ||
            errorMessage.includes('registration-token-not-registered') ||
            errorMessage.includes('invalid-registration-token')
          ) {
            console.log(`❌ Token ${tokenData.id} es inválido - Marcado para eliminar`);
            invalidTokenIds.push(tokenData.id);
          } else {
            console.warn(`⚠️ Token ${tokenData.id} - Error desconocido: ${errorMessage}`);
          }
        }
      }

      // Eliminar tokens inválidos
      if (invalidTokenIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('push_tokens')
          .delete()
          .in('id', invalidTokenIds);

        if (deleteError) {
          console.error('Error al eliminar tokens:', deleteError);
          return NextResponse.json({ error: 'Error al eliminar tokens' }, { status: 500 });
        }

        console.log(`🗑️ ${invalidTokenIds.length} tokens inválidos eliminados`);
      }

      return NextResponse.json({
        success: true,
        message: `${invalidTokenIds.length} tokens inválidos eliminados`,
        deleted: invalidTokenIds.length,
        total: tokens.length,
      });
    } else if (tokenId) {
      // Eliminar un token específico
      const { error: deleteError } = await supabase.from('push_tokens').delete().eq('id', tokenId);

      if (deleteError) {
        console.error('Error al eliminar token:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar token' }, { status: 500 });
      }

      console.log(`🗑️ Token ${tokenId} eliminado`);

      return NextResponse.json({
        success: true,
        message: 'Token eliminado exitosamente',
      });
    } else {
      return NextResponse.json(
        { error: 'Se requiere tokenId o deleteInvalid=true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error al eliminar tokens:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
