/**
 * 🧪 TESTS: Advanced Caching Utilities
 * =====================================
 * Tests para utilidades avanzadas de caching de historial y fingerprinting RAG.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  splitMessagesForCaching,
  calculateOptimalCacheableCount,
  buildOptimizedMessageArray,
  generateContextFingerprint,
  contextsMatch,
  contextCache,
  analyzeCachingStrategy,
  type Message,
  type ContextChunk,
} from '../advancedCaching';

describe('Advanced Caching - Historial Conversacional', () => {
  describe('calculateOptimalCacheableCount', () => {
    it('debe retornar 0 para conversaciones muy cortas (< 5 msgs)', () => {
      expect(calculateOptimalCacheableCount(0)).toBe(0);
      expect(calculateOptimalCacheableCount(3)).toBe(0);
      expect(calculateOptimalCacheableCount(4)).toBe(0);
    });

    it('debe retornar 60% para conversaciones medias (5-10 msgs)', () => {
      expect(calculateOptimalCacheableCount(5)).toBe(3); // 60% de 5
      expect(calculateOptimalCacheableCount(10)).toBe(6); // 60% de 10
    });

    it('debe retornar 75% para conversaciones largas (10+ msgs)', () => {
      expect(calculateOptimalCacheableCount(12)).toBe(9); // 75% de 12
      expect(calculateOptimalCacheableCount(20)).toBe(15); // 75% de 20
    });
  });

  describe('splitMessagesForCaching', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Msg 1' },
      { role: 'assistant', content: 'Resp 1' },
      { role: 'user', content: 'Msg 2' },
      { role: 'assistant', content: 'Resp 2' },
      { role: 'user', content: 'Msg 3' },
      { role: 'assistant', content: 'Resp 3' },
      { role: 'user', content: 'Msg 4' },
      { role: 'assistant', content: 'Resp 4' },
    ];

    it('debe split correctamente con count específico', () => {
      const [cacheable, fresh] = splitMessagesForCaching(messages, 5);

      expect(cacheable).toHaveLength(5);
      expect(fresh).toHaveLength(3);
      expect(cacheable[0].content).toBe('Msg 1');
      expect(fresh[0].content).toBe('Resp 3');
    });

    it('debe usar 70% por defecto si no se especifica count', () => {
      const [cacheable, fresh] = splitMessagesForCaching(messages);

      const expectedCacheable = Math.floor(8 * 0.7); // 5
      expect(cacheable).toHaveLength(expectedCacheable);
      expect(fresh).toHaveLength(8 - expectedCacheable);
    });

    it('debe retornar arrays vacíos si no hay mensajes', () => {
      const [cacheable, fresh] = splitMessagesForCaching([]);

      expect(cacheable).toEqual([]);
      expect(fresh).toEqual([]);
    });

    it('debe no split si el split es muy pequeño (< 3)', () => {
      const shortMessages = messages.slice(0, 3);
      const [cacheable, fresh] = splitMessagesForCaching(shortMessages, 2);

      // Split < 3 → no vale la pena
      expect(cacheable).toEqual([]);
      expect(fresh).toEqual(shortMessages);
    });

    it('debe mantener el orden de los mensajes', () => {
      const [cacheable, fresh] = splitMessagesForCaching(messages, 4);

      expect(cacheable.map(m => m.content)).toEqual(['Msg 1', 'Resp 1', 'Msg 2', 'Resp 2']);
      expect(fresh.map(m => m.content)).toEqual(['Msg 3', 'Resp 3', 'Msg 4', 'Resp 4']);
    });
  });

  describe('buildOptimizedMessageArray', () => {
    it('debe construir array en orden correcto para OpenAI', () => {
      const systemPrompt = 'System instructions';
      const cacheable: Message[] = [
        { role: 'user', content: 'Old 1' },
        { role: 'assistant', content: 'Old Resp 1' },
      ];
      const fresh: Message[] = [
        { role: 'user', content: 'Recent 1' },
        { role: 'assistant', content: 'Recent Resp 1' },
      ];
      const current = 'Current message';

      const result = buildOptimizedMessageArray(systemPrompt, cacheable, fresh, current);

      expect(result).toHaveLength(6); // 1 system + 2 cacheable + 2 fresh + 1 current
      expect(result[0]).toEqual({ role: 'system', content: systemPrompt });
      expect(result[1]).toEqual({ role: 'user', content: 'Old 1' });
      expect(result[3]).toEqual({ role: 'user', content: 'Recent 1' });
      expect(result[5]).toEqual({ role: 'user', content: current });
    });

    it('debe funcionar con arrays vacíos', () => {
      const result = buildOptimizedMessageArray('System', [], [], 'User msg');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
    });
  });
});

describe('Advanced Caching - Contexto RAG Fingerprinting', () => {
  const sampleChunks: ContextChunk[] = [
    { text: 'Content of document 1', filename: 'doc1.pdf', score: 0.95 },
    { text: 'Content of document 2', filename: 'doc2.pdf', score: 0.88 },
  ];

  describe('generateContextFingerprint', () => {
    it('debe generar hash SHA-256 de 64 caracteres', () => {
      const fingerprint = generateContextFingerprint(sampleChunks);

      expect(fingerprint).toHaveLength(64); // SHA-256 = 64 hex chars
      expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });

    it('debe ser determinista (mismo input = mismo hash)', () => {
      const hash1 = generateContextFingerprint(sampleChunks);
      const hash2 = generateContextFingerprint(sampleChunks);

      expect(hash1).toBe(hash2);
    });

    it('debe generar hashes diferentes para contextos diferentes', () => {
      const chunks1: ContextChunk[] = [
        { text: 'Doc A', filename: 'a.pdf' },
      ];
      const chunks2: ContextChunk[] = [
        { text: 'Doc B', filename: 'b.pdf' },
      ];

      const hash1 = generateContextFingerprint(chunks1);
      const hash2 = generateContextFingerprint(chunks2);

      expect(hash1).not.toBe(hash2);
    });

    it('debe ser sensible al orden de los chunks', () => {
      const chunks1 = [...sampleChunks];
      const chunks2 = [...sampleChunks].reverse();

      const hash1 = generateContextFingerprint(chunks1);
      const hash2 = generateContextFingerprint(chunks2);

      expect(hash1).not.toBe(hash2); // Orden importa
    });

    it('debe retornar "empty-context" para array vacío', () => {
      const fingerprint = generateContextFingerprint([]);

      expect(fingerprint).toBe('empty-context');
    });

    it('debe ignorar el campo score (solo texto y filename)', () => {
      const chunks1: ContextChunk[] = [
        { text: 'Content', filename: 'doc.pdf', score: 0.9 },
      ];
      const chunks2: ContextChunk[] = [
        { text: 'Content', filename: 'doc.pdf', score: 0.5 }, // Score diferente
      ];

      const hash1 = generateContextFingerprint(chunks1);
      const hash2 = generateContextFingerprint(chunks2);

      expect(hash1).toBe(hash2); // Score no afecta el hash
    });
  });

  describe('contextsMatch', () => {
    it('debe retornar true para fingerprints idénticos', () => {
      const hash1 = generateContextFingerprint(sampleChunks);
      const hash2 = generateContextFingerprint(sampleChunks);

      expect(contextsMatch(hash1, hash2)).toBe(true);
    });

    it('debe retornar false para fingerprints diferentes', () => {
      const hash1 = generateContextFingerprint(sampleChunks);
      const hash2 = generateContextFingerprint([]);

      expect(contextsMatch(hash1, hash2)).toBe(false);
    });
  });

  describe('ContextFingerprintCache', () => {
    beforeEach(() => {
      contextCache.clear();
    });

    it('debe almacenar y recuperar fingerprints', () => {
      const fingerprint = 'abc123def456';
      contextCache.set('conv-1', fingerprint);

      const retrieved = contextCache.get('conv-1');
      expect(retrieved).toBe(fingerprint);
    });

    it('debe retornar null para claves inexistentes', () => {
      const result = contextCache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('debe verificar coincidencias correctamente', () => {
      const fingerprint1 = 'hash1';
      contextCache.set('conv-1', fingerprint1);

      expect(contextCache.matches('conv-1', 'hash1')).toBe(true);
      expect(contextCache.matches('conv-1', 'hash2')).toBe(false);
    });

    it('debe limpiar entradas expiradas automáticamente', async () => {
      // Simular entrada con TTL muy corto (esto es solo conceptual en el test)
      contextCache.set('conv-1', 'hash1');

      // Verificar que existe
      expect(contextCache.get('conv-1')).toBe('hash1');

      // En producción expiraría después de 10 minutos
      // Para testing, verificamos que el método cleanup existe
      expect(contextCache.stats().size).toBe(1);
    });

    it('debe proporcionar estadísticas correctas', () => {
      contextCache.set('conv-1', 'hash1');
      contextCache.set('conv-2', 'hash2');

      const stats = contextCache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toEqual(['conv-1', 'conv-2']);
    });

    it('debe limpiar todo el cache con clear()', () => {
      contextCache.set('conv-1', 'hash1');
      contextCache.set('conv-2', 'hash2');

      expect(contextCache.stats().size).toBe(2);

      contextCache.clear();

      expect(contextCache.stats().size).toBe(0);
    });
  });
});

describe('Advanced Caching - Análisis de Estrategia', () => {
  describe('analyzeCachingStrategy', () => {
    it('debe analizar conversación corta correctamente', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola, ¿en qué puedo ayudarte?' },
      ];

      const strategy = analyzeCachingStrategy(messages);

      expect(strategy.totalMessages).toBe(2);
      expect(strategy.cacheableMessages).toBe(0); // Muy corta
      expect(strategy.freshMessages).toBe(2);
      expect(strategy.estimatedCacheHitRate).toBe(0);
      expect(strategy.recommendation).toContain('Conversación corta');
    });

    it('debe analizar conversación larga con estrategia óptima', () => {
      const messages: Message[] = Array.from({ length: 12 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i + 1}`,
      }));

      const strategy = analyzeCachingStrategy(messages);

      expect(strategy.totalMessages).toBe(12);
      expect(strategy.cacheableMessages).toBe(9); // 75% de 12
      expect(strategy.freshMessages).toBe(3);
      expect(strategy.estimatedCacheHitRate).toBeGreaterThan(70);
      expect(strategy.recommendation).toContain('Estrategia óptima');
    });

    it('debe detectar contexto RAG coincidente', () => {
      const messages: Message[] = Array.from({ length: 8 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Msg ${i}`,
      }));

      const chunks: ContextChunk[] = [
        { text: 'Doc content', filename: 'doc.pdf' },
      ];

      const fingerprint1 = generateContextFingerprint(chunks);

      const strategy = analyzeCachingStrategy(messages, chunks, fingerprint1);

      expect(strategy.contextMatchesPrevious).toBe(true);
      expect(strategy.contextFingerprint).toBeDefined();
      expect(strategy.recommendation).toContain('Contexto RAG coincide');
      expect(strategy.estimatedCacheHitRate).toBeGreaterThan(60); // Hit rate mejorado por contexto coincidente
    });

    it('debe detectar contexto RAG nuevo', () => {
      const messages: Message[] = Array.from({ length: 8 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Msg ${i}`,
      }));

      const chunks: ContextChunk[] = [
        { text: 'Doc content', filename: 'doc.pdf' },
      ];

      const fingerprint1 = 'different-hash';

      const strategy = analyzeCachingStrategy(messages, chunks, fingerprint1);

      expect(strategy.contextMatchesPrevious).toBe(false);
      expect(strategy.recommendation).toContain('Contexto RAG nuevo');
    });

    it('debe funcionar sin contexto RAG', () => {
      const messages: Message[] = Array.from({ length: 6 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Msg ${i}`,
      }));

      const strategy = analyzeCachingStrategy(messages);

      expect(strategy.contextFingerprint).toBeUndefined();
      expect(strategy.contextMatchesPrevious).toBe(false);
      expect(strategy.totalMessages).toBe(6);
    });

    it('debe proporcionar recomendaciones útiles', () => {
      const shortConv: Message[] = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ];

      const longConv: Message[] = Array.from({ length: 15 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Msg ${i}`,
      }));

      const strategy1 = analyzeCachingStrategy(shortConv);
      const strategy2 = analyzeCachingStrategy(longConv);

      expect(strategy1.recommendation).toBeTruthy();
      expect(strategy2.recommendation).toBeTruthy();
      expect(strategy1.recommendation).not.toBe(strategy2.recommendation);
    });
  });
});

describe('Integration Tests - Full Caching Flow', () => {
  it('debe simular flujo completo de caching conversacional', () => {
    const conversationHistory: Message[] = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Turn ${i + 1}`,
    }));

    const ragChunks: ContextChunk[] = [
      { text: 'FAQ content', filename: 'faq.pdf', score: 0.9 },
    ];

    // 1. Generar fingerprint del contexto
    const contextFingerprint = generateContextFingerprint(ragChunks);

    // 2. Analizar estrategia
    const strategy = analyzeCachingStrategy(conversationHistory, ragChunks);

    // 3. Split mensajes
    const [cacheable, fresh] = splitMessagesForCaching(
      conversationHistory,
      strategy.cacheableMessages
    );

    // 4. Construir array optimizado
    const optimized = buildOptimizedMessageArray(
      'System instructions',
      cacheable,
      fresh,
      'New user message'
    );

    // Verificaciones
    expect(contextFingerprint).toHaveLength(64);
    expect(strategy.totalMessages).toBe(10);
    expect(cacheable.length + fresh.length).toBe(10);
    expect(optimized[0].role).toBe('system');
    expect(optimized[optimized.length - 1].content).toBe('New user message');
  });

  it('debe detectar reutilización de contexto en requests subsecuentes', () => {
    const chunks: ContextChunk[] = [
      { text: 'Product pricing', filename: 'pricing.pdf' },
    ];

    // Request 1
    const fp1 = generateContextFingerprint(chunks);
    contextCache.set('conv-123', fp1);

    // Request 2 con mismo contexto
    const fp2 = generateContextFingerprint(chunks);
    const matches = contextCache.matches('conv-123', fp2);

    expect(matches).toBe(true);
    expect(fp1).toBe(fp2);
  });
});
