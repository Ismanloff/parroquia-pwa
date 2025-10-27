import { NextResponse } from 'next/server';
import { semanticCache } from '../../chat/utils/semanticCache';
import { memoryCache } from '../../chat/utils/memoryCache';

/**
 * Endpoint para probar búsquedas en cache
 * GET /api/admin/test-cache-lookup?q=tu+pregunta
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({
        error: 'Parámetro "q" (pregunta) es requerido',
        example: '/api/admin/test-cache-lookup?q=que+es+eloos',
      }, { status: 400 });
    }

    console.log(`🔍 Probando búsqueda en cache: "${query}"`);

    // Probar Memory Cache
    const memoryStart = Date.now();
    const memoryResult = await memoryCache.get(query);
    const memoryDuration = Date.now() - memoryStart;

    // Probar Redis Cache
    const redisStart = Date.now();
    const redisResult = await semanticCache.get(query);
    const redisDuration = Date.now() - redisStart;

    return NextResponse.json({
      success: true,
      query,
      results: {
        memory: {
          found: !!memoryResult,
          duration: `${memoryDuration}ms`,
          preview: memoryResult ? memoryResult.substring(0, 200) + '...' : null,
        },
        redis: {
          found: !!redisResult,
          duration: `${redisDuration}ms`,
          preview: redisResult ? redisResult.substring(0, 200) + '...' : null,
        },
      },
      recommendation: memoryResult || redisResult ? 'Cache HIT - debería responder rápido' : 'Cache MISS - consultará al agente',
    });

  } catch (error: any) {
    console.error('❌ Error en test-cache-lookup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al probar cache',
    }, { status: 500 });
  }
}
