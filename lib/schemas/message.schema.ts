/**
 * Message Validation Schemas - FASE 1
 *
 * Schemas Zod para validación robusta de mensajes de chat.
 * Previene inyección, XSS, y validamos formato correcto.
 *
 * @see https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025
 * @see https://makerkit.dev/blog/tutorials/nextjs-security
 */

import { z } from 'zod';

/**
 * Patrones de contenido potencialmente malicioso
 */
const MALICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // javascript: protocol
  /data:text\/html/gi, // Data URLs con HTML
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc)
  /<iframe[^>]*>/gi, // Iframes
  /<embed[^>]*>/gi, // Embed tags
  /<object[^>]*>/gi, // Object tags
];

/**
 * Validación custom: detecta contenido malicioso
 */
function containsMaliciousContent(content: string): boolean {
  return MALICIOUS_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Schema para el contenido del mensaje
 */
const messageContentSchema = z
  .string()
  .min(1, 'El mensaje no puede estar vacío')
  .max(4000, 'El mensaje es demasiado largo (máximo 4000 caracteres)')
  .refine((val) => !containsMaliciousContent(val), {
    message:
      'El mensaje contiene contenido potencialmente malicioso y ha sido bloqueado por seguridad',
  })
  .refine(
    (val) => {
      // Validar que no sea solo espacios en blanco
      return val.trim().length > 0;
    },
    {
      message: 'El mensaje no puede contener solo espacios en blanco',
    }
  );

/**
 * Schema para metadata de mensaje
 */
const messageMetadataSchema = z
  .object({
    clientTimestamp: z.string().datetime().optional(),
    userAgent: z.string().max(500).optional(),
    ipAddress: z.string().ip().optional(),
    source: z.enum(['widget', 'dashboard', 'api', 'whatsapp', 'telegram']).optional(),
    requestId: z.string().uuid().optional(),
    language: z.string().length(2).optional(), // ISO 639-1 (es, en, fr, etc)
  })
  .optional();

/**
 * Schema principal para crear un mensaje
 */
export const createMessageSchema = z.object({
  content: messageContentSchema,
  conversationId: z.string().uuid('ID de conversación inválido'),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  metadata: messageMetadataSchema,
});

/**
 * Schema para actualizar un mensaje (solo ciertos campos editables)
 */
export const updateMessageSchema = z.object({
  content: messageContentSchema.optional(),
  metadata: messageMetadataSchema,
});

/**
 * Schema para query parameters al listar mensajes
 */
export const listMessagesQuerySchema = z.object({
  conversationId: z.string().uuid('ID de conversación inválido'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Número de mensajes a retornar'),
  offset: z.coerce.number().int().min(0).default(0).describe('Offset para paginación'),
  order: z.enum(['asc', 'desc']).default('asc').describe('Orden de los mensajes'),
});

/**
 * Schema para búsqueda de mensajes
 */
export const searchMessagesSchema = z.object({
  query: z
    .string()
    .min(2, 'La búsqueda debe tener al menos 2 caracteres')
    .max(200, 'La búsqueda es demasiado larga'),
  conversationId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  includeContext: z.coerce.boolean().default(false).describe('Incluir contexto de mensajes'),
});

/**
 * Schema para mensaje del widget (público, sin auth)
 */
export const widgetMessageSchema = z.object({
  content: messageContentSchema,
  conversationId: z.string().uuid().optional(), // Opcional para primera interacción
  workspaceId: z.string().uuid('ID de workspace inválido'),
  customerId: z.string().max(255).optional(),
  customerMetadata: z
    .object({
      email: z.string().email().optional(),
      name: z.string().max(200).optional(),
      phone: z.string().max(50).optional(),
      customFields: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  metadata: messageMetadataSchema,
});

/**
 * Schema para respuesta del asistente (validación de output)
 */
export const assistantResponseSchema = z.object({
  content: z.string().min(1).max(8000), // Asistente puede generar respuestas más largas
  conversationId: z.string().uuid(),
  model: z.string().optional(),
  tokensUsed: z
    .object({
      prompt: z.number().int().min(0),
      completion: z.number().int().min(0),
      total: z.number().int().min(0),
    })
    .optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        arguments: z.record(z.string(), z.any()),
        result: z.any().optional(),
      })
    )
    .optional(),
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).optional(),
  metadata: messageMetadataSchema,
});

/**
 * Schema para mensajes en batch (operaciones masivas)
 */
export const batchMessagesSchema = z.object({
  messages: z
    .array(createMessageSchema)
    .min(1, 'Debe incluir al menos un mensaje')
    .max(100, 'No se pueden enviar más de 100 mensajes a la vez'),
  workspaceId: z.string().uuid(),
});

/**
 * Schema para eliminar mensajes
 */
export const deleteMessageSchema = z.object({
  messageId: z.string().uuid('ID de mensaje inválido'),
  reason: z.string().max(500).optional().describe('Razón de eliminación (para audit log)'),
});

/**
 * Schema para feedback de mensaje (thumbs up/down)
 */
export const messageFeedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(1000).optional(),
  categories: z
    .array(z.enum(['incorrect', 'unhelpful', 'offensive', 'outdated', 'other']))
    .optional(),
});

/**
 * Type inference para TypeScript
 */
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
export type WidgetMessageInput = z.infer<typeof widgetMessageSchema>;
export type AssistantResponseInput = z.infer<typeof assistantResponseSchema>;
export type BatchMessagesInput = z.infer<typeof batchMessagesSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type MessageFeedbackInput = z.infer<typeof messageFeedbackSchema>;

/**
 * Helper: valida y parsea mensaje de forma segura
 */
export function validateMessage(data: unknown): {
  success: boolean;
  data?: CreateMessageInput;
  error?: { field: string; message: string }[];
} {
  const result = createMessageSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, error: errors };
}

/**
 * Helper: valida mensaje del widget
 */
export function validateWidgetMessage(data: unknown): {
  success: boolean;
  data?: WidgetMessageInput;
  error?: { field: string; message: string }[];
} {
  const result = widgetMessageSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, error: errors };
}
