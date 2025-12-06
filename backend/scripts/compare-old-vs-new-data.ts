/**
 * Script para comparar scores de PDFs viejos (n8n) vs datos nuevos
 *
 * Ejecutar: npx tsx backend/scripts/compare-old-vs-new-data.ts
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const index = pc.index('parroquias');

async function compareData() {
  console.log('\n🔍 COMPARANDO SCORES: PDFs viejos (n8n) vs Datos nuevos\n');
  console.log('='.repeat(70));

  const queries = [
    'Qué es eloos?',
    'Qué es Cáritas?',
    'Horarios de catequesis',
    'Sacramentos de bautismo'
  ];

  for (const query of queries) {
    console.log(`\n📝 Query: "${query}"\n`);

    // Generar embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 3072
    });

    // Buscar en Pinecone
    const queryResults = await index.query({
      vector: embeddingResponse.data[0].embedding,
      topK: 10,
      includeMetadata: true
    });

    console.log('📊 RESULTADOS:\n');

    // Separar por tipo
    const pdfResults: any[] = [];
    const mdResults: any[] = [];

    queryResults.matches.forEach(match => {
      const meta = match.metadata as any;
      const fileName = meta.file_name || '';

      const item = {
        score: match.score || 0,
        scorePercent: Math.round((match.score || 0) * 100),
        file: fileName,
        title: meta.titulo || 'Sin título',
        passesThreshold: (match.score || 0) > 0.35
      };

      if (fileName.endsWith('.pdf')) {
        pdfResults.push(item);
      } else if (fileName.endsWith('.md')) {
        mdResults.push(item);
      }
    });

    // Mostrar PDFs
    if (pdfResults.length > 0) {
      console.log('  📄 PDFs (n8n - VIEJOS):');
      pdfResults.forEach((r, i) => {
        const status = r.passesThreshold ? '✅ PASA' : '❌ NO PASA';
        console.log(`     ${i + 1}. ${status} Score: ${r.scorePercent}% - ${r.title}`);
        console.log(`        Archivo: ${r.file}`);
      });
      console.log('');
    }

    // Mostrar MDs
    if (mdResults.length > 0) {
      console.log('  📝 Markdown (NUEVOS):');
      mdResults.forEach((r, i) => {
        const status = r.passesThreshold ? '✅ PASA' : '❌ NO PASA';
        console.log(`     ${i + 1}. ${status} Score: ${r.scorePercent}% - ${r.title}`);
        console.log(`        Archivo: ${r.file}`);
      });
      console.log('');
    }

    // Análisis
    const pdfsPasan = pdfResults.filter(r => r.passesThreshold).length;
    const mdsPasan = mdResults.filter(r => r.passesThreshold).length;

    console.log('  📈 ANÁLISIS:');
    console.log(`     PDFs que pasan threshold (>35%): ${pdfsPasan}/${pdfResults.length}`);
    console.log(`     MDs que pasan threshold (>35%): ${mdsPasan}/${mdResults.length}`);

    if (pdfResults.length > 0 && mdResults.length > 0) {
      const avgPdfScore = pdfResults.reduce((sum, r) => sum + r.score, 0) / pdfResults.length;
      const avgMdScore = mdResults.reduce((sum, r) => sum + r.score, 0) / mdResults.length;

      console.log(`     Score promedio PDFs: ${Math.round(avgPdfScore * 100)}%`);
      console.log(`     Score promedio MDs: ${Math.round(avgMdScore * 100)}%`);

      const difference = Math.round((avgPdfScore - avgMdScore) * 100);
      if (difference > 5) {
        console.log(`     ⚠️ Los PDFs tienen ${difference}% más score que los MDs`);
      } else if (difference < -5) {
        console.log(`     ⚠️ Los MDs tienen ${-difference}% más score que los PDFs`);
      } else {
        console.log(`     ✅ Scores similares entre PDFs y MDs`);
      }
    }

    console.log('\n' + '-'.repeat(70));
  }

  console.log('\n✅ Análisis completo\n');
}

compareData().catch(console.error);
