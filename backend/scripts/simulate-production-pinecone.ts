/**
 * Simulación EXACTA del pineconeTool en producción
 * Para verificar que funciona correctamente
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const index = pc.index('parroquias');

// COPIA EXACTA DEL CÓDIGO DEL PINECONE TOOL
async function simulatePineconeTool(query: string, categoria?: string) {
  try {
    console.log(`🔍 [Pinecone] Buscando: "${query}"${categoria ? ` | Categoría: ${categoria}` : ''}`);
    const startTime = Date.now();

    // 1. Generar embedding de la consulta usando el mismo modelo que n8n
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 3072 // Mismo que en n8n
    });

    // 2. Construir filtro de metadata (si se especifica categoría)
    const filter: any = {};
    if (categoria) {
      filter.categoria_pastoral = categoria;
    }

    // 3. Buscar en Pinecone
    const queryResults = await index.query({
      vector: embeddingResponse.data[0].embedding,
      topK: 5, // Top 5 resultados más relevantes
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ [Pinecone] Búsqueda completada en ${duration}ms`);

    // 4. Validar resultados
    if (!queryResults.matches || queryResults.matches.length === 0) {
      console.log(`❌ [Pinecone] Sin resultados para: "${query}"`);
      return 'No se encontró información específica sobre este tema en los documentos parroquiales. Consulta directamente con la recepción de la parroquia.';
    }

    // 5. Filtrar por relevancia (score > 0.35 = 35% similar)
    // Nota: Embeddings de texto raramente superan 70-80% de similarity
    // Un threshold de 35-40% es más realista para búsquedas semánticas
    const relevantMatches = queryResults.matches.filter(m =>
      m.score && m.score > 0.35
    );

    if (relevantMatches.length === 0) {
      console.log(`⚠️ [Pinecone] Resultados con baja relevancia (todos < 35%)`);
      return 'No se encontró información suficientemente relevante. Por favor, reformula tu pregunta o consulta con la recepción parroquial.';
    }

    console.log(`✅ [Pinecone] ${relevantMatches.length} resultados relevantes encontrados`);

    // 6. Formatear resultados con metadata rica
    const formattedResults = relevantMatches.map((match, i) => {
      const meta = match.metadata as any;
      const score = Math.round((match.score || 0) * 100);

      // Construir respuesta estructurada
      let result = `📄 **Resultado ${i + 1}** (${score}% relevante)\n`;

      // Título y categoría
      if (meta.titulo) {
        result += `**Título:** ${meta.titulo}\n`;
      }

      if (meta.categoria_pastoral) {
        result += `**Categoría:** ${meta.categoria_pastoral}\n`;
      }

      // Parroquia específica
      if (meta.parroquia_ubicacion && meta.parroquia_ubicacion !== 'ambas') {
        const parroquiaNombre = meta.parroquia_ubicacion === 'soledad'
          ? 'Nuestra Señora de la Soledad'
          : 'Transfiguración del Señor';
        result += `**Parroquia:** ${parroquiaNombre}\n`;
      }

      // Audiencia objetivo
      if (meta.audiencia_objetivo && meta.audiencia_objetivo !== 'publico_general') {
        result += `**Dirigido a:** ${meta.audiencia_objetivo}\n`;
      }

      // Contenido principal (limitado a 500 caracteres)
      const content = meta.pageContent || meta.text || '';
      if (content) {
        const contentPreview = content.substring(0, 500).trim();
        result += `\n${contentPreview}${content.length > 500 ? '...' : ''}\n`;
      }

      // Fuente del documento
      if (meta.file_name) {
        result += `\n_Fuente: ${meta.file_name}_`;
      }

      return result;
    }).join('\n\n---\n\n');

    // 7. Agregar resumen de búsqueda
    const summary = `🔍 **Búsqueda en documentos parroquiales**\n` +
      `Encontrados ${relevantMatches.length} documentos relevantes sobre "${query}".\n\n` +
      formattedResults;

    return summary;

  } catch (error: any) {
    console.error('❌ [Pinecone] Error:', error);

    // Errores específicos
    if (error.message?.includes('API key')) {
      return 'Error de configuración: API key de Pinecone inválida o no configurada.';
    }

    if (error.message?.includes('index')) {
      return 'Error: No se pudo conectar al índice de documentos parroquiales.';
    }

    return `Error al buscar información: ${error.message}. Por favor, intenta de nuevo o consulta directamente con la parroquia.`;
  }
}

// EJECUTAR LA PRUEBA
async function main() {
  console.log('\n🧪 SIMULACIÓN EXACTA DE PINECONE TOOL EN PRODUCCIÓN');
  console.log('='.repeat(70));
  console.log('\n');

  const result = await simulatePineconeTool('Qué es eloos?');

  console.log('\n📋 RESULTADO QUE DEBERÍA VER EL USUARIO:');
  console.log('='.repeat(70));
  console.log('\n');
  console.log(result);
  console.log('\n');
  console.log('='.repeat(70));
  console.log('\n✅ Esta es la respuesta EXACTA que debería generar el sistema');
  console.log('⚠️  Si en producción dice "No encontré información", Vercel NO tiene este código\n');
}

main();
