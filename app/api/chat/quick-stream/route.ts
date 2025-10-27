import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

// 🚀⚡ Endpoint STREAMING para respuestas rápidas
// Mejora la percepción de velocidad en 70-80% mostrando texto en tiempo real

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
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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

    console.log('⚡🌊 [Quick-Stream] Iniciando streaming...');
    const startTime = Date.now();

    // STREAMING: Respuesta palabra por palabra en tiempo real
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      temperature: 0.5,
      maxOutputTokens: 300, // Parámetro correcto: maxOutputTokens (no maxTokens)
      onFinish: () => {
        const duration = Date.now() - startTime;
        console.log(`⚡🌊 [Quick-Stream] Stream completado en ${duration}ms`);
      },
    });

    // Retornar stream con headers CORS
    return result.toTextStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error: any) {
    console.error('❌ [Quick-Stream] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error generating quick stream response' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
