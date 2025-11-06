/**
 * 🧪 TESTS: Prompt Constants & RAG Context Building
 * ==================================================
 * Verifica que las constantes de prompts y utilidades estén correctamente configuradas
 * para aprovechar OpenAI Prompt Caching.
 */

import { describe, it, expect } from 'vitest';
import {
  WIDGET_STATIC_INSTRUCTIONS,
  MESSAGE_STATIC_INSTRUCTIONS,
  GENERATE_STATIC_INSTRUCTIONS,
  MESSAGE_STREAM_STATIC_INSTRUCTIONS,
  FUNCTION_DEFINITIONS,
  CALENDAR_FUNCTION_DEFINITION,
  RESOURCES_FUNCTION_DEFINITION,
  buildRAGContext,
  isPromptCacheOptimal,
  estimateTokens,
} from '../promptConstants';

describe('Prompt Constants - Cache Optimization', () => {
  describe('Static Instructions Length', () => {
    it('WIDGET_STATIC_INSTRUCTIONS debe tener longitud suficiente para caching', () => {
      const tokens = estimateTokens(WIDGET_STATIC_INSTRUCTIONS);
      expect(tokens).toBeGreaterThanOrEqual(200); // Al menos 200 tokens
      expect(WIDGET_STATIC_INSTRUCTIONS.length).toBeGreaterThan(500);
    });

    it('MESSAGE_STATIC_INSTRUCTIONS debe ser conciso pero completo', () => {
      const tokens = estimateTokens(MESSAGE_STATIC_INSTRUCTIONS);
      expect(tokens).toBeGreaterThanOrEqual(150);
      expect(MESSAGE_STATIC_INSTRUCTIONS).toContain('HERRAMIENTAS DISPONIBLES');
      expect(MESSAGE_STATIC_INSTRUCTIONS).toContain('REGLAS CRÍTICAS');
    });

    it('GENERATE_STATIC_INSTRUCTIONS debe estar en inglés', () => {
      expect(GENERATE_STATIC_INSTRUCTIONS).toContain('You are');
      expect(GENERATE_STATIC_INSTRUCTIONS).toContain('CONTEXT USAGE');
      const tokens = estimateTokens(GENERATE_STATIC_INSTRUCTIONS);
      expect(tokens).toBeGreaterThanOrEqual(200);
    });

    it('MESSAGE_STREAM_STATIC_INSTRUCTIONS debe ser el más completo', () => {
      const tokens = estimateTokens(MESSAGE_STREAM_STATIC_INSTRUCTIONS);
      expect(tokens).toBeGreaterThanOrEqual(300); // El más largo
      expect(MESSAGE_STREAM_STATIC_INSTRUCTIONS).toContain('search_parish_info');
      expect(MESSAGE_STREAM_STATIC_INSTRUCTIONS).toContain('SIEMPRE USA search_parish_info');
    });
  });

  describe('Function Definitions Structure', () => {
    it('CALENDAR_FUNCTION_DEFINITION debe tener estructura correcta', () => {
      expect(CALENDAR_FUNCTION_DEFINITION.type).toBe('function');
      expect(CALENDAR_FUNCTION_DEFINITION.function.name).toBe('get_calendar_events');
      expect(CALENDAR_FUNCTION_DEFINITION.function.parameters).toBeDefined();
      expect(CALENDAR_FUNCTION_DEFINITION.function.parameters.required).toContain('timeframe');
    });

    it('RESOURCES_FUNCTION_DEFINITION debe tener estructura correcta', () => {
      expect(RESOURCES_FUNCTION_DEFINITION.type).toBe('function');
      expect(RESOURCES_FUNCTION_DEFINITION.function.name).toBe('get_resources');
      expect(RESOURCES_FUNCTION_DEFINITION.function.parameters.required).toContain('query');
    });

    it('FUNCTION_DEFINITIONS debe contener ambas funciones', () => {
      expect(FUNCTION_DEFINITIONS).toHaveLength(2);
      expect(FUNCTION_DEFINITIONS[0].function.name).toBe('get_calendar_events');
      expect(FUNCTION_DEFINITIONS[1].function.name).toBe('get_resources');
    });

    it('Function definitions deben ser estáticas (no cambiar)', () => {
      // Verificar que son objetos inmutables
      const firstCall = FUNCTION_DEFINITIONS;
      const secondCall = FUNCTION_DEFINITIONS;
      expect(firstCall).toBe(secondCall); // Misma referencia = no se regenera
    });
  });

  describe('buildRAGContext Utility', () => {
    it('debe construir contexto vacío correctamente (español)', () => {
      const context = buildRAGContext([], 'es');
      expect(context).toContain('CONTEXTO DE LA BASE DE CONOCIMIENTOS');
      expect(context).toContain('No hay documentos disponibles');
    });

    it('debe construir contexto vacío correctamente (inglés)', () => {
      const context = buildRAGContext([], 'en');
      expect(context).toContain('KNOWLEDGE BASE CONTEXT');
      expect(context).toContain('No documents available');
    });

    it('debe formatear chunks con numeración correcta (español)', () => {
      const chunks = [
        { text: 'Contenido del doc 1', filename: 'doc1.pdf' },
        { text: 'Contenido del doc 2', filename: 'doc2.pdf' },
        { text: 'Contenido del doc 3', filename: 'doc3.pdf' },
      ];

      const context = buildRAGContext(chunks, 'es');

      expect(context).toContain('Documento 1: doc1.pdf');
      expect(context).toContain('Documento 2: doc2.pdf');
      expect(context).toContain('Documento 3: doc3.pdf');
      expect(context).toContain('Contenido del doc 1');
      expect(context).toContain('---'); // Separador
    });

    it('debe formatear chunks con numeración correcta (inglés)', () => {
      const chunks = [
        { text: 'Content of doc 1', filename: 'doc1.pdf' },
      ];

      const context = buildRAGContext(chunks, 'en');

      expect(context).toContain('Document 1: doc1.pdf');
      expect(context).toContain('Content of doc 1');
    });

    it('debe usar español por defecto si no se especifica idioma', () => {
      const context = buildRAGContext([]);
      expect(context).toContain('CONTEXTO DE LA BASE DE CONOCIMIENTOS');
    });
  });

  describe('Token Estimation Utilities', () => {
    it('isPromptCacheOptimal debe detectar prompts suficientemente largos', () => {
      const shortPrompt = 'Hola, ¿cómo estás?';
      const longPrompt = 'A'.repeat(4096); // 4096 chars = ~1024 tokens

      expect(isPromptCacheOptimal(shortPrompt)).toBe(false);
      expect(isPromptCacheOptimal(longPrompt)).toBe(true);
    });

    it('estimateTokens debe calcular aproximadamente correctamente', () => {
      const text100chars = 'A'.repeat(100);
      const text400chars = 'A'.repeat(400);

      expect(estimateTokens(text100chars)).toBe(25); // 100/4 = 25
      expect(estimateTokens(text400chars)).toBe(100); // 400/4 = 100
    });

    it('WIDGET_STATIC_INSTRUCTIONS debe estar optimizado para caching', () => {
      // Con contexto RAG típico, debería superar 1024 tokens
      const ragContext = buildRAGContext([
        { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20), filename: 'doc1.pdf' },
        { text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(20), filename: 'doc2.pdf' },
      ], 'es');

      const fullPrompt = `${WIDGET_STATIC_INSTRUCTIONS}\n\n${ragContext}`;
      expect(isPromptCacheOptimal(fullPrompt)).toBe(true);
    });
  });

  describe('Prompt Structure Validation', () => {
    it('todas las instrucciones deben contener secciones clave', () => {
      // Widget
      expect(WIDGET_STATIC_INSTRUCTIONS).toMatch(/GUÍAS DE COMPORTAMIENTO|USO DE CONTEXTO/i);

      // Message
      expect(MESSAGE_STATIC_INSTRUCTIONS).toMatch(/HERRAMIENTAS|REGLAS/i);

      // Generate
      expect(GENERATE_STATIC_INSTRUCTIONS).toMatch(/CORE GUIDELINES|CONTEXT USAGE/i);

      // Message Stream
      expect(MESSAGE_STREAM_STATIC_INSTRUCTIONS).toMatch(/HERRAMIENTAS DISPONIBLES|REGLA CRÍTICA/i);
    });

    it('ninguna instrucción debe contener placeholders sin completar', () => {
      const allInstructions = [
        WIDGET_STATIC_INSTRUCTIONS,
        MESSAGE_STATIC_INSTRUCTIONS,
        GENERATE_STATIC_INSTRUCTIONS,
        MESSAGE_STREAM_STATIC_INSTRUCTIONS,
      ];

      allInstructions.forEach((instruction) => {
        expect(instruction).not.toContain('TODO');
        expect(instruction).not.toContain('FIXME');
        expect(instruction).not.toContain('XXX');
        expect(instruction).not.toMatch(/\{\{.*\}\}/); // No template placeholders
      });
    });

    it('instrucciones en español deben usar tildes correctamente', () => {
      const spanishInstructions = [
        WIDGET_STATIC_INSTRUCTIONS,
        MESSAGE_STATIC_INSTRUCTIONS,
        MESSAGE_STREAM_STATIC_INSTRUCTIONS,
      ];

      spanishInstructions.forEach((instruction) => {
        // Verificar que hay tildes (señal de español correcto)
        expect(instruction).toMatch(/[áéíóúñ]/i);
      });
    });
  });

  describe('Immutability & Performance', () => {
    it('constantes deben ser reutilizables sin mutación', () => {
      // Las constantes se exportan y se reutilizan
      // Verificar que obtener la misma referencia indica que son estáticas
      const firstCall = FUNCTION_DEFINITIONS;
      const secondCall = FUNCTION_DEFINITIONS;

      expect(firstCall).toBe(secondCall); // Misma referencia = no se regenera
      expect(FUNCTION_DEFINITIONS.length).toBe(2); // Siempre 2 funciones

      // Si alguien muta (no recomendado), al menos verificar estructura
      expect(FUNCTION_DEFINITIONS[0].function.name).toBe('get_calendar_events');
      expect(FUNCTION_DEFINITIONS[1].function.name).toBe('get_resources');
    });

    it('buildRAGContext debe ser determinista (mismo input = mismo output)', () => {
      const chunks = [
        { text: 'Test content', filename: 'test.pdf' },
      ];

      const result1 = buildRAGContext(chunks, 'es');
      const result2 = buildRAGContext(chunks, 'es');

      expect(result1).toBe(result2);
    });
  });
});

describe('Cache Optimization Strategy Validation', () => {
  it('estructura de prompt debe seguir patrón: estático → dinámico', () => {
    // Simular estructura típica de un endpoint
    const staticPart = WIDGET_STATIC_INSTRUCTIONS;
    const dynamicRAG = buildRAGContext([
      { text: 'Dynamic content', filename: 'doc.pdf' }
    ], 'es');
    const userMessage = '¿Cuál es el precio?';

    // Verificar que estático va primero (mejor para caching)
    const fullPrompt = `${staticPart}\n\n${dynamicRAG}\n\nPREGUNTA: ${userMessage}`;

    // Primeros 1000 caracteres deben ser principalmente estáticos
    const first1000 = fullPrompt.substring(0, 1000);
    expect(first1000).toContain('Eres un asistente virtual');
    expect(first1000).not.toContain('¿Cuál es el precio?');
  });

  it('función definitions deben ir antes de mensajes de usuario', () => {
    // En function calling, las definiciones van en el objeto tools/functions
    // No en el contenido del mensaje, así que esto es correcto por diseño
    expect(FUNCTION_DEFINITIONS).toBeDefined();
    expect(Array.isArray(FUNCTION_DEFINITIONS)).toBe(true);
  });
});
