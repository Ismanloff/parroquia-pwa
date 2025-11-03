/**
 * Pinecone Tool para búsqueda multi-tenant en knowledge base de empresas
 *
 * Configuración:
 * - Índice: saas (dinámico desde .env)
 * - Dimensiones: 1024 (Voyage-3-Large)
 * - Modelo embeddings: voyage-3-large
 * - Región: us-east-1 (AWS Serverless)
 * - Namespace pattern: saas_tenant_{id} (un namespace por workspace)
 *
 * Multi-Tenancy:
 * - Cada tenant tiene su propio namespace aislado en Pinecone
 * - Filtro adicional por tenant_id en metadata para seguridad
 *
 * Optimizaciones RAG 2025:
 * - Query Expansion: Genera 3 variaciones de cada query para mejor recall
 * - Reciprocal Rank Fusion: Combina resultados de múltiples búsquedas
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { Pinecone } from '@pinecone-database/pinecone';
import { VoyageAIClient } from 'voyageai';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentTenantId } from '@/lib/tenant-context';

interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: Record<string, any>;
}

// Inicializar clientes
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const voyageai = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

// Conectar al índice dinámico (desde .env)
const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
const index = pc.index(indexName);

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
      system: `Eres un experto en reformular preguntas sobre productos, servicios y soporte al cliente.

Genera 3 variaciones breves de la pregunta del usuario para mejorar búsquedas semánticas:

TIPOS DE QUERY:

A) Queries de 1-2 palabras clave (ej: "precios planes", "cancelar suscripción"):
   - Mantén las palabras clave EXACTAS en todas las variaciones
   - Expande con contexto mínimo: "cómo puedo", "información sobre", "qué necesito para"
   - NO cambies términos técnicos por sinónimos

B) Nombres propios de productos/servicios:
   - PRESERVA el nombre EXACTO en todas las variaciones
   - Añade contexto: "características", "precio", "cómo funciona", "integración"

REGLAS CRÍTICAS:
- Máximo 12 palabras por variación
- NO uses sinónimos para términos técnicos
- Mantén lenguaje simple y directo
- Si la query menciona precios/planes/documentos, úsalos tal cual

Ejemplos:

"precios planes" →
cuáles son los precios de los planes
información sobre precios y planes
cuánto cuesta cada plan

"cancelar suscripción" →
cómo cancelar mi suscripción
pasos para cancelar suscripción
política de cancelación suscripción

"integraciones disponibles" →
qué integraciones están disponibles
lista de integraciones soportadas
con qué aplicaciones se integra

Responde SOLO con las 3 variaciones, una por línea, sin numeración.`,
      messages: [
        {
          role: 'user',
          content: query
        }
      ]
    });

    const content = response.content[0]?.type === 'text' ? response.content[0]?.text : '';
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
  query: z.string().describe('Consulta del usuario. Debe ser descriptiva y clara.'),
  categoria: z.enum([
    'productos',
    'servicios',
    'precios',
    'soporte',
    'integraciones',
    'politicas',
    'facturacion',
    'cuenta',
    'seguridad',
    'general'
  ]).nullable().default(null).describe('Categoría para filtrar resultados (opcional). Úsala si el usuario pregunta por un tema específico.')
});

/**
 * Herramienta de búsqueda multi-tenant en knowledge base empresarial
 * Soporta filtrado por categoría y aislamiento por tenant
 */
