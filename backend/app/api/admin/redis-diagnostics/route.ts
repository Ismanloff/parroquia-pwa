import { NextResponse } from 'next/server';
import Redis from 'ioredis';

/**
 * Endpoint para diagnosticar Redis Cloud
 * GET /api/admin/redis-diagnostics
 */
export async function GET() {
  try {
    if (!process.env.REDIS_URL) {
      return NextResponse.json({
        success: false,
        error: 'REDIS_URL no está configurada',
      }, { status: 500 });
    }

    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });

    const INDEX_KEY = 'semantic_cache:index';

    // Obtener todas las keys del índice
    const allKeys = await redis.smembers(INDEX_KEY);

    console.log(`📊 Total de keys en índice: ${allKeys.length}`);

    // Verificar cuántas keys realmente existen
    let validKeys = 0;
    let expiredKeys = 0;
    const sampleEntries = [];

    for (const key of allKeys.slice(0, 10)) { // Solo revisar las primeras 10 para el sample
      const exists = await redis.exists(key);
      if (exists) {
        validKeys++;
        const entry = await redis.get(key);
        if (entry) {
          try {
            const parsed = JSON.parse(entry);
            sampleEntries.push({
              key: key.replace('semantic_cache:', ''),
              question: parsed.question,
              answerPreview: parsed.answer.substring(0, 100) + '...',
            });
          } catch (e) {
            // ignore
          }
        }
      } else {
        expiredKeys++;
      }
    }

    // Cerrar conexión
    await redis.quit();

    return NextResponse.json({
      success: true,
      stats: {
        totalKeysInIndex: allKeys.length,
        validKeysInSample: validKeys,
        expiredKeysInSample: expiredKeys,
        sampleSize: 10,
      },
      sampleEntries,
      message: `Redis tiene ${allKeys.length} keys en el índice`,
    });

  } catch (error: any) {
    console.error('❌ Error en Redis diagnostics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al diagnosticar Redis',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
