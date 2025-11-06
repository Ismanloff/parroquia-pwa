/**
 * 🚀 ADVANCED PROMPT CACHING UTILITIES
 * =====================================
 * Utilidades avanzadas para maximizar el aprovechamiento de Prompt Caching:
 * - Caching de historial conversacional
 * - Fingerprinting de contexto RAG
 * - Estrategias de split para optimizar cache hits
 *
 * @see https://platform.openai.com/docs/guides/prompt-caching
 * @created 2025-01-05
 */

import OpenAI from 'openai';
import crypto from 'crypto';

// ============================================================================
// TIPOS
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ContextChunk {
  text: string;
  filename: string;
  score?: number;
}

export interface CachingStrategy {
  // Historial conversacional
  totalMessages: number;
  cacheableMessages: number; // Mensajes antiguos que se cachean
  freshMessages: number; // Mensajes recientes que no se cachean

  // Contexto RAG
  contextFingerprint?: string;
  contextMatchesPrevious: boolean;

  // Métricas
  estimatedCacheHitRate: number; // 0-100%
  recommendation: string;
}

// ============================================================================
// HISTORIAL CONVERSACIONAL - Cachear mensajes antiguos
// ============================================================================

/**
 * Divide el historial en "cacheable" (antiguos) y "fresh" (recientes)
 *
 * ESTRATEGIA:
 * - Mensajes antiguos (primeros N) se cachean → ahorran 50% tokens
 * - Mensajes recientes (últimos M) NO se cachean → cambian frecuentemente
 *
 * @param messages - Historial completo de mensajes
 * @param cacheableCount - Cantidad de mensajes antiguos a cachear (default: 70% del total)
 * @returns [cacheableMessages, freshMessages]
 *
 * @example
 * const [oldMsgs, newMsgs] = splitMessagesForCaching(history, 5);
 * // oldMsgs[0...4] se cachean
 * // newMsgs[5...N] no se cachean
 */
export function splitMessagesForCaching(
  messages: Message[],
  cacheableCount?: number
): [Message[], Message[]] {
  if (messages.length === 0) {
    return [[], []];
  }

  // Por defecto, cachear el 70% de mensajes antiguos
  const defaultCacheable = Math.floor(messages.length * 0.7);
  const splitPoint = cacheableCount ?? defaultCacheable;

  // Si el split es muy pequeño (<3), no vale la pena
  if (splitPoint < 3) {
    return [[], messages];
  }

  const cacheable = messages.slice(0, splitPoint);
  const fresh = messages.slice(splitPoint);

  return [cacheable, fresh];
}

/**
 * Calcula cuántos mensajes antiguos deberían cachearse según la longitud total
 *
 * HEURÍSTICA:
 * - Conversaciones cortas (< 5 msgs): No split (poco beneficio)
 * - Conversaciones medias (5-10 msgs): Cachear primeros 60%
 * - Conversaciones largas (10+ msgs): Cachear primeros 75%
 *
 * @param totalMessages - Número total de mensajes
 * @returns Número óptimo de mensajes a cachear
 */
export function calculateOptimalCacheableCount(totalMessages: number): number {
  if (totalMessages < 5) {
    return 0; // Muy poco beneficio
  }

  if (totalMessages <= 10) {
    return Math.floor(totalMessages * 0.6); // 60%
  }

  return Math.floor(totalMessages * 0.75); // 75%
}

/**
 * Estructura mensajes con marcadores para indicar a OpenAI qué cachear
 *
 * NOTA: OpenAI cachea automáticamente desde el inicio del prompt.
 * Esta función es conceptual para documentar la estrategia.
 *
 * @param systemPrompt - Instrucciones estáticas del sistema
 * @param cacheableMessages - Mensajes antiguos del historial
 * @param freshMessages - Mensajes recientes del historial
 * @param currentMessage - Mensaje actual del usuario
 * @returns Array formateado para OpenAI
 */
export function buildOptimizedMessageArray(
  systemPrompt: string,
  cacheableMessages: Message[],
  freshMessages: Message[],
  currentMessage: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    // 1. System prompt (SIEMPRE se cachea si el prompt supera 1024 tokens)
    { role: 'system' as const, content: systemPrompt },

    // 2. Mensajes antiguos (parte del prefijo estable → se cachean)
    ...cacheableMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),

    // 3. Mensajes recientes (parte dinámica → NO se cachean)
    ...freshMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),

    // 4. Mensaje actual del usuario (NUNCA se cachea)
    { role: 'user' as const, content: currentMessage },
  ];
}

// ============================================================================
// CONTEXTO RAG - Fingerprinting para detectar reutilización
// ============================================================================

/**
 * Genera un fingerprint (hash) del contexto RAG
 *
 * Útil para detectar cuando múltiples requests usan el mismo contexto.
 * Si el fingerprint coincide, OpenAI lo cacheará automáticamente.
 *
 * @param chunks - Chunks de documentos del contexto RAG
 * @returns Hash SHA-256 del contenido combinado
 *
 * @example
 * const hash1 = generateContextFingerprint(chunks);
 * const hash2 = generateContextFingerprint(chunks);
 * if (hash1 === hash2) {
 *   console.log('Mismo contexto → Se beneficiará de caching');
 * }
 */
