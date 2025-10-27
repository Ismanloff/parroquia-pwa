import { NextResponse } from 'next/server';
import Redis from 'ioredis';

/**
 * Endpoint para verificar la conexión de Redis
 * GET /api/redis-health
 */
export async function GET() {
  try {
    // Verificar si REDIS_URL está configurada
    if (!process.env.REDIS_URL) {
      return NextResponse.json({
        status: 'error',
        connected: false,
        message: 'REDIS_URL no está configurada en las variables de entorno',
      }, { status: 500 });
    }

    // Intentar conectar a Redis
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000, // 5 segundos timeout
    });

    // Hacer un ping para verificar conexión
    const pingResult = await redis.ping();

    // Obtener info del servidor
    const info = await redis.info('server');
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';

    // Hacer una operación de escritura/lectura de prueba
    const testKey = 'health_check_test';
    const testValue = Date.now().toString();
    await redis.set(testKey, testValue, 'EX', 10); // Expira en 10 segundos
    const retrievedValue = await redis.get(testKey);
    await redis.del(testKey);

    // Cerrar conexión
    await redis.quit();

    return NextResponse.json({
      status: 'success',
      connected: true,
      ping: pingResult,
      redisVersion,
      readWriteTest: retrievedValue === testValue ? 'passed' : 'failed',
      timestamp: new Date().toISOString(),
      message: 'Redis está conectado y funcionando correctamente',
    });

  } catch (error: any) {
    console.error('❌ Redis health check failed:', error);

    return NextResponse.json({
      status: 'error',
      connected: false,
      message: error.message || 'Error al conectar con Redis',
      error: {
        name: error.name,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
