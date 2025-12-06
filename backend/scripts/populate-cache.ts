/**
 * Script para poblar el Semantic Cache con preguntas frecuentes
 *
 * Uso: npx ts-node backend/scripts/populate-cache.ts
 */

import { kv } from '@vercel/kv';
import * as fs from 'fs';
import * as path from 'path';

interface QAPair {
  question: string;
  answer: string;
}

interface CacheEntry {
  question: string;
  answer: string;
  timestamp: number;
  normalizedQuestion: string;
}

const TTL = 60 * 60 * 24 * 7; // 7 días (más largo que el cache normal de 1 hora)
const KV_PREFIX = 'semantic_cache:';
const KV_INDEX_KEY = 'semantic_cache:index';

// Normalizar pregunta (igual que en semanticCache.ts)
function normalize(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ');
}

async function populateCache() {
  console.log('\n🚀 Iniciando población del Semantic Cache...\n');

  // Leer archivo JSON con Q&A
  const cacheDataPath = path.join(process.cwd(), 'backend', 'cache-data.json');

  if (!fs.existsSync(cacheDataPath)) {
    console.error('❌ Error: No se encontró el archivo backend/cache-data.json');
    console.log('\n📝 Crea el archivo con este formato:');
    console.log('[');
    console.log('  {');
    console.log('    "question": "¿A qué hora son las misas?",');
    console.log('    "answer": "Las misas son..."');
    console.log('  }');
    console.log(']\n');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(cacheDataPath, 'utf-8');
  const qaPairs: QAPair[] = JSON.parse(fileContent);

  console.log(`📚 Encontradas ${qaPairs.length} preguntas en cache-data.json\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < qaPairs.length; i++) {
    const { question, answer } = qaPairs[i];

    if (!question || !answer) {
      console.log(`⚠️  [${i + 1}/${qaPairs.length}] Entrada inválida (falta question o answer), saltando...`);
      errorCount++;
      continue;
    }

    try {
      const normalizedQuestion = normalize(question);
      const key = `${KV_PREFIX}${normalizedQuestion}`;

      const entry: CacheEntry = {
        question,
        answer,
        timestamp: Date.now(),
        normalizedQuestion,
      };

      // Guardar en KV con TTL de 7 días
      await kv.set(key, entry, { ex: TTL });

      // Agregar al índice
      await kv.sadd(KV_INDEX_KEY, key);

      console.log(`✅ [${i + 1}/${qaPairs.length}] Cacheado: "${question.substring(0, 60)}${question.length > 60 ? '...' : ''}"`);
      successCount++;

    } catch (error) {
      console.error(`❌ [${i + 1}/${qaPairs.length}] Error al cachear "${question}":`, error);
      errorCount++;
    }

    // Pequeña pausa para no saturar KV
    if (i < qaPairs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📦 Total: ${qaPairs.length}`);
  console.log(`⏰ TTL: ${TTL / 60 / 60 / 24} días`);
  console.log('\n✨ Cache poblado exitosamente!\n');
}

// Ejecutar
populateCache().catch(console.error);
