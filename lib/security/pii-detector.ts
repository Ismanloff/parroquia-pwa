/**
 * PII (Personally Identifiable Information) Detection - FASE 1
 *
 * Detecta y redacta información personal sensible según GDPR.
 * Esta es una implementación básica con regex patterns.
 *
 * Para producción empresarial, considerar integrar Google Cloud DLP API
 * o servicios similares para detección más avanzada (FASE 3).
 *
 * @see https://www.private-ai.com/en/blog/gdpr-llm-lifecycle
 * @see https://modelmetry.com/blog/how-to-prevent-your-chatbot-from-leaking-pii
 */

export interface PIIFinding {
  type: PIIType;
  value: string;
  start: number;
  end: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type PIIType =
  | 'EMAIL'
  | 'PHONE'
  | 'CREDIT_CARD'
  | 'SPAIN_DNI'
  | 'SPAIN_NIE'
  | 'SPAIN_NIF'
  | 'IBAN'
  | 'IP_ADDRESS'
  | 'DATE_OF_BIRTH'
  | 'PASSPORT'
  | 'SOCIAL_SECURITY';

export interface PIIDetectionResult {
  hasPII: boolean;
  findings: PIIFinding[];
  redactedText: string;
  originalLength: number;
  redactedLength: number;
}

/**
 * Patrones regex para detección de PII
 * Optimizados para español y contexto europeo
 */
const PII_PATTERNS: Record<PIIType, RegExp> = {
  // Email: RFC 5322 simplificado
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // Teléfonos: Formatos españoles e internacionales
  // +34 600 123 456, 600123456, +34-600-123-456, etc
  PHONE: /(\+34|0034)?[\s.-]?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b|\+?\d{7,15}\b/gi,

  // Tarjetas de crédito: 13-19 dígitos con espacios/guiones opcionales
  // Visa, Mastercard, Amex, Discover
  CREDIT_CARD: /\b(?:\d{4}[\s-]?){3}\d{4}|\b\d{13,19}\b/g,

  // DNI español: 8 dígitos + letra
  SPAIN_DNI: /\b\d{8}[A-Z]\b/gi,

  // NIE español: X/Y/Z + 7 dígitos + letra
  SPAIN_NIE: /\b[XYZ]\d{7}[A-Z]\b/gi,

  // NIF español (CIF): Letra + 8 dígitos
  SPAIN_NIF: /\b[A-Z]\d{8}\b/gi,

  // IBAN: 2 letras + 2 dígitos + hasta 30 alfanuméricos
  IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/gi,

  // IP Address: IPv4 y IPv6
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,

  // Fecha de nacimiento: DD/MM/YYYY, DD-MM-YYYY, etc
  DATE_OF_BIRTH: /\b(?:0?[1-9]|[12][0-9]|3[01])[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:19|20)\d{2}\b/g,

  // Pasaporte: Formatos comunes
  PASSPORT: /\b[A-Z]{1,2}\d{6,9}\b/gi,

  // Número de Seguridad Social español
  SOCIAL_SECURITY: /\b\d{2}\/\d{7,10}\/\d{2}\b/g,
};

/**
 * Valida si una tarjeta de crédito es válida usando algoritmo de Luhn
 */
function isValidCreditCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    const digitChar = digits[i];
    if (!digitChar) continue;
    let digit = parseInt(digitChar, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Valida DNI/NIE español con letra correcta
 */
function isValidSpanishID(id: string): boolean {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';

  // DNI: 8 dígitos + letra
  const dniMatch = id.match(/^(\d{8})([A-Z])$/i);
  if (dniMatch && dniMatch[1] && dniMatch[2]) {
    const number = parseInt(dniMatch[1], 10);
    const letter = dniMatch[2].toUpperCase();
    return letters[number % 23] === letter;
  }

  // NIE: X/Y/Z + 7 dígitos + letra
  const nieMatch = id.match(/^([XYZ])(\d{7})([A-Z])$/i);
  if (nieMatch && nieMatch[1] && nieMatch[2] && nieMatch[3]) {
    const prefix = nieMatch[1].toUpperCase();
    const prefixValue = prefix === 'X' ? 0 : prefix === 'Y' ? 1 : 2;
    const number = parseInt(`${prefixValue}${nieMatch[2]}`, 10);
    const letter = nieMatch[3].toUpperCase();
    return letters[number % 23] === letter;
  }

  return false;
}

/**
 * Detecta PII en texto y retorna findings
 */
export function detectPII(text: string): PIIDetectionResult {
  const findings: PIIFinding[] = [];
  let redactedText = text;

  // Iterar sobre cada tipo de PII
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = Array.from(text.matchAll(pattern));

    for (const match of matches) {
      if (!match[0] || match.index === undefined) continue;

      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      // Validaciones adicionales para reducir falsos positivos
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

      if (type === 'CREDIT_CARD') {
        if (!isValidCreditCard(value)) {
          confidence = 'LOW';
        }
      }

      if (type === 'SPAIN_DNI' || type === 'SPAIN_NIE') {
        if (!isValidSpanishID(value)) {
          confidence = 'LOW';
        }
      }

      // Solo reportar findings con confianza MEDIUM o HIGH
      if (confidence !== 'LOW') {
        findings.push({
          type: type as PIIType,
          value,
          start,
          end,
          confidence,
        });
      }
    }
  }

  // Redactar PII de atrás hacia adelante para mantener índices válidos
  const sortedFindings = [...findings].sort((a, b) => b.start - a.start);

  for (const finding of sortedFindings) {
    const placeholder = `[${finding.type}_REDACTED]`;
    redactedText =
      redactedText.substring(0, finding.start) +
      placeholder +
      redactedText.substring(finding.end);
  }

  return {
    hasPII: findings.length > 0,
    findings,
    redactedText,
    originalLength: text.length,
    redactedLength: redactedText.length,
  };
}

/**
 * Versión simplificada que solo retorna si hay PII (para validaciones rápidas)
 */
export function hasPII(text: string): boolean {
  for (const pattern of Object.values(PII_PATTERNS)) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Redacta PII de un texto (wrapper conveniente)
 */
export function redactPII(text: string): string {
  return detectPII(text).redactedText;
}

/**
 * Estadísticas de PII detectada (útil para monitoring)
 */
export function getPIIStats(text: string): Record<PIIType, number> {
  const result = detectPII(text);
  const stats: Record<string, number> = {};

  for (const finding of result.findings) {
    stats[finding.type] = (stats[finding.type] || 0) + 1;
  }

  return stats as Record<PIIType, number>;
}

/**
 * Valida si un texto es seguro para procesar (sin PII sensible)
 */
export function isSafeText(
  text: string,
  options: {
    allowEmails?: boolean;
    allowPhones?: boolean;
    maxPIICount?: number;
  } = {}
): { safe: boolean; reason?: string; findings: PIIFinding[] } {
  const result = detectPII(text);

  if (!result.hasPII) {
    return { safe: true, findings: [] };
  }

  // Filtrar findings basados en opciones
  let relevantFindings = result.findings;

  if (options.allowEmails) {
    relevantFindings = relevantFindings.filter((f) => f.type !== 'EMAIL');
  }

  if (options.allowPhones) {
    relevantFindings = relevantFindings.filter((f) => f.type !== 'PHONE');
  }

  const maxPII = options.maxPIICount || 0;

  if (relevantFindings.length > maxPII) {
    return {
      safe: false,
      reason: `Detected ${relevantFindings.length} PII instances (max allowed: ${maxPII})`,
      findings: relevantFindings,
    };
  }

  return { safe: true, findings: relevantFindings };
}

/**
 * Para uso en logs de auditoría: redacta objeto completo
 */
export function redactObjectPII<T extends Record<string, any>>(obj: T): T {
  const redacted: Record<string, any> = { ...obj };
  const piiFields = [
    'email',
    'phone',
    'telephone',
    'mobile',
    'name',
    'fullName',
    'firstName',
    'lastName',
    'address',
    'street',
    'city',
    'zipCode',
    'postalCode',
    'ssn',
    'dni',
    'nie',
    'nif',
    'passport',
    'creditCard',
    'cardNumber',
    'iban',
    'birthDate',
    'dateOfBirth',
  ];

  for (const field of piiFields) {
    if (field in redacted && typeof redacted[field] === 'string') {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted as T;
}
