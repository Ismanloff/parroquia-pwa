/**
 * SISTEMA DE BOTONES INTELIGENTES (Quick Actions)
 *
 * Configuración completa de botones contextuales que aparecen después de
 * respuestas breves desde cache.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type QuickActionType = 'message' | 'url';

export interface QuickActionButton {
  emoji: string;
  label: string;
  type: QuickActionType;
  action: string; // Mensaje a enviar O URL a abrir
}

export interface QuickActionsConfig {
  buttons: QuickActionButton[];
}

export interface TopicConfig {
  keywords: string[];
  category: 'groups' | 'sacraments' | 'schedules' | 'location';
  dynamicButton: QuickActionButton;
}

// ============================================================================
// BOTÓN FIJO (siempre presente cuando aplique)
// ============================================================================

export const FIXED_BUTTON: QuickActionButton = {
  emoji: '📖',
  label: 'Ver más información',
  type: 'message',
  action: 'Dame información detallada sobre esto',
};

// ============================================================================
// BOTONES DINÁMICOS (según categoría)
// ============================================================================

const DYNAMIC_BUTTONS = {
  groups: {
    emoji: '📝',
    label: 'Inscribirme',
    type: 'url' as QuickActionType,
    action: 'https://form.typeform.com/to/eiNEOWby',
  },
  sacraments: {
    emoji: '📋',
    label: 'Ver requisitos',
    type: 'message' as QuickActionType,
    action: '¿Qué documentos necesito?',
  },
  schedules: {
    emoji: '📅',
    label: 'Ver horarios completos',
    type: 'message' as QuickActionType,
    action: 'Dame todos los horarios',
  },
  location: {
    emoji: '📍',
    label: '¿Dónde está?',
    type: 'message' as QuickActionType,
    action: '¿Cuál es la ubicación y horarios de contacto?',
  },
};

// ============================================================================
// MAPEO DE TEMAS → CATEGORÍAS
// ============================================================================

export const TOPIC_MAPPINGS: TopicConfig[] = [
  // ========== SERVICIOS/PRODUCTOS ==========
  {
    keywords: [
      'producto',
      'servicio',
      'plan',
      'planes',
      'suscripción',
      'suscripcion',
    ],
    category: 'groups',
    dynamicButton: DYNAMIC_BUTTONS.groups,
  },

  // ========== SOPORTE/DOCUMENTACIÓN ==========
  {
    keywords: [
      'documentación',
      'documentacion',
      'guía',
      'guia',
      'tutorial',
      'manual',
    ],
    category: 'sacraments',
    dynamicButton: DYNAMIC_BUTTONS.sacraments,
  },

  // ========== HORARIOS/EVENTOS ==========
  {
    keywords: [
      'horario',
      'horarios',
      'evento',
      'eventos',
      'calendario',
      'webinar',
    ],
    category: 'schedules',
    dynamicButton: DYNAMIC_BUTTONS.schedules,
  },

  // ========== UBICACIÓN/CONTACTO ==========
  {
    keywords: [
      'contacto',
      'donde esta',
      'donde está',
      'dirección',
      'direccion',
      'ubicacion',
      'ubicación',
      'oficina',
    ],
    category: 'location',
    dynamicButton: DYNAMIC_BUTTONS.location,
  },
];

// ============================================================================
// FUNCIÓN DE DETECCIÓN DE TEMA
// ============================================================================

/**
 * Detecta el tema principal en una respuesta del cache y retorna los botones apropiados.
 *
 * @param message - Mensaje original del usuario
 * @param response - Respuesta generada desde cache
 * @returns QuickActionsConfig o null si no se detecta tema
 */
export function detectQuickActions(
  message: string,
  response: string
): QuickActionsConfig | null {
  const lowerMessage = message.toLowerCase();
  const lowerResponse = response.toLowerCase();

  // Combinar mensaje + respuesta para mejor detección
  const combinedText = `${lowerMessage} ${lowerResponse}`;

  // Buscar coincidencias en los mappings
  for (const topicConfig of TOPIC_MAPPINGS) {
    const hasMatch = topicConfig.keywords.some((keyword) =>
      combinedText.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      // Retornar botón fijo + botón dinámico
      return {
        buttons: [FIXED_BUTTON, topicConfig.dynamicButton],
      };
    }
  }

  // No se detectó tema específico → no mostrar botones
  return null;
}

// ============================================================================
// REGLAS DE VALIDACIÓN
// ============================================================================

/**
 * Valida si una respuesta debe mostrar Quick Actions.
 *
 * Criterios:
 * - Respuesta viene de cache
 * - Respuesta corta (< 150 palabras)
 * - Tema identificable
 * - No es respuesta genérica (saludo, agradecimiento)
 *
 * @param response - Respuesta generada
 * @param fromCache - Si viene desde cache
 * @returns true si debe mostrar botones
 */
export function shouldShowQuickActions(
  response: string,
  fromCache: boolean
): boolean {
  // Regla 1: Debe venir de cache
  if (!fromCache) {
    return false;
  }

  // Regla 2: Debe ser respuesta corta (< 150 palabras)
  const wordCount = response.split(/\s+/).length;
  if (wordCount > 150) {
    return false;
  }

  // Regla 3: No debe ser respuesta genérica
  const genericPatterns = [
    /^(hola|buenos días|buenas tardes|buenas noches)/i,
    /^(gracias|muchas gracias|vale|ok|de acuerdo)/i,
    /^(adiós|hasta luego|nos vemos)/i,
  ];

  const isGeneric = genericPatterns.some((pattern) => pattern.test(response));
  if (isGeneric) {
    return false;
  }

  return true;
}
