/**
 * GDPR Right to Data Portability API Endpoint
 *
 * GET /api/gdpr/export
 *
 * Implements GDPR Article 20 (Right to Data Portability).
 * Allows users to download all their personal data in a structured format.
 *
 * Supports JSON and CSV formats.
 *
 * @see https://gdpr-info.eu/art-20-gdpr/
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { resend, FROM_EMAIL } from '@/app/lib/resend';
import { gdprExportReadyEmailTemplate } from '@/app/lib/email-templates';
import { exportUserData, convertToCSV } from '@/lib/gdpr/data-export';
import { logSecurityEvent } from '@/lib/audit';

export const runtime = 'nodejs';

/**
 * GET /api/gdpr/export
 *
 * Export all user data (GDPR Article 20)
 *
 * Query parameters:
 * - format: 'json' | 'csv' (default: 'json')
 * - includeAuditLogs: 'true' | 'false' (default: 'true')
 * - includeDeleted: 'true' | 'false' (default: 'false')
 * - from: ISO date string (optional)
 * - to: ISO date string (optional)
 *
 * Response:
 * - JSON format: Returns data as JSON with appropriate content type
 * - CSV format: Returns data as CSV file download
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const includeAuditLogs = searchParams.get('includeAuditLogs') !== 'false';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      return NextResponse.json(
        { error: 'Formato inválido. Usa "json" o "csv"' },
        { status: 400 }
      );
    }

    // Log export request
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    await logSecurityEvent(
      {
        eventType: 'GDPR_EXPORT_REQUESTED',
        severity: 'medium',
        description: 'User requested GDPR data export',
        format,
        include_audit_logs: includeAuditLogs,
        include_deleted: includeDeleted,
        date_range: { from, to },
      },
      user.id,
      undefined,
      ipAddress
    );

    console.log(`📦 GDPR export requested by user: ${user.id} (${user.email})`);

    // Execute export
    const result = await exportUserData(user.id, {
      format: format as 'json' | 'csv',
      includeAuditLogs,
      includeDeleted,
      dateRange: from || to ? { from, to } : undefined,
    });

    if (!result.success || !result.data) {
      await logSecurityEvent(
        {
          eventType: 'GDPR_EXPORT_FAILED',
          severity: 'high',
          description: 'GDPR data export failed',
          error: result.error,
        },
        user.id,
        undefined
      );

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'No se pudo exportar los datos',
        },
        { status: 500 }
      );
    }

    // Log successful export
    await logSecurityEvent(
      {
        eventType: 'GDPR_EXPORT_COMPLETED',
        severity: 'low',
        description: 'GDPR data export completed successfully',
        format,
        conversations_count: result.data.conversations.length,
        documents_count: result.data.documents.length,
        workspaces_count: result.data.workspaces.length,
        audit_logs_count: result.data.auditLogs.length,
      },
      user.id,
      undefined
    );

    console.log(`✅ GDPR export completed for user: ${user.id}`);

    // Send confirmation email (async, don't block response)
    try {
      // Get user email from auth
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name as string | undefined;
      const userName = fullName || email.split('@')[0] || 'Usuario';

      if (email) {
        // Since this is a download endpoint, we'll send the email to confirm the export was generated
        // The download link is the current request URL (they're already downloading it)
        const downloadUrl = req.url; // User is already downloading from this URL
        const expiresIn = '24 horas'; // Standard expiration time for GDPR exports

        const emailTemplate = gdprExportReadyEmailTemplate({
          userName,
          downloadUrl,
          expiresIn,
        });

        // Don't await to avoid blocking the download
        resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        }).then(() => {
          console.log(`✅ GDPR export confirmation email sent to ${email}`);
        }).catch((emailError) => {
          console.error('Error sending GDPR export notification:', emailError);
        });
      }
    } catch (emailError) {
      console.error('Error sending GDPR export notification:', emailError);
      // Don't fail the request if email fails
    }

    // Return data in requested format
    if (format === 'csv') {
      const csv = convertToCSV(result.data);
      const filename = `gdpr-export-${user.id}-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // JSON format
      const filename = `gdpr-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;

      return new NextResponse(JSON.stringify(result, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) {
    console.error('❌ Error in GDPR export endpoint:', error);

    // Try to log the error
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin!.auth.getUser(token);
        if (user) {
          await logSecurityEvent(
            {
              eventType: 'GDPR_EXPORT_ERROR',
              severity: 'high',
              description: 'Unexpected error during GDPR export',
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
