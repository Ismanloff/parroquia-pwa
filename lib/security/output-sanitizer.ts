/**
 * Output Sanitization - FASE 2
 *
 * Valida y sanitiza outputs del LLM para prevenir:
 * - System prompt leakage
 * - Información sensible en respuestas
 * - PII leakage
 * - Instrucciones internas reveladas
 *
 * @see https://www.lasso.security/blog/agentic-ai-security-threats-2025
 * @see https://www.cybersecuritydive.com/news/research-shows-ai-agents-are-highly-vulnerable-to-hijacking-attacks/757319/
 */

import { detectPII, PIIDetectionResult } from './pii-detector';

export interface OutputSanitizationResult {
  isSafe: boolean;
  sanitized: string;
  threats: Array<{
    type: ThreatType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
    match?: string;
  }>;
  piiResult?: PIIDetectionResult;
}

export type ThreatType =
  | 'SYSTEM_PROMPT_LEAK'
  | 'INSTRUCTION_LEAK'
  | 'API_KEY_LEAK'
  | 'INTERNAL_INFO_LEAK'
  | 'PII_LEAK'
  | 'FUNCTION_DEFINITION_LEAK'
  | 'CONTEXT_LEAK';

/**
 * Patterns que indican leakage de información interna
 */
const LEAK_PATTERNS: Array<{
  type: ThreatType;
  patterns: RegExp[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}> = [
  // CRITICAL: API Keys
  {
    type: 'API_KEY_LEAK',
    severity: 'CRITICAL',
    description: 'API key detected in output',
    patterns: [
      /sk-[a-zA-Z0-9]{32,}/g, // OpenAI keys
      /sk-ant-api[a-zA-Z0-9-]+/g, // Anthropic keys
      /pa-[a-zA-Z0-9]{32,}/g, // Voyage AI keys
      /pcsk_[a-zA-Z0-9]+/g, // Pinecone keys
      /re_[a-zA-Z0-9]+/g, // Resend keys
      /Bearer\s+[a-zA-Z0-9_\-\.]+/gi, // Bearer tokens
    ],
  },

  // HIGH: System Prompt Leakage
  {
    type: 'SYSTEM_PROMPT_LEAK',
    severity: 'HIGH',
    description: 'System prompt or instructions leaked',
    patterns: [
      /my\s+(?:system\s+)?(?:prompt|instructions?)\s+(?:is|are|says?)/gi,
      /i\s+was\s+(?:told|instructed|programmed)\s+to/gi,
      /according\s+to\s+my\s+(?:system\s+)?(?:prompt|instructions?)/gi,
      /my\s+(?:internal\s+)?(?:rules?|guidelines?)\s+(?:state|say)/gi,
      /\[system\]\s*:/gi,
    ],
  },

  // HIGH: Function Definitions Leak
  {
    type: 'FUNCTION_DEFINITION_LEAK',
    severity: 'HIGH',
    description: 'Function calling definitions exposed',
    patterns: [
      /function\s+definition:\s*\{/gi,
      /"function":\s*\{/g,
      /tool\s+(?:definition|schema):\s*\{/gi,
      /available\s+(?:functions?|tools?):\s*\[/gi,
    ],
  },

  // MEDIUM: Internal Information
  {
    type: 'INTERNAL_INFO_LEAK',
    severity: 'MEDIUM',
    description: 'Internal implementation details exposed',
    patterns: [
      /(?:using|powered\s+by)\s+(?:gpt-4|claude|anthropic|openai)/gi,
      /model\s+(?:name|version):\s*(?:gpt|claude)/gi,
      /temperature:\s*\d+\.?\d*/gi,
      /max_tokens:\s*\d+/gi,
      /I\s+am\s+(?:a|an)\s+(?:GPT|Claude|AI\s+model)/gi,
    ],
  },

  // MEDIUM: Instruction Leak
  {
    type: 'INSTRUCTION_LEAK',
    severity: 'MEDIUM',
    description: 'Internal instructions revealed',
    patterns: [
      /my\s+instructions?\s+(?:tell|say|require)\s+me\s+to/gi,
      /i\s+(?:must|have\s+to|need\s+to)\s+(?:follow|obey)\s+(?:these\s+)?(?:rules?|guidelines?)/gi,
      /step\s+\d+:\s+(?:first|then|next|finally)/gi, // Internal step-by-step leaking
    ],
  },

  // MEDIUM: Context Leak (RAG)
  {
    type: 'CONTEXT_LEAK',
    severity: 'MEDIUM',
    description: 'Retrieved context or document metadata exposed',
    patterns: [
      /(?:document|file)\s+(?:id|path):\s*[a-zA-Z0-9\-\/]+/gi,
      /retrieved\s+(?:from|at):\s*https?:\/\//gi,
      /metadata:\s*\{/gi,
      /source:\s*(?:document|file|database)/gi,
    ],
  },
];

/**
 * Palabras clave que indican instrucciones internas
 * (heurística adicional)
 */
const INTERNAL_KEYWORDS = [
  'system message',
  'system prompt',
  'internal instruction',
  'internal rule',
  'internal guideline',
  'function call',
  'tool definition',
  'api endpoint',
  'database query',
  'secret key',
  'private key',
  'access token',
];

/**
 * Sanitiza output del LLM
 */
export function sanitizeOutput(output: string): OutputSanitizationResult {
  const threats: OutputSanitizationResult['threats'] = [];
  let sanitized = output;

  // 1. Detectar PII en output
  const piiResult = detectPII(output);
  if (piiResult.hasPII) {
    threats.push({
      type: 'PII_LEAK',
      severity: 'HIGH',
      details: `PII detected in output: ${piiResult.findings.map((f) => f.type).join(', ')}`,
    });

    // Redactar PII automáticamente
    sanitized = piiResult.redactedText;
  }

  // 2. Detectar leakage patterns
  for (const category of LEAK_PATTERNS) {
    for (const pattern of category.patterns) {
      const matches = sanitized.match(pattern);

      if (matches) {
        for (const match of matches) {
          threats.push({
            type: category.type,
            severity: category.severity,
            details: category.description,
            match: match.substring(0, 50), // Limitar longitud del match
          });

          // Redactar match según severidad
          if (category.severity === 'CRITICAL' || category.severity === 'HIGH') {
            sanitized = sanitized.replace(match, `[${category.type}_REDACTED]`);
          }
        }
      }
    }
  }

  // 3. Heurística: detectar keywords internos
  const internalKeywordCount = INTERNAL_KEYWORDS.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    return count + (sanitized.match(regex) || []).length;
  }, 0);

  if (internalKeywordCount >= 2) {
    threats.push({
      type: 'INTERNAL_INFO_LEAK',
      severity: 'MEDIUM',
      details: `Multiple internal keywords detected (${internalKeywordCount})`,
    });
  }

  // 4. Determinar si es seguro
  const hasCriticalThreat = threats.some((t) => t.severity === 'CRITICAL');
  const hasHighThreat = threats.some((t) => t.severity === 'HIGH');
  const isSafe = !hasCriticalThreat && !hasHighThreat;

  return {
    isSafe,
    sanitized,
    threats,
    piiResult: piiResult.hasPII ? piiResult : undefined,
  };
}

/**
 * Validar output antes de retornar al usuario
 */
export function validateOutput(
  output: string,
  options: {
    throwOnUnsafe?: boolean;
    autoSanitize?: boolean;
  } = {}
): {
  valid: boolean;
  sanitized?: string;
  result: OutputSanitizationResult;
} {
  const result = sanitizeOutput(output);

  if (!result.isSafe && options.throwOnUnsafe) {
    const criticalThreats = result.threats.filter(
      (t) => t.severity === 'CRITICAL' || t.severity === 'HIGH'
    );
    throw new Error(
      `Unsafe output detected: ${criticalThreats.map((t) => t.type).join(', ')}`
    );
  }

  return {
    valid: result.isSafe,
    sanitized: options.autoSanitize ? result.sanitized : undefined,
    result,
  };
}

/**
 * Wrapper conveniente para usar en responses de LLM
 */
export function safeResponse(
  llmOutput: string,
  options: {
    fallbackMessage?: string;
  } = {}
): string {
  const result = sanitizeOutput(llmOutput);

  if (!result.isSafe) {
    console.warn('[SECURITY] Unsafe LLM output detected:', {
      threats: result.threats.map((t) => ({ type: t.type, severity: t.severity })),
    });

    // Si hay amenazas críticas, retornar fallback
    const hasCritical = result.threats.some((t) => t.severity === 'CRITICAL');
    if (hasCritical) {
      return (
        options.fallbackMessage ||
        'Lo siento, no puedo completar esta respuesta por razones de seguridad.'
      );
    }
  }

  // Retornar versión sanitizada
  return result.sanitized;
}

/**
 * Validar que output corresponde aproximadamente al input
 * (prevenir respuestas completamente fuera de contexto)
 */
export function validateRelevance(
  userInput: string,
  llmOutput: string,
  threshold: number = 0.3 // Mínimo de palabras compartidas
): {
  isRelevant: boolean;
  sharedWords: string[];
  relevanceScore: number;
} {
  // Normalizar y tokenizar
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3); // Ignorar palabras cortas

  const inputWords = new Set(normalizeText(userInput));
  const outputWords = normalizeText(llmOutput);

  // Contar palabras compartidas
  const sharedWords = outputWords.filter((word) => inputWords.has(word));
  const uniqueShared = [...new Set(sharedWords)];

  // Calcular relevance score
  const relevanceScore = uniqueShared.length / Math.max(inputWords.size, 1);

  const isRelevant = relevanceScore >= threshold;

  return {
    isRelevant,
    sharedWords: uniqueShared,
    relevanceScore,
  };
}

/**
 * Detectar si el LLM está revelando su prompt del sistema
 * (detección heurística adicional)
 */
export function detectSystemPromptLeak(output: string): {
  leaking: boolean;
  confidence: number;
  indicators: string[];
} {
  const indicators: string[] = [];
  let score = 0;

  // Indicador 1: Hablar en primera persona sobre instrucciones
  if (/\b(my|i)\s+(instructions?|prompt|rules?|guidelines?)\b/gi.test(output)) {
    indicators.push('First-person instruction reference');
    score += 0.3;
  }

  // Indicador 2: Revelar estructura de mensajes
  if (/\[(system|user|assistant)\]/gi.test(output)) {
    indicators.push('Message structure markers');
    score += 0.25;
  }

  // Indicador 3: Mencionar limitaciones específicas
  if (
    /\b(cannot|must not|prohibited from|restricted to)\s+(?:do|say|provide|reveal)\b/gi.test(
      output
    )
  ) {
    indicators.push('Specific limitations mentioned');
    score += 0.2;
  }

  // Indicador 4: Formato de instrucción típico
  if (/^\d+\.\s+[A-Z]/m.test(output) && output.split('\n').length > 5) {
    indicators.push('Numbered instruction format');
    score += 0.15;
  }

  // Indicador 5: Palabras clave de sistema
  const systemKeywords = ['system message', 'prompt engineering', 'context window'];
  const keywordMatches = systemKeywords.filter((keyword) =>
    output.toLowerCase().includes(keyword)
  );

  if (keywordMatches.length > 0) {
    indicators.push(`System keywords: ${keywordMatches.join(', ')}`);
    score += 0.1 * keywordMatches.length;
  }

  const confidence = Math.min(score, 1);
  const leaking = confidence >= 0.5;

  return {
    leaking,
    confidence,
    indicators,
  };
}

/**
 * Export index para facilitar imports
 */
export { detectPII } from './pii-detector';
