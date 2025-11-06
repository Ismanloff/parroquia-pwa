import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'nodejs';

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
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

    // Get workspace ID from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId es requerido' },
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
        { error: 'No tienes acceso a este workspace' },
        { status: 403 }
      );
    }

    // Get Pinecone index stats
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');
    const indexStats = await index.describeIndexStats();

    // Get namespace-specific stats
    const namespaceStats = indexStats.namespaces?.[workspaceId] || { recordCount: 0 };

    // Get chunks from Supabase for detailed info
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .select(`
        *,
        documents!inner (
          id,
          filename,
          mime_type,
          uploaded_at
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
    }

    // Group chunks by document
    const chunksByDocument: { [key: string]: any[] } = {};
    (chunks || []).forEach((chunk: any) => {
      const docId = chunk.document_id;
      if (!chunksByDocument[docId]) {
        chunksByDocument[docId] = [];
      }
      chunksByDocument[docId].push(chunk);
    });

    // Get document stats
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed');

    const vectorsByDocument = Object.entries(chunksByDocument).map(([docId, chunks]) => {
      const doc = documents?.find(d => d.id === docId);
      return {
        documentId: docId,
        filename: doc?.filename || 'Unknown',
        vectorCount: chunks.length,
        totalTokens: chunks.reduce((sum: number, c: any) => sum + (c.token_count || 0), 0),
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalVectors: namespaceStats.recordCount || 0,
        dimension: indexStats.dimension || 1024,
        indexName: process.env.PINECONE_INDEX_NAME || 'saas',
        namespace: workspaceId,
        totalDocuments: documents?.length || 0,
        vectorsByDocument,
      },
      chunks: chunks || [],
    });
  } catch (error: any) {
    console.error('Error in Pinecone stats:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
