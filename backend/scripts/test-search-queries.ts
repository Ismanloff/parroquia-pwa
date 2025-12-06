/**
 * Script para testear búsquedas específicas y ver sus scores
 */
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const index = pc.index('parroquias');

async function testSearch(query: string) {
  console.log(`\n🔍 Buscando: "${query}"`);
  console.log('─'.repeat(60));

  // Generar embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
    dimensions: 3072
  });

  // Buscar en Pinecone
  const results = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 5,
    includeMetadata: true
  });

  if (!results.matches || results.matches.length === 0) {
    console.log('❌ Sin resultados');
    return;
  }

  console.log(`\n📊 Top ${results.matches.length} resultados:\n`);

  results.matches.forEach((match, i) => {
    const score = (match.score || 0) * 100;
    const meta = match.metadata as any;
    const passesThreshold = (match.score || 0) > 0.40;

    console.log(`${i + 1}. Score: ${score.toFixed(2)}% ${passesThreshold ? '✅' : '❌ (< 40%)'}`);
    console.log(`   Archivo: ${meta.file_name}`);
    console.log(`   Título: ${meta.titulo}`);
    console.log(`   Preview: ${(meta.pageContent || '').substring(0, 150)}...`);
    console.log('');
  });
}

async function main() {
  console.log('🧪 TESTING BÚSQUEDAS EN PINECONE');
  console.log('═'.repeat(60));

  // Probar búsquedas problemáticas
  await testSearch('oración de madres');
  await testSearch('qué es oración de madres');
  await testSearch('biblia y teología');
  await testSearch('taller de biblia y teología');
  await testSearch('aula de biblia');
}

main().catch(console.error);
