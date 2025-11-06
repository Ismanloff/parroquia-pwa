/**
 * 📊 PROMPT CACHE MONITORING UTILITY
 * ===================================
 * Utilidad para monitorear y reportar métricas de OpenAI Prompt Caching.
 *
 * FUNCIONALIDADES:
 * - Extrae métricas de cache de respuestas de OpenAI
 * - Calcula porcentajes de hit rate
 * - Estima ahorros de costos
 * - Logging estructurado para análisis
 *
 * @see https://platform.openai.com/docs/guides/prompt-caching
 * @created 2025-01-05
 */

import OpenAI from 'openai';

// ============================================================================
// TIPOS
// ============================================================================

export interface CacheMetrics {
  // Tokens
  totalPromptTokens: number;
  cachedTokens: number;
  uncachedTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Porcentajes
  cacheHitRate: number; // 0-100%

  // Costos estimados (USD)
  estimatedCost: {
    inputCostWithoutCache: number; // Costo si no hubiera cache
    inputCostWithCache: number; // Costo real con cache
    outputCost: number;
    totalCost: number;
    savings: number; // Ahorro absoluto
    savingsPercentage: number; // Ahorro porcentual
  };

  // Metadata
  model: string;
  endpoint: string;
  timestamp: string;
}

// ============================================================================
// CONSTANTES DE PRECIOS (USD por 1M tokens) - Actualizado 2025
// ============================================================================

const PRICING: Record<string, { input: number; output: number; cachedInput: number }> = {
  'gpt-4o': {
    input: 2.50,       // $2.50 / 1M tokens
    output: 10.00,     // $10.00 / 1M tokens
    cachedInput: 1.25, // 50% descuento
  },
  'gpt-4o-mini': {
    input: 0.150,      // $0.15 / 1M tokens
    output: 0.600,     // $0.60 / 1M tokens
    cachedInput: 0.075, // 50% descuento
  },
  'gpt-4o-2024-11-20': {
    input: 2.50,
    output: 10.00,
    cachedInput: 1.25,
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.150,
    output: 0.600,
    cachedInput: 0.075,
  },
  // Fallback para modelos desconocidos
  'default': {
    input: 0.150,
    output: 0.600,
    cachedInput: 0.075,
  },
};

/**
 * Obtiene precios para un modelo específico
 */
