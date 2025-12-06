/**
 * Endpoint de diagnóstico para verificar configuración de Pinecone
 *
 * Usa esto para confirmar qué threshold está usando Vercel en producción
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Leer el archivo pineconeTool para ver qué threshold tiene
    const fs = require('fs');
    const path = require('path');

    const toolPath = path.join(process.cwd(), 'app/api/chat/tools/pineconeTool.ts');
    const toolContent = fs.readFileSync(toolPath, 'utf8');

    // Buscar la línea del threshold
    const thresholdMatch = toolContent.match(/m\.score && m\.score > (0\.\d+)/);
    const threshold = thresholdMatch ? thresholdMatch[1] : 'NO ENCONTRADO';

    // Verificar variables de entorno
    const pineconeKey = process.env.PINECONE_API_KEY;
    const hasKey = !!pineconeKey;
    const keyPreview = pineconeKey ? `...${pineconeKey.slice(-6)}` : 'NO CONFIGURADA';

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      config: {
        threshold: threshold,
        thresholdType: threshold === '0.35' ? '✅ CORRECTO (nuevo)' : '❌ INCORRECTO (viejo)',
        pineconeApiKey: keyPreview,
        hasApiKey: hasKey,
        nodeEnv: process.env.NODE_ENV,
      },
      deployment: {
        vercelUrl: process.env.VERCEL_URL || 'LOCAL',
        vercelEnv: process.env.VERCEL_ENV || 'development',
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'N/A',
      },
      message: threshold === '0.35'
        ? '✅ Threshold correcto - debería funcionar'
        : '❌ Threshold incorrecto - código viejo desplegado'
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
