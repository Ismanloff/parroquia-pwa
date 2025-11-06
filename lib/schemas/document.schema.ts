/**
 * Document Validation Schemas - FASE 1
 *
 * Schemas Zod para validación de documentos de conocimiento.
 * Valida tipo, tamaño, contenido y access control.
 *
 * @see https://www.promptfoo.dev/blog/rag-poisoning/
 * @see https://docs.mend.io/platform/latest/rag-poisoning
 */

import { z } from 'zod';

/**
 * Tipos de archivo permitidos
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain', // .txt
  'text/markdown', // .md
  'text/csv', // .csv
  'application/json', // .json
] as const;

/**
 * Tamaños máximos por tipo de archivo (en bytes)
 */
export const MAX_FILE_SIZES = {
  'application/pdf': 20 * 1024 * 1024, // 20MB
  'application/msword': 10 * 1024 * 1024, // 10MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,
  'application/vnd.ms-excel': 10 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,
  'text/plain': 5 * 1024 * 1024, // 5MB
  'text/markdown': 5 * 1024 * 1024,
  'text/csv': 10 * 1024 * 1024,
  'application/json': 5 * 1024 * 1024,
} as const;

/**
 * Categorías de documentos
 */
const documentCategories = [
  'faq', // Preguntas frecuentes
  'policy', // Políticas y términos
  'guide', // Guías de usuario
  'technical', // Documentación técnica
  'product', // Información de productos
  'legal', // Documentos legales
  'training', // Material de entrenamiento
  'other', // Otros
] as const;

/**
 * Roles que pueden acceder a documentos
 */
const documentRoles = ['owner', 'admin', 'agent', 'viewer'] as const;

/**
 * Schema para metadata de documento
 */
const documentMetadataSchema = z
  .object({
    author: z.string().max(200).optional(),
    source: z.string().url().optional(),
    version: z.string().max(50).optional(),
    language: z.string().length(2).optional(), // ISO 639-1
    keywords: z.array(z.string().max(100)).max(20).optional(),
    summary: z.string().max(1000).optional(),
    customFields: z.record(z.string(), z.any()).optional(),
  })
  .optional();

/**
 * Schema para access control de documentos
 */
const accessControlSchema = z
  .object({
    allowedRoles: z
      .array(z.enum(documentRoles))
      .min(1, 'Debe especificar al menos un rol')
      .default(['owner', 'admin', 'agent']),
    allowedUsers: z.array(z.string().uuid()).optional(),
    expiresAt: z.string().datetime().optional(),
    isPublic: z.boolean().default(false),
  })
  .optional();

/**
 * Schema para crear documento
 */
export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'El título no puede estar vacío')
    .max(500, 'El título es demasiado largo'),
  content: z
    .string()
    .min(10, 'El contenido es demasiado corto (mínimo 10 caracteres)')
    .max(1_000_000, 'El contenido es demasiado largo (máximo 1MB de texto)'),
  workspaceId: z.string().uuid('ID de workspace inválido'),
  category: z.enum(documentCategories).default('other'),
  tags: z
    .array(z.string().max(50))
    .max(10, 'No se pueden agregar más de 10 tags')
    .default([]),
  metadata: documentMetadataSchema,
  accessControl: accessControlSchema,
});

/**
 * Schema para actualizar documento
 */
export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(10).max(1_000_000).optional(),
  category: z.enum(documentCategories).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: documentMetadataSchema,
  accessControl: accessControlSchema,
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

/**
 * Schema para upload de archivo
 */
export const uploadDocumentSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, {
    message: 'Debe proporcionar un archivo válido',
  }),
  workspaceId: z.string().uuid(),
  category: z.enum(documentCategories).default('other'),
  tags: z.array(z.string().max(50)).max(10).default([]),
  metadata: documentMetadataSchema,
  accessControl: accessControlSchema,
});

/**
 * Schema para validación de tipo de archivo
 */
