/**
 * Script para listar todo el contenido de Pinecone
 *
 * Ejecutar: npx tsx backend/scripts/list-pinecone-content.ts
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listPineconeContent() {
  console.log('📋 Listando contenido de Pinecone...\n');

  const pineconeApiKey = process.env.PINECONE_API_KEY;
  if (!pineconeApiKey) {
    console.error('❌ PINECONE_API_KEY no configurada');
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey: pineconeApiKey });
  const index = pc.index('parroquias');

  // 1. Obtener estadísticas
  console.log('📊 Estadísticas del índice:');
  const stats = await index.describeIndexStats();
  console.log(`   Total de vectores: ${stats.totalRecordCount || 0}`);
  console.log(`   Dimensiones: ${stats.dimension || 0}\n`);

  // 2. Para listar el contenido, hacemos queries amplias
  console.log('📄 Documentos en Pinecone:\n');

  // Hacer varias queries con diferentes temas para obtener todos los documentos
  const queries = [
    'parroquia información general',
    'sacramentos bautismo matrimonio',
    'grupos actividades catequesis',
    'Eloos jóvenes comunidades',
    'Cáritas ayuda social'
  ];

  const allDocs = new Map();

  for (const query of queries) {
    // Generar un vector dummy (todos ceros) para query
    const dummyVector = new Array(3072).fill(0);

    const results = await index.query({
      vector: dummyVector,
      topK: 100, // Obtener hasta 100 resultados
      includeMetadata: true
    });

    if (results.matches) {
      results.matches.forEach(match => {
        const meta = match.metadata as any;
        if (match.id && !allDocs.has(match.id)) {
          allDocs.set(match.id, {
            id: match.id,
            titulo: meta.titulo || 'Sin título',
            categoria: meta.categoria_pastoral || 'N/A',
            tipo: meta.tipo_contenido || 'N/A',
            parroquia: meta.parroquia_ubicacion || 'N/A',
            audiencia: meta.audiencia_objetivo || 'N/A',
            file: meta.file_name || 'N/A',
            preview: (meta.pageContent || '').substring(0, 200)
          });
        }
      });
    }
  }

  // Mostrar todos los documentos únicos
  console.log(`Total de documentos únicos encontrados: ${allDocs.size}\n`);

  let i = 1;
  allDocs.forEach((doc) => {
    console.log(`${i}. ${doc.titulo}`);
    console.log(`   📁 Archivo: ${doc.file}`);
    console.log(`   🏷️  Categoría: ${doc.categoria}`);
    console.log(`   📝 Tipo: ${doc.tipo}`);
    console.log(`   ⛪ Parroquia: ${doc.parroquia}`);
    console.log(`   👥 Audiencia: ${doc.audiencia}`);
    console.log(`   📄 Preview: ${doc.preview}...`);
    console.log('');
    i++;
  });

  // Agrupar por categoría
  console.log('\n📊 Distribución por categoría:');
  const byCat = new Map();
  allDocs.forEach(doc => {
    const cat = doc.categoria;
    byCat.set(cat, (byCat.get(cat) || 0) + 1);
  });

  byCat.forEach((count, cat) => {
    console.log(`   ${cat}: ${count} documento(s)`);
  });
}

listPineconeContent().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
