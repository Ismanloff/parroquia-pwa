#!/usr/bin/env node

/**
 * Script para limpiar namespaces antiguos de Pinecone
 *
 * Verifica y elimina namespaces con contenido antiguo
 * del proyecto previo (APP PARRO PWA).
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  console.error('❌ Error: PINECONE_API_KEY o PINECONE_INDEX_NAME no están configurados');
  process.exit(1);
}

console.log(`🔍 Conectando a Pinecone...`);
console.log(`   Index: ${PINECONE_INDEX_NAME}`);

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

async function cleanPinecone() {
  try {
    // Obtener el índice
    const index = pinecone.index(PINECONE_INDEX_NAME);

    // Listar todas las estadísticas del índice
    console.log(`\n📊 Obteniendo estadísticas del índice...`);
    const stats = await index.describeIndexStats();

    console.log(`\n✅ Índice: ${PINECONE_INDEX_NAME}`);
    console.log(`   Total de vectores: ${stats.totalRecordCount || 0}`);
    console.log(`   Dimensiones: ${stats.dimension || 'N/A'}`);

    // Listar namespaces
    const namespaces = stats.namespaces || {};
    const namespaceList = Object.keys(namespaces);

    console.log(`\n📁 Namespaces encontrados: ${namespaceList.length}`);

    if (namespaceList.length === 0) {
      console.log(`\n✨ El índice está vacío. No hay namespaces para limpiar.`);
      return;
    }

    console.log(`\nDetalle de namespaces:`);
    for (const [ns, data] of Object.entries(namespaces)) {
      console.log(`   - ${ns}: ${data.recordCount} vectores`);
    }

    // Identificar namespaces antiguos (que NO empiezan con "ws_")
    const oldNamespaces = namespaceList.filter(ns => !ns.startsWith('ws_'));

    if (oldNamespaces.length === 0) {
      console.log(`\n✅ No hay namespaces antiguos para limpiar.`);
      console.log(`   Todos los namespaces siguen el formato correcto: ws_*`);
      return;
    }

    console.log(`\n⚠️  Namespaces antiguos detectados (${oldNamespaces.length}):`);
    oldNamespaces.forEach(ns => {
      console.log(`   - ${ns} (${namespaces[ns].recordCount} vectores)`);
    });

    console.log(`\n🧹 Limpiando namespaces antiguos...`);

    for (const ns of oldNamespaces) {
      try {
        await index.namespace(ns).deleteAll();
        console.log(`   ✅ Eliminado: ${ns}`);
      } catch (error) {
        console.error(`   ❌ Error eliminando ${ns}:`, error.message);
      }
    }

    console.log(`\n✨ Limpieza completada!`);

    // Verificar resultado
    const finalStats = await index.describeIndexStats();
    const finalNamespaces = Object.keys(finalStats.namespaces || {});

    console.log(`\n📊 Estado final:`);
    console.log(`   Total de vectores: ${finalStats.totalRecordCount || 0}`);
    console.log(`   Namespaces restantes: ${finalNamespaces.length}`);

    if (finalNamespaces.length > 0) {
      console.log(`\n   Namespaces actuales:`);
      for (const [ns, data] of Object.entries(finalStats.namespaces || {})) {
        console.log(`   - ${ns}: ${data.recordCount} vectores`);
      }
    }

  } catch (error) {
    console.error(`\n❌ Error durante la limpieza:`, error);
    process.exit(1);
  }
}

// Ejecutar
cleanPinecone()
  .then(() => {
    console.log(`\n✅ Script completado exitosamente`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Error fatal:`, error);
    process.exit(1);
  });
