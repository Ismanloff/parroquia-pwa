import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { supabaseAdmin } from '@/app/lib/supabase';

export const runtime = 'nodejs';

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

// Generate embedding for search query
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: [query],
        model: 'voyage-3-large',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
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

    const { query, workspaceId, topK = 10 } = await req.json();

    if (!query || !workspaceId) {
      return NextResponse.json(
        { error: 'Query y workspaceId son requeridos' },
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

    // 1. Generate embedding for the query
    console.log('Generating embedding for query:', query);
    const queryEmbedding = await generateQueryEmbedding(query);

    // 2. Search in Pinecone
    console.log('Searching in Pinecone namespace:', workspaceId);
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');

    const searchResults = await index.namespace(workspaceId).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    // 3. Format results
    const results = searchResults.matches.map(match => ({
      id: match.id,
      score: match.score,
      documentId: match.metadata?.documentId,
      filename: match.metadata?.filename,
      text: match.metadata?.text,
      chunkIndex: match.metadata?.chunkIndex,
    }));

    console.log(`Found ${results.length} results`);

    return NextResponse.json({
      success: true,
      results,
      query,
      totalResults: results.length,
    });
  } catch (error: any) {
    console.error('Error in Pinecone search:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
