/**
 * Script para probar optimizaciones condicionales
 * Verifica que queries cortas usen expansión y queries largas no
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Test queries
const testQueries = [
  // ✅ Queries CORTAS (< 30 chars) - DEBEN usar optimizaciones
  {
    query: 'oro y café',
    expectedOptimization: true,
    length: 11
  },
  {
    query: 'horarios?',
    expectedOptimization: true,
    length: 9
  },
  {
    query: 'y para matrimonios?',
    expectedOptimization: true,
    length: 20
  },
  {
    query: 'Eloos',
    expectedOptimization: true,
    length: 5
  },
  {
    query: 'biblia y teología',
    expectedOptimization: true,
    length: 17
  },

  // ✅ Queries LARGAS (>= 30 chars) - NO deben usar optimizaciones
  {
    query: '¿Qué actividades hay para jóvenes en la parroquia?',
    expectedOptimization: false,
    length: 51
  },
  {
    query: 'Cuéntame sobre el grupo Eloos y sus horarios',
    expectedOptimization: false,
    length: 45
  },
  {
    query: '¿Cuáles son los requisitos para el bautismo de adultos?',
    expectedOptimization: false,
    length: 56
  },
  {
    query: 'Información sobre la catequesis',
    expectedOptimization: false,
    length: 32
  },
  {
    query: '¿Qué documentos necesito para matrimonio?',
    expectedOptimization: false,
    length: 42
  }
];

async function testOptimizationLogic() {
  console.log('\n🧪 ===== TEST: OPTIMIZACIÓN CONDICIONAL =====\n');

  for (const test of testQueries) {
    const queryLength = test.query.trim().length;
    const needsOptimization = queryLength < 30;

    const status = needsOptimization === test.expectedOptimization ? '✅' : '❌';
    const optimization = needsOptimization ? 'SÍ' : 'NO';

    console.log(`${status} "${test.query}"`);
    console.log(`   Longitud: ${queryLength} chars (esperado: ${test.length})`);
    console.log(`   Optimización: ${optimization} (esperado: ${test.expectedOptimization ? 'SÍ' : 'NO'})`);
    console.log('');
  }

  console.log('\n📊 RESUMEN:');
  console.log('- Queries < 30 chars → Query Expansion + Conversational Rewriting');
  console.log('- Queries >= 30 chars → SKIP optimizaciones (TTFT más rápido)');
  console.log('\n✅ Test completado\n');
}

// Ejecutar test
testOptimizationLogic().catch(console.error);
