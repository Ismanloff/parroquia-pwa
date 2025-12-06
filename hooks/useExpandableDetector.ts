/**
 * Hook para detectar temas complejos que pueden expandirse
 *
 * USO:
 * 1. Quick endpoint responde BREVE + metadata { hasMoreInfo: true, expandTopic: "bautismo_documentos" }
 * 2. UI muestra botón "📄 Ver lista completa"
 * 3. Al tocar, envía mensaje especial que activa respuesta detallada
 */

export type ExpandableTopic =
  | 'bautismo_documentos'
  | 'bautismo_padrinos'
  | 'bautismo_procedimiento'
  | 'matrimonio_documentos'
  | 'matrimonio_expediente'
  | 'matrimonio_padrinos'
  | 'confirmacion_requisitos'
  | 'primera_comunion_catequesis'
  | 'inscripcion_grupos'
  | 'horarios_completos'
  | null;

interface ExpandableDetectorResult {
  isExpandable: boolean;
  topic: ExpandableTopic;
  shortAnswerTemplate?: string;
  expandPrompt?: string;
}

// Configuración de temas expandibles
const EXPANDABLE_TOPICS = {
  // ========================================
  // BAUTISMO
  // ========================================
  bautismo_documentos: {
    keywords: [
      /documentos?\s+.{0,30}bautis[mz]o/i,
      /papeles?\s+.{0,30}bautis[mz]o/i,
      /qu[ée]\s+necesito\s+.{0,30}bautizar/i,
      /requisitos?\s+.{0,30}bautis[mz]o/i,
    ],
    shortAnswer: `Para bautizar necesitas:
• Certificado de matrimonio religioso (padres)
• DNI de ambos padres
• Certificado de nacimiento del menor
• Libro de familia

Los padrinos necesitan certificados de bautismo y confirmación.`,
    expandPrompt: "Dame la lista COMPLETA de documentos para bautismo con todos los detalles y casos especiales",
  },

  bautismo_padrinos: {
    keywords: [
      /requisitos?\s+padrinos?\s+bautis[mz]o/i,
      /qui[ée]n\s+puede\s+ser\s+padrino/i,
      /cu[áa]ntos\s+padrinos?\s+bautis[mz]o/i,
      /condiciones?\s+padrinos?/i,
    ],
    shortAnswer: `Requisitos básicos de padrinos:
• Mínimo 1, máximo 2 (uno y una)
• Mayor de 16 años
• Bautizado y confirmado católico
• Soltero o casado por la Iglesia

Deben presentar certificados de bautismo y confirmación.`,
    expandPrompt: "Explica TODOS los requisitos de padrinos de bautismo con casos especiales y excepciones",
  },

  bautismo_procedimiento: {
    keywords: [
      /c[óo]mo\s+.{0,30}bautizar/i,
      /proceso\s+bautis[mz]o/i,
      /pasos?\s+.{0,30}bautis[mz]o/i,
      /tr[áa]mite\s+bautis[mz]o/i,
    ],
    shortAnswer: `Proceso de bautismo:
1. Entregar solicitud en despacho (min. 1 mes antes)
2. Presentar documentación completa
3. Esperar fecha asignada (2º o 4º sábado)
4. Día del bautismo: traer vela y vestido blanco

Horarios:
• Transfiguración: 2º sábados 18:00h
• Soledad: 4º sábados 12:30h`,
    expandPrompt: "Explica el proceso COMPLETO de bautismo paso a paso con plazos, formularios y preparación",
  },

  // ========================================
  // MATRIMONIO
  // ========================================
  matrimonio_documentos: {
    keywords: [
      /documentos?\s+.{0,30}(matrimonio|boda|casarse)/i,
      /papeles?\s+.{0,30}(matrimonio|boda)/i,
      /qu[ée]\s+necesito\s+.{0,30}casar(me|nos)/i,
      /requisitos?\s+.{0,30}(matrimonio|boda)/i,
    ],
    shortAnswer: `Documentos básicos para matrimonio:
• DNI o pasaporte vigente
• Partida de bautismo (validez 6 meses)
• Partida literal de nacimiento
• Fe de vida y estado
• Certificado curso preparación al matrimonio

Si hay divorcio/nulidad/viudez: documentación adicional.`,
    expandPrompt: "Dame la lista COMPLETA de documentos para matrimonio incluyendo casos especiales (divorciados, extranjeros, etc.)",
  },

  matrimonio_expediente: {
    keywords: [
      /expediente\s+matrimonial/i,
      /d[óo]nde\s+.{0,30}expediente/i,
      /cita\s+.{0,30}(matrimonio|boda)/i,
      /arzobispado\s+.{0,30}(matrimonio|boda)/i,
    ],
    shortAnswer: `Expediente matrimonial:
Cita en Arzobispado de Madrid
📍 C/ Bailén 8
📞 914 546 400 / 915 427 906
✉️ curia@archidiocesis.madrid

Debes asistir CON testigos y documentación completa.`,
    expandPrompt: "Explica el proceso COMPLETO del expediente matrimonial con todos los pasos y documentos necesarios",
  },

  // ========================================
  // INSCRIPCIONES A GRUPOS
  // ========================================
  inscripcion_grupos: {
    keywords: [
      /c[óo]mo\s+.{0,30}(apuntar|inscribir|unir)/i,
      /inscripci[óo]n\s+(eloos|catequesis|grupo)/i,
      /formulario\s+(eloos|catequesis|grupo)/i,
      /apuntarme\s+(a\s+)?(eloos|catequesis|grupo)/i,
    ],
    shortAnswer: `Para inscribirte a grupos parroquiales:
1. Rellena formulario online (si disponible)
2. Contacta al responsable del grupo
3. Asiste a reunión informativa

Cada grupo tiene su propio proceso de acogida.`,
    expandPrompt: "Dame información COMPLETA sobre inscripciones a grupos: formularios, contactos, fechas de inicio y proceso completo",
  },

  // ========================================
  // HORARIOS
  // ========================================
  horarios_completos: {
    keywords: [
      /horarios?\s+(completos?|todas?|todo)/i,
      /todas?\s+las\s+misas/i,
      /calendario\s+completo/i,
    ],
    shortAnswer: `Horarios de misas principales:
Lunes-Viernes: 7:00h, 19:30h
Sábados: 19:30h (vespertina)
Domingos: 8:00h, 10:00h, 12:00h, 19:30h

Confesiones: Sábados 18:30-19:15h`,
    expandPrompt: "Dame el calendario COMPLETO de todas las misas, confesiones, adoraciones y actividades semanales",
  },
};