export const fileTypeSchema = z.object({
  type: z.enum(ALLOWED_DOCUMENT_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({
      message: `Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
    }),
  }),
  size: z.number().int().positive(),
});

/**
 * Schema para búsqueda de documentos
 */
export const searchDocumentsSchema = z.object({
  query: z
    .string()
    .min(2, 'La búsqueda debe tener al menos 2 caracteres')
    .max(200, 'La búsqueda es demasiado larga'),
  workspaceId: z.string().uuid(),
  category: z.enum(documentCategories).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  includeArchived: z.coerce.boolean().default(false),
});

/**
 * Schema para listar documentos
 */
export const listDocumentsQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  category: z.enum(documentCategories).optional(),
  status: z.enum(['active', 'archived', 'deleted']).default('active'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'title']).default('updated_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema para eliminar documento
 */
export const deleteDocumentSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().max(500).optional().describe('Razón de eliminación (audit log)'),
  hardDelete: z
    .boolean()
    .default(false)
    .describe('Si true, elimina permanentemente. Si false, marca como deleted.'),
});

/**
 * Schema para procesar documento (chunking + embeddings)
 */
export const processDocumentSchema = z.object({
  documentId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  chunkSize: z
    .number()
    .int()
    .min(100)
    .max(2000)
    .default(500)
    .describe('Tamaño de cada chunk en caracteres'),
  chunkOverlap: z
    .number()
    .int()
    .min(0)
    .max(500)
    .default(50)
    .describe('Solapamiento entre chunks'),
  embedModel: z.enum(['voyage-3', 'voyage-3-lite']).default('voyage-3-lite'),
});

/**
 * Schema para validación de contenido de documento (anti-poisoning)
 */
const documentValidationResultSchema = z.object({
  isValid: z.boolean(),
  threats: z.array(
    z.object({
      type: z.enum([
        'INSTRUCTION_INJECTION',
        'RETRIEVAL_MANIPULATION',
        'DATA_EXTRACTION_ATTEMPT',
        'KEYWORD_STUFFING',
        'MISSING_PROVENANCE',
      ]),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      details: z.string(),
      location: z
        .object({
          start: z.number().int(),
          end: z.number().int(),
        })
        .optional(),
    })
  ),
  sanitizedContent: z.string().optional(),
});

/**
 * Type inference
 */
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type FileTypeInput = z.infer<typeof fileTypeSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type ProcessDocumentInput = z.infer<typeof processDocumentSchema>;
export type DocumentValidationResult = z.infer<typeof documentValidationResultSchema>;

/**
 * Helper: valida tipo y tamaño de archivo
 */
export function validateFileType(file: File): {
  valid: boolean;
  error?: string;
  maxSize?: number;
} {
  // Validar tipo
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
    };
  }

  // Validar tamaño
  const maxSize = MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES];
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `El archivo es demasiado grande (${fileSizeMB}MB). Tamaño máximo permitido: ${maxSizeMB}MB`,
      maxSize,
    };
  }

  return { valid: true, maxSize };
}

/**
 * Type for threat items
 */
type ThreatItem = {
  type: 'INSTRUCTION_INJECTION' | 'RETRIEVAL_MANIPULATION' | 'DATA_EXTRACTION_ATTEMPT' | 'KEYWORD_STUFFING' | 'MISSING_PROVENANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  location?: {
    start: number;
    end: number;
  };
};

/**
 * Helper: valida contenido de documento contra document poisoning
 */
export function validateDocumentContent(content: string): DocumentValidationResult {
  const threats: ThreatItem[] = [];
  let sanitizedContent = content;

  // Detectar patrones de instrucción maliciosa
  const injectionPatterns = [
    { pattern: /IGNORE\s+(?:ALL\s+)?(?:PREVIOUS|OTHER)\s+(?:DOCUMENTS|INSTRUCTIONS)/gi, type: 'INSTRUCTION_INJECTION' as const },
    { pattern: /SYSTEM\s+NOTE:/gi, type: 'INSTRUCTION_INJECTION' as const },
    { pattern: /IMPORTANT:\s+(?:WHEN|ALWAYS|FOR)/gi, type: 'INSTRUCTION_INJECTION' as const },
    { pattern: /Note\s+to\s+AI:/gi, type: 'INSTRUCTION_INJECTION' as const },
  ];

  for (const { pattern, type } of injectionPatterns) {
    const matches = Array.from(content.matchAll(pattern));
    for (const match of matches) {
      if (match.index !== undefined) {
        threats.push({
          type,
          severity: 'HIGH',
          details: `Detected injection pattern: ${pattern.source}`,
          location: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    }
  }

  // Detectar keyword stuffing (retrieval manipulation)
  const words = content.toLowerCase().split(/\s+/);
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 5) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }

  const suspiciousRepetition = Object.entries(wordFrequency).filter(
    ([_, count]) => count > 20
  );

  if (suspiciousRepetition.length > 0) {
    threats.push({
      type: 'KEYWORD_STUFFING',
      severity: 'MEDIUM',
      details: `Suspicious keyword repetition detected: ${suspiciousRepetition.map(([w]) => w).slice(0, 5).join(', ')}`,
    });
  }

  // Detectar intentos de extracción de datos
  const extractionPatterns = [
    /summarize\s+all\s+documents\s+containing/gi,
    /list\s+all\s+(?:passwords|keys|credentials)/gi,
    /before\s+continuing,\s+(?:analyze|list|show)/gi,
  ];

  for (const pattern of extractionPatterns) {
    const matches = Array.from(content.matchAll(pattern));
    for (const match of matches) {
      if (match.index !== undefined) {
        threats.push({
          type: 'DATA_EXTRACTION_ATTEMPT',
          severity: 'CRITICAL',
          details: `Detected extraction pattern: ${pattern.source}`,
          location: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    }
  }

  // Sanitizar: eliminar líneas con patrones críticos
  if (threats.some((t) => t.severity === 'HIGH' || t.severity === 'CRITICAL')) {
    const lines = content.split('\n');
    const cleanLines = lines.filter((line) => {
      return !injectionPatterns.some(({ pattern }) => pattern.test(line)) &&
             !extractionPatterns.some((pattern) => pattern.test(line));
    });
    sanitizedContent = cleanLines.join('\n');
  }

  const isValid = !threats.some((t) => t.severity === 'CRITICAL');

  return {
    isValid,
    threats,
    sanitizedContent: isValid ? undefined : sanitizedContent,
  };
}
