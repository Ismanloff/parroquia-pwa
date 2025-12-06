import { tool } from "@openai/agents";
import { z } from "zod";

// Schema para los parámetros de entrada de la tool
const GetResourcesSchema = z.object({
  query: z.string().describe("La consulta o tema del usuario para buscar recursos relacionados (ej: 'catequesis', 'comunidad eloos', 'autorización salida')"),
});

// Base de datos de recursos embebida (compatible con Edge Runtime)
// Para añadir nuevos recursos, edita este objeto directamente
const RESOURCES_DATABASE = {
  "comunidad_eloos": {
    "title": "Formulario de Inscripción - Comunidad Eloos",
    "description": "Formulario para unirse a la comunidad Eloos (Entrega y Superación)",
    "url": "https://form.typeform.com/to/eA98edUa",
    "type": "url",
    "keywords": [
      "comunidad",
      "eloos",
      "entrega",
      "superacion",
      "superación",
      "unirse",
      "apuntarse",
      "inscripcion",
      "inscripción",
      "formulario",
      "joven",
      "jóvenes",
      "grupo"
    ]
  },
  "comunidad_eloos_pdf": {
    "title": "Documento Informativo - Comunidad Eloos (PDF)",
    "description": "Información detallada sobre la comunidad Eloos en formato PDF",
    "url": "/docs/comunidad-eloos.pdf",
    "type": "pdf",
    "keywords": [
      "comunidad",
      "eloos",
      "documento",
      "pdf",
      "informacion",
      "información",
      "descargar",
      "archivo"
    ]
  },
} as const;

// ⚡ OPTIMIZACIÓN: Índice invertido para búsqueda O(1) en lugar de O(n)
// Pre-computar Map: keyword -> [recursos que tienen ese keyword]
const KEYWORD_INDEX = new Map<string, Set<string>>();

// Inicializar índice (se ejecuta 1 sola vez al cargar el módulo)
for (const [resourceId, resource] of Object.entries(RESOURCES_DATABASE)) {
  const resourceData = resource as any;
  for (const keyword of resourceData.keywords || []) {
    const normalizedKeyword = keyword.toLowerCase();

    if (!KEYWORD_INDEX.has(normalizedKeyword)) {
      KEYWORD_INDEX.set(normalizedKeyword, new Set());
    }

    KEYWORD_INDEX.get(normalizedKeyword)!.add(resourceId);
  }
}

// Cargar la base de datos de recursos (ahora solo retorna el objeto embebido)
function loadResources() {
  return RESOURCES_DATABASE;
}

// ⚡ OPTIMIZADA: Calcular relevancia usando índice invertido
function calculateRelevanceOptimized(query: string, keywords: string[]): number {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  let matches = 0;
  let totalKeywords = keywords.length;

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();

    // Match exacto de keyword completa
    if (normalizedQuery.includes(normalizedKeyword)) {
      matches += 2; // Peso mayor para match completo
    }

    // Match parcial por palabra
    for (const word of queryWords) {
      if (normalizedKeyword.includes(word) || word.includes(normalizedKeyword)) {
        matches += 1;
      }
    }
  }

  return matches / totalKeywords;
}

// ⚡ OPTIMIZADA: Función principal con índice invertido
// Antes: O(n*k*w) - iteraba todos los recursos
// Ahora: O(w + r) - solo recursos con keywords relevantes
export function searchResources(query: string) {
  const allResources = loadResources();
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  // PASO 1: Usar índice invertido para encontrar recursos candidatos
  const candidateIds = new Set<string>();

  for (const word of queryWords) {
    // Buscar keywords exactas
    if (KEYWORD_INDEX.has(word)) {
      for (const resourceId of KEYWORD_INDEX.get(word)!) {
        candidateIds.add(resourceId);
      }
    }

    // Buscar keywords que contengan la palabra
    for (const [keyword, resourceIds] of KEYWORD_INDEX.entries()) {
      if (keyword.includes(word) || word.includes(keyword)) {
        for (const resourceId of resourceIds) {
          candidateIds.add(resourceId);
        }
      }
    }
  }

  // PASO 2: Calcular relevancia solo para candidatos (mucho más rápido)
  const results: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    type: "pdf" | "url";
    relevance: number;
  }> = [];

  for (const id of candidateIds) {
    const resource = allResources[id as keyof typeof allResources];
    if (!resource) continue;

    const resourceData = resource as any;
    const relevance = calculateRelevanceOptimized(query, resourceData.keywords || []);

    if (relevance > 0) {
      results.push({
        id,
        title: resourceData.title,
        description: resourceData.description,
        url: resourceData.url,
        type: resourceData.type,
        relevance,
      });
    }
  }

  // PASO 3: Ordenar por relevancia descendente
  results.sort((a, b) => b.relevance - a.relevance);

  // Retornar top 3 más relevantes
  const topResults = results.slice(0, 3);

  if (topResults.length === 0) {
    return {
      resources: [],
      message: "No se encontraron recursos específicos para esta consulta.",
    };
  }

  return {
    resources: topResults.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      url: r.url,
      type: r.type,
    })),
    message: `Se encontraron ${topResults.length} recurso(s) relevante(s).`,
  };
}

// Definir la tool para el agente
export const resourcesTool = tool({
  name: "get_resources",
  description: "Busca y retorna documentos, formularios, PDFs o enlaces útiles relacionados con la consulta del usuario. Usa esta herramienta cuando el usuario necesite: inscribirse a un grupo/actividad, descargar un formulario, obtener una autorización, o acceder a documentación específica de la parroquia.",
  parameters: GetResourcesSchema,
  execute: async ({ query }: z.infer<typeof GetResourcesSchema>) => {
    try {
      console.log('🔧 get_resources LLAMADA con query:', query);
      const result = searchResources(query);
      console.log('📦 get_resources RESULTADO:', JSON.stringify(result, null, 2));
      console.log(`✅ get_resources retornó ${result.resources.length} recurso(s)`);
      return result;
    } catch (error: any) {
      console.error('❌ Error en resourcesTool:', error);
      return {
        resources: [],
        message: `Error al buscar recursos: ${error.message}`,
      };
    }
  },
});
