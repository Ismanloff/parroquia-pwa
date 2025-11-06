/**
 * 🧪 TESTS: Prompt Cache Monitoring Utilities
 * ============================================
 * Verifica que el sistema de monitoreo de cache funcione correctamente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractCacheMetrics,
  logCacheMetrics,
  monitorPromptCache,
  formatMetricsForResponse,
  getCacheOptimizationRecommendations,
  type CacheMetrics,
} from '../promptCacheMonitor';
import type OpenAI from 'openai';

// Mock de console.log para tests de logging
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  mockConsoleLog.mockClear();
  mockConsoleWarn.mockClear();
});

describe('Prompt Cache Monitor - Metrics Extraction', () => {
  const createMockResponse = (
    promptTokens: number,
    cachedTokens: number,
    completionTokens: number,
    model: string = 'gpt-4o-mini'
  ): OpenAI.Chat.Completions.ChatCompletion => ({
    id: 'test-id',
    object: 'chat.completion',
    created: Date.now(),
    model: model,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: 'Test response' },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      prompt_tokens_details: {
        cached_tokens: cachedTokens,
      },
    },
  });

  describe('extractCacheMetrics', () => {
    it('debe extraer métricas correctamente con cache hit', () => {
      const response = createMockResponse(1500, 1000, 200);
      const metrics = extractCacheMetrics(response, 'test-endpoint');

      expect(metrics.totalPromptTokens).toBe(1500);
      expect(metrics.cachedTokens).toBe(1000);
      expect(metrics.uncachedTokens).toBe(500);
      expect(metrics.completionTokens).toBe(200);
      expect(metrics.totalTokens).toBe(1700);
      expect(metrics.cacheHitRate).toBeCloseTo(66.67, 1);
      expect(metrics.endpoint).toBe('test-endpoint');
      expect(metrics.model).toBe('gpt-4o-mini');
    });

    it('debe manejar caso sin cache (0 cached tokens)', () => {
      const response = createMockResponse(1000, 0, 150);
      const metrics = extractCacheMetrics(response, 'test-endpoint');

      expect(metrics.cachedTokens).toBe(0);
      expect(metrics.uncachedTokens).toBe(1000);
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('debe manejar cache hit del 100%', () => {
      const response = createMockResponse(1200, 1200, 100);
      const metrics = extractCacheMetrics(response, 'test-endpoint');

      expect(metrics.cacheHitRate).toBe(100);
      expect(metrics.uncachedTokens).toBe(0);
    });

    it('debe lanzar error si falta usage data', () => {
      const invalidResponse = {
        id: 'test',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
        choices: [],
        // usage: undefined <- Faltante
      } as any;

      expect(() => extractCacheMetrics(invalidResponse, 'test')).toThrow('usage data is missing');
    });

    it('debe incluir timestamp en formato ISO', () => {
      const response = createMockResponse(1000, 500, 100);
      const metrics = extractCacheMetrics(response, 'test');

      expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
      expect(new Date(metrics.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Cost Calculation', () => {
    it('debe calcular costos correctamente para gpt-4o-mini', () => {
      // gpt-4o-mini: $0.150/1M input, $0.075/1M cached, $0.600/1M output
      const response = createMockResponse(2000, 1000, 500, 'gpt-4o-mini');
      const metrics = extractCacheMetrics(response, 'test');

      // Input sin cache: 2000 tokens * $0.150/1M = $0.0003
      expect(metrics.estimatedCost.inputCostWithoutCache).toBeCloseTo(0.0003, 6);

      // Input con cache: 1000 cached ($0.075/1M) + 1000 uncached ($0.150/1M)
      // = $0.000075 + $0.000150 = $0.000225
      expect(metrics.estimatedCost.inputCostWithCache).toBeCloseTo(0.000225, 6);

      // Output: 500 tokens * $0.600/1M = $0.0003
      expect(metrics.estimatedCost.outputCost).toBeCloseTo(0.0003, 6);

      // Savings: $0.0003 - $0.000225 = $0.000075
      expect(metrics.estimatedCost.savings).toBeCloseTo(0.000075, 6);

      // Savings %: (0.000075 / 0.0003) * 100 = 25%
      expect(metrics.estimatedCost.savingsPercentage).toBeCloseTo(25, 1);
    });

    it('debe calcular costos correctamente para gpt-4o', () => {
      // gpt-4o: $2.50/1M input, $1.25/1M cached, $10.00/1M output
      const response = createMockResponse(2000, 1500, 300, 'gpt-4o');
      const metrics = extractCacheMetrics(response, 'test');

      // Input sin cache: 2000 * $2.50/1M = $0.005
      expect(metrics.estimatedCost.inputCostWithoutCache).toBeCloseTo(0.005, 6);

      // Input con cache: 1500 cached ($1.25/1M) + 500 uncached ($2.50/1M)
      // = $0.001875 + $0.00125 = $0.003125
      expect(metrics.estimatedCost.inputCostWithCache).toBeCloseTo(0.003125, 6);

      // Savings: 37.5%
      expect(metrics.estimatedCost.savingsPercentage).toBeCloseTo(37.5, 1);
    });

    it('debe manejar modelos desconocidos con pricing default', () => {
      const response = createMockResponse(1000, 500, 100, 'gpt-unknown-model');
      const metrics = extractCacheMetrics(response, 'test');

      // Debe usar defaults (gpt-4o-mini pricing) y mostrar warning
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Pricing no encontrado para modelo')
      );
      expect(metrics.estimatedCost.inputCostWithoutCache).toBeGreaterThan(0);
    });

    it('debe calcular savings del 50% con cache hit del 100%', () => {
      const response = createMockResponse(2000, 2000, 0, 'gpt-4o-mini');
      const metrics = extractCacheMetrics(response, 'test');

      // Todo cacheado = 50% de descuento en input
      expect(metrics.estimatedCost.savingsPercentage).toBeCloseTo(50, 1);
    });
  });

  describe('logCacheMetrics', () => {
    it('debe loggear métricas básicas con emojis correctos', () => {
      const response = createMockResponse(1500, 1000, 200);
      const metrics = extractCacheMetrics(response, 'test');

      logCacheMetrics(metrics, false);

      expect(mockConsoleLog).toHaveBeenCalled();
      const logOutput = mockConsoleLog.mock.calls[0][0];

      expect(logOutput).toContain('test'); // endpoint
      expect(logOutput).toContain('66.7%'); // hit rate
      expect(logOutput).toContain('1000/1500'); // cached/total
      expect(logOutput).toMatch(/🟢|🟡|🟠|🔴/); // emoji
    });

    it('debe usar emoji verde (🟢) para hit rate > 60%', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1000, 700, 100),
        'test'
      );

      logCacheMetrics(metrics);
      expect(mockConsoleLog.mock.calls[0][0]).toContain('🟢');
    });

    it('debe usar emoji amarillo (🟡) para hit rate 30-60%', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1000, 450, 100),
        'test'
      );

      logCacheMetrics(metrics);
      expect(mockConsoleLog.mock.calls[0][0]).toContain('🟡');
    });

    it('debe usar emoji naranja (🟠) para hit rate 1-30%', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1000, 150, 100),
        'test'
      );

      logCacheMetrics(metrics);
      expect(mockConsoleLog.mock.calls[0][0]).toContain('🟠');
    });

    it('debe usar emoji rojo (🔴) para hit rate 0%', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1000, 0, 100),
        'test'
      );

      logCacheMetrics(metrics);
      expect(mockConsoleLog.mock.calls[0][0]).toContain('🔴');
    });

    it('debe mostrar detalles adicionales en modo verbose', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1500, 1000, 300),
        'test'
      );

      logCacheMetrics(metrics, true);

      // Debe haber múltiples logs
      expect(mockConsoleLog.mock.calls.length).toBeGreaterThan(1);

      // Verificar que se muestran detalles
      const allLogs = mockConsoleLog.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('Model:');
      expect(allLogs).toContain('Total Prompt Tokens:');
      expect(allLogs).toContain('Cost Breakdown:');
      expect(allLogs).toContain('Savings:');
    });
  });

  describe('monitorPromptCache (wrapper function)', () => {
    it('debe extraer y loggear en un solo paso', () => {
      const response = createMockResponse(1500, 1000, 200);

      const result = monitorPromptCache(response, 'test-endpoint', false);

      // Debe devolver metrics
      expect(result.totalPromptTokens).toBe(1500);
      expect(result.endpoint).toBe('test-endpoint');

      // Debe haber loggeado
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('debe respetar el flag verbose', () => {
      const response = createMockResponse(1000, 500, 100);

      monitorPromptCache(response, 'test', true);

      // Modo verbose = múltiples logs
      expect(mockConsoleLog.mock.calls.length).toBeGreaterThan(3);
    });
  });

  describe('formatMetricsForResponse', () => {
    it('debe formatear métricas para respuesta HTTP', () => {
      const response = createMockResponse(1500, 1000, 200);
      const metrics = extractCacheMetrics(response, 'test');
      const formatted = formatMetricsForResponse(metrics);

      expect(formatted).toHaveProperty('cache');
      expect(formatted).toHaveProperty('usage');
      expect(formatted).toHaveProperty('model');

      expect(formatted.cache.hitRate).toBe('66.7%');
      expect(formatted.cache.cachedTokens).toBe(1000);
      expect(formatted.cache.totalPromptTokens).toBe(1500);
      expect(formatted.cache.savings).toMatch(/^\$/); // Starts with $

      expect(formatted.usage.promptTokens).toBe(1500);
      expect(formatted.usage.completionTokens).toBe(200);
      expect(formatted.usage.totalTokens).toBe(1700);

      expect(formatted.model).toBe('gpt-4o-mini');
    });
  });

  describe('getCacheOptimizationRecommendations', () => {
    it('debe recomendar optimización para hit rate muy bajo', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1500, 100, 200),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('Hit rate muy bajo'))).toBe(true);
    });

    it('debe recomendar aumentar tamaño para prompts < 1024 tokens', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(800, 0, 100),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      expect(recommendations.some(r => r.includes('Prompt de solo') && r.includes('1024'))).toBe(true);
    });

    it('debe felicitar por hit rate excelente (>60%)', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(2000, 1400, 200),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      expect(recommendations.some(r => r.includes('Excelente hit rate'))).toBe(true);
      expect(recommendations.some(r => r.includes('✅'))).toBe(true);
    });

    it('debe sugerir mejora para hit rate moderado (30-60%)', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(2000, 900, 200),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      expect(recommendations.some(r => r.includes('Hit rate moderado'))).toBe(true);
      expect(recommendations.some(r => r.includes('margen de mejora'))).toBe(true);
    });

    it('debe alertar sobre sin cache a pesar de superar 1024 tokens', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(1500, 0, 200),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      expect(recommendations.some(r =>
        r.includes('Sin tokens cacheados') && r.includes('primer request')
      )).toBe(true);
    });

    it('no debe repetir recomendaciones para hit rate óptimo', () => {
      const metrics = extractCacheMetrics(
        createMockResponse(2000, 1500, 200),
        'test'
      );

      const recommendations = getCacheOptimizationRecommendations(metrics);

      // Solo debe tener la recomendación positiva, sin warnings
      expect(recommendations.length).toBe(1);
      expect(recommendations[0]).toContain('Excelente');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('debe manejar prompt_tokens = 0 sin división por cero', () => {
      const response = createMockResponse(0, 0, 100);
      const metrics = extractCacheMetrics(response, 'test');

      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.estimatedCost.savingsPercentage).toBe(0);
      expect(isNaN(metrics.cacheHitRate)).toBe(false);
    });

    it('debe manejar cached_tokens undefined (modelos antiguos)', () => {
      const response = {
        id: 'test',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
        choices: [{ index: 0, message: { role: 'assistant', content: 'test' }, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 100,
          total_tokens: 1100,
          prompt_tokens_details: undefined as any, // Sin cached_tokens
        },
      } as OpenAI.Chat.Completions.ChatCompletion;

      const metrics = extractCacheMetrics(response, 'test');

      expect(metrics.cachedTokens).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('debe ser resiliente a valores negativos (edge case)', () => {
      // Aunque no debería pasar, asegurar que no rompe
      const response = createMockResponse(1000, -100, 200); // cached negativo (imposible)
      const metrics = extractCacheMetrics(response, 'test');

      // Uncached sería 1100 (1000 - (-100))
      expect(metrics.uncachedTokens).toBe(1100);
      // Hit rate sería negativo, pero eso es un error de datos de entrada
      expect(typeof metrics.cacheHitRate).toBe('number');
    });
  });
});
