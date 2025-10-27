import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { memoryCache } from '../utils/memoryCache';
import {
  detectQuickActions,
  shouldShowQuickActions,
  type QuickActionsConfig,
} from '../utils/quickActionsConfig';

export const runtime = 'edge';

// 🚀 Endpoint RÁPIDO para respuestas simples sin herramientas
// Usa gpt-4o-mini con instrucciones mínimas para respuestas en 2-3 segundos

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type QuickChatRequest = {
  message: string;
  conversationHistory: Message[];
};

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory }: QuickChatRequest = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 🔍 PRIMERO: Verificar Memory Cache (0ms de latencia)
    const cachedAnswer = await memoryCache.get(message);
    if (cachedAnswer) {
      console.log('⚡ [Quick] Respuesta desde Memory Cache (0ms)');

      // 🎯 Detectar Quick Actions (botones inteligentes)
      let quickActions: QuickActionsConfig | null = null;

      if (shouldShowQuickActions(cachedAnswer, true)) {
        quickActions = detectQuickActions(message, cachedAnswer);
        if (quickActions) {
          console.log(
            `✨ [Quick Actions] Detectados ${quickActions.buttons.length} botones para tema`
          );
        }
      }

      return NextResponse.json({
        message: cachedAnswer,
        attachments: null,
        fromCache: true,
        quick: true,
        quickActions, // Agregar botones contextuales
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
        },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Instrucciones breves pero con contexto básico
    const systemPrompt = `Eres un asistente parroquial. Responde breve pero informativo.

CONTEXTO BÁSICO (menciona cuando sea relevante):
- Misas y eventos: Consulta el calendario para horarios exactos
- Grupos parroquiales: Eloos (jóvenes), catequesis, grupos de oración, voluntariado
- Inscripciones: Hay formularios disponibles para unirse a grupos
- Sacramentos: Bautizos, comuniones, confirmaciones, bodas - consulta con el párroco
- Contacto: Recepción parroquial para consultas específicas

Si preguntan por fechas específicas, eventos, o formularios, indícales que pueden preguntar más detalles para info completa con enlaces.

⚠️ COHERENCIA: NO mezcles actividades distintas.
- Si preguntan por "Eloos" → habla SOLO de Eloos
- NO agregues otras actividades del mismo día
- Mantén el foco específico

Tono: acogedor, pastoral, útil, conciso.`;

    // Limitar historial a últimos 4 mensajes para reducir tokens
    const recentHistory = (conversationHistory || []).slice(-4);

    // Construir mensajes
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    console.log('⚡ [Quick] Generando respuesta rápida (sin herramientas)...');
    const startTime = Date.now();

    // Generar respuesta SIN herramientas para máxima velocidad
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages,
      temperature: 0.5, // Balance entre creatividad y velocidad
      maxOutputTokens: 300, // Limitar tokens de salida para respuestas más rápidas
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ [Quick] Respuesta generada en ${duration}ms`);

    return NextResponse.json({
      message: result.text,
      attachments: null,
      fromCache: false,
      quick: true, // Indicador para debug
      quickActions: null, // No mostrar botones en respuestas generadas (no cache)
    }, {
      headers: {
        // Quick responses: cache por 10 minutos
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
      },
    });

  } catch (error: any) {
    console.error('❌❌❌ ERROR EN QUICK ENDPOINT:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);

    return NextResponse.json(
      {
        error: error.message || 'Error generating quick response',
        technical: {
          name: error.name,
          message: error.message,
          code: error.code,
        },
      },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
