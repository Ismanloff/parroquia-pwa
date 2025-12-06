/**
 * Script de prueba para verificar conexión a Pinecone
 *
 * Ejecutar: npx tsx backend/scripts/test-pinecone.ts
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testPinecone() {
  console.log('🧪 Iniciando prueba de Pinecone...\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno...');
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!pineconeApiKey) {
    console.error('❌ PINECONE_API_KEY no configurada');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY no configurada');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas\n');

  // 2. Conectar a Pinecone
  console.log('2️⃣ Conectando a Pinecone...');
  const pc = new Pinecone({ apiKey: pineconeApiKey });
  const index = pc.index('parroquias');
  console.log('✅ Conectado al índice "parroquias"\n');

  // 3. Verificar estadísticas del índice
  console.log('3️⃣ Obteniendo estadísticas del índice...');
  try {
    const stats = await index.describeIndexStats();
    console.log('📊 Estadísticas del índice:');
    console.log(`   - Total de vectores: ${stats.totalRecordCount || 0}`);
    console.log(`   - Dimensiones: ${stats.dimension || 0}`);
    console.log(`   - Namespaces:`, stats.namespaces || {});
    console.log('✅ Índice verificado\n');
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    process.exit(1);
  }

  // 4. Crear cliente OpenAI
  console.log('4️⃣ Inicializando OpenAI...');
  const openai = new OpenAI({ apiKey: openaiApiKey });
  console.log('✅ Cliente OpenAI inicializado\n');

  // 5. Probar búsqueda semántica
  console.log('5️⃣ Probando búsqueda semántica...');
  const testQuery = '¿Qué es Eloos?';
  console.log(`   Query: "${testQuery}"\n`);

  // Generar embedding
  console.log('   Generando embedding...');
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: testQuery,
    dimensions: 3072
  });
  console.log('   ✅ Embedding generado\n');

  // Buscar en Pinecone
  console.log('   Buscando en Pinecone...');
  const startTime = Date.now();
  const results = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 3,
    includeMetadata: true
  });
  const duration = Date.now() - startTime;

  console.log(`   ⚡ Búsqueda completada en ${duration}ms\n`);

  // Mostrar resultados
  if (!results.matches || results.matches.length === 0) {
    console.log('   ⚠️ No se encontraron resultados');
  } else {
    console.log(`   📄 Encontrados ${results.matches.length} resultados:\n`);

    results.matches.forEach((match, i) => {
      const meta = match.metadata as any;
      const score = Math.round((match.score || 0) * 100);

      console.log(`   ${i + 1}. [${score}% relevante]`);
      console.log(`      Título: ${meta.titulo || 'Sin título'}`);
      console.log(`      Categoría: ${meta.categoria_pastoral || 'N/A'}`);
      console.log(`      Parroquia: ${meta.parroquia_ubicacion || 'N/A'}`);
      console.log(`      Preview: ${(meta.pageContent || '').substring(0, 150)}...`);
      console.log('');
    });
  }

  console.log('✅ Prueba completada exitosamente! 🎉\n');
  console.log('📋 Resumen:');
  console.log(`   - Conexión a Pinecone: ✅`);
  console.log(`   - Generación de embeddings: ✅`);
  console.log(`   - Búsqueda vectorial: ✅ (${duration}ms)`);
  console.log(`   - Resultados encontrados: ${results.matches?.length || 0}`);
  console.log('\n🚀 Pinecone está listo para producción!');
}

// Ejecutar prueba
testPinecone().catch((error) => {
  console.error('\n❌ Error en la prueba:', error);
  process.exit(1);
});
