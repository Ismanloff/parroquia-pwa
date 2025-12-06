/**
 * Hook para detectar si un mensaje requiere respuesta rápida o compleja
 *
 * RESPUESTA RÁPIDA (quick): Usa /api/chat/quick → Memory Cache + GPT-4o-mini (< 2s)
 * - Saludos: "hola", "buenos días", "hey"
 * - Confirmaciones: "gracias", "ok", "entendido"
 * - FAQs simples: "qué es eloos", "número soledad", "horarios misa"
 * - Información general: "comunidades religiosas", "grupos parroquia"
 * - Nota: El endpoint quick PRIMERO verifica Memory Cache (0ms), si no encuentra llama a GPT-4o-mini
 *
 * RESPUESTA COMPLEJA (full): Usa /api/chat/message → OpenAI Agent + Vector Store + Tools (10-15s)
 * - Eventos/fechas dinámicas: "eventos hoy", "misas esta semana", "qué hay mañana"
 * - Follow-ups contextuales: "cuéntame más", "dime más detalles", "y cáritas?"
 * - Inscripciones/formularios: "apuntarme a eloos", "formulario catequesis"
 * - Queries complejas: "explica la diferencia entre", "cómo funciona"
 */

export type MessageType = 'quick' | 'full';

interface QuickDetectorResult {
  type: MessageType;
  reason: string;
}

interface QuickDetectorOptions {
  lastResponseFromCache?: boolean;
}

export const useQuickDetector = () => {
  const detectMessageType = (message: string, options?: QuickDetectorOptions): QuickDetectorResult => {
    const lowerMessage = message.toLowerCase().trim();
    const words = lowerMessage.split(/\s+/);
    const { lastResponseFromCache = false } = options || {};

    // ========================================
    // 1. FOLLOW-UPS EXPANSIVOS DESPUÉS DE CACHE
    // ========================================

    // Si la última respuesta fue desde cache Y el usuario pide más información
    // → buscar en Vector Store (documentos completos)
    if (lastResponseFromCache) {
      const EXPANSIVE_FOLLOWUP_PATTERNS = [
        /dame\s+(m[áa]s|toda)/i,
        /cu[ée]ntame\s+m[áa]s/i,
        /m[áa]s\s+(informaci[óo]n|detalles|datos)/i,
        /dime\s+m[áa]s/i,
        /ampliar/i,
        /profundiza/i,
        /detalla/i,
        /^m[áa]s$/i,  // Solo "más"
        /qu[ée]\s+(m[áa]s|otra cosa|m[áa]s\s+cosas)/i,
      ];

      if (EXPANSIVE_FOLLOWUP_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
        return { type: 'full', reason: 'Follow-up expansivo después de cache (buscar documentos)' };
      }
    }

    // ========================================
    // 2. PATRONES QUE REQUIEREN FULL (herramientas)
    // ========================================

    // Calendario/eventos dinámicos (necesita Calendar Tool)
    const CALENDAR_PATTERNS = [
      /calendario/i,
      /\bevento/i,
      /\beventos\b/i,
      /pr[óo]xim[oa]/i,
      /\bhoy\b/i,
      /ma[ñn]ana/i,
      /semana/i,
      /\bmes\b/i,
      /qu[ée]\s+hay/i,
      /actividades?\s+(de\s+)?(hoy|ma[ñn]ana|semana)/i,
    ];

    if (CALENDAR_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
      return { type: 'full', reason: 'Requiere calendario dinámico' };
    }

    // Queries complejas que requieren razonamiento
    const COMPLEX_PATTERNS = [
      /explica/i,
      /c[óo]mo\s+(funciona|se\s+hace|puedo)/i,
      /por\s+qu[ée]/i,
      /diferencia/i,
      /compara/i,
      /analiza/i,
      /relaci[óo]n/i,
    ];

    if (COMPLEX_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
      return { type: 'full', reason: 'Query compleja que requiere razonamiento' };
    }

    // ========================================
    // 2. PATRONES QUE USAN QUICK (cache)
    // ========================================

    // Saludos básicos
    const basicGreetings = ['hola', 'hey', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches'];
    const isBasicGreeting = basicGreetings.some(greeting =>
      lowerMessage === greeting || lowerMessage.startsWith(greeting + ' ')
    );

    if (isBasicGreeting && words.length <= 3) {
      return { type: 'quick', reason: 'Saludo básico' };
    }

    // Agradecimientos
    const basicThanks = ['gracias', 'ok', 'vale', 'entendido', 'perfecto', 'genial'];
    if (basicThanks.some(thank => lowerMessage === thank) && words.length <= 2) {
      return { type: 'quick', reason: 'Agradecimiento simple' };
    }

    // Follow-ups ESPECÍFICOS que requieren cambio de tema (necesitan Vector Store)
    // NOTA: "dame más" y "cuéntame más" NO van aquí porque el quick endpoint
    // puede manejarlos con el historial + GPT-4o-mini
    const TOPIC_CHANGE_PATTERNS = [
      /^y\s+/i, // "Y cáritas?", "Y eloos?" - cambio de tema
    ];

    if (TOPIC_CHANGE_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
      return { type: 'full', reason: 'Cambio de tema que requiere contexto' };
    }

    // FAQs típicas (muy probable que estén en cache)
    const FAQ_PATTERNS = [
      // Información general
      /qu[ée]\s+es/i,
      /qui[ée]n\s+es/i,
      /d[óo]nde\s+est[áa]/i,
      /ubicaci[óo]n/i,
      /direcci[óo]n/i,

      // Contacto
      /tel[ée]fono/i,
      /n[úu]mero/i,
      /contacto/i,
      /llamar/i,

      // Horarios generales (NO dinámicos)
      /horario[s]?\s+(de\s+)?(misa|confesiones|atenci[óo]n)/i,

      // Grupos y comunidades
      /grupo/i,
      /comunidad/i,
      /eloos/i,
      /catequesis/i,
      /bartimeo/i,
      /pozo/i,
      /dalmanuta/i,
      /mies/i,

      // Sacramentos (info general)
      /bautismo/i,
      /bautizo/i,
      /matrimonio/i,
      /confirmaci[óo]n/i,
      /comuni[óo]n/i,
      /padrinos/i,

      // Servicios
      /c[áa]ritas/i,
      /voluntario/i,
      /taller/i,
      /mercadillo/i,
    ];

    if (FAQ_PATTERNS.some(pattern => pattern.test(lowerMessage))) {
      return { type: 'quick', reason: 'FAQ probable en cache' };
    }

    // ========================================
    // 3. HEURÍSTICA FINAL
    // ========================================

    // Si es muy corto (< 50 chars) y no matcheó nada específico → QUICK
    // Probablemente sea una pregunta simple que puede estar en cache
    if (message.length < 50) {
      return { type: 'quick', reason: 'Pregunta corta simple' };
    }

    // Por defecto, usar FULL para queries largas/complejas
    return { type: 'full', reason: 'Query larga o específica' };
  };

  return { detectMessageType };
};
