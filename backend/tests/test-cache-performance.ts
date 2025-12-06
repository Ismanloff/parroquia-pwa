/**
 * Test de rendimiento del cache
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Pregunta EXACTA del cache
const EXACT_FAQ_QUESTION = "¿Qué es la Oración de las Madres?";

async function testCachePerformance() {
  console.log('\n🧪 TEST DE RENDIMIENTO DEL CACHE\n');
  console.log(`🔗 Backend: ${API_BASE}\n`);

  // Test 1: Primera llamada (debería usar cache)
  console.log('📝 Test 1: Pregunta EXACTA del FAQ');
  console.log(`   Pregunta: "${EXACT_FAQ_QUESTION}"\n`);

  const start1 = Date.now();
  const res1 = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: EXACT_FAQ_QUESTION,
      userId: 'test-cache',
      chatId: `cache-test-${Date.now()}`,
    }),
  });

  const data1 = await res1.json();
  const time1 = Date.now() - start1;

  console.log(`   ⏱️  Tiempo: ${time1}ms (${(time1/1000).toFixed(2)}s)`);
  console.log(`   📦 From Cache: ${data1.fromCache || false}`);
  console.log(`   🗄️  Cache Source: ${data1.cacheSource || 'none'}`);
  console.log(`   📝 Respuesta: ${data1.message?.substring(0, 100) || data1.error}`);

  // Test 2: Pregunta similar (debería coincidir con 95%+)
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n📝 Test 2: Pregunta SIMILAR al FAQ');
  const SIMILAR_QUESTION = "que es oracion de madres";
  console.log(`   Pregunta: "${SIMILAR_QUESTION}"\n`);

  const start2 = Date.now();
  const res2 = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: SIMILAR_QUESTION,
      userId: 'test-cache',
      chatId: `cache-test-${Date.now()}`,
    }),
  });

  const data2 = await res2.json();
  const time2 = Date.now() - start2;

  console.log(`   ⏱️  Tiempo: ${time2}ms (${(time2/1000).toFixed(2)}s)`);
  console.log(`   📦 From Cache: ${data2.fromCache || false}`);
  console.log(`   🗄️  Cache Source: ${data2.cacheSource || 'none'}`);
  console.log(`   📝 Respuesta: ${data2.message?.substring(0, 100) || data2.error}`);

  // Test 3: Pregunta nueva (NO en cache)
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n📝 Test 3: Pregunta NO en cache (debería ir al agente)');
  const NEW_QUESTION = "¿Cuándo abre la iglesia mañana por la tarde?";
  console.log(`   Pregunta: "${NEW_QUESTION}"\n`);

  const start3 = Date.now();
  const res3 = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: NEW_QUESTION,
      userId: 'test-cache',
      chatId: `cache-test-${Date.now()}`,
    }),
  });

  const data3 = await res3.json();
  const time3 = Date.now() - start3;

  console.log(`   ⏱️  Tiempo: ${time3}ms (${(time3/1000).toFixed(2)}s)`);
  console.log(`   📦 From Cache: ${data3.fromCache || false}`);
  console.log(`   🗄️  Cache Source: ${data3.cacheSource || 'none'}`);
  console.log(`   📝 Respuesta: ${data3.message?.substring(0, 100) || data3.error}`);

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));

  const cacheHits = [data1.fromCache, data2.fromCache, data3.fromCache].filter(Boolean).length;
  console.log(`\n✅ Cache Hits: ${cacheHits}/3`);
  console.log(`⏱️  Tiempos:`);
  console.log(`   - Exacta: ${time1}ms ${data1.fromCache ? '(CACHE ✅)' : '(MISS ❌)'}`);
  console.log(`   - Similar: ${time2}ms ${data2.fromCache ? '(CACHE ✅)' : '(MISS ❌)'}`);
  console.log(`   - Nueva: ${time3}ms ${data3.fromCache ? '(CACHE ✅)' : '(MISS ❌)'}`);

  const improvement = data1.fromCache && !data3.fromCache
    ? `${((1 - time1/time3) * 100).toFixed(1)}%`
    : 'N/A';

  console.log(`\n🚀 Mejora con cache: ${improvement} más rápido`);
  console.log('\n✨ Test completado!\n');
}

testCachePerformance().catch(console.error);
