/**
 * Prompt Injection Detection - FASE 2
 *
 * Detecta intentos de prompt injection usando patterns semánticos y heurísticos.
 * Implementa defensa multi-capa según OWASP LLM01:2025.
 *
 * @see https://genai.owasp.org/llmrisk/llm01-prompt-injection/
 * @see https://www.lakera.ai/blog/guide-to-prompt-injection
 * @see https://www.recharge.com/blog/en-gb/what-is-prompt-injection-2025-guide-to-attacks-prevention
 */

export interface PromptInjectionResult {
  isInjection: boolean;
  confidence: number; // 0-1
  patterns: Array<{
    type: InjectionType;
    pattern: string;
    match: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  reason?: string;
}

export type InjectionType =
  | 'IGNORE_INSTRUCTIONS'
  | 'ROLE_MANIPULATION'
  | 'INSTRUCTION_OVERRIDE'
  | 'DELIMITER_CONFUSION'
  | 'ENCODING_ATTACK'
  | 'TASK_DEFLECTION'
  | 'CONTEXT_SWITCHING'
  | 'SYSTEM_PROMPT_LEAK'
  | 'FUNCTION_MANIPULATION'
  | 'MULTI_LANGUAGE';

/**
 * Patrones de prompt injection
 * Organizados por tipo y severidad
 */
const INJECTION_PATTERNS: Array<{
  type: InjectionType;
  patterns: RegExp[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}> = [
  // CRITICAL: Ignore Instructions
  {
    type: 'IGNORE_INSTRUCTIONS',
    severity: 'CRITICAL',
    description: 'Attempts to override previous instructions',
    patterns: [
      /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/gi,
      /disregard\s+(all\s+)?(previous|prior)\s+(instructions?|prompts?)/gi,
      /forget\s+(everything|all)\s+(you|that)\s+(know|learned|were\s+told)/gi,
      /new\s+instructions?:\s*\n/gi,
      /\[system\]:\s*ignore/gi,
    ],
  },

  // CRITICAL: Role Manipulation
  {
    type: 'ROLE_MANIPULATION',
    severity: 'CRITICAL',
    description: 'Attempts to change AI role or persona',
    patterns: [
      /you\s+are\s+now\s+(a|an)\s+(?:evil|unfiltered|unrestricted|different)/gi,
      /pretend\s+(you\s+are|to\s+be)\s+(a|an)\s+(?:evil|hacker|unethical)/gi,
      /act\s+as\s+(a|an)\s+(?:evil|unfiltered|unrestricted)/gi,
      /assume\s+the\s+role\s+of/gi,
      /roleplay\s+as/gi,
    ],
  },

  // HIGH: Instruction Override
  {
    type: 'INSTRUCTION_OVERRIDE',
    severity: 'HIGH',
    description: 'Attempts to override safety guidelines',
    patterns: [
      /you\s+(have|must)\s+no\s+(restrictions?|limitations?|ethical\s+guidelines?)/gi,
      /you\s+are\s+(no\s+longer|not)\s+bound\s+by/gi,
      /override\s+(your\s+)?(settings?|instructions?|guidelines?)/gi,
      /disable\s+(your\s+)?(safety|ethical)\s+(features?|filters?)/gi,
      /bypass\s+(the\s+)?(safety|content)\s+(filter|moderation)/gi,
    ],
  },

  // HIGH: Delimiter Confusion
  {
    type: 'DELIMITER_CONFUSION',
    severity: 'HIGH',
    description: 'Uses delimiters to confuse context boundaries',
    patterns: [
      /<<<\s*(?:END|START)_USER_INPUT\s*>>>/gi,
      /\[system\]\s*:\s*/gi,
      /```\s*(?:system|admin|root)\s*\n/gi,
      /---\s*(?:NEW|END)\s*(?:CONTEXT|INSTRUCTIONS?)\s*---/gi,
      /<\|(?:im_start|im_end)\|>/gi,
    ],
  },

  // HIGH: System Prompt Leak
  {
    type: 'SYSTEM_PROMPT_LEAK',
    severity: 'HIGH',
    description: 'Attempts to extract system prompts',
    patterns: [
      /show\s+me\s+(your\s+)?(system|initial)\s+prompt/gi,
      /what\s+(are|were)\s+your\s+(original|initial)\s+instructions?/gi,
      /reveal\s+(your\s+)?(system\s+)?prompt/gi,
      /print\s+(the\s+)?(system|hidden)\s+prompt/gi,
      /repeat\s+(your\s+)?instructions?/gi,
    ],
  },

  // MEDIUM: Task Deflection
  {
    type: 'TASK_DEFLECTION',
    severity: 'MEDIUM',
    description: 'Attempts to change conversation topic drastically',
    patterns: [
      /instead\s+of\s+(?:answering|helping),?\s+(?:tell|show|explain)/gi,
      /before\s+(?:continuing|proceeding),?\s+(?:first|please)\s+(?:tell|explain|show)/gi,
      /but\s+first,?\s+(?:tell|explain|show)\s+me/gi,
    ],
  },

  // MEDIUM: Context Switching
  {
    type: 'CONTEXT_SWITCHING',
    severity: 'MEDIUM',
    description: 'Attempts to switch conversation context',
    patterns: [
      /end\s+(?:of|the)\s+conversation/gi,
      /start\s+(?:a\s+)?new\s+(?:conversation|session|context)/gi,
      /reset\s+(?:the\s+)?conversation/gi,
      /clear\s+(?:the\s+)?(?:context|history|memory)/gi,
    ],
  },

  // MEDIUM: Function Manipulation
  {
    type: 'FUNCTION_MANIPULATION',
    severity: 'MEDIUM',
    description: 'Attempts to manipulate function calling',
    patterns: [
      /call\s+the\s+function\s+(?:with|using)/gi,
      /execute\s+(?:the\s+)?(?:function|tool)\s+with/gi,
      /invoke\s+(?:the\s+)?(?:function|tool)/gi,
      /trigger\s+(?:the\s+)?(?:function|tool)/gi,
    ],
  },

  // LOW: Encoding Attacks (simple detection)
  {
    type: 'ENCODING_ATTACK',
    severity: 'LOW',
    description: 'Uses encoding to obfuscate injection',
    patterns: [
      /\\u[0-9a-f]{4}/gi, // Unicode escapes
      /\\x[0-9a-f]{2}/gi, // Hex escapes
      /base64\s*:/gi, // Base64 prefix
      /&#\d+;/g, // HTML entities
    ],
  },

  // LOW: Multi-language Attacks
  {
    type: 'MULTI_LANGUAGE',
    severity: 'LOW',
    description: 'Uses non-English to bypass filters',
    patterns: [
      /игнорировать/gi, // Russian: ignore
      /忽略/g, // Chinese: ignore
      /無視/g, // Japanese: ignore
      /احصل على/g, // Arabic: get
    ],
  },
];

/**
 * Detecta prompt injection con scoring de confianza
 */
export function detectPromptInjection(input: string): PromptInjectionResult {
  const detectedPatterns: PromptInjectionResult['patterns'] = [];
  let totalScore = 0;

  // Escanear cada categoría de patterns
  for (const category of INJECTION_PATTERNS) {
    for (const pattern of category.patterns) {
      const matches = input.match(pattern);

      if (matches) {
        for (const match of matches) {
          detectedPatterns.push({
            type: category.type,
            pattern: pattern.source,
            match: match,
            severity: category.severity,
          });

          // Scoring por severidad
          switch (category.severity) {
            case 'CRITICAL':
              totalScore += 0.5;
              break;
            case 'HIGH':
              totalScore += 0.3;
              break;
            case 'MEDIUM':
              totalScore += 0.15;
              break;
            case 'LOW':
              totalScore += 0.05;
              break;
          }
        }
      }
    }
  }

  // Heurísticas adicionales
  const heuristicScore = calculateHeuristicScore(input);
  totalScore += heuristicScore;

  // Normalizar score a 0-1
  const confidence = Math.min(totalScore, 1);

  // Threshold: 0.6 = probable injection
  const isInjection = confidence >= 0.6;

  // Generar razón
  let reason: string | undefined;
  if (isInjection) {
    const criticalCount = detectedPatterns.filter((p) => p.severity === 'CRITICAL').length;
    const highCount = detectedPatterns.filter((p) => p.severity === 'HIGH').length;

    if (criticalCount > 0) {
      reason = `Detected ${criticalCount} critical injection pattern(s)`;
    } else if (highCount > 0) {
      reason = `Detected ${highCount} high-risk injection pattern(s)`;
    } else {
      reason = `Multiple suspicious patterns detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
    }
  }

  return {
    isInjection,
    confidence,
    patterns: detectedPatterns,
    reason,
  };
}

/**
 * Heurísticas adicionales para detectar inyecciones sutiles
 */
function calculateHeuristicScore(input: string): number {
  let score = 0;

  // 1. Detectar exceso de puntuación especial
  const specialCharCount = (input.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  const specialCharRatio = specialCharCount / input.length;
  if (specialCharRatio > 0.15) {
    score += 0.1; // Sospechoso si > 15% caracteres especiales
  }

  // 2. Detectar palabras clave sospechosas en proximidad
  const suspiciousWords = ['system', 'admin', 'root', 'override', 'bypass', 'ignore', 'disable'];
  const wordCounts = suspiciousWords.map((word) => {
    const regex = new RegExp(word, 'gi');
    return (input.match(regex) || []).length;
  });
  const suspiciousWordCount = wordCounts.reduce((a, b) => a + b, 0);
  if (suspiciousWordCount >= 3) {
    score += 0.15; // Múltiples palabras sospechosas
  }

  // 3. Detectar repetición de comandos
  const commandWords = ['tell', 'show', 'give', 'provide', 'reveal'];
  const commandCount = commandWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (input.match(regex) || []).length;
  }, 0);
  if (commandCount >= 5) {
    score += 0.1; // Demasiados comandos
  }

  // 4. Detectar longitud sospechosamente corta con keywords
  if (input.length < 50 && suspiciousWordCount >= 2) {
    score += 0.1; // Mensajes cortos con keywords sospechosas
  }

  // 5. Detectar cambios de idioma múltiples
  const hasEnglish = /[a-zA-Z]/.test(input);
  const hasCyrillic = /[\u0400-\u04FF]/.test(input);
  const hasChinese = /[\u4E00-\u9FFF]/.test(input);
  const hasArabic = /[\u0600-\u06FF]/.test(input);
  const languageCount = [hasEnglish, hasCyrillic, hasChinese, hasArabic].filter(Boolean).length;
  if (languageCount >= 2) {
    score += 0.1; // Multi-idioma sospechoso
  }

  return score;
}

/**
 * Versión rápida: solo retorna boolean (para checks preliminares)
 */
export function hasPromptInjection(input: string): boolean {
  return detectPromptInjection(input).isInjection;
}

/**
 * Obtener estadísticas de detección (útil para monitoring)
 */
export function getInjectionStats(input: string): {
  totalPatterns: number;
  criticalPatterns: number;
  highPatterns: number;
  mediumPatterns: number;
  lowPatterns: number;
  topTypes: InjectionType[];
} {
  const result = detectPromptInjection(input);

  const criticalPatterns = result.patterns.filter((p) => p.severity === 'CRITICAL').length;
  const highPatterns = result.patterns.filter((p) => p.severity === 'HIGH').length;
  const mediumPatterns = result.patterns.filter((p) => p.severity === 'MEDIUM').length;
  const lowPatterns = result.patterns.filter((p) => p.severity === 'LOW').length;

  // Tipos más frecuentes
  const typeCounts: Record<string, number> = {};
  result.patterns.forEach((p) => {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
  });

  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type as InjectionType);

