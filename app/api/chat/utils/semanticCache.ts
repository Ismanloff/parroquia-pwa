/**
 * Cache Semántico para respuestas del chatbot con Redis Cloud
 *
 * Funcionalidad:
 * - Cachea respuestas basadas en similitud semántica de preguntas
 * - NO cachea preguntas relacionadas con calendario/fechas/eventos
 * - TTL de 1 hora para info general
 * - Usa ioredis para conectar con Redis Cloud tradicional
 */

import Redis from 'ioredis';

interface CacheEntry {
  question: string;
  answer: string;
  timestamp: number;
  normalizedQuestion: string;
}

class SemanticCache {
  private redis: Redis | null = null;
  private readonly TTL = 60 * 60; // 1 hora en segundos
  private readonly REDIS_PREFIX = 'semantic_cache:';
  private readonly INDEX_KEY = 'semantic_cache:index'; // Lista de todas las keys

  // Palabras clave que indican pregunta relacionada con eventos/calendario (NO cachear)
  private readonly CALENDAR_KEYWORDS = [
    'evento', 'eventos', 'actividad', 'actividades',
    'hoy', 'mañana', 'próximo', 'proxima', 'próxima',
    'cuando', 'cuándo', 'fecha', 'fechas',
    'semana', 'mes', 'día', 'dia',
    'calendario', 'programado', 'programada',
    'horario', 'horarios',
    'qué hay', 'que hay'
  ];

  // Respuestas cortas/genéricas que NO se deben cachear (causaban bug de repetición)
  private readonly GENERIC_RESPONSES = [
    'gracias', 'ok', 'vale', 'entendido', 'perfecto',
    'si', 'no', 'claro', 'hola', 'adios', 'adiós',
    'bien', 'mal', 'bueno', 'genial'
  ];

