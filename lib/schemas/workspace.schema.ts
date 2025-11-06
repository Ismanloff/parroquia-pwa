/**
 * Workspace Validation Schemas - FASE 1
 *
 * Schemas Zod para validación de workspaces (multi-tenancy).
 * Valida creación, actualización, membresía y configuración.
 *
 * @see https://frontegg.com/blog/saas-multitenancy
 * @see https://www.qodequay.com/multi-tenant-security-in-saas-platforms
 */

import { z } from 'zod';

/**
 * Roles disponibles en workspace
 */
const workspaceRoles = ['owner', 'admin', 'agent', 'viewer'] as const;

/**
 * Estados de workspace
 */
const workspaceStatuses = ['active', 'suspended', 'deleted'] as const;

/**
 * Planes de suscripción
 */
const subscriptionTiers = ['free', 'pro', 'enterprise'] as const;

/**
 * Schema para crear workspace
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .refine(
      (val) => {
        // Validar que no contenga solo espacios
        return val.trim().length >= 2;
      },
      { message: 'El nombre no puede contener solo espacios' }
    ),
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(50, 'El slug es demasiado largo')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'El slug solo puede contener letras minúsculas, números y guiones',
    })
    .optional(),
  description: z.string().max(500, 'La descripción es demasiado larga').optional(),
  logoUrl: z.string().url('URL de logo inválida').optional(),
  websiteUrl: z.string().url('URL de sitio web inválida').optional(),
  industry: z.string().max(100).optional(),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .optional(),
  settings: z
    .object({
      allowPublicSignup: z.boolean().default(false),
      requireEmailVerification: z.boolean().default(true),
      maxAgents: z.number().int().min(1).max(1000).optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Schema para actualizar workspace
 */
export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  industry: z.string().max(100).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  status: z.enum(workspaceStatuses).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema para agregar miembro al workspace
 */
export const addMemberSchema = z.object({
  workspaceId: z.string().uuid('ID de workspace inválido'),
  email: z.string().email('Email inválido'),
  role: z.enum(workspaceRoles),
  sendInvitation: z.boolean().default(true),
  customMessage: z.string().max(500).optional(),
});

/**
 * Schema para actualizar rol de miembro
 */
export const updateMemberRoleSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(workspaceRoles),
  reason: z.string().max(500).optional().describe('Razón del cambio (audit log)'),
});

/**
 * Schema para eliminar miembro
 */
export const removeMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

/**
 * Schema para transferir ownership
 */
export const transferOwnershipSchema = z.object({
  workspaceId: z.string().uuid(),
  newOwnerId: z.string().uuid(),
  confirmationCode: z
    .string()
    .length(6)
    .describe('Código de confirmación enviado por email'),
});

/**
 * Schema para configuración de workspace
 */
export const workspaceSettingsSchema = z.object({
  // Configuración general
  allowPublicSignup: z.boolean().default(false),
  requireEmailVerification: z.boolean().default(true),
  maxAgents: z.number().int().min(1).max(1000).default(5),

  // Configuración de AI
  aiSettings: z
    .object({
      defaultModel: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']).default('gpt-4-turbo'),
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().int().min(100).max(4000).default(500),
      enableFunctionCalling: z.boolean().default(true),
      enableSemanticCache: z.boolean().default(true),
    })
    .optional(),

  // Configuración de seguridad
  securitySettings: z
    .object({
      enablePIIDetection: z.boolean().default(true),
      enablePromptInjectionProtection: z.boolean().default(true),
      ipWhitelist: z.array(z.string().ip()).optional(),
      require2FA: z.boolean().default(false),
      sessionTimeout: z.number().int().min(15).max(1440).default(480), // minutos
    })
    .optional(),

  // Configuración de notificaciones
  notificationSettings: z
    .object({
      emailNotifications: z.boolean().default(true),
      slackWebhook: z.string().url().optional(),
      notifyOnNewConversation: z.boolean().default(false),
      notifyOnFailedResponse: z.boolean().default(true),
    })
    .optional(),

  // Rate limiting por plan
  rateLimitSettings: z
    .object({
      requestsPerMinute: z.number().int().min(1).max(1000).optional(),
      tokensPerMonth: z.number().int().min(1000).max(10_000_000).optional(),
      conversationsPerDay: z.number().int().min(10).max(10_000).optional(),
    })
    .optional(),
});

