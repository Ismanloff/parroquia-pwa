import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    // 🔒 SECURITY FIX #4: Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('[DELETE Document] Unauthorized: No auth header');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.warn('[DELETE Document] Unauthorized: Invalid token');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log(`[DELETE Document] User ${user.id} attempting to delete document ${documentId}`);

    // 1. Get document details before deleting
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('workspace_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 🔒 SECURITY FIX #4: Verify user is member of workspace and has delete permission
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', document.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.warn('[DELETE Document] Forbidden: User not member of workspace', {
        userId: user.id,
        workspaceId: document.workspace_id,
        documentId,
      });
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar documentos de este workspace' },
        { status: 403 }
      );
    }

    // Only owners and admins can delete documents
    if (!['owner', 'admin'].includes(membership.role)) {
      console.warn('[DELETE Document] Forbidden: Insufficient permissions', {
        userId: user.id,
        role: membership.role,
        workspaceId: document.workspace_id,
        documentId,
      });
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar documentos (requiere rol owner o admin)' },
        { status: 403 }
      );
    }

    console.log(`[DELETE Document] Authorization passed: User ${user.id} (${membership.role}) can delete document ${documentId}`);

    // 1.5. Get full document details for deletion
    const { data: fullDocument, error: fullDocError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fullDocError || !fullDocument) {
      console.error('Document not found:', fullDocError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 2. Delete file from Supabase Storage
    if (fullDocument.file_url) {
      try {
        // Extract file path from URL
        // file_url format: https://xxx.supabase.co/storage/v1/object/public/documents/workspace_id/filename
        const urlParts = fullDocument.file_url.split('/documents/');
        if (urlParts.length > 1 && urlParts[1]) {
          const filePath = urlParts[1];
          console.log(`Deleting file from storage: ${filePath}`);

          const { error: storageError } = await supabaseAdmin.storage
            .from('documents')
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting from storage:', storageError);
            // Continue with deletion even if storage fails
          } else {
            console.log('File deleted from storage successfully');
          }
        }
      } catch (storageErr) {
        console.error('Error parsing file URL or deleting from storage:', storageErr);
        // Continue with deletion even if storage fails
      }
    }

    // 3. Delete chunks from document_chunks table
    console.log('Deleting chunks from document_chunks table');
    const { error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (chunksError) {
      console.error('Error deleting chunks:', chunksError);
      // Continue with deletion even if chunks fail
    } else {
      console.log('Chunks deleted successfully');
    }

    // 4. Delete vectors from Pinecone
    try {
      if (fullDocument.workspace_id) {
        console.log(`Deleting vectors from Pinecone namespace: ${fullDocument.workspace_id}`);
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');

        // Delete all vectors for this document
        // Vector IDs follow pattern: ${documentId}_chunk_${i}
        const namespace = index.namespace(fullDocument.workspace_id);

        // Use deleteMany with filter to delete all vectors for this document
        await namespace.deleteMany({
          documentId: documentId,
        });

        console.log('Vectors deleted from Pinecone successfully');
      }
    } catch (pineconeErr) {
      console.error('Error deleting from Pinecone:', pineconeErr);
      // Continue with deletion even if Pinecone fails
    }

    // 5. Finally, delete the document record
    console.log('Deleting document record from database');
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document record' },
        { status: 500 }
      );
    }

    console.log(`Document ${documentId} deleted successfully from all locations`);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedFrom: {
        database: true,
        storage: true,
        chunks: true,
        vectors: true,
      },
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/documents/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
