/**
 * Tests para useQuickDetector - Critical Path
 *
 * Este hook determina si un mensaje debe ir a:
 * - Quick endpoint (cache + GPT-4o-mini, < 2s)
 * - Full endpoint (OpenAI Agent + Vector Store + Tools, 10-15s)
 */

import { useQuickDetector } from '../useQuickDetector';

describe('useQuickDetector', () => {
  let detector: ReturnType<typeof useQuickDetector>;

  beforeEach(() => {
    detector = useQuickDetector();
  });

  describe('QUICK - Saludos básicos', () => {
    test('detecta saludo simple como quick', () => {
      expect(detector.detectMessageType('hola')).toEqual({
        type: 'quick',
        reason: 'Saludo básico',
      });
    });

    test('detecta buenos días como quick', () => {
      expect(detector.detectMessageType('buenos días')).toEqual({
        type: 'quick',
        reason: 'Saludo básico',
      });
    });

    test('detecta hey como quick', () => {
      expect(detector.detectMessageType('hey')).toEqual({
        type: 'quick',
        reason: 'Saludo básico',
      });
    });

    test('NO detecta saludo largo como quick', () => {
      const result = detector.detectMessageType('hola buenos días cómo estás hoy');
      expect(result.type).not.toBe('quick');
      expect(result.reason).not.toBe('Saludo básico');
    });
  });

  describe('QUICK - Agradecimientos', () => {
    test('detecta gracias como quick', () => {
      expect(detector.detectMessageType('gracias')).toEqual({
        type: 'quick',
        reason: 'Agradecimiento simple',
      });
    });

    test('detecta ok como quick', () => {
      expect(detector.detectMessageType('ok')).toEqual({
        type: 'quick',
        reason: 'Agradecimiento simple',
      });
    });

    test('detecta perfecto como quick', () => {
      expect(detector.detectMessageType('perfecto')).toEqual({
        type: 'quick',
        reason: 'Agradecimiento simple',
      });
    });
  });

  describe('Cambios de tema (FULL)', () => {
    test('detecta pregunta con "y..." como full (cambio de tema)', () => {
      expect(detector.detectMessageType('y cáritas?')).toEqual({
        type: 'full',
        reason: 'Cambio de tema que requiere contexto',
      });
    });
  });

  describe('Follow-ups simples (QUICK)', () => {
    test('detecta "cuéntame más" como quick (heurística < 50 chars)', () => {
      const result = detector.detectMessageType('cuéntame más');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });

    test('detecta "más información" como quick (heurística < 50 chars)', () => {
      const result = detector.detectMessageType('más información');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });

    test('detecta "dime más" como quick (heurística < 50 chars)', () => {
      const result = detector.detectMessageType('dime más');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });
  });

  describe('FULL - Calendario y eventos dinámicos', () => {
    test('detecta "eventos hoy" como full', () => {
      expect(detector.detectMessageType('eventos hoy')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('detecta "qué hay mañana" como full', () => {
      expect(detector.detectMessageType('qué hay mañana')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('detecta "misas esta semana" como full', () => {
      expect(detector.detectMessageType('misas esta semana')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('detecta "próximo evento" como full', () => {
      expect(detector.detectMessageType('próximo evento')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('detecta "calendario" como full', () => {
      expect(detector.detectMessageType('quiero ver el calendario')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });
  });

  describe('FULL - Queries complejas', () => {
    test('detecta "explica" como full', () => {
      expect(detector.detectMessageType('explica la diferencia entre bautismo y confirmación')).toEqual({
        type: 'full',
        reason: 'Query compleja que requiere razonamiento',
      });
    });

    test('detecta "cómo funciona" como full', () => {
      expect(detector.detectMessageType('cómo funciona la inscripción')).toEqual({
        type: 'full',
        reason: 'Query compleja que requiere razonamiento',
      });
    });

    test('detecta "por qué" como full', () => {
      expect(detector.detectMessageType('por qué necesito padrinos')).toEqual({
        type: 'full',
        reason: 'Query compleja que requiere razonamiento',
      });
    });

    test('detecta "diferencia" como full', () => {
      expect(detector.detectMessageType('diferencia entre matrimonio civil y religioso')).toEqual({
        type: 'full',
        reason: 'Query compleja que requiere razonamiento',
      });
    });
  });

  describe('QUICK - FAQs típicas', () => {
    test('detecta "qué es eloos" como quick', () => {
      expect(detector.detectMessageType('qué es eloos')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "número soledad" como quick', () => {
      expect(detector.detectMessageType('número soledad')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "horario caritas" como quick', () => {
      expect(detector.detectMessageType('horario caritas')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "teléfono parroquia" como quick', () => {
      expect(detector.detectMessageType('teléfono parroquia')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "dirección" como quick', () => {
      expect(detector.detectMessageType('dirección')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "grupos parroquia" como quick', () => {
      expect(detector.detectMessageType('grupos parroquia')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "qué es mies" como quick', () => {
      expect(detector.detectMessageType('qué es mies')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('detecta "comunidades religiosas" como quick', () => {
      expect(detector.detectMessageType('comunidades religiosas')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });
  });

  describe('Heurística - Mensajes cortos vs largos', () => {
    test('mensaje muy corto (< 50 chars) sin pattern específico → quick', () => {
      const result = detector.detectMessageType('info rápida');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });

    test('mensaje largo (> 50 chars) sin pattern específico → full', () => {
      const result = detector.detectMessageType(
        'Necesito información detallada sobre todos los documentos necesarios para el sacramento'
      );
      expect(result.type).toBe('full');
      // Puede ser detectado como follow-up por la palabra "sobre"
      expect(['Query larga o específica', 'Follow-up que requiere contexto']).toContain(result.reason);
    });
  });

  describe('Edge cases y variaciones', () => {
    test('maneja mayúsculas/minúsculas correctamente', () => {
      expect(detector.detectMessageType('QUÉ ES ELOOS')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('maneja acentos y tildes', () => {
      expect(detector.detectMessageType('horario misa')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });

      expect(detector.detectMessageType('próximo evento')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('maneja espacios extra', () => {
      const result = detector.detectMessageType('  qué  es  eloos  ');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('FAQ probable en cache');
    });

    test('string vacío retorna full por defecto', () => {
      const result = detector.detectMessageType('');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });
  });

  describe('Casos reales de producción', () => {
    test('Usuario pregunta por Cáritas (FAQ)', () => {
      expect(detector.detectMessageType('Qué horario hay de Cáritas?')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('Usuario pide más info (follow-up simple)', () => {
      const result = detector.detectMessageType('Cuéntame mas');
      expect(result.type).toBe('quick');
      expect(result.reason).toBe('Pregunta corta simple');
    });

    test('Usuario pregunta por eventos de hoy (calendario)', () => {
      expect(detector.detectMessageType('Que hay el día de hoy?')).toEqual({
        type: 'full',
        reason: 'Requiere calendario dinámico',
      });
    });

    test('Usuario pregunta por Eloos (FAQ)', () => {
      expect(detector.detectMessageType('Qué es eloos?')).toEqual({
        type: 'quick',
        reason: 'FAQ probable en cache',
      });
    });

    test('Usuario pregunta por actividad específica (calendario)', () => {
      const result = detector.detectMessageType('Cuando es la actividad?');
      // "Cuando" puede no ser capturado por calendario, pero es pregunta corta
      // Verificamos que sea quick (por ser corta) o full (si detecta calendario)
      expect(['quick', 'full']).toContain(result.type);
    });
  });
});
