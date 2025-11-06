/**
 * GDPR Right to Deletion API Endpoint
 *
 * POST /api/gdpr/delete
 *
 * Implements GDPR Article 17 (Right to Erasure).
 * Allows users to delete all their personal data from the platform.
 *
 * ⚠️  CRITICAL: This endpoint performs irreversible data deletion.
 * The user must confirm deletion with a special confirmation token.
 *
 * @see https://gdpr-info.eu/art-17-gdpr/
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { deleteUserData, getDeletionStatus } from '@/lib/gdpr/right-to-deletion';
import { logSecurityEvent } from '@/lib/audit';

export const runtime = 'nodejs';

/**
 * POST /api/gdpr/delete
 *
 * Delete all user data (GDPR Article 17)
 *
 * Request body:
 * {
 *   confirmation: "DELETE_MY_ACCOUNT",  // Required confirmation string
 *   reason?: string,                     // Optional reason for deletion
 *   hardDelete?: boolean                 // Optional: hard delete instead of soft delete
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Your data has been deleted successfully",
 *   deleted: { ... },
 *   jobId?: string  // For async deletion (future enhancement)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { confirmation, reason, hardDelete = false } = body;

    // ⚠️ SAFETY CHECK: Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      await logSecurityEvent(
        {
          eventType: 'GDPR_DELETION_ATTEMPT_WITHOUT_CONFIRMATION',
          severity: 'high',
          description: 'User attempted GDPR deletion without proper confirmation',
          attempted_by: user.id,
        },
        user.id,
        undefined
      );

      return NextResponse.json(
        {
          error: 'Confirmación requerida',
          message: 'Debes enviar confirmation: "DELETE_MY_ACCOUNT" para confirmar la eliminación',
        },
        { status: 400 }
      );
    }

    // Extract metadata for logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    // Log deletion initiation
    await logSecurityEvent(
      {
        eventType: 'GDPR_DELETION_INITIATED',
        severity: 'critical',
        description: 'User initiated GDPR Article 17 data deletion',
        user_email: user.email,
        reason: reason || 'User requested account deletion',
        hard_delete: hardDelete,
      },
      user.id,
      undefined,
      ipAddress
    );

    console.log(`🗑️  GDPR deletion initiated for user: ${user.id} (${user.email})`);

    // Execute deletion
    const result = await deleteUserData(user.id, {
      hardDelete,
      reason: reason || 'User requested account deletion via GDPR endpoint',
      deletedBy: user.id,
    });

    if (!result.success) {
      // Log failure
      await logSecurityEvent(
        {
          eventType: 'GDPR_DELETION_FAILED',
          severity: 'high',
          description: 'GDPR deletion process failed',
          errors: result.errors,
          deleted: result.deleted,
        },
        user.id,
        undefined
      );

      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo completar la eliminación de datos',
          details: result.errors,
          partialDeletion: result.deleted,
        },
        { status: 500 }
      );
    }

    // Log successful deletion
    console.log(`✅ GDPR deletion completed for user: ${user.id}`);
    console.log('Deleted:', result.deleted);

    // Note: No audit log here because the user is already deleted from auth.users
    // Final audit log was created inside deleteUserData() before user deletion

    return NextResponse.json(
      {
        success: true,
        message: 'Todos tus datos han sido eliminados exitosamente. Tu cuenta ya no está activa.',
        deleted: result.deleted,
        timestamp: result.timestamp,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error in GDPR deletion endpoint:', error);

    // Try to log the error (may fail if user is already deleted)
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin!.auth.getUser(token);
        if (user) {
          await logSecurityEvent(
            {
              eventType: 'GDPR_DELETION_ERROR',
              severity: 'critical',
              description: 'Unexpected error during GDPR deletion',
              error: error.message,
            },
            user.id,
            undefined
          );
        }
      }
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr/delete
 *
 * Get deletion status for current user
 *
 * Response:
 * {
 *   isDeleted: boolean,
 *   softDeletedContent?: { conversations, messages, documents },
 *   anonymizedAuditLogs?: boolean
 * }
 */
export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get deletion status
    const status = await getDeletionStatus(user.id);

    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error getting deletion status:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
