/**
 * Script para eliminar TODOS los vectores de Pinecone
 * Usar antes de re-subir con nuevo sistema de chunking
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index('parroquias');

async function cleanPinecone() {
  console.log('\n🧹 ===== LIMPIANDO PINECONE =====\n');

  try {
    // Obtener estadísticas antes
    const stats = await index.describeIndexStats();
    console.log(`📊 Vectores actuales: ${stats.totalRecordCount}`);
    console.log(`📁 Namespaces: ${Object.keys(stats.namespaces || {}).join(', ') || 'default'}\n`);

    if (stats.totalRecordCount === 0) {
      console.log('✅ Pinecone ya está vacío\n');
      return;
    }

    console.log('⚠️  ¿Estás seguro de que quieres eliminar TODOS los vectores?');
    console.log('   Escribe "yes" para confirmar...\n');

    // Eliminar todos los vectores
    console.log('🗑️  Eliminando todos los vectores...\n');

    await index.deleteAll();

    console.log('⏳ Esperando 5 segundos para que se complete la eliminación...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar
    const statsAfter = await index.describeIndexStats();
    console.log(`📊 Vectores después: ${statsAfter.totalRecordCount}`);

    if (statsAfter.totalRecordCount === 0) {
      console.log('\n✅ Pinecone limpiado exitosamente\n');
    } else {
      console.log('\n⚠️  Aún quedan vectores, puede tardar unos minutos en eliminarse completamente\n');
    }

  } catch (error) {
    console.error('❌ Error limpiando Pinecone:', error);
    throw error;
  }
}

cleanPinecone().catch(console.error);
