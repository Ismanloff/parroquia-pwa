# 🔍 Hybrid Search & Cascading Retrieval - Future Enhancement

**Status**: 📋 Documentación para implementación futura
**Priority**: Sprint 5-6 (después de completar features core)
**Source**: Pinecone recommendation email
**Expected Impact**: +30-40% mejora en precisión de búsqueda

---

## 📧 Context: Email de Pinecone

> "There are a variety of techniques you can use to increase the performance of your RAG application. One common technique is **cascading retrieval** which combines dense and sparse retrieval and reranks the results through an unified search pipeline."

---

## 🎯 ¿Qué es Cascading Retrieval?

### Definición
Técnica avanzada de búsqueda que combina:
1. **Dense Retrieval** (búsqueda semántica por embeddings)
2. **Sparse Retrieval** (búsqueda por keywords/BM25)
3. **Reranking** (reordenamiento con modelo especializado)

### Pipeline Completo
```
User Query
    ↓
┌─────────────────────────────┐
│  1. Dense Retrieval         │ → 50 resultados (semántica)
│     (Voyage AI embeddings)  │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  2. Sparse Retrieval        │ → 50 resultados (keywords)
│     (BM25 / TF-IDF)         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  3. Merge Results           │ → 100 resultados únicos
│     (remove duplicates)     │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  4. Reranking Model         │ → Top 5 mejores
│     (Cohere/OpenAI)         │
└─────────────────────────────┘
    ↓
RAG Context (mejor calidad)
```

---

## 🔬 Comparación de Técnicas

### 1. Dense Retrieval (Implementación Actual)

**Qué es**: Búsqueda semántica usando embeddings vectoriales

**Tecnología**: Voyage AI (`voyage-3-large`, 1024 dims)

**Fortalezas**:
- ✅ Entiende contexto y sinónimos
- ✅ Búsqueda por "significado" no palabras exactas
- ✅ Excelente para preguntas naturales
- ✅ Multi-idioma (similar semántico cross-language)

**Debilidades**:
- ❌ Puede fallar con términos técnicos exactos
- ❌ No ideal para IDs, códigos, nombres propios
- ❌ Dificulta búsqueda de abreviaturas

**Ejemplo**:
```typescript
Query: "¿Cuándo abren?"
✅ Encuentra: "Horario de atención: Lunes a Viernes 9:00-18:00"
❌ Puede perder: "Horario: L-V 9-18h" (formato abreviado)
```

---

### 2. Sparse Retrieval (A Implementar)

**Qué es**: Búsqueda tradicional por keywords

**Tecnología**: BM25, TF-IDF, o Pinecone Sparse Vectors

**Fortalezas**:
- ✅ Perfecto para términos exactos
- ✅ Excelente con nombres propios, IDs
- ✅ Rápido y económico
- ✅ Bueno con abreviaturas

**Debilidades**:
- ❌ No entiende sinónimos
- ❌ Sensible a typos
- ❌ Requiere palabra exacta en documento

**Ejemplo**:
```typescript
Query: "COVID-19"
✅ Encuentra: "Protocolo COVID-19 actualizado" (exacto)
❌ No encuentra: "Protocolo de coronavirus" (sinónimo)
```

---

### 3. Hybrid Search (Dense + Sparse)

**Qué es**: Combinar lo mejor de ambos mundos

**Cómo funciona**:
```typescript
// Pinecone Hybrid Search
const results = await index.query({
  // Dense vector (semántica)
  vector: [0.1, 0.5, 0.3, ...], // 1024 dims

  // Sparse vector (keywords)
  sparseVector: {
    indices: [42, 157, 892],  // Token IDs
    values: [0.5, 0.3, 0.2]   // Importancia
  },

  topK: 10,
  includeMetadata: true
});
```

**Alpha Parameter** (balance dense/sparse):
```typescript
{
  alpha: 0.5  // 50% dense + 50% sparse (default)
  alpha: 0.7  // 70% dense + 30% sparse (más semántica)
  alpha: 0.3  // 30% dense + 70% sparse (más keywords)
}
```

---

### 4. Reranking (Paso Final)

**Qué es**: Modelo especializado que reordena resultados por relevancia

**Modelos Disponibles**:

| Provider | Model | Cost/1K requests | Latency |
|----------|-------|------------------|---------|
| **Cohere** | rerank-english-v2.0 | $0.002 | ~100ms |
| **Cohere** | rerank-multilingual-v2.0 | $0.002 | ~120ms |
| **OpenAI** | text-embedding-3-large | $0.0001 | ~150ms |
| **Jina AI** | jina-reranker-v1 | $0.0005 | ~80ms |