export function generateContextFingerprint(chunks: ContextChunk[]): string {
  if (chunks.length === 0) {
    return 'empty-context';
  }

  // Crear string determinista con contenido + orden
  const combined = chunks
    .map((chunk) => `${chunk.filename}:${chunk.text}`)
    .join('||');

  // Generar hash SHA-256
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Compara dos fingerprints de contexto
 *
 * @param fingerprint1 - Primer fingerprint
 * @param fingerprint2 - Segundo fingerprint
 * @returns true si son idénticos (mismo contexto)
 */
export function contextsMatch(fingerprint1: string, fingerprint2: string): boolean {
  return fingerprint1 === fingerprint2;
}

/**
 * Almacén en memoria para fingerprints recientes (cache de corto plazo)
 * Útil para detectar contextos repetidos en requests cercanos en el tiempo
 */
class ContextFingerprintCache {
  private cache: Map<string, { fingerprint: string; timestamp: number }> = new Map();
  private readonly TTL = 10 * 60 * 1000; // 10 minutos

  /**
   * Almacena un fingerprint asociado a una clave (ej: conversationId)
   */
  set(key: string, fingerprint: string): void {
    this.cache.set(key, {
      fingerprint,
      timestamp: Date.now(),
    });

    // Limpiar entradas expiradas
    this.cleanup();
  }

  /**
   * Obtiene el fingerprint previo para una clave
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.fingerprint;
  }

  /**
   * Verifica si el nuevo contexto coincide con el anterior
   */
  matches(key: string, newFingerprint: string): boolean {
    const previous = this.get(key);
    return previous === newFingerprint;
  }

  /**
   * Limpia entradas expiradas del cache
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia todo el cache (útil para testing)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instancia global del cache de fingerprints
export const contextCache = new ContextFingerprintCache();

// ============================================================================
// ANÁLISIS DE ESTRATEGIA - Recomendar configuración óptima
// ============================================================================

/**
 * Analiza una conversación y recomienda la mejor estrategia de caching
 *
 * @param conversationHistory - Historial de mensajes
 * @param ragChunks - Chunks de contexto RAG (opcional)
 * @param previousFingerprint - Fingerprint del request anterior (opcional)
 * @returns Estrategia recomendada con métricas
 */
export function analyzeCachingStrategy(
  conversationHistory: Message[],
  ragChunks?: ContextChunk[],
  previousFingerprint?: string
): CachingStrategy {
  const totalMessages = conversationHistory.length;
  const cacheableCount = calculateOptimalCacheableCount(totalMessages);
  const freshCount = totalMessages - cacheableCount;

  // Analizar contexto RAG
  let contextFingerprint: string | undefined;
  let contextMatchesPrevious = false;

  if (ragChunks && ragChunks.length > 0) {
    contextFingerprint = generateContextFingerprint(ragChunks);

    if (previousFingerprint) {
      contextMatchesPrevious = contextsMatch(contextFingerprint, previousFingerprint);
    }
  }

  // Estimar hit rate
  let estimatedCacheHitRate = 0;

  if (totalMessages > 0) {
    // Hit rate depende de cuántos mensajes se cachean
    const messageHitRate = (cacheableCount / totalMessages) * 100;

    // Si el contexto coincide, aumenta el hit rate
    if (contextMatchesPrevious) {
      estimatedCacheHitRate = Math.min(messageHitRate + 20, 90);
    } else {
      estimatedCacheHitRate = messageHitRate;
    }
  }

  // Generar recomendación
  let recommendation = '';

  if (totalMessages < 5) {
    recommendation = 'Conversación corta: caching tendrá poco impacto. Enfoque en optimizar prompts estáticos.';
  } else if (cacheableCount >= 5) {
    recommendation = `Estrategia óptima: cachear ${cacheableCount} mensajes antiguos (${Math.round((cacheableCount / totalMessages) * 100)}% del historial).`;
  } else {
    recommendation = 'Conversación en crecimiento: beneficio de caching aumentará con más mensajes.';
  }

  if (contextMatchesPrevious) {
    recommendation += ' ✅ Contexto RAG coincide con request anterior → excelente cache hit esperado.';
  } else if (ragChunks && ragChunks.length > 0) {
    recommendation += ' ℹ️ Contexto RAG nuevo → primer request sin cache, subsecuentes se beneficiarán.';
  }

  return {
    totalMessages,
    cacheableMessages: cacheableCount,
    freshMessages: freshCount,
    contextFingerprint,
    contextMatchesPrevious,
    estimatedCacheHitRate,
    recommendation,
  };
}

// ============================================================================
// UTILIDADES DE LOGGING
// ============================================================================

/**
 * Loggea la estrategia de caching de forma legible
 */
export function logCachingStrategy(strategy: CachingStrategy, endpoint: string): void {
  console.log(
    `📊 [Advanced Caching - ${endpoint}] ` +
    `Messages: ${strategy.cacheableMessages}/${strategy.totalMessages} cacheable | ` +
    `Estimated hit rate: ${strategy.estimatedCacheHitRate.toFixed(1)}% | ` +
    `Context: ${strategy.contextMatchesPrevious ? '✅ Reused' : '🆕 New'}`
  );

  if (strategy.recommendation) {
    console.log(`   💡 ${strategy.recommendation}`);
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  splitMessagesForCaching,
  calculateOptimalCacheableCount,
  buildOptimizedMessageArray,
  generateContextFingerprint,
  contextsMatch,
  contextCache,
  analyzeCachingStrategy,
  logCachingStrategy,
};
