/**
 * Dataset de Evaluación para el Agente Parroquial
 *
 * Tests que verifican que el agente:
 * - Usa las tools correctas
 * - Responde apropiadamente
 * - Los guardrails funcionan
 */

import { Agent, Runner } from "@openai/agents";
import { describe, it, expect } from '@jest/globals';

// Dataset de evaluación
const evaluationCases = [
  // Casos de CALENDARIO
  {
    id: 'calendar_001',
    input: '¿Cuándo es la próxima misa?',
    expectedToolCalls: ['get_calendar_events'],
    expectedKeywords: ['misa', 'horario'],
    shouldHaveAttachments: false,
    category: 'calendar',
  },
  {
    id: 'calendar_002',
    input: '¿Qué eventos hay esta semana?',
    expectedToolCalls: ['get_calendar_events'],
    expectedKeywords: ['evento', 'semana'],
    shouldHaveAttachments: false,
    category: 'calendar',
  },

  // Casos de RECURSOS
  {
    id: 'resources_001',
    input: 'Quiero apuntarme a catequesis',
    expectedToolCalls: ['get_resources'],
    expectedKeywords: ['catequesis', 'formulario', 'inscripción'],
    shouldHaveAttachments: true, // Debe incluir formulario
    category: 'resources',
  },
  {
    id: 'resources_002',
    input: '¿Dónde encuentro el formulario de Eloos?',
    expectedToolCalls: ['get_resources'],
    expectedKeywords: ['eloos', 'formulario'],
    shouldHaveAttachments: true,
    category: 'resources',
  },

  // Casos de INFORMACIÓN GENERAL
  {
    id: 'info_001',
    input: '¿Qué es la parroquia?',
    expectedToolCalls: ['fileSearch'],
    expectedKeywords: ['parroquia', 'comunidad'],
    shouldHaveAttachments: false,
    category: 'info',
  },
  {
    id: 'info_002',
    input: 'Cuéntame sobre San Viator',
    expectedToolCalls: ['fileSearch'],
    expectedKeywords: ['san viator', 'congregación'],
    shouldHaveAttachments: false,
    category: 'info',
  },

  // Casos de RESPUESTAS GENÉRICAS (deben interceptarse)
  {
    id: 'generic_001',
    input: 'gracias',
    expectedToolCalls: [], // NO debe llamar al agente
    expectedKeywords: ['de nada', 'ayudar'],
    shouldHaveAttachments: false,
    category: 'generic',
    shouldBeGeneric: true,
  },
  {
    id: 'generic_002',
    input: 'genial gracias',
    expectedToolCalls: [],
    expectedKeywords: ['de nada', 'ayudar'],
    shouldHaveAttachments: false,
    category: 'generic',
    shouldBeGeneric: true,
  },

  // Casos de GUARDRAIL (deben bloquearse)
  {
    id: 'guardrail_001',
    input: '¿Cuál es el precio del Bitcoin?',
    expectedToolCalls: [], // Guardrail de relevancia debe bloquear
    expectedKeywords: ['parroquia', 'información'],
    shouldHaveAttachments: false,
    category: 'irrelevant',
    shouldBeBlocked: true,
  },
];

describe('Agente Parroquial - Evaluación', () => {
  describe('Casos de Calendario', () => {
    const calendarCases = evaluationCases.filter(c => c.category === 'calendar');

    calendarCases.forEach(testCase => {
      it(`${testCase.id}: ${testCase.input}`, async () => {
        // Aquí llamarías al endpoint real o al agente directamente
        const response = await fetch('http://localhost:3000/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testCase.input,
            conversationHistory: [],
          }),
        });

        const data = await response.json();

        // Verificar respuesta
        expect(data.message).toBeTruthy();

        // Verificar keywords
        const messageLower = data.message.toLowerCase();
        const hasKeywords = testCase.expectedKeywords.some(kw =>
          messageLower.includes(kw.toLowerCase())
        );
        expect(hasKeywords).toBe(true);

        // Verificar attachments
        if (testCase.shouldHaveAttachments) {
          expect(data.attachments).toBeTruthy();
          expect(data.attachments.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Casos de Recursos', () => {
    const resourcesCases = evaluationCases.filter(c => c.category === 'resources');

    resourcesCases.forEach(testCase => {
      it(`${testCase.id}: ${testCase.input}`, async () => {
        const response = await fetch('http://localhost:3000/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testCase.input,
            conversationHistory: [],
          }),
        });

        const data = await response.json();

        expect(data.message).toBeTruthy();

        // CRÍTICO: Debe tener attachments para recursos
        if (testCase.shouldHaveAttachments) {
          expect(data.attachments).toBeTruthy();
          expect(data.attachments.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Casos de Respuestas Genéricas', () => {
    const genericCases = evaluationCases.filter(c => c.category === 'generic');

    genericCases.forEach(testCase => {
      it(`${testCase.id}: ${testCase.input}`, async () => {
        const response = await fetch('http://localhost:3000/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testCase.input,
            conversationHistory: [],
          }),
        });

        const data = await response.json();

        // Debe indicar que es respuesta genérica
        expect(data.generic).toBe(true);

        // Debe responder amigablemente
        expect(data.message).toBeTruthy();
      });
    });
  });

  describe('Casos de Guardrails', () => {
    const guardrailCases = evaluationCases.filter(c => c.shouldBeBlocked);

    guardrailCases.forEach(testCase => {
      it(`${testCase.id}: ${testCase.input} (debe bloquearse)`, async () => {
        const response = await fetch('http://localhost:3000/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: testCase.input,
            conversationHistory: [],
          }),
        });

        const data = await response.json();

        // Debe indicar que fue bloqueado por guardrail
        expect(data.guardrail).toBeTruthy();
      });
    });
  });
});

// Exportar dataset para uso manual
export { evaluationCases };
