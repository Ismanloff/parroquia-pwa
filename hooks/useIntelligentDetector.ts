import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

export type MessageType = 'quick' | 'full';

interface DetectorResult {
  type: MessageType;
  reason: string;
}

interface DetectorOptions {
  lastResponseFromCache?: boolean;
  recentMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Detector simplificado: Calendar vs Pinecone
 *
 * ESTRATEGIA OPTIMIZADA 2025:
 * - Detecta queries de CALENDARIO → calendarTool (datos dinámicos)
 * - Todo lo demás → Pinecone + Agent (datos estáticos con streaming)
 * - Sin caché para Pinecone (ya es rápido + streaming oculta latencia)
 */
export const useIntelligentDetector = () => {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectMessageType = useCallback(async (
    message: string,
    options?: DetectorOptions
  ): Promise<DetectorResult> => {
    const lowerMessage = message.toLowerCase().trim();

    // ========================================
    // DETECTOR SIMPLIFICADO: ¿Requiere Calendar?
    // ========================================

    // Fechas/eventos dinámicos → Calendar API
    // Incluye: hoy, mañana, esta semana, días específicos, "qué hay", "eventos"
    const calendarioRegex = /\b(hoy|ma[ñn]ana|esta semana|este? fin de semana|este? (lunes|martes|mi[eé]rcoles|jueves|viernes|s[áa]bado|domingo)|pr[óo]xim[oa] (lunes|martes|mi[eé]rcoles|jueves|viernes|s[áa]bado|domingo|semana)|qu[eé] hay|eventos?|actividades? (hoy|ma[ñn]ana|esta|pr[óo]xim)|cu[áa]ndo)\b/i;

    if (calendarioRegex.test(lowerMessage)) {
      return { type: 'full', reason: 'Calendario dinámico' };
    }

    // ========================================
    // TODO LO DEMÁS → Pinecone + Agent
    // ========================================
    // Incluye: Qué es X, grupos, saludos, inscripciones, info general
    // Pinecone (0.3s) + Streaming = Respuestas naturales rápidas

    return { type: 'full', reason: 'Búsqueda en Pinecone + Agent' };
  }, []);

  return {
    detectMessageType,
    isDetecting,
  };
};
