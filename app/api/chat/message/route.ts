import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from "zod";
import { semanticCache } from '../utils/semanticCache';
import { memoryCache } from '../utils/memoryCache';
import { StructuredLogger } from '../utils/structuredLogger';
import { searchResources } from '../tools/resourcesTool';

// Importar la lógica de calendar tool
import ICAL from 'ical.js';

const CALENDAR_URL = process.env.GOOGLE_CALENDAR_ICS_URL ||
  'https://calendar.google.com/calendar/ical/2ca61dd15b0992030db91fe0df4c6f59720ac5901439d6227dfef642c33c0986%40group.calendar.google.com/public/basic.ics';

let cachedEvents: any[] | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Helper para enviar logs al dashboard de debug
function sendDebugLog(level: string, message: string, data: any, requestId: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/debug/logger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'backend',
      level,
      message,
      data,
      requestId,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

// Helper para reintentar con backoff exponencial
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error?.status === 429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⏳ Rate limit alcanzado. Reintentando en ${delay}ms... (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

// Helper para moderar contenido con OpenAI Moderation API
async function moderateContent(message: string, openaiClient: OpenAI): Promise<{ flagged: boolean; categories?: string[] }> {
  try {
    const moderation = await openaiClient.moderations.create({
      input: message,
    });

    const result = moderation.results[0];
    if (result?.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return { flagged: true, categories: flaggedCategories };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Error en moderación:', error);
    return { flagged: false };
  }
}

// ⭐ INPUT GUARDRAIL: Verificar relevancia parroquial
function checkRelevance(message: string): { isRelevant: boolean; response?: string } {
  const normalized = message.toLowerCase().trim();

  const irrelevantKeywords = [
    'bitcoin', 'cripto', 'cryptocurrency', 'ethereum',
    'comprar', 'vender', 'invertir', 'trading',
    'futbol', 'fútbol', 'deportes', 'partido',
    'recetas', 'cocina', 'restaurante',
    'programación', 'código', 'javascript', 'python',
    'videojuegos', 'gaming', 'juegos',
    'política', 'elecciones', 'gobierno',
  ];

  const hasIrrelevantKeyword = irrelevantKeywords.some(kw => normalized.includes(kw));
  const hasParishKeyword = /parroquia|iglesia|misa|sacramento|fe|dios|jesús|virgen|catequesis|bautizo|comunión|confirmación|matrimonio|párroco|padre/i.test(message);

  if (hasIrrelevantKeyword && !hasParishKeyword) {
    return {
      isRelevant: false,
      response: 'Solo puedo ayudarte con información sobre la parroquia: horarios de misas, eventos, catequesis, sacramentos, grupos parroquiales, etc. ¿En qué puedo ayudarte relacionado con la parroquia?'
    };
  }

  return { isRelevant: true };
}

// Helper para detectar respuestas genéricas y responder sin llamar al agente
function isGenericResponse(message: string): string | null {
  const normalized = message.toLowerCase().trim();

  const genericPatterns = [
    /^(gracias|muchas gracias|mil gracias)$/,
    /^(vale|ok|okay|de acuerdo)$/,
    /^(entendido|perfecto|genial|excelente|bien)$/,
    /^(vale gracias|ok gracias|gracias vale)$/,
    /^(entendido gracias|perfecto gracias)$/,
    /^(genial gracias|excelente gracias|bien gracias)$/,
    /^(super|super gracias|muy bien|muy bien gracias)$/,
    /^(claro|por supuesto|desde luego)$/,
    /^(sí|si|no)$/,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(normalized)) {
      const responses = [
        '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
        '¡Encantado de ayudar! Si necesitas algo más, aquí estoy.',
        '¡Para eso estoy! ¿Tienes alguna otra pregunta?',
        '¡Un placer! No dudes en preguntar si necesitas más información.',
      ];
      return responses[Math.floor(Math.random() * responses.length)] || null;
    }
  }

  return null;
}

// 🚀 OPTIMIZACIÓN: Context trimming - límite de mensajes en historial
const MAX_HISTORY_MESSAGES = 15;

const agentModel = process.env.OPENAI_AGENT_MODEL || "gpt-4o-mini";

// ⚡ INSTRUCCIONES OPTIMIZADAS: Concisas para máxima velocidad (< 3s)
const AGENT_INSTRUCTIONS = `Asistente parroquial. Responde breve y claro.

TOOLS: get_calendar_events, get_resources (copia COMPLETO a attachments)

REGLAS CRÍTICAS:
- Usa tools, no adivines
- Inscripciones/formularios → get_resources + copia a attachments
- Casos complejos → deriva al párroco
- Tono acogedor y profesional

⚠️ COHERENCIA: NO mezcles actividades distintas
- Si preguntan por "Eloos" → habla SOLO de Eloos
- Si preguntan por "Cáritas" → habla SOLO de Cáritas
- NO agregues otras actividades solo porque ocurren el mismo día
- Mantén el foco en lo que el usuario pregunta específicamente`;

// ⚡ CONFIGURACIÓN DE RUNTIME: Extender timeout de Edge Function
export const runtime = 'nodejs'; // Usar Node.js runtime (no Edge) para mayor timeout
export const maxDuration = 60; // 60 segundos máximo (Pro plan)

// ⚡ FUNCTION DEFINITIONS para OpenAI Function Calling (OPTIMIZADO: descripciones ultra-cortas)
const FUNCTIONS = [
  {
    type: "function" as const,
    function: {
      name: "get_calendar_events",
      description: "Obtiene eventos del calendario parroquial por fecha/periodo.",
      parameters: {
        type: "object",
        properties: {
          timeframe: {
            type: "string",
            enum: ['upcoming', 'today', 'tomorrow', 'week', 'weekend', 'next_week', 'month', 'custom'],
            description: "El periodo de tiempo para buscar eventos"
          },
          limit: {
            type: "number",
            nullable: true,
            default: 10,
            description: "Número máximo de eventos a devolver"
          },
          startDate: {
            type: "string",
            nullable: true,
            description: "Fecha de inicio para búsqueda custom (formato ISO)"
          },
          endDate: {
            type: "string",
            nullable: true,
            description: "Fecha de fin para búsqueda custom (formato ISO)"
          },
        },
        required: ["timeframe"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_resources",
      description: "Busca formularios, PDFs y documentos parroquiales.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "La consulta o tema del usuario para buscar recursos relacionados"
          },
        },
        required: ["query"],
      },
    },
  },
];

// 4. Handler de la API para procesar los mensajes
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  console.log(`\n🔵 ========== BACKEND REQUEST ${requestId} ==========`);

  try {
    // Extraer mensaje e historial del frontend
    const { message, conversationHistory: clientHistory } = await request.json();

    console.log(`📨 [${requestId}] Mensaje recibido:`, message);
    console.log(`📚 [${requestId}] Historial length:`, clientHistory?.length || 0);

    sendDebugLog('info', 'Request recibida en backend', {
      message: message.substring(0, 100),
      historyLength: clientHistory?.length || 0,
    }, requestId);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 🛡️ INPUT GUARDRAIL: Verificar relevancia parroquial
    const relevanceCheck = checkRelevance(message);
    if (!relevanceCheck.isRelevant) {
      console.log(`🚫 [${requestId}] Consulta irrelevante detectada`);
      sendDebugLog('warning', 'Consulta irrelevante bloqueada', {
        messagePreview: message.substring(0, 50),
      }, requestId);

      return NextResponse.json({
        message: relevanceCheck.response,
        attachments: null,
        fromCache: false,
        guardrail: 'relevance',
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      });
    }

    // 🛡️ MODERACIÓN DE CONTENIDO
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      return NextResponse.json({ error: 'La clave de API de OpenAI no está configurada en el servidor.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const moderationResult = await moderateContent(message, openai);

    if (moderationResult.flagged) {
      console.log(`🚫 [${requestId}] Contenido inapropiado detectado:`, moderationResult.categories);
      return NextResponse.json({
        message: 'Lo siento, no puedo procesar ese tipo de contenido. Por favor, reformula tu mensaje de manera apropiada.',
        attachments: null,
        fromCache: false,
        moderated: true,
      });
    }

    // 🎯 DETECCIÓN DE RESPUESTAS GENÉRICAS
    const genericResponse = isGenericResponse(message);
    if (genericResponse) {
      console.log(`💬 [${requestId}] Respuesta genérica detectada: "${message}"`);
      return NextResponse.json({
        message: genericResponse,
        attachments: null,
        fromCache: false,
        generic: true,
      });
    }

    // 💾 CACHE SEMÁNTICO DESACTIVADO (2025-01-XX)
    // Razón: Pinecone es rápido (0.3s) + streaming oculta latencia
    // Cache solo para Calendar API (tiene su propio cache de 5 min)

    // let cachedResponse = await memoryCache.get(message);
    // let cacheSource = 'memory';

    // if (!cachedResponse) {
    //   try {
    //     cachedResponse = await semanticCache.get(message);
    //     cacheSource = 'kv';
    //   } catch (error) {
    //     console.log(`⚠️ [${requestId}] KV cache no disponible, usando solo memory cache`);
    //   }
    // }

    // if (cachedResponse) {
    //   console.log(`⚡ [${requestId}] CACHE HIT - retornando desde ${cacheSource} cache`);
    //   return NextResponse.json({
    //     message: cachedResponse,
    //     fromCache: true,
    //     cacheSource,
    //   });
    // }

    console.log(`🚀 [${requestId}] Ejecutando AI (cache desactivado)...`);
    sendDebugLog('info', 'CACHE MISS - Ejecutando Function Calling', {}, requestId);

    // 🚀 OPTIMIZACIÓN: Context trimming
    const trimmedHistory = (clientHistory || []).slice(-MAX_HISTORY_MESSAGES);

    // Convertir historial al formato OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_INSTRUCTIONS },
      ...trimmedHistory.map((msg: { role: string, content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // 📊 TRACING: Timestamp de inicio
    const startTime = Date.now();
    console.log('⚡ Ejecutando Function Calling optimizado...');

    // ⚡ PASO 1: Llamada inicial al modelo
    let response = await retryWithExponentialBackoff(
      () => openai.chat.completions.create({
        model: agentModel,
        messages,
        functions: FUNCTIONS.map(f => f.function),
        function_call: "auto",
        temperature: 0.3,
        max_tokens: 200, // ⚡ Reducido para velocidad
      }),
      3,
      1000
    );

    let finalMessage = response.choices[0]?.message;
    let toolResults: any[] = [];

    // Check if finalMessage exists
    if (!finalMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // ⚡ PASO 2: Loop de tool execution (máximo 3 iteraciones)
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    while (finalMessage.function_call && iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`🔧 [${requestId}] Iteración ${iterations}: Ejecutando ${finalMessage.function_call.name}`);

      const functionName = finalMessage.function_call.name;
      const functionArgs = JSON.parse(finalMessage.function_call.arguments);

      let functionResult: string;

      // Ejecutar la función correspondiente
      if (functionName === "get_calendar_events") {
        // ⚡ IMPLEMENTACIÓN INLINE DE CALENDAR TOOL (evita overhead del SDK)
        try {
          const now = Date.now();

          // Fetch y cachear eventos
          if (!cachedEvents || (now - lastFetch) >= CACHE_DURATION) {
            const response = await fetch(CALENDAR_URL);
            if (!response.ok) {
              throw new Error(`Failed to fetch calendar: ${response.status}`);
            }

            const icsData = await response.text();
            const jcalData = ICAL.parse(icsData);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');

            cachedEvents = vevents.map((vevent) => {
              const event = new ICAL.Event(vevent);
              const startDate = event.startDate;
              const endDate = event.endDate;
              const allDay = !startDate.hour && !startDate.minute;

              return {
                id: event.uid,
                title: event.summary || 'Sin título',
                start: startDate.toJSDate().toISOString(),
                end: endDate.toJSDate().toISOString(),
                location: event.location || undefined,
                description: event.description || undefined,
                allDay,
              };
            });

            cachedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
            lastFetch = now;
          }

          // Filtrar eventos según timeframe
          const timeframe = functionArgs.timeframe || 'upcoming';
          const limit = functionArgs.limit || 10;
          const nowDate = new Date();

          let filteredEvents = cachedEvents.filter(event => {
            const eventEnd = new Date(event.end);
            const eventStart = new Date(event.start);
            return eventEnd >= nowDate || eventStart >= nowDate;
          });

          if (timeframe === 'today') {
            const todayStart = new Date(nowDate);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(nowDate);
            todayEnd.setHours(23, 59, 59, 999);

            filteredEvents = filteredEvents.filter(event => {
              const eventStart = new Date(event.start);
              return eventStart >= todayStart && eventStart <= todayEnd;
            });
          } else if (timeframe === 'tomorrow') {
            const tomorrow = new Date(nowDate);
            tomorrow.setDate(nowDate.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(23, 59, 59, 999);

            filteredEvents = filteredEvents.filter(event => {
              const eventStart = new Date(event.start);
              return eventStart >= tomorrow && eventStart <= tomorrowEnd;
            });
          } else if (timeframe === 'upcoming') {
            filteredEvents = filteredEvents.slice(0, limit);
          }

          // Formatear eventos
          const currentDateStr = nowDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/Madrid'
          });

          if (filteredEvents.length === 0) {
            functionResult = `[Fecha actual: ${currentDateStr}]\n\nNo hay eventos programados para ${timeframe}.`;
          } else {
            const formattedEvents = filteredEvents.map(event => {
              const startDate = new Date(event.start);
              const endDate = new Date(event.end);

              let dateStr = startDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Europe/Madrid'
              });

              if (!event.allDay) {
                const startTime = startDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Madrid',
                  hour12: false
                });
                const endTime = endDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Madrid',
                  hour12: false
                });
                dateStr += ` de ${startTime} a ${endTime}`;
              } else {
                dateStr += ' (todo el día)';
              }

              let result = `**${event.title}**\n📅 ${dateStr}`;
              if (event.location) result += `\n📍 ${event.location}`;
              if (event.description) result += `\n📝 ${event.description}`;

              return result;
            }).join('\n\n---\n\n');

            functionResult = `[Fecha actual: ${currentDateStr}]\n\n✅ Encontré ${filteredEvents.length} evento(s):\n\n${formattedEvents}`;
          }
        } catch (error: any) {
          console.error('Error fetching calendar:', error);
          functionResult = "Lo siento, no pude obtener los eventos del calendario en este momento.";
        }
      } else if (functionName === "get_resources") {
        const result = searchResources(functionArgs.query);
        functionResult = JSON.stringify(result);
        toolResults = result.resources || [];
      } else {
        functionResult = JSON.stringify({ error: "Función desconocida" });
      }

      // Agregar result al historial y hacer nueva llamada
      messages.push(finalMessage);
      messages.push({
        role: "function" as const,
        name: functionName,
        content: functionResult,
      });

      response = await openai.chat.completions.create({
        model: agentModel,
        messages,
        functions: FUNCTIONS.map(f => f.function),
        function_call: "auto",
        temperature: 0.3,
        max_tokens: 200, // ⚡ Reducido para velocidad
      });

      finalMessage = response.choices[0]?.message || finalMessage;
    }

    // 📊 TRACING: Tiempo de ejecución
    const duration = Date.now() - startTime;
    console.log(`⚡ Function Calling ejecutado en ${duration}ms`);

    const assistantMessage = finalMessage.content || "Lo siento, no pude generar una respuesta.";

    // Formatear attachments desde toolResults
    const attachments = toolResults.length > 0 ? toolResults.map(r => ({
      title: r.title,
      url: r.url,
      type: r.type,
      description: r.description,
    })) : null;

    // 💾 CACHE SEMÁNTICO DESACTIVADO (no guardar en cache)
    // await semanticCache.set(message, assistantMessage);

    console.log(`📝 [${requestId}] Respuesta generada: ${assistantMessage.length} caracteres`);
    console.log(`✅ [${requestId}] Respuesta enviada (total: ${duration}ms)`);

    return NextResponse.json({
      message: assistantMessage,
      attachments: attachments,
      fromCache: false,
      usage: response.usage,
    });

  } catch (error: any) {
    console.error('❌❌❌ ERROR COMPLETO:', error);

    let userMessage = 'Lo siento, ocurrió un error al procesar tu mensaje.';
    let statusCode = 500;

    if (error.status === 401 || error.code === 'invalid_api_key') {
      userMessage = 'Error de autenticación con OpenAI. Por favor, contacta al administrador.';
      statusCode = 401;
    } else if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      userMessage = 'Hemos alcanzado el límite de solicitudes. Por favor, intenta de nuevo en unos minutos.';
      statusCode = 429;
    }

    return NextResponse.json(
      { error: userMessage, technical: error.message },
      { status: statusCode }
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