/**
 * Schema para listar workspaces de un usuario
 */
export const listWorkspacesQuerySchema = z.object({
  status: z.enum(workspaceStatuses).optional(),
  role: z.enum(workspaceRoles).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).default('updated_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema para listar miembros de workspace
 */
export const listMembersQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  role: z.enum(workspaceRoles).optional(),
  status: z.enum(['active', 'pending', 'inactive']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Schema para invitación de workspace
 */
export const invitationSchema = z.object({
  email: z.string().email(),
  workspaceId: z.string().uuid(),
  role: z.enum(workspaceRoles),
  token: z.string().uuid(),
  expiresAt: z.string().datetime(),
});

/**
 * Schema para aceptar invitación
 */
export const acceptInvitationSchema = z.object({
  token: z.string().uuid('Token de invitación inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional()
    .describe('Solo requerido si el usuario es nuevo'),
});

/**
 * Schema para configuración de billing
 */
export const billingSettingsSchema = z.object({
  subscriptionTier: z.enum(subscriptionTiers),
  billingEmail: z.string().email(),
  taxId: z.string().max(50).optional(),
  billingAddress: z
    .object({
      country: z.string().length(2), // ISO 3166-1 alpha-2
      state: z.string().max(100).optional(),
      city: z.string().max(100),
      postalCode: z.string().max(20),
      addressLine1: z.string().max(200),
      addressLine2: z.string().max(200).optional(),
    })
    .optional(),
});

/**
 * Schema para eliminar workspace (requiere confirmación)
 */
export const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
  confirmationPhrase: z
    .string()
    .refine((val) => val === 'DELETE WORKSPACE', {
      message: 'Debe escribir "DELETE WORKSPACE" para confirmar',
    }),
  reason: z.string().max(1000).optional(),
  exportData: z
    .boolean()
    .default(true)
    .describe('Si true, genera export GDPR antes de eliminar'),
});

/**
 * Type inference
 */
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesQuerySchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type BillingSettings = z.infer<typeof billingSettingsSchema>;
export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;

/**
 * Helper: genera slug único desde nombre
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios/underscores con guión
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio/final
}

/**
 * Helper: valida permisos de rol
 */
export function canPerformAction(
  userRole: (typeof workspaceRoles)[number],
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean {
  const roleHierarchy = {
    owner: ['read', 'write', 'delete', 'admin'],
    admin: ['read', 'write', 'delete'],
    agent: ['read', 'write'],
    viewer: ['read'],
  };

  return roleHierarchy[userRole]?.includes(action) || false;
}

/**
 * Helper: obtiene límites por tier de suscripción
 */
export function getSubscriptionLimits(tier: (typeof subscriptionTiers)[number]): {
  maxAgents: number;
  maxDocuments: number;
  maxConversationsPerMonth: number;
  maxTokensPerMonth: number;
  features: string[];
} {
  const limits = {
    free: {
      maxAgents: 2,
      maxDocuments: 50,
      maxConversationsPerMonth: 1000,
      maxTokensPerMonth: 100_000,
      features: ['basic_ai', 'email_support'],
    },
    pro: {
      maxAgents: 10,
      maxDocuments: 500,
      maxConversationsPerMonth: 10_000,
      maxTokensPerMonth: 1_000_000,
      features: ['advanced_ai', 'priority_support', 'analytics', 'custom_branding'],
    },
    enterprise: {
      maxAgents: -1, // ilimitado
      maxDocuments: -1,
      maxConversationsPerMonth: -1,
      maxTokensPerMonth: -1,
      features: [
        'all_features',
        'dedicated_support',
        'sla',
        'sso',
        'advanced_security',
        'custom_integrations',
      ],
    },
  };

  return limits[tier];
}
