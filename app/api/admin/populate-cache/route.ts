/**
 * API Endpoint para poblar el Semantic Cache con Redis Cloud
 * Uso: POST https://tu-backend.vercel.app/api/admin/populate-cache
 *
 * Carga 43 preguntas + 228 variaciones = 271 entradas totales
 * IMPORTANTE: Proteger esta ruta en producción o eliminarla después de usar
 */

import { NextRequest, NextResponse } from 'next/server';
import { semanticCache } from '../../chat/utils/semanticCache';
import FAQ_JSON from '@/Cache/faq_parroquial.json';

const FAQ_DATA = FAQ_JSON.questions || [];

interface QAPair {
  question: string;
  answer: string;
  variations?: string[];
}

export async function POST(_request: NextRequest) {
  try {
    console.log('\n🚀 Iniciando población del Semantic Cache con variaciones...\n');

    let successCount = 0;
    let errorCount = 0;
    let totalEntries = 0;
    const results = [];

    for (let i = 0; i < FAQ_DATA.length; i++) {
      const item = FAQ_DATA[i] as QAPair;
      const { question, answer, variations } = item;

      if (!question || !answer) {
        errorCount++;
        results.push({ index: i + 1, status: 'error', reason: 'Missing question or answer' });
        continue;
      }

      try {
        // Guardar pregunta principal
        await semanticCache.set(question, answer);
        console.log(`✅ [${i + 1}/${FAQ_DATA.length}] Cacheado: "${question.substring(0, 60)}"`);
        successCount++;
        totalEntries++;

        // Guardar variaciones
        if (variations && variations.length > 0) {
          for (const variation of variations) {
            await semanticCache.set(variation, answer);
            totalEntries++;
          }
          console.log(`   📝 + ${variations.length} variaciones guardadas`);
        }

        results.push({
          index: i + 1,
          status: 'success',
          question: question.substring(0, 60),
          variations: variations?.length || 0
        });

      } catch (error) {
        console.error(`❌ [${i + 1}/${FAQ_DATA.length}] Error:`, error);
        errorCount++;
        results.push({
          index: i + 1,
          status: 'error',
          question: question.substring(0, 60),
          error: String(error)
        });
      }
    }

    console.log(`\n✅ Cache poblado completamente!`);
    console.log(`📊 Preguntas: ${successCount}/${FAQ_DATA.length}`);
    console.log(`📊 Total entradas (con variaciones): ${totalEntries}`);
    console.log(`❌ Errores: ${errorCount}\n`);

    return NextResponse.json({
      success: true,
      message: 'Cache poblado exitosamente con variaciones',
      summary: {
        total_questions: FAQ_DATA.length,
        successful_questions: successCount,
        total_cache_entries: totalEntries,
        errors: errorCount,
        ttl_hours: 1,
      },
      results,
    });

  } catch (error) {
    console.error('❌ Error fatal:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
