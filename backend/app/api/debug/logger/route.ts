import { NextRequest, NextResponse } from 'next/server';

// Store de logs en memoria (solo para debug)
// En producción usarías una DB, pero para debug esto es perfecto
const logs: any[] = [];
const MAX_LOGS = 500; // Máximo 500 logs en memoria

export async function GET(request: NextRequest) {
  // Obtener logs
  return NextResponse.json({
    logs: logs,
    count: logs.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const log = await request.json();

    // Añadir timestamp del servidor
    const logEntry = {
      ...log,
      serverTimestamp: new Date().toISOString(),
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };

    // Añadir al principio (logs más recientes primero)
    logs.unshift(logEntry);

    // Mantener solo los últimos MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS;
    }

    return NextResponse.json({ success: true, id: logEntry.id });
  } catch (error) {
    console.error('Error storing log:', error);
    return NextResponse.json({ error: 'Failed to store log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Limpiar todos los logs
  logs.length = 0;
  return NextResponse.json({ success: true, message: 'Logs cleared' });
}
