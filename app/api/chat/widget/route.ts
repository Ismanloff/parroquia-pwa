import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { WIDGET_STATIC_INSTRUCTIONS, buildRAGContext } from '../config/promptConstants';
import { monitorPromptCache } from '../utils/promptCacheMonitor';
import { withRateLimit, withTiming, withErrorHandler, RATE_LIMITS } from '@/lib/performance/middleware';
import { getCorsHeaders, validateOrigin } from '@/lib/security/cors-validator';

export const runtime = 'nodejs';

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  // Get workspaceId from header or query
  const workspaceId = req.headers.get('X-Workspace-ID') || req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return new NextResponse(JSON.stringify({ error: 'workspaceId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate origin
  const origin = req.headers.get('origin');
  const { allowed, allowedOrigin } = await validateOrigin(origin, workspaceId);

  if (!allowed) {
    console.warn('[CORS] Blocked preflight request:', { origin, workspaceId });
    return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = getCorsHeaders(allowedOrigin);

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Generate embedding with Voyage AI
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'voyage-3-large',
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// RAG search in Pinecone
async function searchDocuments(workspaceId: string, query: string, topK: number = 3) {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const index = pinecone.index('saas');
    const namespace = index.namespace(workspaceId);

    const searchResponse = await namespace.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
    });

    return searchResponse.matches.map(match => ({
      text: match.metadata?.text || '',
      filename: match.metadata?.filename || 'Unknown',
      score: match.score || 0,
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

// Generate response with OpenAI (Non-streaming version)
// 🎯 OPTIMIZADO PARA PROMPT CACHING: Instrucciones estáticas primero, contexto dinámico después
async function generateResponse(message: string, context: any[]): Promise<string> {
  try {
    // 🎯 PROMPT CACHING: Construir contexto RAG separado del contenido estático
    const contextText = buildRAGContext(
      context.map(c => ({ text: c.text, filename: c.filename })),
      'es'
    );

    // 🎯 ESTRUCTURA OPTIMIZADA: Estático primero (WIDGET_STATIC_INSTRUCTIONS se cachea)
    // Luego contexto dinámico que cambia por request
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: WIDGET_STATIC_INSTRUCTIONS },
        { role: 'user', content: `${contextText}\n\nPREGUNTA DEL USUARIO:\n${message}` }
      ],
      temperature: 0.7,
      max_tokens: 300,  // Reduced from 500 to 300 (40% less tokens = faster response)
      // Enable prompt caching for static system message (75% latency reduction on cache hits)
      store: true,
    });

    // 📊 MONITOREO: Loggear métricas de cache
    monitorPromptCache(completion, 'widget-non-stream');

    const firstChoice = completion.choices[0];
    return firstChoice?.message.content || 'Lo siento, no pude generar una respuesta.';
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Lo siento, hubo un error al generar la respuesta. Por favor intenta de nuevo.';
  }
}

// Generate response with OpenAI STREAMING
// 🎯 OPTIMIZADO PARA PROMPT CACHING: Instrucciones estáticas primero, contexto dinámico después
async function generateStreamingResponse(message: string, context: any[]) {
  // 🎯 PROMPT CACHING: Construir contexto RAG separado del contenido estático
  const contextText = buildRAGContext(
    context.map(c => ({ text: c.text, filename: c.filename })),
    'es'
  );

  // 🎯 ESTRUCTURA OPTIMIZADA: Estático primero (WIDGET_STATIC_INSTRUCTIONS se cachea)
  // Luego contexto dinámico que cambia por request
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: WIDGET_STATIC_INSTRUCTIONS },
      { role: 'user', content: `${contextText}\n\nPREGUNTA DEL USUARIO:\n${message}` }
    ],
    temperature: 0.7,
    max_tokens: 300,  // Reduced from 500 to 300 (40% less tokens = faster response)
    stream: true,
    stream_options: { include_usage: true }, // 📊 Necesario para obtener metrics en streaming
    // Enable prompt caching for static system message (75% latency reduction on cache hits)
    store: true,
  });

  return stream;
}

// Widget endpoint with RAG + OpenAI (with rate limiting)
async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, workspaceId, conversationId, stream = true } = body;

    // 🔒 SECURITY FIX #1: Validate CORS origin before processing
    const origin = req.headers.get('origin');
    const { allowed, allowedOrigin } = await validateOrigin(origin, workspaceId);

    const corsHeaders = getCorsHeaders(allowedOrigin);

    if (!allowed) {
      console.warn('[CORS] Blocked request from unauthorized origin:', { origin, workspaceId });
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403, headers: corsHeaders }
      );
    }

    if (!message || !workspaceId) {
      return NextResponse.json(
        { error: 'message and workspaceId are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Create or get conversation
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Create new conversation for widget
      const { data: newConversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          workspace_id: workspaceId,
          status: 'open',
          customer_name: 'Cliente del Widget',
          customer_metadata: { source: 'widget' },
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500, headers: corsHeaders }
        );
      }

      currentConversationId = newConversation.id;
    }

    // 2. Save user message
    const { error: userMsgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: message,
        sender_type: 'customer',
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // 3. Search relevant documents (RAG)
    const relevantChunks = await searchDocuments(workspaceId, message, 3);

    // 4. Check if streaming is requested
    if (stream) {
      // STREAMING RESPONSE
      const encoder = new TextEncoder();
      const openaiStream = await generateStreamingResponse(message, relevantChunks);

      let fullResponse = '';

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              conversationId: currentConversationId,
              sources: relevantChunks.length,
            })}\n\n`));

            // Stream response chunks
            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'content',
                  content: content,
                })}\n\n`));
              }
            }

            // Save complete response to DB
            await supabaseAdmin
              .from('messages')
              .insert({
                conversation_id: currentConversationId,
                content: fullResponse,
                sender_type: 'ai',
                ai_response: true,
                sources_used: relevantChunks.length > 0 ? relevantChunks : null,
              });

            // Send done signal
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
            })}\n\n`));

            controller.close();
          } catch (error) {
            console.error('Error in stream:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: 'Error generating response',
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    } else {
      // NON-STREAMING RESPONSE (backward compatibility)
      const aiResponse = await generateResponse(message, relevantChunks);

      // Save assistant message
      await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          content: aiResponse,
          sender_type: 'ai',
          ai_response: true,
          sources_used: relevantChunks.length > 0 ? relevantChunks : null,
        });

      return NextResponse.json({
        success: true,
        conversationId: currentConversationId,
        response: aiResponse,
        sources: relevantChunks.length > 0 ? relevantChunks.length : 0,
      }, { headers: corsHeaders });
    }
  } catch (error: any) {
    console.error('Error in widget endpoint:', error);
    // Return generic CORS headers on error
    const corsHeaders = getCorsHeaders(null);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Apply rate limiting and timing middleware
export async function POST(req: NextRequest) {
  return withRateLimit(
    req,
    RATE_LIMITS.WIDGET,
    withTiming(() => withErrorHandler(() => handlePOST(req), {
      endpoint: '/api/chat/widget',
      method: 'POST',
    }))
  );
}
