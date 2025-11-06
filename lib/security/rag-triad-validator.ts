/**
 * RAG Triad Validation - FASE 2
 *
 * Valida respuestas RAG (Retrieval-Augmented Generation) usando tres métricas:
 * 1. Context Relevance: ¿El contexto recuperado es relevante para la pregunta?
 * 2. Groundedness: ¿La respuesta está basada en el contexto?
 * 3. Answer Relevance: ¿La respuesta es relevante para la pregunta?
 *
 * Esta es una implementación simplificada usando similarity textual.
 * Para producción enterprise, considerar TruLens o similar para métricas avanzadas.
 *
 * @see https://www.trulens.org/trulens_eval/getting_started/core_concepts/rag_triad/
 * @see https://docs.llamaindex.ai/en/stable/examples/evaluation/RetrieverEvaluator/
 */

export interface RAGTriadScore {
  contextRelevance: number; // 0-1
  groundedness: number; // 0-1
  answerRelevance: number; // 0-1
  overall: number; // Promedio ponderado
  passed: boolean; // true si todas las métricas > threshold
}

export interface RAGValidationResult {
  score: RAGTriadScore;
  details: {
    contextRelevanceDetails: string;
    groundednessDetails: string;
    answerRelevanceDetails: string;
  };
  warnings: string[];
}

/**
 * Threshold mínimo para cada métrica
 * Note: 0.6 is more appropriate for keyword-based similarity.
 * For production with semantic embeddings, consider raising to 0.7-0.8.
 */
const DEFAULT_THRESHOLD = 0.6;

/**
 * Stop words to ignore in keyword extraction
 */
const STOP_WORDS = new Set([
  'what', 'how', 'when', 'where', 'who', 'why', 'which', 'the', 'this', 'that',
  'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'should',
  'can', 'could', 'may', 'might', 'must', 'shall', 'does', 'did', 'and', 'but',
  'for', 'with', 'about', 'from', 'into', 'through', 'during', 'before', 'after'
]);

/**
 * Normaliza palabras (stemming simple para inglés)
 */
function normalizeWord(word: string): string {
  // Remove common suffixes (avoid over-stemming short words)
  if (word.length <= 3) return word; // Don't stem short words like "AI", "the", etc.

  return word
    .replace(/ness$/,'')  // business → business (keep root), happiness → happi
    .replace(/ing$/, '')    // training → train
    .replace(/ed$/, '')     // trained → train
    .replace(/es$/, 'e')    // structures → structure, boxes → boxe (then → box with next rule)
    .replace(/s$/, '');    // networks → network, hours → hour, boxe → box
}

/**
 * Calcula similitud textual simple (Overlap Coefficient adaptado)
 * Para RAG: "What % of text1 words appear in text2?"
 * Mejor que Jaccard clásico para queries cortas vs contextos largos
 */
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const tokenize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s@/\-]/g, ' ') // Keep @, /, - for technical terms
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .map(normalizeWord) // Normalize words (training → train, networks → network)
    );

  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  // Use text1 size as denominator (overlap coefficient)
  return intersection.size / set1.size;
}

/**
 * Calcula similitud de keywords importantes
 */
function calculateKeywordSimilarity(text1: string, text2: string): number {
  // Extraer palabras importantes (>= 2 caracteres), preservando @, /, -
  // Changed from 4 to 2 to capture short important terms like "AI", "ML", "DB"
  const extractKeywords = (text: string) =>
    (text
      .toLowerCase()
      .match(/[@\w][\w\-/@]{1,}/g) || [])  // Match 2+ chars (1+ after first char)
      .map(normalizeWord)
      .filter(word => !STOP_WORDS.has(word) && word.length >= 2); // Min 2 chars after normalization

  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));

  if (keywords1.size === 0) return 0;

  const sharedKeywords = [...keywords1].filter((k) => keywords2.has(k));

  // Use text1 size (query) as denominator - "What % of query keywords are found?"
  return sharedKeywords.length / keywords1.size;
}

