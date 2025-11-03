/**
 * Script para subir documentos a Pinecone usando Voyage AI embeddings
 *
 * Uso:
 * npx tsx scripts/upload-documents-voyage.ts <tenant_id> <file_path>
 *
 * Ejemplo:
 * npx tsx scripts/upload-documents-voyage.ts tenant_001 ./docs/product-guide.txt
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { VoyageAIClient } from 'voyageai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Inicializar clientes
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const voyageai = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!
});

const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
const index = pc.index(indexName);

/**
 * Divide un texto en chunks con overlapping
 */
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += (chunkSize - overlap);

    // Evitar chunks muy pequeños al final
    if (text.length - start < overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * Sube un documento a Pinecone con embeddings de Voyage AI
 */
async function uploadDocument(
  tenantId: string,
  documentPath: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    categoria?: string;
    metadata?: Record<string, any>;
  } = {}
) {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    categoria = 'general',
    metadata = {}
  } = options;

  try {
    console.log(`\n📄 Procesando documento: ${documentPath}`);
    console.log(`🏢 Tenant ID: ${tenantId}`);

    // 1. Verificar que el archivo existe
    if (!fs.existsSync(documentPath)) {
      throw new Error(`Archivo no encontrado: ${documentPath}`);
    }

    // 2. Leer contenido del archivo
    const content = fs.readFileSync(documentPath, 'utf-8');
    console.log(`📏 Tamaño del documento: ${content.length} caracteres`);

    // 3. Dividir en chunks
    const chunks = chunkText(content, chunkSize, chunkOverlap);
    console.log(`✂️  Dividido en ${chunks.length} chunks`);

    // 4. Generar embeddings con Voyage AI (batch processing)
    console.log(`🔮 Generando embeddings con Voyage AI...`);
    const batchSize = 128; // Voyage AI soporta hasta 128 textos por batch
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const result = await voyageai.embed({
        input: batch,  // Voyage AI SDK usa 'input', no 'texts'
        model: 'voyage-3-large',
        inputType: 'document',  // 'document' para indexar, 'query' para buscar
        outputDimension: 1024
      });

      // Voyage AI retorna result.data[].embedding, no result.embeddings
      const batchEmbeddings = result.data?.map((item: any) => item.embedding) || [];
      allEmbeddings.push(...batchEmbeddings);
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} completado`);
    }

    console.log(`✅ ${allEmbeddings.length} embeddings generados`);

    // 5. Preparar vectores para Pinecone
    const fileName = path.basename(documentPath);
    const documentId = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      values: allEmbeddings[index],
      metadata: {
        tenant_id: tenantId,
        document_id: documentId,
        chunk_index: index,
        total_chunks: chunks.length,
        text: chunk,
        source: fileName,
        categoria: categoria,
        created_at: new Date().toISOString(),
        ...metadata
      }
    }));

    // 6. Construir namespace por tenant
    const baseNamespace = process.env.PINECONE_NAMESPACE || 'saas';
    const namespace = `${baseNamespace}_${tenantId}`;
    console.log(`🗂️  Namespace: ${namespace}`);

    // 7. Upsert a Pinecone (en batches de 100 vectores)
    console.log(`⬆️  Subiendo a Pinecone...`);
    const upsertBatchSize = 100;

    for (let i = 0; i < vectors.length; i += upsertBatchSize) {
      const batch = vectors.slice(i, i + upsertBatchSize);
      await index.namespace(namespace).upsert(batch);
      console.log(`  ✅ Upsert ${Math.floor(i / upsertBatchSize) + 1}/${Math.ceil(vectors.length / upsertBatchSize)} completado`);
    }

    console.log(`\n🎉 Documento subido exitosamente!`);
    console.log(`   📄 Archivo: ${fileName}`);
    console.log(`   🏢 Tenant: ${tenantId}`);
    console.log(`   🗂️  Namespace: ${namespace}`);
    console.log(`   ✂️  Chunks: ${chunks.length}`);
    console.log(`   🔮 Embeddings: ${allEmbeddings.length} (1024 dims cada uno)`);
    console.log(`   💾 Document ID: ${documentId}\n`);

    return {
      documentId,
      namespace,
      chunksUploaded: chunks.length,
      success: true
    };

  } catch (error) {
    console.error(`\n❌ Error al subir documento:`, error);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📚 Upload Documents to Pinecone with Voyage AI

Uso:
  npx tsx scripts/upload-documents-voyage.ts <tenant_id> <file_path> [categoria]

Parámetros:
  tenant_id   ID del tenant/workspace (ej: tenant_001)
  file_path   Ruta al archivo a subir (ej: ./docs/guide.txt)
  categoria   (Opcional) Categoría del documento (default: general)
              Opciones: productos, servicios, precios, soporte, integraciones, politicas

Ejemplos:
  npx tsx scripts/upload-documents-voyage.ts tenant_001 ./docs/product-guide.txt productos
  npx tsx scripts/upload-documents-voyage.ts tenant_002 ./docs/pricing.md precios
  npx tsx scripts/upload-documents-voyage.ts tenant_001 ./docs/faq.txt soporte

Variables de entorno requeridas (.env.local):
  PINECONE_API_KEY
  VOYAGE_API_KEY
  PINECONE_INDEX_NAME (default: saas)
  PINECONE_NAMESPACE (default: saas)
    `);
    process.exit(1);
  }

  const [tenantId, filePath, categoria = 'general'] = args;

  console.log(`\n🚀 Iniciando upload de documento...`);

  await uploadDocument(tenantId, filePath, {
    categoria,
    chunkSize: 1000,
    chunkOverlap: 200
  });

  console.log(`✅ Proceso completado!\n`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

// Exportar para uso en otros scripts
export { uploadDocument, chunkText };
