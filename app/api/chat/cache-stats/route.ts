import { NextResponse } from 'next/server';
import { semanticCache } from '../utils/semanticCache';

/**
 * Endpoint para ver estadísticas del cache semántico
 * GET /api/chat/cache-stats
 */
export async function GET() {
  try {
    const stats = await semanticCache.getStats();

    return NextResponse.json({
      ...stats,
      message: `Cache tiene ${stats.size} entradas`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener stats del cache' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para limpiar el cache
 * DELETE /api/chat/cache-stats
 */
export async function DELETE() {
  try {
    await semanticCache.clear();

    return NextResponse.json({
      message: 'Cache limpiado exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al limpiar cache' },
      { status: 500 }
    );
  }
}
