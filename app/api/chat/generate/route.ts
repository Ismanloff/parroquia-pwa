import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { GENERATE_STATIC_INSTRUCTIONS, buildRAGContext } from '../config/promptConstants';
import { monitorPromptCache } from '../utils/promptCacheMonitor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 🎯 OPTIMIZADO PARA PROMPT CACHING: Sistema de prompts con instrucciones estáticas separadas
// Las instrucciones base (GENERATE_STATIC_INSTRUCTIONS) se cachean automáticamente
// El contexto RAG se agrega dinámicamente por request

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      context = [],
      model = 'gpt-4o-mini',
      temperature = 0.7,
      stream = true,
    } = body;

    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generate request:', {
      messageCount: messages.length,
      contextChunks: context.length,
      model,
      stream,
    });

    // 🎯 PROMPT CACHING: Construir contexto RAG separado de instrucciones estáticas
    const ragContext = buildRAGContext(context, 'en');

    // 🎯 ESTRUCTURA OPTIMIZADA: Instrucciones estáticas primero → se cachean
    // Luego mensajes del usuario con contexto dinámico
    const openAIMessages: Message[] = [
      { role: 'system', content: GENERATE_STATIC_INSTRUCTIONS },
      ...messages.slice(0, -1), // Mensajes anteriores
      {
        role: messages[messages.length - 1].role,
        content: `${ragContext}\n\n${messages[messages.length - 1].content}`
      }
    ];

    // Create streaming response
    if (stream) {
      const streamResponse = await openai.chat.completions.create({
        model: model,
        messages: openAIMessages,
        temperature: temperature,
        stream: true,
      });

      // Create a TransformStream to handle SSE format
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }

            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model: model,
        messages: openAIMessages,
        temperature: temperature,
        stream: false,
      });

      // 📊 MONITOREO: Loggear métricas de cache
      monitorPromptCache(completion, 'generate-non-stream');

      const response = completion.choices[0]?.message?.content || '';

      return new Response(
        JSON.stringify({
          success: true,
          response: response,
          model: model,
          usage: completion.usage,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in generate:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