  constructor() {
    // Inicializar conexión Redis solo si la URL está disponible
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying
            return Math.min(times * 50, 2000); // Exponential backoff
          },
          lazyConnect: true, // No conectar inmediatamente
        });

        // Conectar de forma asíncrona
        this.redis.connect().catch((err) => {
          console.error('❌ Error conectando a Redis:', err.message);
          this.redis = null;
        });

        console.log('🔗 Redis Cloud inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando Redis:', error);
        this.redis = null;
      }
    } else {
      console.warn('⚠️  REDIS_URL no configurada - cache deshabilitado');
    }
  }

  /**
   * Verifica si Redis está disponible
   */
  private isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Normaliza una pregunta para comparación
   */
  private normalize(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[¿?¡!.,;:]/g, '') // Remover puntuación
      .replace(/\s+/g, ' '); // Normalizar espacios
  }

  /**
   * Verifica si la pregunta es sobre calendario/eventos
   */
  private isCalendarRelated(question: string): boolean {
    const normalized = this.normalize(question);
    return this.CALENDAR_KEYWORDS.some(keyword =>
      normalized.includes(keyword.toLowerCase())
    );
  }

  /**
   * Verifica si es una respuesta genérica corta (gracias, ok, etc.)
   * Estas NO se deben cachear porque causan bug de repetición
   */
  private isGenericResponse(question: string): boolean {
    const normalized = this.normalize(question);
    const words = normalized.split(' ').filter(w => w.length > 0);

    // Si tiene 0 palabras, no es genérico
    if (words.length === 0) return false;

    // Si tiene SOLO 1-3 palabras Y TODAS son genéricas → NO cachear
    if (words.length <= 3) {
      // Verificar si TODAS las palabras son genéricas
      const allGeneric = words.every(word => this.GENERIC_RESPONSES.includes(word));
      if (allGeneric) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcula similitud entre dos strings (0-1)
   * Más estricto con preguntas cortas para evitar falsos positivos
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Si son idénticas
    if (str1 === str2) return 1;

    const words1 = str1.split(' ').filter(w => w.length > 0);
    const words2 = str2.split(' ').filter(w => w.length > 0);

    // Si tienen diferente número de palabras significativamente, baja similitud
    const lengthDiff = Math.abs(words1.length - words2.length);
    const maxLength = Math.max(words1.length, words2.length);

    // Si la diferencia es >50% del total, no son similares
    if (lengthDiff / maxLength > 0.5) {
      return 0;
    }

    // Calcular palabras en común (sensible a orden)
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    const basicSimilarity = commonWords / totalWords;

    // Para preguntas cortas (≤3 palabras), requiere 100% de coincidencia
    if (maxLength <= 3) {
      return words1.length === words2.length && commonWords === totalWords ? 1 : 0;
    }

    return basicSimilarity;
  }

  /**
   * Busca en cache una pregunta similar
   * Retorna null si no encuentra o si está expirada
   */
  async get(question: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    // 🚫 NO cachear preguntas sobre calendario
    if (this.isCalendarRelated(question)) {
      console.log('🚫 Cache SKIP: Pregunta relacionada con calendario');
      return null;
    }

    // 🚫 NO cachear respuestas genéricas cortas (fix bug "gracias" repite respuesta)
    if (this.isGenericResponse(question)) {
      console.log('🚫 Cache SKIP: Respuesta genérica corta');
      return null;
    }

    const normalizedQuestion = this.normalize(question);

    try {
      // Buscar coincidencia exacta primero
      const exactKey = `${this.REDIS_PREFIX}${normalizedQuestion}`;
      const exactMatchStr = await this.redis!.get(exactKey);

      if (exactMatchStr) {
        const exactMatch: CacheEntry = JSON.parse(exactMatchStr);
        console.log('⚡ Redis Cache HIT (exacto):', question);
        return exactMatch.answer;
      }

      // Buscar coincidencia semántica (≥85% similitud)
      // Obtener todas las keys del índice
      const allKeys = await this.redis!.smembers(this.INDEX_KEY);

      for (const key of allKeys) {
        const entryStr = await this.redis!.get(key);

        if (!entryStr) continue; // Key expirada

        const entry: CacheEntry = JSON.parse(entryStr);
        const similarity = this.calculateSimilarity(normalizedQuestion, entry.normalizedQuestion);

        // Threshold ajustado a 75% para capturar más variaciones naturales
        // Para preguntas cortas el algoritmo ya requiere 100%
        if (similarity >= 0.75) {
          console.log(`⚡ Redis Cache HIT (${Math.round(similarity * 100)}% similar):`, question, '→', entry.question);
          return entry.answer;
        }
      }

      console.log('❌ Redis Cache MISS:', question);
      return null;
    } catch (error: any) {
      console.error('❌ Error en Redis get:', error.message);
      return null; // Fallback gracefully
    }
  }

  /**
   * Determina el TTL apropiado según el tipo de pregunta
   * @param question - Pregunta a analizar
   * @returns TTL en segundos
   */
  private getDynamicTTL(question: string): number {
    const lowerQuestion = question.toLowerCase();

    // FAQs muy estables → 24 horas
    const stableKeywords = [
      'que es', 'qué es', 'quien es', 'quién es',
      'direccion', 'dirección', 'ubicacion', 'ubicación',
      'telefono', 'teléfono', 'donde esta', 'dónde está',
      'donde se encuentra', 'contacto', 'email', 'correo'
    ];

    if (stableKeywords.some(kw => lowerQuestion.includes(kw))) {
      return 60 * 60 * 24; // 24 horas
    }

    // Info de servicios y recursos → 7 días
    const serviceKeywords = [
      'servicio', 'producto', 'recurso', 'documento',
      'guía', 'manual', 'proceso', 'procedimiento'
    ];

    if (serviceKeywords.some(kw => lowerQuestion.includes(kw))) {
      return 60 * 60 * 24 * 7; // 7 días
    }

    // Info general → 1 hora (por defecto)
    return this.TTL; // 1 hora
  }

  /**
   * Guarda una respuesta en cache
   */
  async set(question: string, answer: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    // 🚫 NO cachear preguntas sobre calendario
    if (this.isCalendarRelated(question)) {
      console.log('🚫 Cache NO guardado: Pregunta relacionada con calendario');
      return;
    }

    // 🚫 NO cachear respuestas genéricas cortas (fix bug "gracias" repite respuesta)
    if (this.isGenericResponse(question)) {
      console.log('🚫 Cache NO guardado: Respuesta genérica corta');
      return;
    }

    const normalizedQuestion = this.normalize(question);
    const key = `${this.REDIS_PREFIX}${normalizedQuestion}`;

    const entry: CacheEntry = {
      question,
      answer,
      timestamp: Date.now(),
      normalizedQuestion,
    };

    // Determinar TTL dinámico según tipo de pregunta
    const ttl = this.getDynamicTTL(question);

    try {
      // Guardar entry con TTL dinámico
      await this.redis!.setex(key, ttl, JSON.stringify(entry));

      // Agregar key al índice (sin TTL, se limpia periódicamente)
      await this.redis!.sadd(this.INDEX_KEY, key);

      const ttlHours = Math.round(ttl / 3600);
      console.log(`💾 Redis Cache guardado (TTL: ${ttlHours}h):`, question);
    } catch (error: any) {
      console.error('❌ Error en Redis set:', error.message);
    }
  }

  /**
   * Limpia entradas expiradas del índice
   * Redis ya maneja el TTL automáticamente, solo necesitamos limpiar el índice
   */
  async cleanup(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const allKeys = await this.redis!.smembers(this.INDEX_KEY);
      let removed = 0;

      for (const key of allKeys) {
        const exists = await this.redis!.exists(key);

        // Si la entry no existe (expiró), remover del índice
        if (!exists) {
          await this.redis!.srem(this.INDEX_KEY, key);
          removed++;
        }
      }

      if (removed > 0) {
        console.log(`🧹 Redis Cache cleanup: ${removed} keys expiradas removidas del índice`);
      }
    } catch (error: any) {
      console.error('❌ Error en Redis cleanup:', error.message);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  async getStats() {
    if (!this.isAvailable()) {
      return { size: 0, entries: [] };
    }

    try {
      const allKeys = await this.redis!.smembers(this.INDEX_KEY);
      const entries: Array<{ question: string; age: number }> = [];

      for (const key of allKeys) {
        const entryStr = await this.redis!.get(key);
        if (entryStr) {
          const entry: CacheEntry = JSON.parse(entryStr);
          entries.push({
            question: entry.question,
            age: Math.round((Date.now() - entry.timestamp) / 1000 / 60), // minutos
          });
        }
      }

      return {
        size: entries.length,
        entries,
      };
    } catch (error: any) {
      console.error('❌ Error en Redis getStats:', error.message);
      return { size: 0, entries: [] };
    }
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const allKeys = await this.redis!.smembers(this.INDEX_KEY);

      // Eliminar todas las entries
      if (allKeys.length > 0) {
        await this.redis!.del(...allKeys);
      }

      // Limpiar el índice
      await this.redis!.del(this.INDEX_KEY);

      console.log('🗑️  Redis Cache completamente limpiado');
    } catch (error: any) {
      console.error('❌ Error en Redis clear:', error.message);
    }
  }

  /**
   * Cierra la conexión Redis (para testing/cleanup)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      console.log('👋 Redis desconectado');
    }
  }
}

// Instancia singleton del cache
export const semanticCache = new SemanticCache();

// Cleanup periódico cada 10 minutos (solo en Node.js, no en Edge Runtime)
// En Edge Runtime, el cleanup se hará on-demand o vía Vercel Cron Jobs
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    await semanticCache.cleanup();
  }, 10 * 60 * 1000);
}