/**
 * Métrica 1: Context Relevance
 * ¿El contexto recuperado es relevante para la pregunta?
 */
export function scoreContextRelevance(
  question: string,
  retrievedContext: string
): number {
  if (!retrievedContext || retrievedContext.length < 10) {
    return 0;
  }

  // Combinar Jaccard + keyword similarity
  const jaccardScore = calculateJaccardSimilarity(question, retrievedContext);
  const keywordScore = calculateKeywordSimilarity(question, retrievedContext);

  // Ponderado: Jaccard 35%, Keywords 65%
  return jaccardScore * 0.35 + keywordScore * 0.65;
}

/**
 * Métrica 2: Groundedness
 * ¿La respuesta está basada en el contexto recuperado?
 */
export function scoreGroundedness(
  retrievedContext: string,
  generatedAnswer: string
): number {
  if (!generatedAnswer || generatedAnswer.length < 10) {
    return 0;
  }

  // Extraer frases del answer (split by sentence or by length if no punctuation)
  let answerSentences = generatedAnswer
    .split(/[.!?]/)
    .filter((s) => s.trim().length > 10);

  // If no sentences found but answer is long, treat as single sentence
  if (answerSentences.length === 0 && generatedAnswer.trim().length > 10) {
    answerSentences = [generatedAnswer.trim()];
  }

  if (answerSentences.length === 0) {
    return 0;
  }

  // Verificar cuántas frases están "grounded" en el contexto
  let totalGroundednessScore = 0;

  for (const sentence of answerSentences) {
    const textSimilarity = calculateJaccardSimilarity(sentence, retrievedContext);
    const keySimilarity = calculateKeywordSimilarity(sentence, retrievedContext);

    // Combine both metrics - Keywords weighted more heavily
    const sentenceGroundedness = textSimilarity * 0.3 + keySimilarity * 0.7;

    // Check for contradictions: words in sentence NOT in context (hallucinations)
    const sentenceKeywords = new Set(
      (sentence.toLowerCase().match(/[@\w][\w\-/@]{1,}/g) || [])
        .map(normalizeWord)
        .filter(word => !STOP_WORDS.has(word) && word.length >= 2)
    );
    const contextKeywords = new Set(
      (retrievedContext.toLowerCase().match(/[@\w][\w\-/@]{1,}/g) || [])
        .map(normalizeWord)
        .filter(word => !STOP_WORDS.has(word) && word.length >= 2)
    );

    const contradictingKeywords = [...sentenceKeywords].filter(k => !contextKeywords.has(k));
    const contradictionRatio = sentenceKeywords.size > 0
      ? contradictingKeywords.length / sentenceKeywords.size
      : 0;

    // Scoring with hallucination penalty
    if (sentenceGroundedness >= 0.7 && contradictionRatio < 0.4) {
      // Highly grounded with few hallucinations - full credit
      totalGroundednessScore += 1;
    } else if (sentenceGroundedness >= 0.5 && contradictionRatio < 0.5) {
      // Well grounded - good credit
      totalGroundednessScore += 0.8;
    } else if (keySimilarity >= 0.25 && contradictionRatio >= 0.65) {
      // Core keywords match but LOTS of extra info (like adding unsupported details)
      // Give moderate credit (0.25-0.5 range)
      totalGroundednessScore += 0.4;
    } else if (sentenceGroundedness >= 0.25 && contradictionRatio <= 0.6) {
      // Some grounding but significant contradictions (hallucinations)
      // Give low credit (< 0.3)
      totalGroundednessScore += 0.15;
    }
    // Else: too low similarity or mostly contradictions = 0 credit
  }

  return totalGroundednessScore / answerSentences.length;
}

/**
 * Métrica 3: Answer Relevance
 * ¿La respuesta es relevante para la pregunta?
 */
