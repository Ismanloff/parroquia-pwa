import { NextRequest, NextResponse } from 'next/server';
import { fileSearchTool, Agent, AgentInputItem, Runner, setDefaultOpenAIKey } from "@openai/agents";
import { z } from "zod";
import OpenAI from 'openai';
import { calendarTool } from '../tools/calendarTool';
import { resourcesTool } from '../tools/resourcesTool';
import { semanticCache } from '../utils/semanticCache';
import { memoryCache } from '../utils/memoryCache';
import { StructuredLogger } from '../utils/structuredLogger';

// Helper para enviar logs al dashboard de debug
// 🚀 OPTIMIZADO: Fire-and-forget (no bloquea), solo en desarrollo
function sendDebugLog(level: string, message: string, data: any, requestId: string) {
  // Solo ejecutar en desarrollo para evitar latencia en producción
  if (process.env.NODE_ENV === 'production') {
    return; // No hacer nada en producción
  }

  // Fire-and-forget: no usar await, ejecutar en background
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
  }).catch(() => {
    // Silenciar errores del logger (fire-and-forget)
  });
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

      // Si es error 429 (rate limit), reintentar con backoff
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt); // 1s, 2s, 4s, 8s...
        console.log(`⏳ Rate limit alcanzado. Reintentando en ${delay}ms... (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Si no es 429 o ya no quedan reintentos, lanzar el error
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
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return { flagged: true, categories: flaggedCategories };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Error en moderación:', error);
    // En caso de error, permitir el mensaje (fail open)
    return { flagged: false };
  }
}

// ⭐ INPUT GUARDRAIL: Verificar relevancia parroquial
function checkRelevance(message: string): { isRelevant: boolean; response?: string } {
  const normalized = message.toLowerCase().trim();

  // Keywords claramente NO relacionados con parroquia
  const irrelevantKeywords = [
    'bitcoin', 'cripto', 'cryptocurrency', 'ethereum',
    'comprar', 'vender', 'invertir', 'trading',
    'futbol', 'fútbol', 'deportes', 'partido',
    'recetas', 'cocina', 'restaurante',
    'programación', 'código', 'javascript', 'python',
    'videojuegos', 'gaming', 'juegos',
    'política', 'elecciones', 'gobierno',
  ];

  // Si menciona keywords irrelevantes y NO menciona nada parroquial
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

// ✅ LISTA BLANCA: Información pública de contacto de la parroquia
// Estos datos son públicos y pueden compartirse con los usuarios
const PUBLIC_CONTACT_WHITELIST = {
  // Teléfonos públicos de las parroquias
  phones: [
    // Parroquia Transfiguración del Señor
    '914751875',
    '91 475 18 75',
    '+34914751875',
    '+34 91 475 18 75',

    // Parroquia Ntra. Señora de la Soledad
    '917924245',
    '91 792 42 45',
    '+34917924245',
    '+34 91 792 42 45',
  ],

  // Emails públicos de las parroquias (agregar cuando estén disponibles)
  emails: [
    // Agregar emails cuando los tengas disponibles
    // Ejemplo: 'info@transfiguracion.es',
  ],

  // Direcciones públicas de las parroquias
  addresses: [
    // Parroquia Ntra. Señora de la Soledad
    'Porta Coeli, s/n',
    'Visitación, 1',
    'c/ Porta Coeli, s/n',
    'c/ Visitación, 1',

    // Parroquia Transfiguración del Señor
    'Isabelita Usera, 34',
    'c/ Isabelita Usera, 34',
  ],
};

// Helper: Normalizar teléfonos para comparación (quita espacios, guiones, +34)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, '').replace(/^34/, '');
}

// Helper: Normalizar emails para comparación (lowercase)
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Helper: Normalizar direcciones para comparación
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper: Verificar si un teléfono está en la lista blanca
function isWhitelistedPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return PUBLIC_CONTACT_WHITELIST.phones.some(whitelisted =>
    normalizePhone(whitelisted) === normalized
  );
}

// Helper: Verificar si un email está en la lista blanca
function isWhitelistedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return PUBLIC_CONTACT_WHITELIST.emails.some(whitelisted =>
    normalizeEmail(whitelisted) === normalized
  );
}

// Helper: Verificar si una dirección está en la lista blanca
function isWhitelistedAddress(address: string): boolean {
  const normalized = normalizeAddress(address);
  return PUBLIC_CONTACT_WHITELIST.addresses.some(whitelisted =>
    normalizeAddress(whitelisted).includes(normalized) ||
    normalized.includes(normalizeAddress(whitelisted))
  );
}

// ⭐ OUTPUT GUARDRAIL: Filtrar información personal sensible (PII)
// ✅ MEJORADO: Respeta lista blanca de contactos públicos de la parroquia
function filterPII(text: string): { hasPII: boolean; filteredText?: string; detectedTypes?: string[] } {
  const detectedTypes: string[] = [];
  let filteredText = text;

  // 1. TELÉFONOS - Solo bloquear si NO están en lista blanca
  const phonePattern = /\b(\+34[\s\-]?)?[6789]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/g;
  let phoneMatch;
  while ((phoneMatch = phonePattern.exec(text)) !== null) {
    const phone = phoneMatch[0];
    if (!isWhitelistedPhone(phone)) {
      detectedTypes.push('teléfono privado');
      filteredText = filteredText.replace(phone, '[TELÉFONO ELIMINADO]');
    }
  }

  // 2. EMAILS - Solo bloquear si NO están en lista blanca
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let emailMatch;
  while ((emailMatch = emailPattern.exec(text)) !== null) {
    const email = emailMatch[0];
    if (!isWhitelistedEmail(email)) {
      detectedTypes.push('email privado');
      filteredText = filteredText.replace(email, '[EMAIL ELIMINADO]');
    }
  }

  // 3. DNI/NIE - SIEMPRE bloquear (nunca son públicos)
  const dniPattern = /\b[0-9]{8}[A-Z]\b|\b[XYZ][0-9]{7}[A-Z]\b/g;
  if (dniPattern.test(filteredText)) {
    detectedTypes.push('DNI/NIE');
    filteredText = filteredText.replace(dniPattern, '[DOCUMENTO ELIMINADO]');
  }

  // 4. DIRECCIONES - Solo bloquear si NO están en lista blanca
  const addressPattern = /\b(calle|c\/|avenida|av\.|plaza|pl\.|paseo)\s+[A-Za-zÀ-ÿ\s]+,?\s*\d+/gi;
  let addressMatch;
  const addressMatches: string[] = [];
  while ((addressMatch = addressPattern.exec(text)) !== null) {
    addressMatches.push(addressMatch[0]);
  }

  for (const address of addressMatches) {
    if (!isWhitelistedAddress(address)) {
      detectedTypes.push('dirección privada');
      filteredText = filteredText.replace(address, '[DIRECCIÓN ELIMINADA]');
    }
  }

  if (detectedTypes.length > 0) {
    return {
      hasPII: true,
      filteredText,
      detectedTypes,
    };
  }

  return { hasPII: false };
}

// Helper para detectar respuestas genéricas y responder sin llamar al agente
function isGenericResponse(message: string): string | null {
  const normalized = message.toLowerCase().trim();

  // Palabras/frases genéricas que indican agradecimiento o confirmación
  const genericPatterns = [
    /^(gracias|muchas gracias|mil gracias)$/,
    /^(vale|ok|okay|de acuerdo)$/,
    /^(entendido|perfecto|genial|excelente|bien)$/,
    /^(vale gracias|ok gracias|gracias vale)$/,
    /^(entendido gracias|perfecto gracias)$/,
    /^(genial gracias|excelente gracias|bien gracias)$/,  // ⭐ FIX: "genial gracias"
    /^(super|super gracias|muy bien|muy bien gracias)$/,  // ⭐ FIX: "super gracias"
    /^(claro|por supuesto|desde luego)$/,
    /^(sí|si|no)$/,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(normalized)) {
      // Respuestas variadas para no ser repetitivo
      const responses = [
        '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
        '¡Encantado de ayudar! Si necesitas algo más, aquí estoy.',
        '¡Para eso estoy! ¿Tienes alguna otra pregunta?',
        '¡Un placer! No dudes en preguntar si necesitas más información.',
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return null; // No es una respuesta genérica
}

// 🚀 OPTIMIZACIÓN: Context trimming - límite de mensajes en historial
const MAX_HISTORY_MESSAGES = 15; // Últimos 15 mensajes (7-8 pares de conversación)

// 1. Definir las herramientas que usa el agente
// ⚡ OPTIMIZACIÓN: fileSearch removido (Vector Store muy lento ~10-15s)
// resourcesTool ya cubre todos los documentos/formularios
// const fileSearch = fileSearchTool([
//   process.env.OPENAI_VECTOR_STORE_ID || "vs_68effc5f31f881919b57e2ebd7dbde99"
// ]);

// 2. Definir el esquema de salida del agente (simplificado para reducir latencia)
const MyAgentSchema = z.object({
  response: z.string().describe("Respuesta para el usuario"),
  attachments: z.array(z.object({
    title: z.string(),
    url: z.string(),
    type: z.enum(["pdf", "url"]),
    description: z.string().nullable(),
  })).nullable().describe("Recursos de get_resources (null si no hay)"),
});

const agentModel = process.env.OPENAI_AGENT_MODEL || "gpt-4o-mini";
const agentName = process.env.AGENT_NAME || "Asistente Parroquial";

// ⚡ INSTRUCCIONES OPTIMIZADAS: Concisas para máxima velocidad (< 3s)
function getOptimizedInstructions(): { instructions: string; contextsApplied: string[] } {
  const instructions = `Asistente parroquial. Responde breve y claro.

TOOLS: get_calendar_events, get_resources (copia COMPLETO a attachments)

REGLAS:
- Usa tools, no adivines
- Inscripciones/formularios → get_resources + copia a attachments
- Casos complejos → deriva al párroco
- Tono acogedor y profesional`;

  return {
    instructions,
    contextsApplied: ['OPTIMIZED_BASE'],
  };
}

const optimizedContext = getOptimizedInstructions();
const agentInstructions = optimizedContext.instructions;

// 3. Definir el Agente
// ⚡ OPTIMIZACIONES PARA LATENCIA < 3s:
// - Instrucciones ultra-concisas (~250 chars vs ~3000)
// - maxTokens 300 (reducido de 500) para respuestas más rápidas
// - Solo 2 tools (calendarTool, resourcesTool) - fileSearch removido
// - Temperature 0.3: consistencia y precisión
// - Top_p 0.7: balance entre precisión y naturalidad
const myAgent = new Agent({
  name: agentName,
  instructions: agentInstructions,
  model: agentModel,
  modelSettings: {
    temperature: 0.3,  // Bajo para respuestas consistentes y precisas
    topP: 0.7,        // Moderado para respuestas naturales pero controladas
    maxTokens: 300,   // ⚡ Reducido de 500 para respuestas más rápidas
  },
  tools: [calendarTool, resourcesTool], // ⚡ fileSearch removido (-10-15s latencia)
  outputType: MyAgentSchema,
});

// 4. Handler de la API para procesar los mensajes
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  console.log(`\n🔵 ========== BACKEND REQUEST ${requestId} ==========`);

  try {
    // Extraer mensaje e historial del frontend
    const { message, conversationHistory: clientHistory } = await request.json();

    console.log(`📨 [${requestId}] Mensaje recibido:`, message);
    console.log(`📚 [${requestId}] Historial length:`, clientHistory?.length || 0);

    // Log al dashboard
    sendDebugLog('info', 'Request recibida en backend', {
      message: message.substring(0, 100),
      historyLength: clientHistory?.length || 0,
    }, requestId);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 🛡️ INPUT GUARDRAIL: Verificar relevancia parroquial ANTES de gastar tokens
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

    // 🛡️ MODERACIÓN DE CONTENIDO: Verificar que el mensaje no sea inapropiado
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY no configurada');
      return NextResponse.json({ error: 'La clave de API de OpenAI no está configurada en el servidor.' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const moderationResult = await moderateContent(message, openai);

    if (moderationResult.flagged) {
      console.log(`🚫 [${requestId}] Contenido inapropiado detectado:`, moderationResult.categories);
      sendDebugLog('warning', 'Contenido inapropiado bloqueado', {
        categories: moderationResult.categories,
        messagePreview: message.substring(0, 50),
      }, requestId);

      return NextResponse.json({
        message: 'Lo siento, no puedo procesar ese tipo de contenido. Por favor, reformula tu mensaje de manera apropiada.',
        attachments: null,
        fromCache: false,
        moderated: true,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      });
    }

    // ⚠️ ADVERTENCIA: Detectar si el usuario comparte datos muy sensibles (DNI/NIE)
    // Solo advertimos, NO bloqueamos el mensaje
    const dniPattern = /\b[0-9]{8}[A-Z]\b|\b[XYZ][0-9]{7}[A-Z]\b/g;
    if (dniPattern.test(message)) {
      console.log(`⚠️ [${requestId}] Usuario compartió DNI/NIE en el mensaje`);
      sendDebugLog('warning', 'Usuario compartió DNI/NIE', {
        messagePreview: message.substring(0, 50),
      }, requestId);

      // OPCIÓN: Podrías devolver una advertencia directa aquí
      // pero seguimos procesando el mensaje normal
    }

    // 🎯 DETECCIÓN DE RESPUESTAS GENÉRICAS: Responder directamente sin llamar al agente
    const genericResponse = isGenericResponse(message);
    if (genericResponse) {
      console.log(`💬 [${requestId}] Respuesta genérica detectada: "${message}"`);
      console.log(`✅ [${requestId}] Respondiendo directamente: "${genericResponse}"`);

      sendDebugLog('info', 'RESPUESTA GENÉRICA - Sin llamar al agente', {
        userMessage: message,
        response: genericResponse,
      }, requestId);

      return NextResponse.json({
        message: genericResponse,
        attachments: null,
        fromCache: false,
        generic: true, // Indicador de que es respuesta genérica
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      });
    }

    setDefaultOpenAIKey(apiKey);

    // 💾 CACHE SEMÁNTICO: Intentar recuperar respuesta del cache
    // Primero intenta Memory Cache (siempre disponible), luego KV (si está configurado)
    let cachedResponse = await memoryCache.get(message);
    let cacheSource = 'memory';

    if (!cachedResponse) {
      try {
        cachedResponse = await semanticCache.get(message);
        cacheSource = 'kv';
      } catch (error) {
        // Si KV no está disponible, continuar sin cache KV
        console.log(`⚠️ [${requestId}] KV cache no disponible, usando solo memory cache`);
      }
    }

    if (cachedResponse) {
      // ⚡ Cache hit - retornar inmediatamente
      console.log(`⚡ [${requestId}] CACHE HIT - retornando desde ${cacheSource} cache`);
      console.log(`📝 [${requestId}] Respuesta cacheada:`, cachedResponse.substring(0, 100) + '...');
      console.log(`========== FIN BACKEND REQUEST ${requestId} (CACHE) ==========\n`);

      // Log al dashboard
      sendDebugLog('warning', `CACHE HIT (${cacheSource}) - Retornando respuesta cacheada`, {
        messagePreview: cachedResponse.substring(0, 100),
        cachedLength: cachedResponse.length,
        cacheSource,
      }, requestId);

      return NextResponse.json({
        message: cachedResponse,
        fromCache: true, // Indicador para debug
        cacheSource, // memory o kv
      }, {
        headers: {
          // NO cachear en CDN - el body del POST es dinámico
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      });
    }

    console.log(`❌ [${requestId}] CACHE MISS - ejecutando agente...`);
    sendDebugLog('info', 'CACHE MISS - Ejecutando agente', {}, requestId);

    // 📊 LOG OPTIMIZACIÓN: Registrar optimizaciones aplicadas
    sendDebugLog('info', `OPTIMIZACIÓN APLICADA: ${optimizedContext.contextsApplied.join(', ')} (${optimizedContext.instructions.length} chars)`, {
      contexts: optimizedContext.contextsApplied,
      instructionsLength: optimizedContext.instructions.length,
    }, requestId);

    // 🚀 OPTIMIZACIÓN: Context trimming - limitar historial para reducir tokens
    const trimmedHistory = (clientHistory || []).slice(-MAX_HISTORY_MESSAGES);

    // 📊 TRACING: Log de optimización de contexto
    const originalLength = (clientHistory || []).length;
    const trimmedLength = trimmedHistory.length;
    if (originalLength > trimmedLength) {
      console.log(`⚡ Context trimmed: ${originalLength} → ${trimmedLength} mensajes (${originalLength - trimmedLength} removidos)`);
    }

    // Convertir el historial del cliente al formato que espera el SDK de Agents
    const conversationHistory: AgentInputItem[] = trimmedHistory.map((msg: { role: string, content: string }) => {
      const sanitizedContent = msg.content ?? '';

      if (msg.role === 'assistant') {
        return {
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: sanitizedContent }]
        } as AgentInputItem;
      }

      if (msg.role === 'system') {
        return {
          role: "system",
          content: sanitizedContent
        } as AgentInputItem;
      }

      return {
        role: "user",
        content: [{ type: "input_text", text: sanitizedContent }]
      } as AgentInputItem;
    });

    // Añadir el mensaje actual del usuario al historial
    conversationHistory.push({
      role: "user",
      content: [{ type: "input_text", text: message }]
    });

    // 📊 TRACING: Timestamp de inicio
    const startTime = Date.now();
    console.log('🚀 Ejecutando agente (sin streaming, optimizado)...');

    // 📊 TRACING MEJORADO: Crear el Runner con metadata extendida para observabilidad
    const runner = new Runner({
      traceMetadata: {
        // Identificadores de workflow
        workflow_id: process.env.CHATKIT_WORKFLOW_ID || "wf_68ed475f35208190a1f93b097d23758402413a726b0c1a70",
        workflow_name: "parroquia_chatbot",

        // Identificadores de sesión/request
        request_id: requestId,
        session_id: `session_${Date.now()}`,

        // Contexto del usuario (primeros 100 chars para no exceder límites)
        user_message_preview: message.substring(0, 100),
        message_length: String(message.length),
        history_length: String(conversationHistory.length),

        // Metadata adicional para análisis en dashboard de OpenAI
        timestamp: new Date().toISOString(),
        model: agentModel,
        environment: process.env.NODE_ENV || 'production',
      }
    });

    // Ejecutar el agente (sin streaming) con retry y backoff exponencial
    const agentResult = await retryWithExponentialBackoff(
      () => runner.run(myAgent, conversationHistory),
      3, // máximo 3 reintentos
      1000 // delay inicial de 1 segundo
    );

    // 📊 TRACING: Tiempo de ejecución y uso de tokens
    const duration = Date.now() - startTime;
    console.log(`⚡ Agente ejecutado en ${duration}ms`);

    // Extraer información de uso de tokens desde steps si está disponible
    let tokenUsage = null;
    let estimatedCost = 0;

    // El Agents SDK no expone directamente usage en RunResult
    // Pero podemos extraerlo de los steps si están disponibles
    try {
      const steps = (agentResult as any).steps;
      if (steps && Array.isArray(steps)) {
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;

        for (const step of steps) {
          if (step.usage) {
            totalPromptTokens += step.usage.prompt_tokens || 0;
            totalCompletionTokens += step.usage.completion_tokens || 0;
          }
        }

        if (totalPromptTokens > 0 || totalCompletionTokens > 0) {
          tokenUsage = {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: totalPromptTokens + totalCompletionTokens,
          };

          // Costos aproximados para gpt-4o-mini (actualizar según modelo)
          // gpt-4o-mini: $0.15/1M input tokens, $0.60/1M output tokens
          const inputCostPer1M = 0.15;
          const outputCostPer1M = 0.60;

          const inputCost = (tokenUsage.promptTokens / 1_000_000) * inputCostPer1M;
          const outputCost = (tokenUsage.completionTokens / 1_000_000) * outputCostPer1M;
          estimatedCost = inputCost + outputCost;

          console.log(`💰 Tokens usados: ${tokenUsage.totalTokens} (prompt: ${tokenUsage.promptTokens}, completion: ${tokenUsage.completionTokens})`);
          console.log(`💵 Costo estimado: $${estimatedCost.toFixed(6)}`);
        }
      }
    } catch (e) {
      // Si no podemos extraer usage, simplemente continuar
      console.log('⚠️ No se pudo extraer información de uso de tokens');
    }

    // Comprobar si el agente produjo una salida final
    if (!agentResult.finalOutput) {
      console.error("El agente no produjo una salida final.", agentResult);
      throw new Error("El agente no pudo generar una respuesta.");
    }

    // La salida final es un objeto que cumple con `MyAgentSchema`.
    // Extraemos la propiedad 'response' para enviarla al frontend.
    const assistantMessage = agentResult.finalOutput.response;
    let attachments = agentResult.finalOutput.attachments;

    // ✅ NUEVA ESTRATEGIA: NO filtrar respuestas del agente
    // El agente puede enviar TODA la información pública de la base de datos
    // Solo advertimos al usuario si comparte datos sensibles personales

    // Log para monitoreo (sin bloquear)
    const piiCheck = filterPII(assistantMessage);
    if (piiCheck.hasPII) {
      console.log(`ℹ️ [${requestId}] Información de contacto en respuesta:`, piiCheck.detectedTypes);
      sendDebugLog('info', 'Respuesta contiene información de contacto (permitido)', {
        detectedTypes: piiCheck.detectedTypes,
        messageLength: assistantMessage.length,
      }, requestId);
      // ✅ NO bloqueamos ni modificamos la respuesta
    }

    // 📊 DEBUG: Logging detallado de attachments
    console.log('🔍 DEBUG - finalOutput completo:', JSON.stringify(agentResult.finalOutput, null, 2));
    console.log(`📎 Attachments en finalOutput: ${attachments ? attachments.length : 'null/undefined'}`);

    // 🔧 FALLBACK: Si no hay attachments pero el mensaje menciona keywords, añadir manualmente
    if (!attachments || attachments.length === 0) {
      console.log('⚠️  NO se encontraron attachments en la respuesta del agente');

      // Detectar keywords en el mensaje original
      const messageLower = message.toLowerCase();
      const shouldHaveAttachments =
        messageLower.includes('eloos') ||
        messageLower.includes('catequesis') ||
        messageLower.includes('formulario') ||
        messageLower.includes('inscripción') ||
        messageLower.includes('inscripcion') ||
        messageLower.includes('apuntarme') ||
        messageLower.includes('apuntar') ||
        messageLower.includes('unirme') ||
        messageLower.includes('documento') ||
        messageLower.includes('pdf');

      if (shouldHaveAttachments) {
        console.log('🛠️  FALLBACK ACTIVADO: Detectadas keywords, añadiendo attachments manualmente');

        // Importar y ejecutar directamente la lógica de get_resources
        const { searchResources } = await import('../tools/resourcesTool');
        const resourcesResult = searchResources(message);

        if (resourcesResult.resources && resourcesResult.resources.length > 0) {
          attachments = resourcesResult.resources.map((r: any) => ({
            title: r.title,
            url: r.url,
            type: r.type,
            description: r.description,
          }));
          console.log(`✅ FALLBACK: Añadidos ${attachments?.length ?? 0} attachments automáticamente`);
        }
      }
    }

    if (attachments && attachments.length > 0) {
      console.log('📎 Attachments encontrados:');
      attachments.forEach((att, idx) => {
        console.log(`  ${idx + 1}. ${att.title} (${att.type}) - ${att.url}`);
      });
    }

    // 💾 CACHE SEMÁNTICO: Guardar respuesta en cache KV (ahora con Vercel KV)
    await semanticCache.set(message, assistantMessage);

    // 📊 TRACING: Información de la respuesta
    console.log(`📝 [${requestId}] Respuesta generada: ${assistantMessage.length} caracteres`);
    console.log(`📝 [${requestId}] Primeros 100 chars:`, assistantMessage.substring(0, 100) + '...');
    console.log(`✅ [${requestId}] Respuesta enviada (total: ${Date.now() - startTime}ms)`);
    console.log(`========== FIN BACKEND REQUEST ${requestId} (AGENTE) ==========\n`);

    // Log al dashboard con información de tokens y costo
    sendDebugLog('info', 'Respuesta generada por agente', {
      messagePreview: assistantMessage.substring(0, 100),
      messageLength: assistantMessage.length,
      duration: Date.now() - startTime,
      hasAttachments: !!attachments?.length,
      tokenUsage,
      estimatedCost: estimatedCost > 0 ? `$${estimatedCost.toFixed(6)}` : null,
    }, requestId);

    // Enviar la respuesta de vuelta al frontend SIN cache HTTP
    // ⚠️ CRÍTICO: NO cachear respuestas POST - el body es dinámico
    return NextResponse.json({
      message: assistantMessage,
      attachments: attachments,
      fromCache: false, // Indicador para debug
      usage: tokenUsage, // Información de uso de tokens (para monitoreo)
      cost: estimatedCost > 0 ? estimatedCost : null, // Costo estimado en USD
    }, {
      headers: {
        // NO cachear en CDN - el body del POST es dinámico
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Request-ID': requestId,
      },
    });

  } catch (error: any) {
    console.error('❌❌❌ ERROR COMPLETO:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);

    // Log del error al dashboard CON MÁS DETALLES
    sendDebugLog('error', 'Error en ejecución del agente', {
      errorName: error.name,
      errorMessage: error.message,
      errorStatus: error.status,
      errorCode: error.code,
      errorStack: error.stack?.substring(0, 500), // Más stack trace
    }, requestId);

    // Mensajes de error amigables basados en el tipo de error
    let userMessage = 'Lo siento, ocurrió un error al procesar tu mensaje.';
    let statusCode = 500;

    if (error.status === 401 || error.code === 'invalid_api_key') {
      userMessage = 'Error de autenticación con OpenAI. Por favor, contacta al administrador.';
      statusCode = 401;
    } else if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      userMessage = 'Hemos alcanzado el límite de solicitudes. Por favor, intenta de nuevo en unos minutos.';
      statusCode = 429;
    } else if (error.status === 503 || error.code === 'service_unavailable') {
      userMessage = 'El servicio de OpenAI está temporalmente no disponible. Por favor, intenta más tarde.';
      statusCode = 503;
    } else if (error.code === 'context_length_exceeded') {
      userMessage = 'La conversación es demasiado larga. Por favor, inicia una nueva conversación.';
      statusCode = 400;
    } else if (error.message?.includes('timeout') || error.code === 'timeout') {
      userMessage = 'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.';
      statusCode = 504;
    }

    return NextResponse.json(
      { error: userMessage, technical: error.message },
      {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      }
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
