/**
 * Test DIRECTO de búsquedas en Pinecone
 * Mide tiempos con y sin Query Expansion
 */

// Cargar .env ANTES de imports
import dotenv from 'dotenv';
dotenv.config();

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Inicializar clientes
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const index = pc.index('parroquias');

// Query Expansion (copiada de pineconeTool)
async function expandQuery(query: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.1,
      system: `Eres un experto en reformular preguntas sobre parroquias católicas.

Genera 3 variaciones breves de la pregunta del usuario para mejorar búsquedas:

1. Una versión expandida (añade "qué es", "información sobre", etc)
2. Una versión con sinónimos y términos relacionados
3. Una versión con contexto específico (grupo parroquial, actividad, sacramento)

REGLAS CRÍTICAS:
- PRESERVA nombres propios EXACTAMENTE: "Eloos", "Oro y Café", "Bartimeo", "Dalmanuta"
- Si detectas un nombre de grupo/actividad, úsalo tal cual en todas las variaciones
- Sé CONCISO (máximo 15 palabras por variación)
- Si la query es solo un nombre, expándela a pregunta
- Añade contexto parroquial/católico relevante

Ejemplos:
"oro y café" →
información sobre el grupo Oro y Café de la parroquia
encuentro de parejas Oro y Café horarios y actividades
grupo matrimonial Oro y Café en las parroquias

Responde SOLO con las 3 variaciones, una por línea, sin numeración.`,
      messages: [{ role: 'user', content: query }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const variations = content.split('\n').map(line => line.trim()).filter(line => line.length > 0).slice(0, 3);
    return [query, ...variations];
  } catch (error) {
    console.warn('⚠️ Query Expansion falló:', error);
    return [query];
  }
}

// Reciprocal Rank Fusion
function reciprocalRankFusion(resultSets: any[][], k: number = 60): any[] {
  const scoreMap = new Map();

  resultSets.forEach((results) => {
    results.forEach((match, rank) => {
      const id = match.id;
      const rrfScore = 1 / (k + rank + 1);

      if (scoreMap.has(id)) {
        const existing = scoreMap.get(id);
        existing.score += rrfScore;
      } else {
        scoreMap.set(id, { score: rrfScore, match });
      }
    });
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(item => item.match);
}

// Búsqueda CON optimización
async function searchWithExpansion(query: string) {
  const startTime = Date.now();

  const queryLength = query.trim().length;
  const needsExpansion = queryLength < 30;

  console.log(`📏 Longitud: ${queryLength} chars | Expansion: ${needsExpansion ? 'SÍ' : 'NO'}`);

  let expandedQueries: string[];
  if (needsExpansion) {
    expandedQueries = await expandQuery(query);
    console.log(`📝 Queries expandidas: ${expandedQueries.length}`);
  } else {
    expandedQueries = [query];
    console.log(`⚡ SKIP expansion - query auto-contenida`);
  }

  // Generar embeddings en paralelo
  const embeddingPromises = expandedQueries.map(q =>
    openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: q,
      dimensions: 3072
    })
  );

  const embeddingResponses = await Promise.all(embeddingPromises);

  // Buscar en Pinecone en paralelo
  const searchPromises = embeddingResponses.map(embeddingResponse =>
    index.query({
      vector: embeddingResponse.data[0].embedding,
      topK: 5,
      includeMetadata: true
    })
  );

  const searchResults = await Promise.all(searchPromises);

  // Fusionar resultados
  const allMatches = searchResults.map(result => result.matches || []);
  const fusedResults = reciprocalRankFusion(allMatches);

  const duration = Date.now() - startTime;

  return { duration, results: fusedResults.slice(0, 3), needsExpansion };
}

async function runTests() {
  console.log('\n🧪 ===== TEST REAL: PINECONE CON OPTIMIZACIÓN CONDICIONAL =====\n');

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

  const results: any[] = [];

  console.log('🔹 QUERIES CORTAS (< 30 chars) - CON OPTIMIZACIONES 🔹\n');

  for (const query of shortQueries) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔹 "${query}"`);
    console.log('='.repeat(70));

    const result = await searchWithExpansion(query);
    console.log(`⏱️  TIEMPO: ${result.duration}ms`);
    console.log(`📄 ${result.results.length} resultados encontrados`);

    results.push({ query, type: 'SHORT', ...result });
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n\n🔸 QUERIES LARGAS (>= 30 chars) - SIN OPTIMIZACIONES 🔸\n');

  for (const query of longQueries) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔸 "${query}"`);
    console.log('='.repeat(70));

    const result = await searchWithExpansion(query);
    console.log(`⏱️  TIEMPO: ${result.duration}ms`);
    console.log(`📄 ${result.results.length} resultados encontrados`);

    results.push({ query, type: 'LONG', ...result });
    await new Promise(r => setTimeout(r, 500));
  }

  // Resumen
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(80) + '\n');

  const shortResults = results.filter(r => r.type === 'SHORT');
  const longResults = results.filter(r => r.type === 'LONG');

  const avgShort = shortResults.reduce((sum, r) => sum + r.duration, 0) / shortResults.length;
  const avgLong = longResults.reduce((sum, r) => sum + r.duration, 0) / longResults.length;

  console.log(`🔹 QUERIES CORTAS (< 30 chars):`);
  console.log(`   Optimizaciones: ✅ Query Expansion (4 queries) + RRF`);
  console.log(`   Queries probadas: ${shortResults.length}`);
  console.log(`   Tiempo promedio: ${avgShort.toFixed(0)}ms`);
  console.log(`   Tiempos: ${shortResults.map(r => `${r.duration}ms`).join(', ')}\n`);

  console.log(`🔸 QUERIES LARGAS (>= 30 chars):`);
  console.log(`   Optimizaciones: ❌ SKIP (1 query directa)`);
  console.log(`   Queries probadas: ${longResults.length}`);
  console.log(`   Tiempo promedio: ${avgLong.toFixed(0)}ms`);
  console.log(`   Tiempos: ${longResults.map(r => `${r.duration}ms`).join(', ')}\n`);

  const speedup = (avgShort / avgLong).toFixed(1);
  const savings = (avgShort - avgLong).toFixed(0);

  console.log(`🚀 MEJORA DE RENDIMIENTO:`);
  console.log(`   - Queries largas ${speedup}× más rápidas`);
  console.log(`   - Ahorro promedio: ${savings}ms por query larga`);
  console.log(`   - Reducción latencia: ${((1 - avgLong/avgShort) * 100).toFixed(0)}%\n`);

  console.log('='.repeat(80));
  console.log('✅ Test completado');
  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