export const pineconeTool = tool({
  name: 'search_parish_info',
  description: `Busca información en la base de conocimiento de la empresa (documentos, guías, políticas, FAQ).

Usa esta herramienta para:
- Información sobre productos y servicios
- Precios, planes y facturación
- Políticas de uso, reembolso y privacidad
- Soporte técnico y troubleshooting
- Integraciones disponibles
- Guías de usuario y procedimientos

NO uses esta herramienta para:
- Eventos con fechas específicas (usa get_calendar_events)
- Formularios de registro (usa get_resources)`,

  parameters: PineconeToolInputSchema,

  execute: async ({ query, categoria }) => {
    try {
      // Obtener tenant_id del contexto global
      const resolvedTenantId = getCurrentTenantId();

      console.log(`🔍 [Pinecone] Buscando: "${query}" | Tenant: ${resolvedTenantId}${categoria ? ` | Categoría: ${categoria}` : ''}`);
      const startTime = Date.now();

      // Construir namespace dinámico por tenant
      const baseNamespace = process.env.PINECONE_NAMESPACE || 'saas';
      const namespace = `${baseNamespace}_${resolvedTenantId}`;
      console.log(`🏢 [Multi-Tenant] Namespace: ${namespace}`);

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

      // 2. Construir filtro de metadata (categoría + tenant_id para seguridad)
      const filter: any = {
        tenant_id: resolvedTenantId  // Filtro de seguridad obligatorio
      };
      if (categoria) {
        filter.categoria = categoria;
      }

      // 3. Generar embeddings de todas las queries EN PARALELO con Voyage AI
      const embeddingPromises = expandedQueries.map(q =>
        voyageai.embed({
          input: [q],  // Voyage AI SDK usa 'input', no 'texts'
          model: 'voyage-3-large',
          inputType: 'query',
          outputDimension: 1024  // Voyage-3-Large default
        })
      );

      const embeddingResponses = await Promise.all(embeddingPromises);
      console.log(`✅ [Embeddings] ${embeddingResponses.length} embeddings generados con Voyage AI`);

      // 4. Buscar en Pinecone con cada embedding EN PARALELO (usando namespace)
      // Voyage AI retorna result.data[].embedding, no result.embeddings
      const searchPromises = embeddingResponses.map(embeddingResponse =>
        index.namespace(namespace).query({
          vector: embeddingResponse.data?.[0]?.embedding || [],
          topK: 5, // Aumentado porque luego fusionamos
          includeMetadata: true,
          filter: filter  // Siempre incluye tenant_id
        })
      );

      const searchResults = await Promise.all(searchPromises);
      console.log(`🔎 [Búsquedas] ${searchResults.length} búsquedas completadas`);

      // DEBUG: Ver cuántos matches hay ANTES de fusion
      const totalMatches = searchResults.reduce((sum, result) => sum + (result.matches?.length || 0), 0);
      console.log(`🔍 [DEBUG] Total matches antes de fusion: ${totalMatches}`);
      if (totalMatches > 0 && searchResults[0]?.matches && searchResults[0]?.matches.length > 0) {
        const firstMatch = searchResults[0]?.matches[0];
        if (firstMatch) {
          console.log(`🔍 [DEBUG] Primer match - ID: ${firstMatch.id}, Score: ${firstMatch.score}, Metadata:`, firstMatch.metadata);
        }
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

        // Buscar de nuevo SIN filtro de categoría pero SIEMPRE con tenant_id
        const fallbackFilter = { tenant_id: resolvedTenantId };
        const fallbackSearchPromises = embeddingResponses.map(embeddingResponse =>
          index.namespace(namespace).query({
            vector: embeddingResponse.data?.[0]?.embedding || [],
            topK: 5,
            includeMetadata: true,
            filter: fallbackFilter  // Mantiene tenant_id por seguridad
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
        console.log(`❌ [Pinecone] Sin resultados para: "${query}" en tenant ${resolvedTenantId}`);
        console.log(`🔍 [DEBUG] Namespace: ${namespace} | Filtro:`, filter);
        return 'No se encontró información específica sobre este tema en la base de conocimiento. Contacta con el equipo de soporte para más ayuda.';
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
        return 'Error: No se pudo conectar al índice de conocimiento.';
      }

      return `Error al buscar información: ${error.message}. Por favor, intenta de nuevo o contacta con soporte.`;
    }
  },
});
