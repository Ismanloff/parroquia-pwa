/**
 * Test de calidad de respuestas: 10 queries (5 cortas, 5 largas)
 * Evalúa si las respuestas son coherentes con los documentos
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Inicializar clientes
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const index = pc.index('parroquias');

// Query Expansion
async function expandQuery(query: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.1,
      system: `Eres un experto en reformular preguntas sobre parroquias católicas.

Genera 3 variaciones breves de la pregunta del usuario para mejorar búsquedas semánticas:

TIPOS DE QUERY:

A) Queries de 1-2 palabras clave (ej: "testigos bautismo", "documentos matrimonio"):
   - Mantén las palabras clave EXACTAS en todas las variaciones
   - Expande con contexto mínimo: "requisitos para", "información sobre", "qué necesito para"
   - NO cambies términos técnicos por sinónimos

B) Nombres propios de grupos (ej: "Eloos", "Oro y Café"):
   - PRESERVA el nombre EXACTO en todas las variaciones
   - Añade contexto: "grupo", "actividades", "horarios", "reuniones"

REGLAS CRÍTICAS:
- Máximo 12 palabras por variación
- NO uses sinónimos para términos sacramentales: "testigos" NO es "padrinos"
- Mantén lenguaje simple y directo
- Si la query menciona documentos/requisitos/testigos, úsalos tal cual

Ejemplos:

"testigos bautismo" →
requisitos testigos bautismo
información testigos para bautismo
quiénes pueden ser testigos bautismo

"documentos matrimonio" →
qué documentos necesito para matrimonio
requisitos documentos expediente matrimonial
documentación necesaria matrimonio

"oro y café" →
grupo Oro y Café actividades
información Oro y Café horarios
encuentro parejas Oro y Café

Responde SOLO con las 3 variaciones, una por línea, sin numeración.`,
      messages: [{ role: 'user', content: query }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const variations = content.split('\n').map(line => line.trim()).filter(line => line.length > 0).slice(0, 3);
    return [query, ...variations];
  } catch (error) {
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

// Búsqueda con expansión
async function searchWithExpansion(query: string) {
  const startTime = Date.now();

  const queryLength = query.trim().length;
  const needsExpansion = queryLength < 30;

  let expandedQueries: string[];
  if (needsExpansion) {
    expandedQueries = await expandQuery(query);
  } else {
    expandedQueries = [query];
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

  return {
    duration,
    results: fusedResults.slice(0, 3),
    needsExpansion,
    expandedQueries
  };
}

// Generar respuesta con GPT-4o-mini (simulando el agente)
async function generateResponse(query: string, retrievedDocs: any[]) {
  const context = retrievedDocs.map((doc, i) => {
    const meta = doc.metadata as any;
    const content = meta?.pageContent || meta?.text || '';
    return `[Documento ${i + 1}]\n${content.substring(0, 800)}`;
  }).join('\n\n---\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: `Eres un asistente parroquial. Responde SOLO basándote en los documentos proporcionados.

REGLAS CRÍTICAS:
- USA información de los documentos
- Si no hay información relevante, di "No encontré información específica"
- Sé conciso y directo
- Menciona nombres de grupos/actividades tal cual aparecen`
      },
      {
        role: 'user',
        content: `Documentos recuperados:\n\n${context}\n\nPregunta del usuario: ${query}\n\nResponde basándote SOLO en los documentos:`
      }
    ]
  });

  return response.choices[0].message.content || '';
}

async function runQualityTest() {
  console.log('\n🧪 ===== TEST DE CALIDAD: 10 QUERIES =====\n');

  const queries = {
    short: [
      'Eloos',
      'oro y café',
      'Cáritas',
      'bautismo bebé',
      'testigos bautismo'
    ],
    long: [
      '¿Qué actividades hay para jóvenes en la parroquia?',
      '¿Cuáles son los requisitos para bautizar a mi bebé?',
      '¿Qué grupos de oración existen y cuándo se reúnen?',
      '¿Qué documentos necesito para el expediente matrimonial?',
      '¿Quiénes pueden ser testigos de bautismo y qué requisitos tienen?'
    ]
  };

  const allQueries = [...queries.short, ...queries.long];
  const results: any[] = [];

  for (let i = 0; i < allQueries.length; i++) {
    const query = allQueries[i];
    const isShort = i < 5;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`${isShort ? '🔹' : '🔸'} Query ${i + 1}/10 (${isShort ? 'CORTA' : 'LARGA'}): "${query}"`);
    console.log('='.repeat(80));

    // 1. Búsqueda en Pinecone
    const searchResult = await searchWithExpansion(query);
    console.log(`⏱️  Búsqueda: ${searchResult.duration}ms`);
    console.log(`📝 Expansión: ${searchResult.needsExpansion ? 'SÍ' : 'NO'}`);
    if (searchResult.needsExpansion) {
      console.log(`   Queries expandidas:`);
      searchResult.expandedQueries.forEach((q, idx) => {
        console.log(`   ${idx + 1}. ${q}`);
      });
    }

    // 2. Documentos recuperados
    console.log(`\n📄 Documentos recuperados (top 3):`);
    searchResult.results.forEach((doc, idx) => {
      const meta = doc.metadata as any;
      const score = doc.score ? (doc.score * 100).toFixed(1) : 'N/A';
      console.log(`   ${idx + 1}. [Score: ${score}%] ${meta?.file_name || 'Unknown'}`);
      console.log(`      Título: ${meta?.titulo || 'N/A'}`);
      console.log(`      Snippet: ${(meta?.pageContent || meta?.text || '').substring(0, 100)}...`);
    });

    // 3. Generar respuesta
    const answer = await generateResponse(query, searchResult.results);
    console.log(`\n💬 RESPUESTA GENERADA:`);
    console.log(`   ${answer}`);

    results.push({
      query,
      type: isShort ? 'short' : 'long',
      searchDuration: searchResult.duration,
      needsExpansion: searchResult.needsExpansion,
      documentsFound: searchResult.results.length,
      topDocuments: searchResult.results.map(r => ({
        file: r.metadata?.file_name,
        score: r.score
      })),
      answer
    });

    // Pausa entre queries
    await new Promise(r => setTimeout(r, 1000));
  }

  // Resumen
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN DEL TEST');
  console.log('='.repeat(80) + '\n');

  const shortResults = results.filter(r => r.type === 'short');
  const longResults = results.filter(r => r.type === 'long');

  console.log(`🔹 QUERIES CORTAS (${shortResults.length}):`);
  shortResults.forEach((r, i) => {
    console.log(`\n${i + 1}. "${r.query}"`);
    console.log(`   ⏱️  ${r.searchDuration}ms`);
    console.log(`   📄 ${r.documentsFound} documentos`);
    console.log(`   📁 Principales: ${r.topDocuments.map((d: any) => d.file).join(', ')}`);
    console.log(`   💬 Respuesta: ${r.answer.substring(0, 150)}...`);
  });

  console.log(`\n\n🔸 QUERIES LARGAS (${longResults.length}):`);
  longResults.forEach((r, i) => {
    console.log(`\n${i + 1}. "${r.query}"`);
    console.log(`   ⏱️  ${r.searchDuration}ms`);
    console.log(`   📄 ${r.documentsFound} documentos`);
    console.log(`   📁 Principales: ${r.topDocuments.map((d: any) => d.file).join(', ')}`);
    console.log(`   💬 Respuesta: ${r.answer.substring(0, 150)}...`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completado');
  console.log('='.repeat(80) + '\n');
}

runQualityTest().catch(console.error);