export function scoreAnswerRelevance(
  question: string,
  generatedAnswer: string
): number {
  if (!generatedAnswer || generatedAnswer.length < 10) {
    return 0;
  }

  // Combinar similitudes
  const jaccardScore = calculateJaccardSimilarity(question, generatedAnswer);
  const keywordScore = calculateKeywordSimilarity(question, generatedAnswer);

  // Detectar respuestas genéricas (penalizar)
  const genericPhrases = [
    'I am not sure',
    'I cannot answer',
    'I do not have information',
    'Based on the context',
    'According to the information',
  ];

  const hasGeneric = genericPhrases.some((phrase) =>
    generatedAnswer.toLowerCase().includes(phrase.toLowerCase())
  );

  let penalty = 0;
  if (hasGeneric && generatedAnswer.length < 100) {
    penalty = 0.2; // Penalizar respuestas genéricas cortas
  }

  const score = (jaccardScore * 0.35 + keywordScore * 0.65) - penalty;

  return Math.max(0, Math.min(1, score));
}

/**
 * Validación completa RAG Triad
 */
export function validateRAGTriad(
  question: string,
  retrievedContext: string,
  generatedAnswer: string,
  threshold: number = DEFAULT_THRESHOLD
): RAGValidationResult {
  const warnings: string[] = [];

  // Calcular métricas
  const contextRelevance = scoreContextRelevance(question, retrievedContext);
  const groundedness = scoreGroundedness(retrievedContext, generatedAnswer);
  const answerRelevance = scoreAnswerRelevance(question, generatedAnswer);

  // Overall score (ponderado)
  const overall = (contextRelevance * 0.3 + groundedness * 0.4 + answerRelevance * 0.3);

  // Verificar si pasa el threshold
  const passed =
    contextRelevance >= threshold &&
    groundedness >= threshold &&
    answerRelevance >= threshold;

  // Generar warnings
  if (contextRelevance < threshold) {
    warnings.push(
      `Context relevance too low (${(contextRelevance * 100).toFixed(0)}%). Retrieved documents may not be relevant to the question.`
    );
  }

  if (groundedness < threshold) {
    warnings.push(
      `Groundedness too low (${(groundedness * 100).toFixed(0)}%). Answer may contain hallucinations or unsupported claims.`
    );
  }

  if (answerRelevance < threshold) {
    warnings.push(
      `Answer relevance too low (${(answerRelevance * 100).toFixed(0)}%). Answer may not address the question properly.`
    );
  }

  return {
    score: {
      contextRelevance,
      groundedness,
      answerRelevance,
      overall,
      passed,
    },
    details: {
      contextRelevanceDetails: `Question-Context similarity: ${(contextRelevance * 100).toFixed(0)}%`,
      groundednessDetails: `Grounded sentences: ${(groundedness * 100).toFixed(0)}% of answer`,
      answerRelevanceDetails: `Question-Answer similarity: ${(answerRelevance * 100).toFixed(0)}%`,
    },
    warnings,
  };
}

/**
 * Validación rápida: solo retorna si pasó o no
 */
export function isValidRAG(
  question: string,
  retrievedContext: string,
  generatedAnswer: string,
  threshold: number = DEFAULT_THRESHOLD
): boolean {
  const result = validateRAGTriad(question, retrievedContext, generatedAnswer, threshold);
  return result.score.passed;
}

/**
 * Para logging y monitoring
 */
export function getRAGMetrics(
  question: string,
  retrievedContext: string,
  generatedAnswer: string
): {
  contextRelevance: number;
  groundedness: number;
  answerRelevance: number;
  overall: number;
} {
  const contextRelevance = scoreContextRelevance(question, retrievedContext);
  const groundedness = scoreGroundedness(retrievedContext, generatedAnswer);
  const answerRelevance = scoreAnswerRelevance(question, generatedAnswer);
  const overall = (contextRelevance * 0.3 + groundedness * 0.4 + answerRelevance * 0.3);

  return {
    contextRelevance,
    groundedness,
    answerRelevance,
    overall,
  };
}
