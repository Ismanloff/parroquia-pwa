import { NextRequest } from 'next/server';
import { Agent, AgentInputItem, Runner, setDefaultOpenAIKey } from "@openai/agents";
import { calendarTool } from '../tools/calendarTool';
import { resourcesTool } from '../tools/resourcesTool';
import { pineconeTool } from '../tools/pineconeTool';
// import { detectQuickActions } from '../utils/quickActionsConfig';
import Anthropic from '@anthropic-ai/sdk';
import { setCurrentTenantId } from '@/lib/tenant-context';
import { MESSAGE_STREAM_STATIC_INSTRUCTIONS } from '../config/promptConstants';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ⚡ CONFIGURAR API KEY
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY no configurada');
}
setDefaultOpenAIKey(apiKey);

// Inicializar Anthropic client para conversational rewriting
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// ===== CONVERSATIONAL REWRITING =====
// Detecta preguntas de seguimiento y las reescribe con contexto

/**
 * Detecta si una pregunta es un follow-up que necesita contexto
 */
function isFollowUpQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Muy corta (menos de 20 caracteres, probablemente incompleta)
  if (lowerMessage.length < 20) {
    // Empieza con conectores de seguimiento
    const followUpStarters = ['y ', '¿y ', 'también', 'qué tal', 'que tal', 'y el', 'y la', 'y los'];
    if (followUpStarters.some(starter => lowerMessage.startsWith(starter))) {
      return true;
    }
  }

  // Preguntas extremadamente cortas (menos de 15 caracteres)
  if (lowerMessage.length < 15 && !lowerMessage.includes('qué') && !lowerMessage.includes('que')) {
    return true;
  }

  return false;
}

/**
 * Reescribe una pregunta de seguimiento usando el contexto del historial con Claude Haiku 4.5
 */
async function rewriteWithContext(
  currentMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    console.log(`🔄 [Conversational Rewriting] Reescribiendo: "${currentMessage}"`);

    // Obtener últimos 3 mensajes para contexto (6 mensajes = 3 intercambios)
    const recentHistory = conversationHistory.slice(-6);

    // Construir contexto legible
    const contextLines = recentHistory.map(msg =>
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      temperature: 0.1,
      system: `Eres un experto en reescribir preguntas de seguimiento.

Tu tarea: Reescribir la pregunta del usuario para que sea COMPLETA y AUTO-CONTENIDA usando el contexto de la conversación previa.

Reglas:
- Incorpora el contexto necesario de mensajes anteriores
- Mantén la intención original del usuario
- Sé específico y claro
- Si se refiere a algo mencionado antes, inclúyelo explícitamente
- Máximo 20 palabras
- Añade contexto del negocio si es relevante

Ejemplos:
Usuario anterior: "precios del plan básico"
Pregunta actual: "y del premium?"
Reescritura: "¿Cuál es el precio del plan premium?"

Usuario anterior: "horario de atención"
Pregunta actual: "y los fines de semana?"
Reescritura: "¿Cuál es el horario de atención los fines de semana?"

Responde SOLO con la pregunta reescrita, sin explicaciones.`,
      messages: [
        {
          role: 'user',
          content: `Contexto de la conversación:\n${contextLines}\n\nPregunta actual del usuario: ${currentMessage}\n\nReescribe la pregunta:`
        }
      ]
    });

    const rewritten = response.content[0]?.type === 'text' ? response.content[0]?.text?.trim() : currentMessage;
    console.log(`✅ [Conversational Rewriting] Reescrito a: "${rewritten}"`);

    return rewritten;

  } catch (error) {
    console.warn('⚠️ [Conversational Rewriting] Error, usando original:', error);
    return currentMessage; // Fallback: usar mensaje original
  }
}

// ===== PRE-FILTRO DE QUERIES CONVERSACIONALES =====
// Detecta greetings, acknowledgments y chitchat que NO necesitan RAG

/**
 * Detecta si un mensaje es conversacional simple (no necesita búsqueda en documentos)
 * @returns {greeting|acknowledgment|chitchat|null} Tipo de mensaje conversacional o null si necesita RAG
 */
function detectConversationalQuery(message: string): 'greeting' | 'acknowledgment' | 'chitchat' | null {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  const greetings = ['hola', 'hey', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'holi'];
  if (greetings.some(greeting => lowerMessage === greeting || lowerMessage.startsWith(greeting + ' '))) {
    return 'greeting';
  }

  // Acknowledgments (respuestas cortas)
  const acknowledgments = ['vale', 'ok', 'gracias', 'muchas gracias', 'perfecto', 'entendido', 'de acuerdo', 'sí', 'si', 'no', 'claro', 'genial', 'bien'];
  if (acknowledgments.includes(lowerMessage) || acknowledgments.some(ack => lowerMessage === ack + '!' || lowerMessage === ack + '.')) {
    return 'acknowledgment';
  }

  // Chitchat (conversación casual)
  const chitchatPatterns = [
    'cómo estás', 'como estas', 'que tal', 'qué tal',
    'cómo te va', 'como te va', 'todo bien', 'qué haces', 'que haces'
  ];
  if (chitchatPatterns.some(pattern => lowerMessage.includes(pattern))) {
    return 'chitchat';
  }

  return null; // Necesita RAG
}