function getPricing(model: string) {
  // Buscar coincidencia exacta
  if (PRICING[model]) {
    return PRICING[model];
  }

  // Buscar coincidencia parcial (ej: "gpt-4o-mini-2024-07-18" matches "gpt-4o-mini")
  const partialMatch = Object.keys(PRICING).find(key => model.includes(key));
  if (partialMatch && PRICING[partialMatch]) {
    return PRICING[partialMatch];
  }

  // Fallback a default
  console.warn(`⚠️ Pricing no encontrado para modelo "${model}", usando defaults`);
  return PRICING['default'];
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Extrae métricas de cache de una respuesta de OpenAI
 *
 * @param response - Respuesta completa de OpenAI chat.completions.create()
 * @param endpoint - Nombre del endpoint (para logging)
 * @returns CacheMetrics object con todos los datos calculados
 *
 * @example
 * const response = await openai.chat.completions.create({...});
 * const metrics = extractCacheMetrics(response, 'widget');
 * logCacheMetrics(metrics);
 */
export function extractCacheMetrics(
  response: OpenAI.Chat.Completions.ChatCompletion,
  endpoint: string
): CacheMetrics {
  const usage = response.usage;
  const model = response.model;

  if (!usage) {
    throw new Error('Response usage data is missing');
  }

  // Extraer tokens
  const totalPromptTokens = usage.prompt_tokens || 0;
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  const uncachedTokens = totalPromptTokens - cachedTokens;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (totalPromptTokens + completionTokens);

  // Calcular hit rate
  const cacheHitRate = totalPromptTokens > 0
    ? (cachedTokens / totalPromptTokens) * 100
    : 0;

  // Obtener precios del modelo
  const pricing = getPricing(model);

  // Calcular costos
  const inputCostWithoutCache = (totalPromptTokens / 1_000_000) * pricing!.input;
  const cachedCost = (cachedTokens / 1_000_000) * pricing!.cachedInput;
  const uncachedCost = (uncachedTokens / 1_000_000) * pricing!.input;
  const inputCostWithCache = cachedCost + uncachedCost;
  const outputCost = (completionTokens / 1_000_000) * pricing!.output;
  const totalCost = inputCostWithCache + outputCost;
  const savings = inputCostWithoutCache - inputCostWithCache;
  const savingsPercentage = inputCostWithoutCache > 0
    ? (savings / inputCostWithoutCache) * 100
    : 0;

  return {
    totalPromptTokens,
    cachedTokens,
    uncachedTokens,
    completionTokens,
    totalTokens,
    cacheHitRate,
    estimatedCost: {
      inputCostWithoutCache,
      inputCostWithCache,
      outputCost,
      totalCost,
      savings,
      savingsPercentage,
    },
    model,
    endpoint,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formatea métricas de cache para logging en consola
 *
 * @param metrics - Métricas extraídas con extractCacheMetrics()
 * @param verbose - Si true, muestra información detallada
 *
 * @example
 * const metrics = extractCacheMetrics(response, 'widget');
 * logCacheMetrics(metrics, true);
 */
export function logCacheMetrics(metrics: CacheMetrics, verbose: boolean = false): void {
  const { cacheHitRate, estimatedCost } = metrics;

  // Emoji según hit rate
  let emoji = '🔴'; // Rojo: 0-20%
  if (cacheHitRate > 60) emoji = '🟢'; // Verde: 60%+
  else if (cacheHitRate > 30) emoji = '🟡'; // Amarillo: 30-60%
  else if (cacheHitRate > 0) emoji = '🟠'; // Naranja: 1-30%

  console.log(
    `${emoji} [Prompt Cache - ${metrics.endpoint}] ` +
    `Hit Rate: ${cacheHitRate.toFixed(1)}% | ` +
    `Cached: ${metrics.cachedTokens}/${metrics.totalPromptTokens} tokens | ` +
    `Savings: $${estimatedCost.savings.toFixed(6)} (${estimatedCost.savingsPercentage.toFixed(1)}%)`
  );

  if (verbose) {
    console.log(`   📊 Detailed Metrics:`);
    console.log(`      Model: ${metrics.model}`);
    console.log(`      Total Prompt Tokens: ${metrics.totalPromptTokens}`);
    console.log(`      ├─ Cached: ${metrics.cachedTokens} (${cacheHitRate.toFixed(1)}%)`);
    console.log(`      └─ Uncached: ${metrics.uncachedTokens} (${(100 - cacheHitRate).toFixed(1)}%)`);
    console.log(`      Completion Tokens: ${metrics.completionTokens}`);
    console.log(`      Total Tokens: ${metrics.totalTokens}`);
    console.log(`   💰 Cost Breakdown:`);
    console.log(`      Input (without cache): $${estimatedCost.inputCostWithoutCache.toFixed(6)}`);
    console.log(`      Input (with cache): $${estimatedCost.inputCostWithCache.toFixed(6)}`);
    console.log(`      Output: $${estimatedCost.outputCost.toFixed(6)}`);
    console.log(`      Total: $${estimatedCost.totalCost.toFixed(6)}`);
    console.log(`      💚 Savings: $${estimatedCost.savings.toFixed(6)} (${estimatedCost.savingsPercentage.toFixed(1)}%)`);
  }
}

/**
 * Wrapper conveniente que extrae y loggea métricas en un solo paso
 *
 * @param response - Respuesta de OpenAI
 * @param endpoint - Nombre del endpoint
 * @param verbose - Logging detallado
 * @returns CacheMetrics para uso posterior si es necesario
 *
 * @example
 * const response = await openai.chat.completions.create({...});
 * monitorPromptCache(response, 'widget', true);
 */
export function monitorPromptCache(
  response: OpenAI.Chat.Completions.ChatCompletion,
  endpoint: string,
  verbose: boolean = false
): CacheMetrics {
  const metrics = extractCacheMetrics(response, endpoint);
  logCacheMetrics(metrics, verbose);
  return metrics;
}

/**
 * Formatea métricas para respuesta HTTP (opcional, para debugging)
 *
 * @param metrics - Métricas de cache
 * @returns Objeto formateado para incluir en respuesta HTTP
 */
export function formatMetricsForResponse(metrics: CacheMetrics) {
  return {
    cache: {
      hitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
      cachedTokens: metrics.cachedTokens,
      totalPromptTokens: metrics.totalPromptTokens,
      savings: `$${metrics.estimatedCost.savings.toFixed(6)}`,
    },
    usage: {
      promptTokens: metrics.totalPromptTokens,
      completionTokens: metrics.completionTokens,
      totalTokens: metrics.totalTokens,
    },
    model: metrics.model,
  };
}

// ============================================================================
// UTILITY: RECOMENDACIONES AUTOMÁTICAS
// ============================================================================

/**
 * Analiza métricas y proporciona recomendaciones de optimización
 *
 * @param metrics - Métricas de cache
 * @returns Array de recomendaciones
 */
export function getCacheOptimizationRecommendations(metrics: CacheMetrics): string[] {
  const recommendations: string[] = [];

  // Hit rate bajo
  if (metrics.cacheHitRate < 20) {
    recommendations.push(
      '⚠️ Hit rate muy bajo (<20%). Verifica que el contenido estático esté al inicio del prompt.'
    );
  }

  // Prompt muy corto
  if (metrics.totalPromptTokens < 1024) {
    recommendations.push(
      `⚠️ Prompt de solo ${metrics.totalPromptTokens} tokens. OpenAI cachea prompts de 1024+ tokens. ` +
      'Considera agregar más contexto estático al inicio.'
    );
  }

  // Buen hit rate
  if (metrics.cacheHitRate > 60) {
    recommendations.push(
      `✅ Excelente hit rate (${metrics.cacheHitRate.toFixed(1)}%). ¡Optimización funcionando correctamente!`
    );
  }

  // Hit rate medio
  if (metrics.cacheHitRate >= 30 && metrics.cacheHitRate <= 60) {
    recommendations.push(
      `🟡 Hit rate moderado (${metrics.cacheHitRate.toFixed(1)}%). ` +
      'Hay margen de mejora: revisa si hay contenido dinámico al inicio del prompt.'
    );
  }

  // Sin cache
  if (metrics.cachedTokens === 0 && metrics.totalPromptTokens >= 1024) {
    recommendations.push(
      '🔴 Sin tokens cacheados a pesar de superar 1024 tokens. ' +
      'Puede ser el primer request con este prompt. Monitorea requests subsecuentes.'
    );
  }

  return recommendations;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  extractCacheMetrics,
  logCacheMetrics,
  monitorPromptCache,
  formatMetricsForResponse,
  getCacheOptimizationRecommendations,
};
