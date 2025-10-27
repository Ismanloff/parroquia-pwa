/**
 * Pinecone Tool para búsqueda en documentos parroquiales
 *
 * Configuración:
 * - Índice: parroquias
 * - Dimensiones: 3072
 * - Modelo: text-embedding-3-large
 * - Región: us-east-1 (AWS)
 * - 71 documentos vectorizados con metadata rica (24 PDFs + 47 MD chunks)
 *
 * Optimizaciones RAG 2025:
 * - Query Expansion: Genera 3 variaciones de cada query para mejor recall
 * - Reciprocal Rank Fusion: Combina resultados de múltiples búsquedas
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: Record<string, any>;
}

// Inicializar clientes
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// Conectar al índice "parroquias"
const index = pc.index('parroquias');

/**
 * Expande una query en múltiples variaciones usando Claude Haiku 4.5
 * Mejora el recall al buscar con diferentes formulaciones
 */
async function expandQuery(query: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      temperature: 0.1,
      system: `Eres un experto en reformular preguntas sobre parroquias católicas.

Genera 3 variaciones breves de la pregunta del usuario para mejorar búsquedas semánticas:

TIPOS DE QUERY:

A) Queries de 1-2 palabras clave (ej: "testigos bautismo", "documentos matrimonio"):
   - Mantén las palabras clave EXACTAS en todas las variaciones
   - Expande con contexto mínimo: "requisitos para", "información sobre", "qué necesito para"
   - NO cambies términos técnicos por sinónimos

B) Nombres propios de grupos (ej: "Eloos", "Oro y Café"):
   - PRESERVA el nombre EXACTO en todas las variaciones
   - Añade contexto: "grupo", "actividades", "horarios", "reuniones"

REGLAS CRÍTICAS:
- Máximo 12 palabras por variación
- NO uses sinónimos para términos sacramentales: "testigos" NO es "padrinos"
- Mantén lenguaje simple y directo
- Si la query menciona documentos/requisitos/testigos, úsalos tal cual

Ejemplos:

"testigos bautismo" →
requisitos testigos bautismo
información testigos para bautismo
quiénes pueden ser testigos bautismo

"documentos matrimonio" →
qué documentos necesito para matrimonio
requisitos documentos expediente matrimonial
documentación necesaria matrimonio

"oro y café" →
grupo Oro y Café actividades
información Oro y Café horarios
encuentro parejas Oro y Café

Responde SOLO con las 3 variaciones, una por línea, sin numeración.`,
      messages: [
        {
          role: 'user',
          content: query
        }
      ]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const variations = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 3); // Solo las primeras 3

    // Siempre incluir la query original también
    return [query, ...variations];

  } catch (error) {
    console.warn('⚠️ [Query Expansion] Error, usando query original:', error);
    return [query]; // Fallback: solo la query original
  }
}

/**
 * Reciprocal Rank Fusion: Combina resultados de múltiples búsquedas
 * Fórmula: score = sum(1 / (k + rank)) para cada query donde aparece el documento
 */
function reciprocalRankFusion(resultSets: PineconeMatch[][], k: number = 60): PineconeMatch[] {
  const scoreMap = new Map<string, { score: number; match: PineconeMatch }>();

  resultSets.forEach((results) => {
    results.forEach((match, rank) => {
      const id = match.id;
      const rrfScore = 1 / (k + rank + 1); // +1 porque rank empieza en 0

      if (scoreMap.has(id)) {
        const existing = scoreMap.get(id)!;
        existing.score += rrfScore;
      } else {
        scoreMap.set(id, { score: rrfScore, match });
      }
    });
  });

  // Ordenar por score RRF descendente
  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(item => item.match);
}

// Schema para los parámetros del tool
const PineconeToolInputSchema = z.object({
  query: z.string().describe('Consulta del usuario sobre la parroquia. Debe ser descriptiva y clara.'),
  categoria: z.enum([
    'sacramentos',
    'catequesis',
    'liturgia',
    'caritas',
    'grupos_oracion',
    'jovenes',
    'familias',
    'formacion',
    'comunidad_china',
    'informacion_general'
  ]).nullable().default(null).describe('Categoría pastoral para filtrar resultados (opcional). Úsala si el usuario pregunta por un tema específico.')
});

/**
 * Herramienta de búsqueda en Pinecone para documentos parroquiales
 * Soporta filtrado por categoría pastoral y metadata enriquecida
 */
