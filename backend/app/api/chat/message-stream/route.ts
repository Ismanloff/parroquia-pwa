import { NextRequest } from 'next/server';
import { Agent, AgentInputItem, Runner, setDefaultOpenAIKey } from "@openai/agents";
import { calendarTool } from '../tools/calendarTool';
import { resourcesTool } from '../tools/resourcesTool';
import { pineconeTool } from '../tools/pineconeTool';
import { detectQuickActions } from '../utils/quickActionsConfig';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ⚡ CONFIGURAR API KEY (lazy para no fallar durante build)
const apiKey = process.env.OPENAI_API_KEY;
let _openaiKeySet = false;

const ensureOpenAIKey = () => {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada');
  }
  if (!_openaiKeySet) {
    setDefaultOpenAIKey(apiKey);
    _openaiKeySet = true;
  }
};

// Inicializar Anthropic client para conversational rewriting (lazy)
let _anthropic: Anthropic | null = null;
const getAnthropic = () => {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });
  }
  return _anthropic;
};

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

    const response = await getAnthropic().messages.create({
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
- Añade contexto parroquial si es relevante

Ejemplos:
Usuario anterior: "actividades para jóvenes"
Pregunta actual: "y para matrimonios?"
Reescritura: "¿Qué actividades hay para matrimonios en la parroquia?"

Usuario anterior: "qué es Eloos"
Pregunta actual: "y Bartimeo?"
Reescritura: "¿Qué es el grupo Bartimeo de la parroquia?"

Responde SOLO con la pregunta reescrita, sin explicaciones.`,
      messages: [
        {
          role: 'user',
          content: `Contexto de la conversación:\n${contextLines}\n\nPregunta actual del usuario: ${currentMessage}\n\nReescribe la pregunta:`
        }
      ]
    });

    const rewritten = response.content[0].type === 'text' ? response.content[0].text.trim() : currentMessage;
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
      return '¡Hola! Soy el asistente parroquial. Puedo ayudarte con información sobre actividades, grupos, sacramentos y más. ¿En qué puedo ayudarte?';
    case 'acknowledgment':
      return '¡De nada! ¿Hay algo más en lo que pueda ayudarte?';
    case 'chitchat':
      return '¡Todo bien por aquí! Estoy listo para ayudarte con cualquier duda sobre la parroquia. ¿Qué necesitas saber?';
  }
}

// 1. Definir las herramientas que usa el agente
// ✅ PINECONE: Búsqueda vectorial en documentos parroquiales (80-90% más rápido que fileSearch)
// Índice: parroquias | 24 documentos | Embeddings: text-embedding-3-large (3072 dims)

const agentModel = process.env.OPENAI_AGENT_MODEL || "gpt-4o-mini";
const agentName = process.env.AGENT_NAME || "Asistente Parroquial";

// ⚡ INSTRUCCIONES OPTIMIZADAS (concisas para velocidad)
const agentInstructions = `Asistente parroquial. Responde breve y claro.

TOOLS: get_calendar_events, get_resources, search_parish_info

⚠️ REGLA CRÍTICA: SIEMPRE USA search_parish_info PRIMERO
- Para CUALQUIER pregunta sobre actividades, grupos, sacramentos, o información parroquial
- NUNCA NUNCA respondas de memoria - SIEMPRE busca en los documentos primero
- Aunque creas saber la respuesta, USA search_parish_info para verificar

Ejemplos que REQUIEREN search_parish_info:
  * "Qué es Eloos?" → search_parish_info
  * "Qué es oración de madres?" → search_parish_info
  * "Biblia y teología" → search_parish_info
  * "Grupos de la parroquia" → search_parish_info
  * "Horarios de Cáritas" → search_parish_info
  * "Cómo me bautizo?" → search_parish_info
  * "Qué actividades hay" → search_parish_info
  * "Oro y Café" → search_parish_info

USO DE search_parish_info (Pinecone):
- Usa search_parish_info para buscar en documentos oficiales de la parroquia
- Para consultas sobre sacramentos, grupos, actividades, normativas, historia
- Información sobre catequesis, Eloos, Cáritas, comunidades religiosas, etc.
- Puedes filtrar por categoría: sacramentos, catequesis, liturgia, caritas, jovenes, familias
- Responde con la información de forma natural y directa
- Esta herramienta es 80-90% más rápida que la anterior

USO DE get_calendar_events:
- Para eventos con fechas específicas: "eventos hoy", "misas esta semana", "qué hay mañana"

USO DE get_resources:
- Para formularios de inscripción y enlaces directos a Typeform

REGLAS CRÍTICAS:
- Usa tools, no adivines información
- Inscripciones/formularios → get_resources
- Eventos/fechas → get_calendar_events
- Info documentada → search_parish_info
- Casos complejos → deriva al párroco
- Tono acogedor y profesional

⚠️ COHERENCIA: NO mezcles actividades distintas
- Si preguntan por "Eloos" → habla SOLO de Eloos
- Si preguntan por "Cáritas" → habla SOLO de Cáritas
- NO agregues otras actividades solo porque ocurren el mismo día
- Mantén el foco en lo que el usuario pregunta específicamente`;

// 3. Crear el Agente con Pinecone + streaming
// NOTA: NO usar outputType con streaming (causa error "Model did not produce a final response!")
const myAgent = new Agent({
  name: agentName,
  instructions: agentInstructions,
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
    // Asegurar que la API key esté configurada
    ensureOpenAIKey();

    const { message, conversationHistory: clientHistory } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    console.log('⚡🌊 Iniciando streaming con @openai/agents...');
    console.log(`📝 Mensaje original: ${message.substring(0, 100)}...`);
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
        workflow_name: "parroquia_chatbot_streaming",
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
          let finalAttachments: any[] | null = null;
          const originalMessage = message; // Guardar mensaje para detectar quickActions
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

            // Evento: Item completado (incluye attachments)
            if (event.type === 'run_item_stream_event') {
              const item = event.item as any;

              // Capturar attachments si los hay
              if (item?.output?.attachments && Array.isArray(item.output.attachments) && item.output.attachments.length > 0) {
                finalAttachments = item.output.attachments;
                console.log(`📎 Attachments capturados:`, finalAttachments!.length);
              }
            }
          }

          console.log('✅ Streaming completado');

          // 🎯 DETECTAR QUICK ACTIONS solo para preguntas específicas sobre inscripciones
          // Solo mostrar si el usuario pregunta EXPLÍCITAMENTE sobre inscribirse/apuntarse
          const inscriptionKeywords = [
            'inscrib',
            'apunta',
            'unir',
            'participar',
            'formulario',
            'registr',
            'cómo entrar',
            'como entrar',
            'cómo me uno',
            'como me uno'
          ];

          const isAskingAboutInscription = inscriptionKeywords.some(kw =>
            originalMessage.toLowerCase().includes(kw)
          );

          let quickActions = null;
          if (isAskingAboutInscription) {
            quickActions = detectQuickActions(originalMessage, accumulatedText);
            if (quickActions) {
              console.log(`🎯 Quick Actions detectados (pregunta de inscripción):`, quickActions.buttons.length, 'botones');
            }
          }

          // Enviar evento de completado con attachments y quickActions
          const doneData = {
            completed: true,
            attachments: finalAttachments,
            quickActions: quickActions // ✨ Agregar botones inteligentes
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
