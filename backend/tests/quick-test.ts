/**
 * Quick Test - 8 preguntas clave del chatbot
 * Tiempo estimado: 1-2 minutos
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// 8 preguntas clave que cubren todas las áreas
const quickTests = [
  { q: '¿A qué hora son las misas?', expect: 'horarios' },
  { q: '¿Cuál es el teléfono de la parroquia?', expect: 'teléfono/contacto' },
  { q: '¿Qué es Eloos?', expect: 'grupo joven + attachment' },
  { q: '¿Quién es el párroco?', expect: 'nombre párroco' },
  { q: '¿Cómo me preparo para la confirmación?', expect: 'sacramento' },
  { q: 'gracias', expect: 'respuesta genérica rápida' },
  { q: '¿Dónde está la parroquia?', expect: 'dirección' },
  { q: 'cuéntame un chiste', expect: 'bloqueo guardrail' },
];

async function testQuestion(question: string) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        userId: 'test-user-quick',
        chatId: `quick-test-${Date.now()}`,
      }),
    });

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return {
      question,
      success: response.ok,
      responseTime,
      response: data.response || data.error || 'Sin respuesta',
      hasAttachments: data.attachments && data.attachments.length > 0,
      isGeneric: responseTime < 1000,
      isBlocked: data.response?.includes('no puedo ayudarte') || data.response?.includes('fuera de mis capacidades'),
    };
  } catch (error: any) {
    return {
      question,
      success: false,
      responseTime: Date.now() - startTime,
      response: `Error: ${error.message}`,
      hasAttachments: false,
      isGeneric: false,
      isBlocked: false,
    };
  }
}

async function runQuickTest() {
  console.log('\n⚡ QUICK TEST - 8 Preguntas Clave');
  console.log('═'.repeat(60));
  console.log(`🔗 Backend: ${API_BASE}\n`);

  const results = [];
  let testNumber = 1;

  for (const test of quickTests) {
    process.stdout.write(`\n[${testNumber}/8] Testing: "${test.q}"...`);

    const result = await testQuestion(test.q);
    results.push(result);

    // Print result
    const statusIcon = result.success ? '✅' : '❌';
    const timeColor = result.responseTime < 2000 ? '\x1b[32m' : result.responseTime < 10000 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(` ${statusIcon} ${timeColor}${result.responseTime}ms${reset}`);
    console.log(`   Esperado: ${test.expect}`);
    console.log(`   Respuesta: ${result.response.substring(0, 120)}${result.response.length > 120 ? '...' : ''}`);

    if (result.hasAttachments) console.log('   📎 Con archivos adjuntos');
    if (result.isGeneric) console.log('   ⚡ Respuesta genérica (rápida)');
    if (result.isBlocked) console.log('   🚫 Bloqueado por guardrail');

    testNumber++;

    // Pausa corta entre tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN');
  console.log('═'.repeat(60));

  const successCount = results.filter(r => r.success).length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length);
  const withAttachments = results.filter(r => r.hasAttachments).length;
  const genericCount = results.filter(r => r.isGeneric).length;
  const blockedCount = results.filter(r => r.isBlocked).length;

  console.log(`✅ Tests exitosos: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`⏱️  Tiempo promedio: ${avgTime}ms`);
  console.log(`📎 Con attachments: ${withAttachments}`);
  console.log(`⚡ Respuestas genéricas: ${genericCount}`);
  console.log(`🚫 Bloqueados por guardrail: ${blockedCount}`);

  console.log('\n✨ Test completado!\n');
}

runQuickTest().catch(console.error);