/**
 * Genera respuesta conversacional simple sin necesidad de RAG
 */
function getConversationalResponse(type: 'greeting' | 'acknowledgment' | 'chitchat'): string {
  switch (type) {
    case 'greeting':
      return '¡Hola! Soy tu asistente de atención al cliente con IA. Puedo ayudarte con información sobre productos, servicios, precios y más. ¿En qué puedo ayudarte?';
    case 'acknowledgment':
      return '¡De nada! ¿Hay algo más en lo que pueda ayudarte?';
    case 'chitchat':
      return '¡Todo bien por aquí! Estoy listo para ayudarte con cualquier duda. ¿Qué necesitas saber?';
  }
}

// 1. Definir las herramientas que usa el agente
// ✅ PINECONE: Búsqueda vectorial en documentos de la empresa (80-90% más rápido que fileSearch)
// Índice: knowledge base | Embeddings: text-embedding-3-large (3072 dims)

const agentModel = process.env.OPENAI_AGENT_MODEL || "gpt-4o-mini";
const agentName = process.env.AGENT_NAME || "Asistente de Atención al Cliente";

// ⚡ INSTRUCCIONES OPTIMIZADAS: Importadas desde config/promptConstants.ts
// 🎯 PROMPT CACHING: Las instrucciones estáticas se cachean automáticamente cuando el agente las usa
// Ver: MESSAGE_STREAM_STATIC_INSTRUCTIONS en config/promptConstants.ts
// NOTA: @openai/agents SDK maneja el caching internamente al crear el Agent

// 3. Crear el Agente con Pinecone + streaming
// 🎯 PROMPT CACHING: Usar MESSAGE_STREAM_STATIC_INSTRUCTIONS desde config
// El SDK de @openai/agents maneja automáticamente el caching de las instrucciones
// NOTA: NO usar outputType con streaming (causa error "Model did not produce a final response!")
const myAgent = new Agent({
  name: agentName,
  instructions: MESSAGE_STREAM_STATIC_INSTRUCTIONS,
  model: agentModel,
  modelSettings: {
    temperature: 0.3,
    topP: 0.7,
    maxTokens: 800, // Aumentado de 300 para respuestas más complejas
  },
  tools: [pineconeTool, calendarTool, resourcesTool],
  // outputType removido - incompatible con streaming
});

