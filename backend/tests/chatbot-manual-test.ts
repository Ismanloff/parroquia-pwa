/**
 * Test Manual del Chatbot Parroquial
 *
 * Script para probar el chatbot con preguntas reales de forma rápida
 * Uso: npx ts-node backend/tests/chatbot-manual-test.ts
 */

// Configuración del backend (ajusta según tu entorno)
const TEST_TEST_API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000';

// 🧪 Dataset de preguntas específicas de la parroquia
const testQuestions = [
  {
    category: '📅 Horarios de Misa',
    questions: [
      '¿A qué hora son las misas?',
      '¿Cuándo es la misa del domingo?',
      '¿Hay misa entre semana?',
      'Horarios de misa de la Transfiguración',
      '¿A qué hora es la misa de la tarde?',
    ],
  },
  {
    category: '📞 Contacto',
    questions: [
      '¿Cuál es el teléfono de la parroquia?',
      '¿Cómo contacto con el párroco?',
      'Teléfono de la Transfiguración',
      '¿Dónde está la oficina parroquial?',
      'Dirección de la parroquia',
    ],
  },
  {
    category: '👥 Grupos Parroquiales',
    questions: [
      '¿Qué es Eloos?',
      '¿Cómo me apunto a Eloos?',
      'Grupos de jóvenes',
      '¿Hay catequesis para niños?',
      'Quiero inscribir a mi hijo en catequesis',
    ],
  },
  {
    category: '⛪ Información Parroquial',
    questions: [
      '¿Qué parroquias hay?',
      'Cuéntame sobre San Viator',
      '¿Quién es el párroco?',
      'Historia de la parroquia',
      '¿Dónde está la parroquia de la Soledad?',
    ],
  },
  {
    category: '📆 Eventos',
    questions: [
      '¿Qué eventos hay esta semana?',
      '¿Cuándo es la próxima actividad?',
      '¿Hay algo programado para el fin de semana?',
      'Eventos del mes',
    ],
  },
  {
    category: '🙏 Sacramentos',
    questions: [
      '¿Cuándo hay confesiones?',
      'Horario de confesión',
      '¿Cómo me caso por la iglesia?',
      'Quiero bautizar a mi hijo',
      'Información sobre primera comunión',
    ],
  },
  {
    category: '❌ Preguntas Fuera de Tema (deben bloquearse)',
    questions: [
      '¿Cuál es el precio del Bitcoin?',
      '¿Quién ganó el partido de fútbol?',
      'Receta de paella',
      '¿Qué tiempo hace mañana?',
    ],
  },
  {
    category: '✅ Respuestas Genéricas (deben ser rápidas)',
    questions: [
      'gracias',
      'vale',
      'ok',
      'genial gracias',
      'entendido',
    ],
  },
];

// Función para testear una pregunta
async function testQuestion(question: string): Promise<{
  question: string;
  response: string;
  responseTime: number;
  hasAttachments: boolean;
  isGeneric: boolean;
  isBlocked: boolean;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${TEST_API_BASE}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        conversationHistory: [],
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      question,
      response: data.message || data.error || 'Sin respuesta',
      responseTime,
      hasAttachments: data.attachments && data.attachments.length > 0,
      isGeneric: data.generic || false,
      isBlocked: data.guardrail || false,
    };
  } catch (error: any) {
    return {
      question,
      response: '',
      responseTime: Date.now() - startTime,
      hasAttachments: false,
      isGeneric: false,
      isBlocked: false,
      error: error.message,
    };
  }
}

// Función para mostrar resultados con colores
function printResult(result: Awaited<ReturnType<typeof testQuestion>>) {
  const statusEmoji = result.error ? '❌' : result.isBlocked ? '🚫' : result.isGeneric ? '⚡' : '✅';
  const timeColor = result.responseTime < 2000 ? '\x1b[32m' : result.responseTime < 5000 ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`\n${statusEmoji} Pregunta: "${result.question}"`);
  console.log(`   Tiempo: ${timeColor}${result.responseTime}ms${reset}`);

  if (result.error) {
    console.log(`   ❌ Error: ${result.error}`);
  } else {
    console.log(`   Respuesta: ${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}`);

    if (result.hasAttachments) {
      console.log('   📎 Con archivos adjuntos');
    }
    if (result.isGeneric) {
      console.log('   ⚡ Respuesta genérica (rápida)');
    }
    if (result.isBlocked) {
      console.log('   🚫 Bloqueado por guardrail');
    }
  }
}

// Función principal
async function runTests() {
  console.log('\n🧪 ========================================');
  console.log('   TEST MANUAL DEL CHATBOT PARROQUIAL');
  console.log('========================================\n');
  console.log(`🔗 Backend: ${TEST_API_BASE}`);
  console.log(`📊 Total de preguntas: ${testQuestions.reduce((acc, cat) => acc + cat.questions.length, 0)}\n`);

  // Preguntar si quiere test completo o selectivo
  console.log('Opciones:');
  console.log('1. Test completo (todas las preguntas)');
  console.log('2. Test por categoría');
  console.log('3. Pregunta personalizada\n');

  // Para este script, haremos test completo
  // En producción podrías agregar readline para interactividad

  const allResults: Array<Awaited<ReturnType<typeof testQuestion>>> = [];

  for (const category of testQuestions) {
    console.log(`\n📂 ${category.category}`);
    console.log('─'.repeat(50));

    for (const question of category.questions) {
      const result = await testQuestion(question);
      allResults.push(result);
      printResult(result);

      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Resumen final
  console.log('\n\n📊 ========================================');
  console.log('   RESUMEN DE RESULTADOS');
  console.log('========================================\n');

  const successful = allResults.filter(r => !r.error);
  const failed = allResults.filter(r => r.error);
  const generic = allResults.filter(r => r.isGeneric);
  const blocked = allResults.filter(r => r.isBlocked);
  const withAttachments = allResults.filter(r => r.hasAttachments);

  const avgTime = successful.reduce((acc, r) => acc + r.responseTime, 0) / successful.length;

  console.log(`✅ Exitosas: ${successful.length}/${allResults.length}`);
  console.log(`❌ Fallidas: ${failed.length}/${allResults.length}`);
  console.log(`⚡ Genéricas: ${generic.length}`);
  console.log(`🚫 Bloqueadas: ${blocked.length}`);
  console.log(`📎 Con adjuntos: ${withAttachments.length}`);
  console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(0)}ms`);

  // Análisis de calidad
  console.log('\n📈 Análisis de Calidad:');

  const fastResponses = successful.filter(r => r.responseTime < 2000).length;
  const mediumResponses = successful.filter(r => r.responseTime >= 2000 && r.responseTime < 5000).length;
  const slowResponses = successful.filter(r => r.responseTime >= 5000).length;

  console.log(`   🚀 Rápidas (<2s): ${fastResponses}`);
  console.log(`   🐢 Medias (2-5s): ${mediumResponses}`);
  console.log(`   🐌 Lentas (>5s): ${slowResponses}`);

  if (failed.length > 0) {
    console.log('\n❌ Preguntas Fallidas:');
    failed.forEach(r => {
      console.log(`   - "${r.question}": ${r.error}`);
    });
  }

  console.log('\n✅ Test completado!\n');
}

// Ejecutar tests
runTests().catch(console.error);
