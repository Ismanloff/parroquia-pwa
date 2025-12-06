/**
 * Script para verificar estadísticas de Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index('parroquias');

async function checkStats() {
  console.log('\n📊 ===== ESTADÍSTICAS DE PINECONE =====\n');

  try {
    const stats = await index.describeIndexStats();
    console.log(`📦 Vectores totales: ${stats.totalRecordCount}`);
    console.log(`📁 Namespaces: ${Object.keys(stats.namespaces || {}).join(', ') || 'default'}\n`);

    console.log('✅ Esperado: 86 + 8 + 13 + 3 = 110 chunks');
    console.log(`📊 Actual: ${stats.totalRecordCount} chunks`);

    if (stats.totalRecordCount === 110) {
      console.log('\n✅ Todos los documentos subidos correctamente\n');
    } else {
      console.log('\n⚠️  Faltan documentos o hay duplicados\n');
    }
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}

checkStats().catch(console.error);
