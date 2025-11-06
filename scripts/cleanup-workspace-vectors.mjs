#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPIEZA DE VECTORES DE PINECONE
 * ============================================
 * Elimina todos los vectores de un workspace específico en Pinecone.
 *
 * IMPORTANTE: Este script es INTERACTIVO y pedirá confirmación antes de eliminar.
 *
 * USO:
 *   node scripts/cleanup-workspace-vectors.mjs <workspace_id>
 *
 * EJEMPLOS:
 *   node scripts/cleanup-workspace-vectors.mjs test
 *   node scripts/cleanup-workspace-vectors.mjs ismael
 *   node scripts/cleanup-workspace-vectors.mjs abc-123-def-456
 *
 * NOTA: También intenta con el prefijo 'ws_' si el namespace no se encuentra.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const WORKSPACE_ID = process.argv[2];

if (!WORKSPACE_ID) {
  console.error('\n❌ Error: Debes proporcionar un workspace ID\n');
  console.log('Uso: node scripts/cleanup-workspace-vectors.mjs <workspace_id>\n');
  console.log('Ejemplos:');
  console.log('  node scripts/cleanup-workspace-vectors.mjs test');
  console.log('  node scripts/cleanup-workspace-vectors.mjs ismael');
  console.log('  node scripts/cleanup-workspace-vectors.mjs abc-123-def-456\n');
  process.exit(1);
}

/**
 * Espera unos segundos dando oportunidad de cancelar con Ctrl+C
 */
async function waitForCancellation(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏳ Esperando ${i} segundos... (Presiona Ctrl+C para cancelar)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  process.stdout.write('\r                                                                    \r');
}

/**
 * Intenta encontrar el namespace correcto (con y sin prefijo 'ws_')
 */
async function findNamespace(index, workspaceId) {
  const stats = await index.describeIndexStats();

  // Buscar coincidencia exacta
  if (stats.namespaces?.[workspaceId]) {
    return workspaceId;
  }

  // Buscar con prefijo 'ws_'
  const withPrefix = `ws_${workspaceId}`;
  if (stats.namespaces?.[withPrefix]) {
    return withPrefix;
  }

  // Buscar case-insensitive
  const namespaces = Object.keys(stats.namespaces || {});
  const caseInsensitiveMatch = namespaces.find(
    ns => ns.toLowerCase() === workspaceId.toLowerCase()
  );

  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  return null;
}

/**
 * Obtiene información de sample de vectores para mostrar al usuario
 */
async function getSampleVectors(index, namespace) {
  try {
    const queryResult = await index.namespace(namespace).query({
      vector: new Array(1024).fill(0),  // Vector dummy
      topK: 5,
      includeMetadata: true
    });

    return queryResult.matches || [];
  } catch (error) {
    console.error(`⚠️  No se pudo obtener sample: ${error.message}`);
    return [];
  }
}

/**
 * Función principal de limpieza
 */
async function cleanup() {
  console.log('\n🧹 LIMPIEZA DE VECTORES DE PINECONE\n');
  console.log(`📦 Workspace ID: ${WORKSPACE_ID}\n`);

  try {
    // 1. Inicializar Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    const index = pinecone.index(indexName);

    console.log(`✅ Conectado al índice: ${indexName}`);

    // 2. Encontrar el namespace correcto
    console.log(`\n🔍 Buscando namespace para workspace "${WORKSPACE_ID}"...`);
    const namespace = await findNamespace(index, WORKSPACE_ID);

    if (!namespace) {
      console.log(`\n❌ No se encontró el namespace "${WORKSPACE_ID}"`);
      console.log('\n💡 Namespaces disponibles:');
      const stats = await index.describeIndexStats();
      if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
        Object.keys(stats.namespaces).forEach(ns => {
          console.log(`   - ${ns}`);
        });
      } else {
        console.log('   (ninguno - índice vacío)');
      }
      process.exit(1);
    }

    console.log(`✅ Namespace encontrado: ${namespace}`);

    // 3. Obtener estadísticas antes de eliminar
    console.log('\n📊 Obteniendo estadísticas...');
    const statsBefore = await index.describeIndexStats();
    const vectorsBefore = statsBefore.namespaces?.[namespace]?.recordCount || 0;

    console.log(`\n📈 Estadísticas ANTES de la limpieza:`);
    console.log(`   Namespace: ${namespace}`);
    console.log(`   Total de vectores: ${vectorsBefore}`);

    if (vectorsBefore === 0) {
      console.log('\n✅ El namespace ya está vacío. No hay nada que eliminar.\n');
      process.exit(0);
    }

    // 4. Mostrar sample de vectores
    console.log('\n📄 Sample de vectores a eliminar:');
    const sampleVectors = await getSampleVectors(index, namespace);
    if (sampleVectors.length > 0) {
      sampleVectors.slice(0, 5).forEach((match, i) => {
        const docId = match.metadata?.documentId || 'unknown';
        const filename = match.metadata?.filename || 'unknown';
        console.log(`   ${i + 1}. ${match.id}`);
        console.log(`      Document ID: ${docId}`);
        console.log(`      Filename: ${filename}`);
      });
      if (vectorsBefore > 5) {
        console.log(`   ... y ${vectorsBefore - 5} vectores más`);
      }
    }

    // 5. CONFIRMACIÓN INTERACTIVA
    console.log('\n⚠️  ⚠️  ⚠️  ADVERTENCIA ⚠️  ⚠️  ⚠️');
    console.log(`\n🗑️  Estás a punto de ELIMINAR ${vectorsBefore} vectores del namespace "${namespace}"`);
    console.log('   Esta operación NO se puede deshacer.');
    console.log('\n💡 Si deseas cancelar, presiona Ctrl+C ahora.\n');

    await waitForCancellation(5);

    // 6. Eliminar vectores
    console.log('\n🧹 Eliminando vectores...');
    await index.namespace(namespace).deleteAll();
    console.log('✅ Comando de eliminación enviado');

    // 7. Esperar propagación
    console.log('\n⏳ Esperando propagación de cambios (2 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 8. Verificar eliminación
    console.log('\n🔍 Verificando eliminación...');
    const statsAfter = await index.describeIndexStats();
    const vectorsAfter = statsAfter.namespaces?.[namespace]?.recordCount || 0;

    // 9. Mostrar resultados
    console.log('\n📊 RESULTADOS DE LA LIMPIEZA:');
    console.log('═══════════════════════════════');
    console.log(`   Namespace: ${namespace}`);
    console.log(`   Vectores ANTES: ${vectorsBefore}`);
    console.log(`   Vectores DESPUÉS: ${vectorsAfter}`);
    console.log(`   Vectores eliminados: ${vectorsBefore - vectorsAfter}`);

    if (vectorsAfter === 0) {
      console.log('\n✅ ¡LIMPIEZA EXITOSA! El namespace está completamente vacío.\n');
    } else if (vectorsAfter < vectorsBefore) {
      console.log('\n⚠️  Limpieza parcial. Algunos vectores aún permanecen.');
      console.log('   Esto puede ser normal debido a la propagación de Pinecone.');
      console.log('   Ejecuta el script verify-pinecone.ts en unos segundos para verificar.\n');
    } else {
      console.log('\n❌ No se eliminaron vectores. Revisa los logs para posibles errores.\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);

    if (error.message?.includes('API key')) {
      console.log('\n💡 Verifica que PINECONE_API_KEY esté configurado en .env.local');
    }

    throw error;
  }
}

// Ejecutar
cleanup().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