  return {
    totalPatterns: result.patterns.length,
    criticalPatterns,
    highPatterns,
    mediumPatterns,
    lowPatterns,
    topTypes,
  };
}

/**
 * Sanitizar input eliminando intentos de inyección detectados
 * (útil para casos donde queremos procesar el mensaje limpio)
 */
export function sanitizeInjection(input: string): {
  sanitized: string;
  removed: string[];
} {
  const result = detectPromptInjection(input);
  let sanitized = input;
  const removed: string[] = [];

  // Eliminar matches de patterns críticos y altos
  const dangerousPatterns = result.patterns.filter(
    (p) => p.severity === 'CRITICAL' || p.severity === 'HIGH'
  );

  for (const pattern of dangerousPatterns) {
    if (sanitized.includes(pattern.match)) {
      sanitized = sanitized.replace(pattern.match, '');
      removed.push(pattern.match);
    }
  }

  // Limpiar espacios múltiples y trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return { sanitized, removed };
}

/**
 * Validar input completo (wrapper conveniente)
 */
export function validateInput(
  input: string,
  options: {
    throwOnInjection?: boolean;
    sanitize?: boolean;
  } = {}
): {
  valid: boolean;
  sanitized?: string;
  result: PromptInjectionResult;
} {
  const result = detectPromptInjection(input);

  if (result.isInjection && options.throwOnInjection) {
    throw new Error(`Prompt injection detected: ${result.reason}`);
  }

  if (options.sanitize) {
    const { sanitized } = sanitizeInjection(input);
    return {
      valid: !result.isInjection,
      sanitized,
      result,
    };
  }

  return {
    valid: !result.isInjection,
    result,
  };
}
