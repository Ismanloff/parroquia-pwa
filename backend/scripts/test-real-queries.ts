/**
 * Test REAL de queries cortas vs largas con pineconeTool
 * Mide tiempos y verifica optimizaciones
 */

// IMPORTANTE: Cargar .env ANTES de cualquier import que use variables de entorno
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'backend/.env');
dotenv.config({ path: envPath });

// Verificar que las variables críticas estén cargadas
if (!process.env.PINECONE_API_KEY) {
  console.error('❌ ERROR: PINECONE_API_KEY no encontrada en .env');
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY no encontrada en .env');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ERROR: ANTHROPIC_API_KEY no encontrada en .env');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente\n');

// Ahora sí, importar la función de búsqueda (ya tiene acceso a las env vars)
import { searchPinecone } from '../app/api/chat/tools/pineconeTool';

// Test queries
const shortQueries = [
  'oro y café',
  'Eloos',
  'horarios catequesis',
  'oración madres'
];

const longQueries = [
  '¿Qué actividades hay para jóvenes en la parroquia?',
  'Cuéntame sobre el grupo Eloos y sus horarios',
  '¿Cuáles son los requisitos para bautizar a mi bebé?',
  'Información sobre el grupo de oración de madres y sus reuniones'
];

async function testQuery(query: string, type: 'SHORT' | 'LONG') {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${type === 'SHORT' ? '🔹' : '🔸'} ${type} QUERY: "${query}"`);
  console.log(`${'='.repeat(80)}`);

  const startTime = Date.now();

  try {
    const result = await searchPinecone(query, null);
    const duration = Date.now() - startTime;

    console.log(`\n⏱️  TIEMPO TOTAL: ${duration}ms`);
    console.log(`📄 RESULTADO (primeros 200 chars):`);
    console.log(result.substring(0, 200) + '...\n');

    return { query, type, duration, success: true };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ ERROR: ${error.message}`);
    console.log(`⏱️  TIEMPO: ${duration}ms\n`);

    return { query, type, duration, success: false };
  }
}

async function runTests() {
  console.log('\n🧪 ===== TEST REAL: QUERIES CORTAS VS LARGAS =====\n');

  const results: any[] = [];

  // Test queries cortas
  console.log('\n🔹🔹🔹 QUERIES CORTAS (< 30 chars) - CON OPTIMIZACIONES 🔹🔹🔹\n');
  for (const query of shortQueries) {
    const result = await testQuery(query, 'SHORT');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa 1s entre queries
  }

  // Test queries largas
  console.log('\n🔸🔸🔸 QUERIES LARGAS (>= 30 chars) - SIN OPTIMIZACIONES 🔸🔸🔸\n');
  for (const query of longQueries) {
    const result = await testQuery(query, 'LONG');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa 1s entre queries
  }

  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(80) + '\n');

  const shortResults = results.filter(r => r.type === 'SHORT' && r.success);
  const longResults = results.filter(r => r.type === 'LONG' && r.success);

  const avgShort = shortResults.reduce((sum, r) => sum + r.duration, 0) / shortResults.length;
  const avgLong = longResults.reduce((sum, r) => sum + r.duration, 0) / longResults.length;

  console.log(`🔹 QUERIES CORTAS (< 30 chars):`);
  console.log(`   - Optimizaciones: ✅ Query Expansion + RRF`);
  console.log(`   - Queries probadas: ${shortResults.length}`);
  console.log(`   - Tiempo promedio: ${avgShort.toFixed(0)}ms`);
  console.log(`   - Tiempos individuales: ${shortResults.map(r => `${r.duration}ms`).join(', ')}\n`);

  console.log(`🔸 QUERIES LARGAS (>= 30 chars):`);
  console.log(`   - Optimizaciones: ❌ SKIP (query auto-contenida)`);
  console.log(`   - Queries probadas: ${longResults.length}`);
  console.log(`   - Tiempo promedio: ${avgLong.toFixed(0)}ms`);
  console.log(`   - Tiempos individuales: ${longResults.map(r => `${r.duration}ms`).join(', ')}\n`);

  const speedup = (avgShort / avgLong).toFixed(1);
  console.log(`🚀 MEJORA DE RENDIMIENTO: ${speedup}× más rápido para queries largas\n`);

  console.log('='.repeat(80));
  console.log('✅ Test completado');
  console.log('='.repeat(80) + '\n');
}

// Ejecutar tests
runTests().catch(console.error);
