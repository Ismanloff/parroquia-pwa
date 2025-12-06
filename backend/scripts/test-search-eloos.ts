/**
 * Script de prueba para buscar "Eloos" en Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const index = pc.index('parroquias');

async function testSearch(query: string) {
  console.log(`\n🔍 Buscando: "${query}"\n`);

  // Generar embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
    dimensions: 3072
  });

  // Buscar en Pinecone
  const results = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 10, // Top 10 para ver más resultados
    includeMetadata: true
  });

  console.log(`📊 Resultados encontrados: ${results.matches.length}\n`);

  results.matches.forEach((match, i) => {
    const meta = match.metadata as any;
    const score = Math.round((match.score || 0) * 100);

    console.log(`${i + 1}. Score: ${score}%`);
    console.log(`   Título: ${meta.titulo || 'N/A'}`);
    console.log(`   Archivo: ${meta.file_name || 'N/A'}`);
    console.log(`   Categoría: ${meta.categoria_pastoral || 'N/A'}`);
    console.log(`   Preview: ${(meta.pageContent || '').substring(0, 100)}...`);
    console.log('');
  });
}

async function main() {
  try {
    await testSearch('Qué es eloos?');
    await testSearch('Eloos');
    await testSearch('Eloos Entrega');
    await testSearch('grupos para jóvenes');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
