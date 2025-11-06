import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Initialize services
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: {
    documentId: string;
    workspaceId: string;
    filename: string;
    chunkIndex: number;
  };
}

// Generate embedding using Voyage AI
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

// Expand query using Anthropic to improve search results
async function expandQuery(query: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Expand this search query to improve semantic search results. Return only the expanded query, no explanations:

Query: "${query}"

Expanded query:`,
        },
      ],
    });

    const firstBlock = message.content[0];
    const expandedQuery = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : query;

    console.log('Query expansion:', { original: query, expanded: expandedQuery });
    return expandedQuery;
  } catch (error) {
    console.error('Error expanding query, using original:', error);
    return query; // Fallback to original query
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      workspaceId,
      topK = 5,
      includeMetadata = true,
      expandQuery: shouldExpandQuery = false,
    } = body;

    // Validate inputs
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json(
        { error: 'WorkspaceId is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('RAG Search:', { query, workspaceId, topK, shouldExpandQuery });

    // Step 1: Optionally expand query for better search
    let searchQuery = query;
    if (shouldExpandQuery) {
      searchQuery = await expandQuery(query);
    }

    // Step 2: Generate embedding for the query
    console.log('Generating embedding for query...');
    const queryEmbedding = await generateQueryEmbedding(searchQuery);

    // Step 3: Search in Pinecone namespace
    console.log('Searching in Pinecone namespace:', workspaceId);
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'saas');
    const namespace = index.namespace(workspaceId);

    const searchResponse = await namespace.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: includeMetadata,
    });

    // Step 4: Format results
    const results: SearchResult[] = searchResponse.matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      text: (match.metadata?.text as string) || '',
      metadata: {
        documentId: (match.metadata?.documentId as string) || '',
        workspaceId: (match.metadata?.workspaceId as string) || '',
        filename: (match.metadata?.filename as string) || '',
        chunkIndex: (match.metadata?.chunkIndex as number) || 0,
      },
    }));

    console.log(`Found ${results.length} results`);

    return NextResponse.json({
      success: true,
      query: query,
      expandedQuery: shouldExpandQuery ? searchQuery : undefined,
      results: results,
      totalResults: results.length,
    });
  } catch (error: any) {
    console.error('Error in RAG search:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
