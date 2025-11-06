import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
// FASE 1: Security imports
import { validateFileType } from '@/lib/schemas';
import { validateFileSignature } from '@/lib/security/file-validator';
// FASE 3: Audit logging
import { logCreate, ResourceType } from '@/lib/audit';

export const runtime = 'nodejs'; // Need Node runtime for file handling

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin no está configurado' },
        { status: 500 }
      );
    }

    // Get user ID from authorization header
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'Archivo y workspaceId son requeridos' },
        { status: 400 }
      );
    }

    // 🛡️ FASE 1: Validación de tipo y tamaño con Zod schema
    const fileValidation = validateFileType(file);
    if (!fileValidation.valid) {
      console.warn(`❌ File validation failed:`, fileValidation.error);
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Verify user is member of this workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes permisos para subir documentos a este workspace' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🔒 SECURITY FIX #3: Validate file signature (magic numbers)
    const signatureValidation = validateFileSignature(buffer, file.type, file.name);
    if (!signatureValidation.valid) {
      console.warn(`❌ File signature validation failed:`, {
        filename: file.name,
        claimedType: file.type,
        error: signatureValidation.error,
        detectedType: signatureValidation.detectedType,
      });
      return NextResponse.json(
        {
          error: signatureValidation.error || 'Archivo inválido',
          details: signatureValidation.details,
        },
        { status: 400 }
      );
    }

    console.log(`✅ File signature validated:`, {
      filename: file.name,
      type: file.type,
      detectedType: signatureValidation.detectedType,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${workspaceId}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir archivo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filename);

    // Create document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        filename: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending', // Will be processed later
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (docError) {
      console.error('Error creating document record:', docError);

      // Cleanup: Delete uploaded file
      await supabaseAdmin.storage
        .from('documents')
        .remove([filename]);

      return NextResponse.json(
        { error: 'Error al guardar documento' },
        { status: 500 }
      );
    }

    // AUDIT: Log document creation
    await logCreate(
      ResourceType.DOCUMENT,
      document.id,
      user.id,
      workspaceId,
      {
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
      }
    );

    // Trigger document processing asynchronously (don't await)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: document.id,
        workspaceId: workspaceId,
      }),
    }).catch(err => console.error('Error triggering document processing:', err));

    return NextResponse.json(
      {
        success: true,
        message: 'Documento subido exitosamente. Se procesará en segundo plano.',
        document: {
          id: document.id,
          filename: document.filename,
          file_url: document.file_url,
          status: document.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in document upload endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
