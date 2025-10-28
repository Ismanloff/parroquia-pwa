/**
 * Endpoint de TEST DIRECTO de Pinecone
 *
 * Úsalo para verificar que Pinecone funciona en producción
 * GET /api/test-pinecone-tool?query=eloos
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'Qué es eloos?';

  console.log(`🧪 TEST DIRECTO PINECONE: "${query}"`);

  try {
    // Inicializar clientes
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const index = pc.index('parroquias');

    // Generar embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 3072
    });

    // Buscar en Pinecone
    const queryResults = await index.query({
      vector: embeddingResponse.data[0]?.embedding || [],
      topK: 5,
      includeMetadata: true
    });

    // Aplicar threshold 0.35
    const relevantMatches = queryResults.matches.filter(m =>
      m.score && m.score > 0.35
    );

    const results = relevantMatches.map(m => ({
      score: m.score,
      title: (m.metadata as any)?.titulo || 'Sin título',
      file: (m.metadata as any)?.file_name || 'Desconocido',
      content: ((m.metadata as any)?.pageContent || (m.metadata as any)?.text || '').substring(0, 200)
    }));

    console.log(`✅ RESULTADOS: ${relevantMatches.length} documentos encontrados`);

    return NextResponse.json({
      status: 'SUCCESS',
      query,
      timestamp: new Date().toISOString(),
      totalResults: queryResults.matches.length,
      relevantResults: relevantMatches.length,
      threshold: 0.35,
      results,
      message: relevantMatches.length > 0
        ? '✅ Pinecone funciona correctamente'
        : '⚠️ No se encontraron resultados relevantes'
    });

  } catch (error: any) {
    console.error('❌ ERROR EN PINECONE:', error);

    return NextResponse.json({
      status: 'ERROR',
      query,
      error: error.message,
      stack: error.stack,
      message: '❌ Pinecone falló - revisa las variables de entorno'
    }, { status: 500 });
  }
}
