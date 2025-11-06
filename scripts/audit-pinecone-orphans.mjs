#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE AUDITORÍA DE VECTORES HUÉRFANOS EN PINECONE
 * ========================================================
 * Compara documentos en Supabase con vectores en Pinecone para detectar discrepancias.
 *
 * VECTORES HUÉRFANOS: Vectores que existen en Pinecone pero no tienen documento
 * correspondiente en Supabase (probablemente eliminados antes de implementar
 * la limpieza automática).
 *
 * USO:
 *   node scripts/audit-pinecone-orphans.mjs [workspace_id]
 *
 * EJEMPLOS:
 *   node scripts/audit-pinecone-orphans.mjs           # Audita todos los workspaces
 *   node scripts/audit-pinecone-orphans.mjs test      # Solo workspace "test"
 *   node scripts/audit-pinecone-orphans.mjs ismael    # Solo workspace "ismael"
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const WORKSPACE_FILTER = process.argv[2]; // Opcional

/**
 * Obtiene documentos de Supabase por workspace
 */
async function getSupabaseDocuments(supabase, workspaceId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, workspace_id, filename, status, uploaded_at')
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Error obteniendo documentos de Supabase: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene vectores de Pinecone por namespace
 */
async function getPineconeVectors(index, namespace, maxSample = 100) {
  try {
    const queryResult = await index.namespace(namespace).query({
      vector: new Array(1024).fill(0),  // Vector dummy
      topK: maxSample,
      includeMetadata: true
    });

    return queryResult.matches || [];
  } catch (error) {
    console.error(`   ⚠️  Error querying namespace ${namespace}: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene todos los workspaces de Supabase
 */
async function getAllWorkspaces(supabase) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, slug');

  if (error) {
    throw new Error(`Error obteniendo workspaces: ${error.message}`);
  }

  return data || [];
}

/**
 * Función principal de auditoría
 */
async function audit() {
  console.log('\n🔍 AUDITORÍA DE VECTORES HUÉRFANOS EN PINECONE\n');

  try {
    // 1. Conectar a Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Conectado a Supabase');

    // 2. Conectar a Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    const index = pinecone.index(indexName);
    console.log(`✅ Conectado a Pinecone (índice: ${indexName})`);

    // 3. Obtener namespaces de Pinecone
    console.log('\n📊 Obteniendo estadísticas de Pinecone...');
    const stats = await index.describeIndexStats();

    if (!stats.namespaces || Object.keys(stats.namespaces).length === 0) {
      console.log('\n✅ No hay namespaces en Pinecone. Índice vacío.\n');
      return;
    }

    // 4. Obtener workspaces de Supabase
    console.log('📊 Obteniendo workspaces de Supabase...');
    const workspaces = await getAllWorkspaces(supabase);
    console.log(`✅ ${workspaces.length} workspaces encontrados en Supabase`);

    // 5. Auditar cada namespace
    const namespacesToAudit = Object.keys(stats.namespaces);
    let totalOrphans = 0;
    let totalVectors = 0;

    console.log(`\n🔍 Auditando ${namespacesToAudit.length} namespaces...\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const namespace of namespacesToAudit) {
      // Filtrar si el usuario especificó un workspace
      if (WORKSPACE_FILTER && !namespace.toLowerCase().includes(WORKSPACE_FILTER.toLowerCase())) {
        continue;
      }

      const nsStats = stats.namespaces[namespace];
      const vectorCount = nsStats.recordCount || 0;
      totalVectors += vectorCount;

      console.log(`📁 Namespace: ${namespace}`);
      console.log(`   Vectores en Pinecone: ${vectorCount}`);

      // Resaltar workspaces conocidos
      if (namespace.toLowerCase().includes('ismael')) {
        console.log(`   ⭐ Workspace "Ismael" detectado`);
      }
      if (namespace.toLowerCase().includes('test')) {
        console.log(`   ⭐ Workspace "Test" detectado`);
      }

      if (vectorCount === 0) {
        console.log(`   ✅ Namespace vacío (sin vectores)\n`);
        continue;
      }

      // Obtener workspace ID (remover prefijo 'ws_' si existe)
      const workspaceId = namespace.startsWith('ws_') ? namespace.slice(3) : namespace;

      // Obtener documentos de Supabase
      const documents = await getSupabaseDocuments(supabase, workspaceId);
      console.log(`   Documentos en Supabase: ${documents.length}`);

      // Obtener sample de vectores de Pinecone
      const vectors = await getPineconeVectors(index, namespace, 100);
      console.log(`   Sample de vectores obtenidos: ${vectors.length}`);

      // Extraer documentIds únicos de Supabase
      const supabaseDocIds = new Set(documents.map(doc => doc.id));

      // Extraer documentIds únicos de Pinecone
      const pineconeDocIds = new Set(
        vectors
          .map(v => v.metadata?.documentId)
          .filter(Boolean)
      );

      console.log(`   Document IDs únicos en Supabase: ${supabaseDocIds.size}`);
      console.log(`   Document IDs únicos en Pinecone: ${pineconeDocIds.size}`);

      // Detectar vectores huérfanos
      const orphanDocIds = [...pineconeDocIds].filter(docId => !supabaseDocIds.has(docId));

      if (orphanDocIds.length > 0) {
        totalOrphans += orphanDocIds.length;
        console.log(`\n   ⚠️  ¡VECTORES HUÉRFANOS DETECTADOS! (${orphanDocIds.length} documentos sin registro en Supabase)`);
        console.log(`\n   📄 Document IDs huérfanos:`);
        orphanDocIds.slice(0, 10).forEach((docId, i) => {
          // Encontrar un vector de ejemplo
          const exampleVector = vectors.find(v => v.metadata?.documentId === docId);
          const filename = exampleVector?.metadata?.filename || 'unknown';
          console.log(`      ${i + 1}. ${docId}`);
          console.log(`         Filename: ${filename}`);
          console.log(`         Vector ID: ${exampleVector?.id}`);
        });
        if (orphanDocIds.length > 10) {
          console.log(`      ... y ${orphanDocIds.length - 10} más`);
        }

        console.log(`\n   💡 Recomendación: Ejecuta cleanup-workspace-vectors.mjs para limpiar`);
        console.log(`      Comando: node scripts/cleanup-workspace-vectors.mjs ${workspaceId}\n`);
      } else {
        console.log(`   ✅ Sin vectores huérfanos (todos los vectores tienen documento en Supabase)\n`);
      }

      console.log('───────────────────────────────────────────────────────────────\n');
    }

    // 6. Resumen final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📊 RESUMEN DE LA AUDITORÍA:\n');
    console.log(`   Total de namespaces auditados: ${namespacesToAudit.length}`);
    console.log(`   Total de vectores: ${totalVectors}`);
    console.log(`   Documentos huérfanos encontrados: ${totalOrphans}`);

    if (totalOrphans > 0) {
      console.log(`\n   ⚠️  Acción recomendada: Limpiar namespaces con vectores huérfanos`);
      console.log(`      usando: node scripts/cleanup-workspace-vectors.mjs <workspace_id>`);
    } else {
      console.log(`\n   ✅ ¡Todo en orden! No se encontraron vectores huérfanos.`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error durante la auditoría:', error.message);

    if (error.message?.includes('API key')) {
      console.log('\n💡 Verifica que PINECONE_API_KEY y SUPABASE_SERVICE_ROLE_KEY estén configurados');
    }

    throw error;
  }
}

// Ejecutar
audit().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
