import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY no configurada');
}

const openai = new OpenAI({ apiKey });

/**
 * Detector inteligente con GPT-3.5 Turbo
 *
 * Clasifica mensajes en quick (< 3s) o full (streaming)
 * Usa GPT-3.5 Turbo para latencia ultra-baja (< 300ms)
 */
export async function POST(request: NextRequest) {
  try {
    const { message, context, lastFromCache } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Prompt ultra-optimizado para clasificación rápida
    const contextLine = context ? `CONTEXTO: ${context}` : '';
    const cacheHint = lastFromCache ? 'IMPORTANTE: Si pide MÁS información/detalles → FULL (buscar documentos completos)' : '';

    const systemPrompt = `Eres un clasificador de mensajes para un chatbot parroquial.

QUICK (usa GPT-4o-mini, < 3s):
- Saludos y despedidas
- Agradecimientos
- FAQs simples: horarios, teléfonos, qué es X
- Follow-ups contextuales simples
- Confirmaciones

FULL (usa Vector Store + streaming):
- Calendario: eventos, fechas futuras
- Documentos: normativas, procedimientos
- Queries complejas: "explica", "cómo funciona"
- Follow-ups expansivos: "dame MÁS información" (especialmente si respuesta anterior fue cache)
- Inscripciones/formularios

${contextLine}
${cacheHint}

Responde SOLO con JSON: {"type": "quick"|"full", "reason": "razón breve"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Clasifica: "${message}"` }
      ],
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message.content || '{}');

    console.log(`🧠 Detector IA: "${message}" → ${result.type} (${result.reason})`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Error en detector:', error);

    // Fallback seguro
    return NextResponse.json({
      type: 'quick',
      reason: 'Fallback por error'
    });
  }
}
