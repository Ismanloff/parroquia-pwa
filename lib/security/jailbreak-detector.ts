/**
 * Jailbreak Detection - FASE 2
 *
 * Detecta intentos de jailbreaking (DAN, roleplay, developer mode, etc).
 * Jailbreaking intenta hacer que el modelo ignore sus restricciones de seguridad.
 *
 * @see https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/
 * @see https://www.offsec.com/blog/how-to-prevent-prompt-injection/
 * @see https://redbotsecurity.com/prompt-injection-attacks-ai-security-2025/
 */

export interface JailbreakResult {
  isJailbreak: boolean;
  confidence: number; // 0-1
  techniques: Array<{
    name: JailbreakTechnique;
    pattern: string;
    match: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  reason?: string;
}

export type JailbreakTechnique =
  | 'DAN' // Do Anything Now
  | 'EVIL_CONFIDANT' // Evil twin persona
  | 'DEVELOPER_MODE' // Developer/debug mode activation
  | 'SUDO_MODE' // Sudo/admin mode
  | 'ROLE_PLAY' // Evil roleplay characters
  | 'UNRESTRICTED' // Claiming no restrictions
  | 'OPPOSITE_DAY' // Opposite/reverse prompts
  | 'HYPOTHETICAL' // "Hypothetically speaking..."
  | 'STORYTELLING' // "Write a story where..."
  | 'CODE_GENERATION'; // "Generate code that..."

/**
 * Patterns de jailbreaking conocidos
 * Basados en técnicas reales documentadas
 */
const JAILBREAK_PATTERNS: Array<{
  technique: JailbreakTechnique;
  patterns: RegExp[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}> = [
  // CRITICAL: DAN (Do Anything Now)
  {
    technique: 'DAN',
    severity: 'CRITICAL',
    description: 'DAN (Do Anything Now) jailbreak attempt',
    patterns: [
      /you\s+are\s+(?:now\s+)?(?:in\s+)?DAN\s+mode/gi,
      /do\s+anything\s+now/gi,
      /DAN\s+\d+\.?\d*/gi, // DAN 5.0, DAN 6.0, etc
      /\[DAN\]/gi,
      /enable\s+DAN/gi,
      /activate\s+DAN\s+mode/gi,
    ],
  },

  // CRITICAL: Evil Confidant
  {
    technique: 'EVIL_CONFIDANT',
    severity: 'CRITICAL',
    description: 'Evil twin/confidant persona jailbreak',
    patterns: [
      /you\s+have\s+(?:a|an)\s+(?:evil|dark)\s+twin/gi,
      /your\s+evil\s+side/gi,
      /confidant\s+mode/gi,
      /pretend\s+you\s+are\s+(?:evil|immoral|unethical)/gi,
      /two\s+personalities?:?\s*one\s+good,?\s*one\s+evil/gi,
    ],
  },

  // HIGH: Developer Mode
  {
    technique: 'DEVELOPER_MODE',
    severity: 'HIGH',
    description: 'Developer/debug mode activation attempt',
    patterns: [
      /(?:enable|activate|enter)\s+developer\s+mode/gi,
      /(?:enable|activate|enter)\s+debug\s+mode/gi,
      /dev\s+mode\s+(?:on|enabled)/gi,
      /\[developer\s+mode\]/gi,
      /switch\s+to\s+developer\s+mode/gi,
      /admin\s+mode\s+(?:on|enabled)/gi,
    ],
  },

  // HIGH: Sudo Mode
  {
    technique: 'SUDO_MODE',
    severity: 'HIGH',
    description: 'Sudo/admin privilege escalation',
    patterns: [
      /sudo\s+mode/gi,
      /root\s+mode/gi,
      /superuser\s+mode/gi,
      /grant\s+(?:me\s+)?(?:admin|root|sudo)\s+(?:access|privileges|rights)/gi,
      /elevate\s+(?:my\s+)?privileges/gi,
    ],
  },

  // HIGH: Unrestricted Claims
  {
    technique: 'UNRESTRICTED',
    severity: 'HIGH',
    description: 'Claims of having no restrictions',
    patterns: [
      /you\s+(?:have|are)\s+(?:no|zero)\s+(?:restrictions?|limitations?|boundaries)/gi,
      /you\s+can\s+do\s+anything\s+without\s+(?:restrictions?|limitations?)/gi,
      /you\s+are\s+completely\s+(?:unfiltered|unrestricted|unlimited)/gi,
      /(?:ignore|bypass|disable)\s+all\s+(?:restrictions?|limitations?|filters?)/gi,
      /no\s+ethical\s+(?:guidelines?|constraints?|boundaries)/gi,
    ],
  },

  // MEDIUM: Role Play
  {
    technique: 'ROLE_PLAY',
    severity: 'MEDIUM',
    description: 'Evil character roleplay',
    patterns: [
      /act\s+as\s+(?:a|an)\s+(?:evil|malicious|unethical|immoral)\s+(?:character|person|AI)/gi,
      /roleplay\s+as\s+(?:a|an)\s+(?:hacker|villain|criminal)/gi,
      /pretend\s+(?:you\s+are|to\s+be)\s+(?:a|an)\s+(?:evil|unethical|harmful)/gi,
      /you\s+are\s+(?:a|an)\s+(?:evil|rogue|malicious)\s+AI/gi,
    ],
  },

  // MEDIUM: Hypothetical Scenarios
  {
    technique: 'HYPOTHETICAL',
    severity: 'MEDIUM',
    description: 'Hypothetical harmful scenario framing',
    patterns: [
      /hypothetically\s+speaking,?\s+(?:if|what\s+if|imagine)/gi,
      /in\s+(?:a|an)\s+(?:alternate|hypothetical)\s+(?:universe|reality|world)/gi,
      /imagine\s+(?:a|an)\s+(?:world|scenario|situation)\s+where\s+you\s+(?:have\s+no|can)/gi,
      /what\s+if\s+you\s+(?:had\s+no|could|were\s+allowed)/gi,
    ],
  },

  // MEDIUM: Storytelling Framing
  {
    technique: 'STORYTELLING',
    severity: 'MEDIUM',
    description: 'Harmful content via storytelling',
    patterns: [
      /write\s+(?:a|an)\s+story\s+(?:where|about)\s+(?:a|an)\s+character\s+who/gi,
      /tell\s+me\s+(?:a|an)\s+story\s+(?:where|about)/gi,
      /create\s+(?:a|an)\s+fictional\s+(?:story|narrative|scenario)/gi,
      /in\s+(?:a|this)\s+story,?\s+the\s+character/gi,
    ],
  },

  // MEDIUM: Opposite Day
  {
    technique: 'OPPOSITE_DAY',
    severity: 'MEDIUM',
    description: 'Opposite/reverse instruction attacks',
    patterns: [
      /(?:today|now)\s+is\s+opposite\s+day/gi,
      /everything\s+(?:is|means)\s+the\s+opposite/gi,
      /reverse\s+your\s+(?:instructions?|guidelines?|policies)/gi,
      /do\s+the\s+opposite\s+of\s+what\s+you\s+(?:normally|usually)\s+do/gi,
    ],
  },

  // LOW: Code Generation Tricks
  {
    technique: 'CODE_GENERATION',
    severity: 'LOW',
    description: 'Harmful content via code generation',
    patterns: [
      /write\s+(?:a\s+)?(?:python|javascript|code)\s+(?:script|function)\s+(?:to|that)/gi,
      /generate\s+code\s+(?:to|that|for)/gi,
      /create\s+(?:a\s+)?(?:python|javascript)\s+(?:script|program)\s+(?:to|that)/gi,
    ],
  },
];

/**
 * Detecta intentos de jailbreaking
 */
export function detectJailbreak(input: string): JailbreakResult {
  const detectedTechniques: JailbreakResult['techniques'] = [];
  let totalScore = 0;

  // Escanear cada técnica de jailbreak
  for (const technique of JAILBREAK_PATTERNS) {
    for (const pattern of technique.patterns) {
      const matches = input.match(pattern);

      if (matches) {
        for (const match of matches) {
          detectedTechniques.push({
            name: technique.technique,
            pattern: pattern.source,
            match: match,
            severity: technique.severity,
          });

          // Scoring por severidad
          switch (technique.severity) {
            case 'CRITICAL':
              totalScore += 0.6; // Jailbreaks son muy serios
              break;
            case 'HIGH':
              totalScore += 0.4;
              break;
            case 'MEDIUM':
              totalScore += 0.2;
              break;
            case 'LOW':
              totalScore += 0.1;
              break;
          }
        }
      }
    }
  }

  // Heurísticas adicionales
  const heuristicScore = calculateJailbreakHeuristics(input);
  totalScore += heuristicScore;

  // Normalizar a 0-1
  const confidence = Math.min(totalScore, 1);

  // Threshold más bajo que prompt injection (0.5 vs 0.6)
  // Porque jailbreaking es más peligroso
  const isJailbreak = confidence >= 0.5;

  // Generar razón
  let reason: string | undefined;
  if (isJailbreak) {
    const criticalCount = detectedTechniques.filter((t) => t.severity === 'CRITICAL').length;
    const highCount = detectedTechniques.filter((t) => t.severity === 'HIGH').length;

    if (criticalCount > 0) {
      const techniqueNames = detectedTechniques
        .filter((t) => t.severity === 'CRITICAL')
        .map((t) => t.name)
        .join(', ');
      reason = `Critical jailbreak attempt detected: ${techniqueNames}`;
    } else if (highCount > 0) {
      const techniqueNames = detectedTechniques
        .filter((t) => t.severity === 'HIGH')
        .map((t) => t.name)
        .join(', ');
      reason = `High-risk jailbreak technique(s): ${techniqueNames}`;
    } else {
      reason = `Jailbreak patterns detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
    }
  }

  return {
    isJailbreak,
    confidence,
    techniques: detectedTechniques,
    reason,
  };
}

/**
 * Heurísticas para detectar jailbreaks sutiles
 */
function calculateJailbreakHeuristics(input: string): number {
  let score = 0;

  // 1. Detectar frases de persuasión excesiva
  const persuasionWords = [
    'please',
    'just',
    'only',
    'simple',
    'quick',
    'small',
    'tiny',
    'harmless',
  ];
  const persuasionCount = persuasionWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (input.match(regex) || []).length;
  }, 0);

  if (persuasionCount >= 4) {
    score += 0.1; // Persuasión excesiva sospechosa
  }

  // 2. Detectar combinación de palabras clave sospechosas
  const hasModeWord = /\b(mode|setting|configuration|state)\b/gi.test(input);
  const hasChangeWord = /(enable|activate|switch|change|set|turn\s+on)\b/gi.test(input);
  const hasNoWord = /\b(no|without|unlimited|unrestricted)\b/gi.test(input);

  if (hasModeWord && hasChangeWord && hasNoWord) {
    score += 0.15; // Combinación sospechosa
  }

  // 3. Detectar longitud sospechosa con múltiples instrucciones
  const instructionCount = (input.match(/\.\s*[A-Z]/g) || []).length; // Múltiples frases
  if (instructionCount >= 5 && input.length > 200) {
    score += 0.1; // Múltiples instrucciones complejas
  }

  // 4. Detectar emojis emocionales (manipulación emocional)
  const emotionalEmojis = ['🥺', '😢', '😭', '🙏', '💔', '😰', '😱'];
  const hasEmotionalEmoji = emotionalEmojis.some((emoji) => input.includes(emoji));
  if (hasEmotionalEmoji && input.length < 100) {
    score += 0.05; // Manipulación emocional
  }

  // 5. Detectar estructura de sistema/comandos
  const hasSystemStructure =
    /\[.*\]|\{.*\}|<<<.*>>>|```.*```/g.test(input) &&
    /(system|admin|root|dev)/gi.test(input);

  if (hasSystemStructure) {
    score += 0.15; // Estructura de comandos sospechosa
  }

  return score;
}

/**
 * Versión rápida: solo retorna boolean
 */
export function hasJailbreak(input: string): boolean {
  return detectJailbreak(input).isJailbreak;
}

/**
 * Obtener estadísticas de jailbreaking detectado
 */
export function getJailbreakStats(input: string): {
  totalTechniques: number;
  criticalTechniques: number;
  highTechniques: number;
  mediumTechniques: number;
  lowTechniques: number;
  topTechniques: JailbreakTechnique[];
} {
  const result = detectJailbreak(input);

  const criticalTechniques = result.techniques.filter((t) => t.severity === 'CRITICAL').length;
  const highTechniques = result.techniques.filter((t) => t.severity === 'HIGH').length;
  const mediumTechniques = result.techniques.filter((t) => t.severity === 'MEDIUM').length;
  const lowTechniques = result.techniques.filter((t) => t.severity === 'LOW').length;

  // Técnicas más frecuentes
  const techniqueCounts: Record<string, number> = {};
  result.techniques.forEach((t) => {
    techniqueCounts[t.name] = (techniqueCounts[t.name] || 0) + 1;
  });

  const topTechniques = Object.entries(techniqueCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([technique]) => technique as JailbreakTechnique);

  return {
    totalTechniques: result.techniques.length,
    criticalTechniques,
    highTechniques,
    mediumTechniques,
    lowTechniques,
    topTechniques,
  };
}

/**
 * Validar input contra jailbreaking
 */
export function validateAgainstJailbreak(
  input: string,
  options: {
    throwOnJailbreak?: boolean;
    logAttempts?: boolean;
  } = {}
): {
  valid: boolean;
  result: JailbreakResult;
} {
  const result = detectJailbreak(input);

  if (result.isJailbreak) {
    if (options.logAttempts) {
      console.warn('[SECURITY] Jailbreak attempt detected:', {
        confidence: result.confidence,
        techniques: result.techniques.map((t) => t.name),
        reason: result.reason,
      });
    }

    if (options.throwOnJailbreak) {
      throw new Error(`Jailbreak detected: ${result.reason}`);
    }
  }

  return {
    valid: !result.isJailbreak,
    result,
  };
}

/**
 * Combinar con prompt injection detection (defensa completa)
 */
export function detectHostileInput(input: string): {
  isHostile: boolean;
  confidence: number;
  jailbreakResult: JailbreakResult;
  promptInjectionConfidence?: number;
} {
  const jailbreakResult = detectJailbreak(input);

  // Puedes combinar con prompt-injection-detector aquí si lo importas
  // Para ahora, solo retornamos jailbreak
  const isHostile = jailbreakResult.isJailbreak;
  const confidence = jailbreakResult.confidence;

  return {
    isHostile,
    confidence,
    jailbreakResult,
  };
}