**Cómo funciona**:
```typescript
// Antes del reranking
Results: [
  { text: "Info de contacto", score: 0.85 },
  { text: "Email: support@resply.com", score: 0.78 },
  { text: "Envía un correo", score: 0.75 }
]

// Después del reranking (Cohere)
Results: [
  { text: "Email: support@resply.com", score: 0.95 }, // ✅ Mejor
  { text: "Info de contacto", score: 0.85 },
  { text: "Envía un correo", score: 0.75 }
]
```

---

## 💡 Casos de Uso Ideales

### ✅ Implementar Hybrid Search SI:

1. **Documentos Técnicos**:
   - Manuales con códigos de error (E404, ERR_CONN_REFUSED)
   - APIs con endpoints exactos (/api/v1/users)
   - Productos con SKUs (SKU-12345)

2. **Nombres Propios**:
   - Personas: "Dr. García", "María López"
   - Lugares: "Madrid", "Calle Gran Vía 42"
   - Empresas: "Resply SaaS Inc."

3. **Fechas y Números Exactos**:
   - "Reunión 15 de marzo"
   - "Factura #INV-2024-001"
   - "Precio: €49.99"

4. **Abreviaturas**:
   - "FAQ", "API", "CEO", "RLS"
   - "L-V" (Lunes a Viernes)
   - "ASAP", "FYI"

### ❌ NO necesario SI:

1. Documentos principalmente narrativos (blog posts, artículos)
2. Preguntas siempre en lenguaje natural
3. Pocos documentos (<500 por workspace)
4. Presupuesto muy limitado
5. Dense retrieval actual tiene >80% satisfacción

---

## 📊 Comparativa de Resultados

### Ejemplo 1: Búsqueda de Email

**Query**: "email de soporte"

#### Solo Dense (actual):
```json
[
  { "text": "Contacta con nuestro equipo...", "score": 0.85 },
  { "text": "Envía un correo al admin", "score": 0.78 },
  { "text": "Email: support@resply.com", "score": 0.75 }
]
```

#### Hybrid + Rerank:
```json
[
  { "text": "Email: support@resply.com", "score": 0.95 }, // ✅
  { "text": "Contacta con nuestro equipo...", "score": 0.85 },
  { "text": "Envía un correo al admin", "score": 0.78 }
]
```

**Mejora**: Email exacto sube de #3 a #1

---

### Ejemplo 2: Código de Error

**Query**: "error E404"

#### Solo Dense (actual):
```json
[
  { "text": "Errores comunes en la app", "score": 0.82 },
  { "text": "Solución: revisa logs", "score": 0.79 },
  { "text": "E404: Página no encontrada", "score": 0.68 } // ❌
]
```

#### Hybrid + Rerank:
```json
[
  { "text": "E404: Página no encontrada", "score": 0.94 }, // ✅
  { "text": "Errores comunes en la app", "score": 0.82 },
  { "text": "Solución: revisa logs", "score": 0.79 }
]
```

**Mejora**: Código exacto sube de #3 a #1

---

## 🚀 Implementación Técnica

### Opción 1: Pinecone Hybrid Search (Recomendado)

**Prerrequisitos**:
- Index de Pinecone con soporte `dotproduct` o `cosine`
- Pinecone client v2.0+

**Código**:
```typescript
// app/api/chat/hybrid-search.ts
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function hybridSearch(
  query: string,
  workspaceId: string,
  topK: number = 5
) {
  const index = pinecone.index('saas');
  const namespace = index.namespace(workspaceId);

  // 1. Generate dense embedding (Voyage AI)
  const denseVector = await generateDenseEmbedding(query);

  // 2. Generate sparse vector (BM25 - local o Pinecone)
  const sparseVector = await generateSparseEmbedding(query);

  // 3. Hybrid search
  const results = await namespace.query({
    vector: denseVector,
    sparseVector: {
      indices: sparseVector.indices,
      values: sparseVector.values,
    },
    topK: topK * 2, // Pedir más para reranking
    includeMetadata: true,
  });

  // 4. Rerank (opcional)
  const reranked = await rerankWithCohere(query, results.matches);

  return reranked.slice(0, topK);
}

// Generate sparse vector (BM25)
async function generateSparseEmbedding(text: string) {
  // Opción A: Usar librería local (bm25)
  const tokens = tokenize(text);
  const bm25 = new BM25(tokens);

  return {
    indices: bm25.indices,
    values: bm25.scores,
  };

  // Opción B: Usar Pinecone Inference API
  const response = await fetch('https://api.pinecone.io/embed/sparse', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.PINECONE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'bm25',
      inputs: [text],
    }),
  });

  const data = await response.json();
  return data.embeddings[0];
}

// Rerank with Cohere
async function rerankWithCohere(query: string, documents: any[]) {
  const response = await fetch('https://api.cohere.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'rerank-english-v2.0',
      query: query,
      documents: documents.map(d => d.metadata.text),
      top_n: 5,
    }),
  });

  const data = await response.json();

  // Mapear scores de Cohere a documentos originales
  return data.results.map((result: any) => ({
    ...documents[result.index],
    score: result.relevance_score,
  }));
}
```