// 4. Handler de la API con STREAMING
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `stream_${Date.now()}`;
  console.log(`\n🌊 ========== STREAMING REQUEST ${requestId} ==========`);

  try {
    const { message, conversationHistory: clientHistory, tenant_id } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    if (!tenant_id) {
      return new Response('tenant_id is required for multi-tenant queries', { status: 400 });
    }

    // ⚠️ TODO: Implementar AsyncLocalStorage en producción
    // Por ahora usamos variable global (thread-unsafe pero funcional para MVP)
    setCurrentTenantId(tenant_id);

    console.log('⚡🌊 Iniciando streaming con @openai/agents...');
    console.log(`📝 Mensaje original: ${message.substring(0, 100)}...`);
    console.log(`🏢 Tenant ID: ${tenant_id} (stored globally for tools)`);
    console.log(`📚 Historial: ${(clientHistory || []).length} mensajes`);

    // ===== PRE-FILTRO: DETECTAR QUERIES CONVERSACIONALES =====
    // Evitar búsquedas innecesarias en Pinecone para "hola", "gracias", etc.
    const conversationalType = detectConversationalQuery(message);

    if (conversationalType) {
      console.log(`💬 [Pre-filtro] Query conversacional detectada: ${conversationalType}`);
      console.log(`⚡ [Pre-filtro] Respondiendo directamente sin RAG`);

      // Responder directamente sin usar el agente
      const response = getConversationalResponse(conversationalType);

      // Crear encoder y stream simple
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          // Simular streaming para consistencia de UX
          const chunks = response.split(' ');
          chunks.forEach((chunk, index) => {
            const text = index === chunks.length - 1 ? chunk : chunk + ' ';
            const data = `data: ${JSON.stringify(text)}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Enviar evento de completado
          const doneEvent = `event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));
          controller.close();
        }
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Request-ID': requestId,
        },
      });
    }

    // ===== CONVERSATIONAL REWRITING =====
    // Detectar y reescribir preguntas de seguimiento ANTES de pasar al agente
    let processedMessage = message;

    // 🎯 OPTIMIZACIÓN CONDICIONAL: Solo reescribir si es realmente necesario
    const messageLength = message.trim().length;
    const needsRewriting = messageLength < 30 && isFollowUpQuestion(message) && clientHistory && clientHistory.length > 0;

    if (needsRewriting) {
      console.log(`🔍 [Conversational Rewriting] Detectada pregunta de seguimiento corta (${messageLength} chars)`);
      processedMessage = await rewriteWithContext(message, clientHistory);
      console.log(`📝 Mensaje procesado: ${processedMessage}`);
    } else if (messageLength >= 30) {
      console.log(`⚡ [Conversational Rewriting] SKIP - Query auto-contenida (${messageLength} chars)`);
    }

    // Preparar historial de conversación (formato AgentInputItem)
    const trimmedHistory = (clientHistory || []).slice(-10); // Últimos 10 mensajes
    const conversationHistory: AgentInputItem[] = trimmedHistory.map((msg: { role: string, content: string }) => {
      const sanitizedContent = msg.content ?? '';

      if (msg.role === 'assistant') {
        return {
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: sanitizedContent }]
        } as AgentInputItem;
      }

      return {
        role: "user",
        content: [{ type: "input_text", text: sanitizedContent }]
      } as AgentInputItem;
    });

    // Añadir el mensaje procesado (posiblemente reescrito) al historial del agente
    conversationHistory.push({
      role: "user",
      content: [{ type: "input_text", text: processedMessage }]
    });

    // ⚡ STREAMING con @openai/agents
    const runner = new Runner({
      traceMetadata: {
        request_id: requestId,
        workflow_name: "resply_chatbot_streaming",
        timestamp: new Date().toISOString(),
      },
    });

    // Ejecutar agente con streaming (API correcta: run con { stream: true })
    const stream = await runner.run(myAgent, conversationHistory, { stream: true });

    // Crear encoder para Server-Sent Events
    const encoder = new TextEncoder();

    // ReadableStream que enviará chunks al frontend
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // 🔍 EMITIR STATUS: "Buscando datos..."
          const searchingEvent = `event: status\ndata: ${JSON.stringify({ status: 'searching' })}\n\n`;
          controller.enqueue(encoder.encode(searchingEvent));
          console.log('📡 Status emitido: searching');

          let accumulatedText = '';
          // Attachments DESACTIVADOS - siempre null
          // let finalAttachments: any[] | null = null;
          // const originalMessage = message; // Guardar mensaje para detectar quickActions
          let hasStartedStreaming = false; // Flag para limpiar status cuando empiece streaming

          // ⚡ STREAMING: Iterar eventos del agente
          for await (const event of stream) {
            // Evento: Tokens incrementales del modelo
            if (event.type === 'raw_model_stream_event') {
              const rawEvent = event.data as any;

              // Texto incremental (response.output_text.delta)
              if (rawEvent.event?.type === 'response.output_text.delta' && rawEvent.event?.delta) {
                // 🧹 LIMPIAR STATUS: Cuando empiece streaming (solo la primera vez)
                if (!hasStartedStreaming) {
                  const clearStatusEvent = `event: status\ndata: ${JSON.stringify({ status: null })}\n\n`;
                  controller.enqueue(encoder.encode(clearStatusEvent));
                  console.log('📡 Status limpiado (streaming iniciado)');
                  hasStartedStreaming = true;
                }

                const delta = rawEvent.event.delta;
                accumulatedText += delta;

                // Enviar chunk al frontend
                const data = `data: ${JSON.stringify(delta)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }

            // Attachments DESACTIVADOS
            // if (event.type === 'run_item_stream_event') {
            //   const item = event.item as any;
            //   if (item?.output?.attachments && Array.isArray(item.output.attachments) && item.output.attachments.length > 0) {
            //     finalAttachments = item.output.attachments;
            //     console.log(`📎 Attachments capturados:`, finalAttachments!.length);
            //   }
            // }
          }

          console.log('✅ Streaming completado');

          // 🎯 DETECTAR QUICK ACTIONS solo para preguntas específicas sobre inscripciones
          // Solo mostrar si el usuario pregunta EXPLÍCITAMENTE sobre inscribirse/apuntarse
          // QuickActions DESACTIVADOS por solicitud del usuario
          // const isAskingAboutInscription = inscriptionKeywords.some(kw =>
          //   originalMessage.toLowerCase().includes(kw)
          // );
          // let quickActions = null;
          // if (isAskingAboutInscription) {
          //   quickActions = detectQuickActions(originalMessage, accumulatedText);
          //   if (quickActions) {
          //     console.log(`🎯 Quick Actions detectados:`, quickActions.buttons.length, 'botones');
          //   }
          // }

          // Enviar evento de completado (sin attachments ni quickActions)
          const doneData = {
            completed: true,
            attachments: null, // ❌ Attachments desactivados
            quickActions: null // ❌ QuickActions desactivados
          };
          const doneEvent = `event: done\ndata: ${JSON.stringify(doneData)}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));

          controller.close();
        } catch (error: any) {
          console.error('❌ Error en streaming:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-Request-ID': requestId,
      },
    });

  } catch (error: any) {
    console.error('❌❌❌ ERROR STREAMING:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
