/**
 * Script para verificar configuración de Pinecone
 *
 * Uso:
 * npx tsx scripts/verify-pinecone.ts
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function verifyPinecone() {
  console.log('\n🔍 Verificando configuración de Pinecone...\n');

  try {
    // 1. Inicializar cliente
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    console.log('✅ Cliente Pinecone inicializado correctamente');

    // 2. Obtener nombre del índice
    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    console.log(`📦 Índice: ${indexName}`);

    // 3. Listar todos los índices
    const indexes = await pc.listIndexes();
    console.log('\n📋 Índices disponibles:');
    indexes.indexes?.forEach((idx) => {
      console.log(`   - ${idx.name}`);
    });

    // 4. Verificar que existe nuestro índice
    const ourIndex = indexes.indexes?.find(idx => idx.name === indexName);
    if (!ourIndex) {
      console.log(`\n❌ El índice "${indexName}" NO existe.`);
      console.log('\n💡 Crear índice con:');
      console.log(`   - Nombre: ${indexName}`);
      console.log(`   - Dimensiones: 1024 (Voyage-3-Large)`);
      console.log(`   - Métrica: cosine`);
      console.log(`   - Región: us-east-1 (AWS Serverless)`);
      return;
    }

    console.log(`\n✅ Índice "${indexName}" encontrado!`);
    console.log(`   Dimensiones: ${ourIndex.dimension}`);
    console.log(`   Métrica: ${ourIndex.metric}`);
    console.log(`   Host: ${ourIndex.host}`);
    console.log(`   Status: ${ourIndex.status?.state || 'unknown'}`);

    // 5. Verificar dimensiones
    if (ourIndex.dimension !== 1024) {
      console.log(`\n⚠️  ADVERTENCIA: El índice tiene ${ourIndex.dimension} dimensiones, pero Voyage-3-Large requiere 1024`);
    }

    // 6. Verificar métrica
    if (ourIndex.metric !== 'cosine') {
      console.log(`\n⚠️  ADVERTENCIA: El índice usa métrica "${ourIndex.metric}", recomendado: "cosine"`);
    }

    // 7. Conectar al índice y obtener stats
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();

    console.log(`\n📊 Estadísticas del índice:`);
    console.log(`   Total de vectores: ${stats.totalRecordCount || 0}`);
    console.log(`   Dimensiones: ${stats.dimension}`);

    if (stats.namespaces) {
      const namespaceCount = Object.keys(stats.namespaces).length;
      console.log(`\n📁 Namespaces (${namespaceCount}):`);

      Object.entries(stats.namespaces).forEach(([ns, data]) => {
        console.log(`   - ${ns}: ${data.recordCount} vectores`);
      });
    } else {
      console.log(`\n📁 Namespaces: 0 (índice vacío)`);
    }

    console.log('\n✅ Verificación completada!\n');

  } catch (error: any) {
    console.error('\n❌ Error al verificar Pinecone:', error.message);

    if (error.message?.includes('API key')) {
      console.log('\n💡 Verifica que PINECONE_API_KEY esté correctamente configurado en .env.local');
    }

    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  verifyPinecone().catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

export { verifyPinecone };