export const pineconeTool = tool({
  name: 'search_parish_info',
  description: `Busca información en documentos oficiales de la parroquia (PDFs, guías, boletines).

Usa esta herramienta para:
- Información sobre sacramentos (bautismo, confirmación, matrimonio, etc.)
- Actividades y grupos parroquiales (catequesis, Eloos, Cáritas, grupos de oración)
- Horarios de actividades regulares
- Normativas y procedimientos parroquiales
- Historia y contexto de la parroquia
- Información sobre comunidades religiosas

NO uses esta herramienta para:
- Eventos con fechas específicas (usa get_calendar_events)
- Formularios de inscripción (usa get_resources)`,

  parameters: PineconeToolInputSchema,

  execute: async ({ query, categoria }) => {
    try {
      console.log(`🔍 [Pinecone] Buscando: "${query}"${categoria ? ` | Categoría: ${categoria}` : ''}`);
      const startTime = Date.now();

      // 🎯 OPTIMIZACIÓN CONDICIONAL: Detectar si la query necesita expansion
      // Queries largas (>= 30 chars) y bien formuladas NO necesitan expansion
      const queryLength = query.trim().length;
      const needsExpansion = queryLength < 30;

      console.log(`📏 [Query Analysis] Longitud: ${queryLength} chars | Expansion: ${needsExpansion ? 'SÍ' : 'NO (query auto-contenida)'}`);

      // 1. Query Expansion: Generar variaciones SOLO si es necesario
      let expandedQueries: string[];

      if (needsExpansion) {
        expandedQueries = await expandQuery(query);
        console.log(`📝 [Query Expansion] Generadas ${expandedQueries.length} variaciones (query corta)`);
      } else {
        expandedQueries = [query]; // Skip expansion para queries largas
        console.log(`⚡ [Query Expansion] SKIP - Query suficientemente específica (${queryLength} chars)`);
      }

      // 2. Construir filtro de metadata (si se especifica categoría)
      const filter: any = {};
      if (categoria) {
        filter.categoria_pastoral = categoria;
      }

      // 3. Generar embeddings de todas las queries EN PARALELO
      const embeddingPromises = expandedQueries.map(q =>
        openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: q,
          dimensions: 3072
        })
      );

      const embeddingResponses = await Promise.all(embeddingPromises);
      console.log(`✅ [Embeddings] ${embeddingResponses.length} embeddings generados`);

      // 4. Buscar en Pinecone con cada embedding EN PARALELO
      const searchPromises = embeddingResponses.map(embeddingResponse =>
        index.query({
          vector: embeddingResponse.data[0].embedding,
          topK: 5, // Aumentado porque luego fusionamos
          includeMetadata: true,
          filter: Object.keys(filter).length > 0 ? filter : undefined
        })
      );

      const searchResults = await Promise.all(searchPromises);
      console.log(`🔎 [Búsquedas] ${searchResults.length} búsquedas completadas`);

      // DEBUG: Ver cuántos matches hay ANTES de fusion
      const totalMatches = searchResults.reduce((sum, result) => sum + (result.matches?.length || 0), 0);
      console.log(`🔍 [DEBUG] Total matches antes de fusion: ${totalMatches}`);
      if (totalMatches > 0 && searchResults[0].matches && searchResults[0].matches.length > 0) {
        const firstMatch = searchResults[0].matches[0];
        console.log(`🔍 [DEBUG] Primer match - ID: ${firstMatch.id}, Score: ${firstMatch.score}, Metadata:`, firstMatch.metadata);
      }

      // 5. Combinar resultados usando Reciprocal Rank Fusion
      let allMatches = searchResults.map(result => result.matches || []);
      let fusedResults = reciprocalRankFusion(allMatches);

      const duration = Date.now() - startTime;
      console.log(`⚡ [Pinecone] Búsqueda completada en ${duration}ms`);

      // 6. FALLBACK: Si no hay resultados CON filtro, intentar SIN filtro
      if (fusedResults.length === 0 && Object.keys(filter).length > 0) {
        console.log(`🔄 [Pinecone] FALLBACK - Sin resultados con filtro. Intentando sin filtro de categoría...`);
        console.log(`🔍 [DEBUG] Filtro que bloqueó resultados:`, filter);

        // Buscar de nuevo SIN filtro
        const fallbackSearchPromises = embeddingResponses.map(embeddingResponse =>
          index.query({
            vector: embeddingResponse.data[0].embedding,
            topK: 5,
            includeMetadata: true
            // Sin filtro
          })
        );

        const fallbackSearchResults = await Promise.all(fallbackSearchPromises);
        console.log(`🔎 [FALLBACK] ${fallbackSearchResults.length} búsquedas sin filtro completadas`);

        // DEBUG: Ver cuántos matches hay sin filtro
        const totalFallbackMatches = fallbackSearchResults.reduce((sum, result) => sum + (result.matches?.length || 0), 0);
        console.log(`🔍 [DEBUG] Total matches SIN filtro: ${totalFallbackMatches}`);

        allMatches = fallbackSearchResults.map(result => result.matches || []);
        fusedResults = reciprocalRankFusion(allMatches);

        if (fusedResults.length > 0) {
          console.log(`✅ [FALLBACK] ¡Encontrados ${fusedResults.length} resultados sin filtro!`);
        }
      }

      // 7. Validar resultados finales
      if (fusedResults.length === 0) {
        console.log(`❌ [Pinecone] Sin resultados para: "${query}"`);
        console.log(`🔍 [DEBUG] Intentó con filtro:`, Object.keys(filter).length > 0 ? filter : 'ninguno');
        return 'No se encontró información específica sobre este tema en los documentos parroquiales. Consulta directamente con la recepción de la parroquia.';
      }

      // 8. Tomar los top 3 resultados después de fusion
      const topResults = fusedResults.slice(0, 3);
      console.log(`✅ [Pinecone] ${topResults.length} resultados finales seleccionados`);

      // 9. Formatear resultados con contenido limpio
      const formattedResults = topResults.map((match) => {
        const meta = match.metadata as any;
        const content = meta?.pageContent || meta?.text || '';

        // Retornar solo el contenido relevante (aumentado a 1000 chars para no cortar información clave)
        return content.substring(0, 1000).trim() + (content.length > 1000 ? '...' : '');
      }).join('\n\n---\n\n');

      // 10. Retornar solo el contenido formateado (sin encabezado redundante)
      return formattedResults;

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
  },
});
