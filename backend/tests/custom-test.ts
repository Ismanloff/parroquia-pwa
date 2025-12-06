/**
 * Custom Test - Preguntas específicas del usuario
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Preguntas personalizadas del usuario
const customQuestions = [
  '¿Qué es eloos?',
  '¿Qué hay este finde semana?',
  '¿Qué es oración de madres?',
  '¿Cómo consigo la partida de bautismo?',
  '¿Certificado matrimonial?',
  '¿Congregaciones?',
  '¿Quiénes son hijas de jesús?',
  '¿A qué se dedican?',
];

async function testQuestion(question: string, index: number) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        userId: 'test-user-custom',
        chatId: `custom-test-${Date.now()}-${index}`,
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
      attachmentCount: data.attachments?.length || 0,
      isGeneric: responseTime < 1000,
      isBlocked: data.response?.includes('no puedo ayudarte') || data.response?.includes('fuera de mis capacidades'),
      status: response.status,
    };
  } catch (error: any) {
    return {
      question,
      success: false,
      responseTime: Date.now() - startTime,
      response: `Error: ${error.message}`,
      hasAttachments: false,
      attachmentCount: 0,
      isGeneric: false,
      isBlocked: false,
      status: 0,
    };
  }
}

async function runCustomTest() {
  console.log('\n🎯 TEST PERSONALIZADO - 8 Preguntas Específicas');
  console.log('═'.repeat(70));
  console.log(`🔗 Backend: ${API_BASE}\n`);

  const results = [];

  for (let i = 0; i < customQuestions.length; i++) {
    const question = customQuestions[i];
    const testNumber = i + 1;

    console.log(`\n[${ testNumber}/8] 💬 "${question}"`);
    process.stdout.write('   ⏳ Esperando respuesta...');

    const result = await testQuestion(question, i);
    results.push(result);

    // Clear the "waiting" line
    process.stdout.write('\r');

    // Print result
    const statusIcon = result.success ? '✅' : '❌';
    const timeMs = result.responseTime;
    const timeSec = (timeMs / 1000).toFixed(1);
    const timeColor = timeMs < 2000 ? '\x1b[32m' : timeMs < 10000 ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`   ${statusIcon} Tiempo: ${timeColor}${timeSec}s (${timeMs}ms)${reset}`);

    if (result.success) {
      // Show first 200 chars of response
      const preview = result.response.substring(0, 200).replace(/\n/g, ' ');
      console.log(`   📝 Respuesta: ${preview}${result.response.length > 200 ? '...' : ''}`);

      if (result.hasAttachments) {
        console.log(`   📎 Archivos adjuntos: ${result.attachmentCount}`);
      }
      if (result.isGeneric) {
        console.log('   ⚡ Respuesta genérica (rápida)');
      }
      if (result.isBlocked) {
        console.log('   🚫 Bloqueado por guardrail');
      }
    } else {
      console.log(`   ❌ Error: ${result.response}`);
    }

    // Pausa corta entre tests
    if (i < customQuestions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('═'.repeat(70));

  const successCount = results.filter(r => r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
  const avgTime = Math.round(totalTime / results.length);
  const withAttachments = results.filter(r => r.hasAttachments).length;
  const totalAttachments = results.reduce((sum, r) => sum + r.attachmentCount, 0);
  const genericCount = results.filter(r => r.isGeneric).length;
  const blockedCount = results.filter(r => r.isBlocked).length;
  const fastQueries = results.filter(r => r.responseTime < 5000).length;
  const slowQueries = results.filter(r => r.responseTime > 10000).length;

  console.log(`\n✅ Tests exitosos: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  console.log(`⏱️  Tiempo promedio: ${(avgTime/1000).toFixed(1)}s`);
  console.log(`⚡ Consultas rápidas (<5s): ${fastQueries}`);
  console.log(`🐌 Consultas lentas (>10s): ${slowQueries}`);
  console.log(`📎 Con attachments: ${withAttachments} (${totalAttachments} archivos totales)`);
  console.log(`⚡ Respuestas genéricas: ${genericCount}`);
  console.log(`🚫 Bloqueados por guardrail: ${blockedCount}`);

  // Show slowest and fastest queries
  const sortedByTime = [...results].sort((a, b) => b.responseTime - a.responseTime);
  console.log('\n🏆 Consulta más rápida:');
  console.log(`   "${sortedByTime[sortedByTime.length - 1].question}" - ${(sortedByTime[sortedByTime.length - 1].responseTime/1000).toFixed(1)}s`);
  console.log('\n🐢 Consulta más lenta:');
  console.log(`   "${sortedByTime[0].question}" - ${(sortedByTime[0].responseTime/1000).toFixed(1)}s`);

  console.log('\n✨ Test completado!\n');
}

runCustomTest().catch(console.error);