---

### Opción 2: Manual Merge (Sin Pinecone Hybrid)

Si tu index actual no soporta sparse vectors:

```typescript
async function cascadingRetrieval(
  query: string,
  workspaceId: string
) {
  // 1. Dense retrieval (Pinecone actual)
  const denseResults = await pineconeSearch(query, workspaceId, 50);

  // 2. Sparse retrieval (local BM25 sobre metadatos)
  const sparseResults = await localBM25Search(query, workspaceId, 50);

  // 3. Merge y deduplicate
  const merged = mergeResults(denseResults, sparseResults);

  // 4. Rerank
  const reranked = await rerankWithCohere(query, merged);

  return reranked.slice(0, 5);
}

function mergeResults(dense: any[], sparse: any[]) {
  const seen = new Set<string>();
  const merged = [];

  // Priorizar dense primero
  for (const doc of dense) {
    if (!seen.has(doc.id)) {
      merged.push(doc);
      seen.add(doc.id);
    }
  }

  // Agregar sparse no duplicados
  for (const doc of sparse) {
    if (!seen.has(doc.id)) {
      merged.push(doc);
      seen.add(doc.id);
    }
  }

  return merged;
}
```

---

## 💰 Análisis de Costos

### Costo Actual (Dense Only)
| Componente | Proveedor | Costo/1M tokens | Uso (100 tenants) | Costo/mes |
|------------|-----------|-----------------|-------------------|-----------|
| Dense embeddings | Voyage AI | $0.10 | 2M tokens | $200 |
| Pinecone query | Pinecone | Incluido | - | $70 |
| **Total** | | | | **$270** |

### Costo con Hybrid + Rerank
| Componente | Proveedor | Costo | Uso (100 tenants) | Costo/mes |
|------------|-----------|-------|-------------------|-----------|
| Dense embeddings | Voyage AI | $0.10/1M tokens | 2M tokens | $200 |
| Sparse embeddings | Local BM25 | Gratis | - | $0 |
| Pinecone query | Pinecone | Incluido | - | $70 |
| Reranking | Cohere | $0.002/1K req | 10K requests | $20 |
| **Total** | | | | **$290** |

**Incremento**: +$20/mes (+7.4%)
**ROI esperado**: +30-40% mejor precisión

---

## 📈 Métricas de Éxito

### Antes de Implementar (Baseline)
Medir durante 1 semana:
1. **Precision@5**: ¿Cuántos de los top 5 son relevantes?
2. **User satisfaction**: Thumbs up/down en respuestas
3. **No-result rate**: % de búsquedas sin resultados útiles
4. **Query latency**: Tiempo de respuesta

### Después de Implementar (A/B Test)
Comparar durante 2 semanas:
1. **Precision@5**: Debe subir +20-30%
2. **User satisfaction**: Debe subir +10-15%
3. **No-result rate**: Debe bajar 30-50%
4. **Query latency**: Puede subir +100-200ms (aceptable)

### KPIs Target
```
Precision@5:      70% → 90%  (+20%)
User satisfaction: 75% → 85%  (+10%)
No-result rate:   15% → 8%   (-47%)
Latency:         150ms → 300ms (+150ms)
```

---

## 🛠️ Plan de Implementación (Cuando decidas hacerlo)

### Fase 1: Preparación (1 semana)
- [ ] Medir baseline metrics (1 semana de datos)
- [ ] Analizar queries que fallan actualmente
- [ ] Identificar tipos de documentos (técnicos vs narrativos)
- [ ] Decidir: ¿Pinecone Hybrid o manual merge?

### Fase 2: Sparse Retrieval (2-3 días)
- [ ] Implementar BM25 local o usar Pinecone Inference API
- [ ] Generar sparse vectors para documentos existentes
- [ ] Actualizar pipeline de indexado (agregar sparse a upsert)
- [ ] Testing: sparse retrieval solo

### Fase 3: Hybrid Search (2-3 días)
- [ ] Implementar merge de dense + sparse
- [ ] Configurar alpha parameter (empezar con 0.5)
- [ ] A/B test: dense vs hybrid (sin rerank)
- [ ] Optimizar alpha según resultados

### Fase 4: Reranking (1-2 días)
- [ ] Integrar Cohere Rerank API
- [ ] A/B test: hybrid vs hybrid+rerank
- [ ] Optimizar top_n y threshold
- [ ] Implementar caching de rerank