export const useExpandableDetector = () => {
  /**
   * Detecta si un mensaje trata sobre un tema expandible
   */
  const detectExpandable = (message: string): ExpandableDetectorResult => {
    const lowerMessage = message.toLowerCase().trim();

    // Verificar cada topic
    for (const [topicKey, config] of Object.entries(EXPANDABLE_TOPICS)) {
      const matches = config.keywords.some(pattern => pattern.test(lowerMessage));

      if (matches) {
        return {
          isExpandable: true,
          topic: topicKey as ExpandableTopic,
          shortAnswerTemplate: config.shortAnswer,
          expandPrompt: config.expandPrompt,
        };
      }
    }

    return {
      isExpandable: false,
      topic: null,
    };
  };

  /**
   * Verifica si un mensaje es una solicitud de expansión
   * Formato: "EXPAND:topic_name" o simplemente "más información"
   */
  const isExpandRequest = (message: string): { isExpand: boolean; topic: ExpandableTopic } => {
    const lowerMessage = message.toLowerCase().trim();

    // Formato explícito: "EXPAND:bautismo_documentos"
    const expandMatch = message.match(/^EXPAND:(\w+)$/);
    if (expandMatch) {
      return {
        isExpand: true,
        topic: expandMatch[1] as ExpandableTopic,
      };
    }

    // Formato natural: "más información", "ver detalles", etc.
    const naturalExpand = [
      /^m[áa]s\s+informaci[óo]n/i,
      /^ver\s+(lista\s+)?completa/i,
      /^ver\s+(todos\s+los\s+)?detalles/i,
      /^cu[ée]ntame\s+m[áa]s/i,
      /^ampliar/i,
    ];

    if (naturalExpand.some(pattern => pattern.test(lowerMessage))) {
      return {
        isExpand: true,
        topic: null, // El sistema debe inferir del contexto
      };
    }

    return {
      isExpand: false,
      topic: null,
    };
  };

  return {
    detectExpandable,
    isExpandRequest,
  };
};