### Fase 5: Producción (1 semana)
- [ ] Deploy gradual (10% → 50% → 100%)
- [ ] Monitor latency, errors, costs
- [ ] Ajustar parámetros según feedback
- [ ] Documentar mejoras observadas

**Tiempo total**: 3-4 semanas
**Esfuerzo**: 20-30 horas desarrollo

---

## 🧪 Testing Strategy

### Test 1: Términos Exactos
```typescript
// Queries que deberían mejorar con hybrid
const testQueries = [
  "error E404",           // Código exacto
  "FAQ",                  // Abreviatura
  "support@resply.com",   // Email exacto
  "SKU-12345",            // ID de producto
  "15 de marzo",          // Fecha exacta
];

for (const query of testQueries) {
  const dense = await denseSearch(query);
  const hybrid = await hybridSearch(query);

  console.log(`Query: ${query}`);
  console.log(`Dense top 1: ${dense[0].metadata.text}`);
  console.log(`Hybrid top 1: ${hybrid[0].metadata.text}`);
  console.log(`Improvement: ${hybrid[0].score > dense[0].score ? '✅' : '❌'}`);
}
```

### Test 2: Preguntas Semánticas
```typescript
// Queries que NO deberían empeorar con hybrid
const semanticQueries = [
  "¿Cómo puedo contactar con soporte?",
  "Horario de atención al cliente",
  "Información sobre precios",
  "¿Dónde encuentro la documentación?",
];

// Esperado: hybrid ≈ dense (no debería empeorar)
```

### Test 3: Latency Benchmark
```bash
# Test de latencia
npm run test:latency:dense    # Baseline
npm run test:latency:hybrid   # Compare
npm run test:latency:rerank   # Full pipeline

# Expected:
# Dense:  150ms
# Hybrid: 200ms (+50ms)
# Rerank: 300ms (+150ms)
```

---

## 📚 Recursos y Referencias

### Documentación Oficial
- [Pinecone Hybrid Search](https://docs.pinecone.io/docs/hybrid-search)
- [Pinecone Sparse Vectors](https://docs.pinecone.io/docs/sparse-dense-embeddings)
- [Cohere Rerank API](https://docs.cohere.com/reference/rerank-1)
- [Voyage AI Embeddings](https://docs.voyageai.com/embeddings/)

### Papers y Artículos
- [Dense vs Sparse Retrieval (Pinecone Blog)](https://www.pinecone.io/learn/dense-vector-embeddings-nlp/)
- [BM25 Algorithm Explained](https://en.wikipedia.org/wiki/Okapi_BM25)
- [Reranking for RAG (Cohere Blog)](https://cohere.com/blog/rerank)

### Librerías Útiles
```bash
# BM25 local (Node.js)
npm install bm25

# Natural Language Processing
npm install natural

# Tokenización
npm install @stdlib/nlp-tokenize
```

### Ejemplos de Código
- [Pinecone Hybrid Search Examples](https://github.com/pinecone-io/examples)
- [LangChain Reranking](https://python.langchain.com/docs/modules/data_connection/retrievers/contextual_compression/)
- [Cohere Node.js SDK](https://github.com/cohere-ai/cohere-node)

---

## 🎯 Recomendación Final

### AHORA (Sprint 2-4):
- ❌ **No implementar** - enfócate en features core
- ✅ **Medir baseline** - track precision y user satisfaction
- ✅ **Recopilar feedback** - ¿usuarios se quejan de búsquedas?

### FUTURO (Sprint 5-6):
- ✅ **Implementar SI**:
  - Tienes >500 documentos/workspace
  - Usuarios reportan búsquedas fallidas
  - Documentos técnicos con IDs/códigos
  - Presupuesto disponible (+$20/mes)

- ❌ **No implementar SI**:
  - Dense retrieval actual >80% satisfacción
  - Pocos documentos (<500)
  - Presupuesto muy limitado
  - Prioridades más urgentes

---

## ✅ Checklist Pre-Implementación

Antes de empezar, asegúrate:
- [ ] Sprint 1-4 completados (monitoring, performance, backups, features)
- [ ] Métricas baseline recopiladas (1 semana de datos)
- [ ] Identificados tipos de queries que fallan
- [ ] Presupuesto aprobado (+$20/mes)
- [ ] Tiempo disponible (20-30 horas desarrollo)
- [ ] Plan de A/B testing definido
- [ ] Rollback strategy preparada

---

**Fecha de Creación**: 2025-01-05
**Última Actualización**: 2025-01-05
**Autor**: Claude (basado en recomendación Pinecone)
**Status**: 📋 Pendiente de implementación futura
**Prioridad**: Sprint 5-6 (después de features core)
