# 🎯 PLAN: Pinecone Document Management System

**Fecha:** 3 de Noviembre 2025
**Objetivo:** Sistema profesional de gestión de documentos con vectorización en Pinecone
**Completitud actual:** 80% (muy avanzado!)

---

## 📊 ANÁLISIS: LO QUE YA TIENES

### ✅ UI Completa (app/(dashboard)/dashboard/documents/page.tsx)

**Features implementados:**
- ✅ Tabla de documentos con columnas: Documento, Tamaño, Chunks, Estado, Fecha
- ✅ Búsqueda en tiempo real por nombre de archivo
- ✅ Real-time updates con Supabase
- ✅ Indicador de conexión (Live/Offline)
- ✅ Progress indicator para uploads
- ✅ Botón de refresh
- ✅ Botón de delete por documento
- ✅ Botón de download
- ✅ Stats footer (Total documentos, Chunks, Tamaño, Completados)
- ✅ Empty state con call-to-action
- ✅ Loading states
- ✅ Error states
- ✅ Dark mode support
- ✅ Responsive design

**Calidad:** Diseño profesional, bien estructurado, siguiendo mejores prácticas de UX 2025

---

### ✅ Backend Funcional

**API Endpoints:**

1. **`/api/documents/upload`** (route.ts)
   - ✅ Autenticación con bearer token
   - ✅ Validación de permisos (workspace_members)
   - ✅ Validación de tipo de archivo (PDF, DOC, DOCX, TXT)
   - ✅ Validación de tamaño (max 10MB)
   - ✅ Upload a Supabase Storage
   - ✅ Creación de record en DB
   - ✅ Trigger asíncrono de procesamiento

2. **`/api/documents/list`** (route.ts)
   - ✅ Autenticación
   - ✅ Filtrado por workspace
   - ✅ Ordenamiento por fecha

3. **`/api/documents/process`** (route.ts)
   - ⚠️ **INCOMPLETO** - Solo esqueleto con TODOs

---

### ✅ Realtime Hook (hooks/useRealtimeDocuments.ts)

**Features:**
- ✅ Subscripción a cambios en tabla documents
- ✅ Estado de conexión
- ✅ Función de refresh
- ✅ Función de delete
- ✅ Contador de uploads en progreso

---

## ❌ LO QUE FALTA (20% restante)

### 1. **Drag & Drop Funcional**

**Estado actual:** Solo texto "Arrastra archivos aquí" pero no funciona

**Qué hace falta:**
- Implementar react-dropzone (librería estándar 2025)
- Event handlers: onDrop, onDragOver, onDragLeave
- Visual feedback (borde azul cuando arrastras)
- Multi-file support
- File previews antes de subir

**Complejidad:** ⭐⭐ (Media)
**Tiempo estimado:** 2-3 horas

---

### 2. **Conectar Upload Button a API**

**Estado actual:** Botón existe pero no hace nada

**Qué hace falta:**
- Input file hidden
- Click handler para abrir file picker
- FormData construction
- Fetch a /api/documents/upload
- Loading state durante upload
- Toast notification al completar
- Error handling

**Complejidad:** ⭐ (Baja)
**Tiempo estimado:** 1 hora

---

### 3. **Completar Document Processing** ⚠️ **CRÍTICO**

**Estado actual:** Archivo process/route.ts tiene solo TODOs

**Qué hace falta implementar:**

#### 3.1. Descarga del archivo desde Supabase Storage
```typescript
const response = await fetch(document.file_url);
const buffer = await response.arrayBuffer();
```

#### 3.2. Extracción de texto según tipo
- **PDF:** usar `pdf-parse` (ya instalado)
- **DOCX:** usar `mammoth` (instalar)
- **TXT:** leer directo

#### 3.3. Text Chunking
Dividir texto en chunks de ~500-1000 tokens con overlap de 100 tokens

**Estrategia recomendada:**
- Por párrafos (mejor semánticamente)
- Max 1000 caracteres por chunk
- Overlap 100 caracteres

#### 3.4. Generar Embeddings
**Opción 1: Voyage AI** (YA configurado en .env)
```typescript
import { VoyageAIClient } from 'voyageai';
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
const embeddings = await voyage.embed({
  input: chunks,
  model: 'voyage-3-large', // 1024 dims
});
```

**Opción 2: OpenAI** (alternativa)
```typescript
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: chunks,
});
```

#### 3.5. Upsert a Pinecone
```typescript
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('saas');

await index.namespace(workspaceId).upsert(
  chunks.map((chunk, i) => ({
    id: `${documentId}_chunk_${i}`,
    values: embeddings[i],
    metadata: {
      documentId,
      workspaceId,
      chunkIndex: i,
      text: chunk,
      filename: document.filename,
    }
  }))
);
```

#### 3.6. Guardar chunks en Supabase
```typescript
await supabase.from('document_chunks').insert(
  chunks.map((chunk, i) => ({
    document_id: documentId,
    workspace_id: workspaceId,
    pinecone_id: `${documentId}_chunk_${i}`,
    content: chunk,
    chunk_index: i,
    token_count: chunk.split(' ').length,
  }))
);
```

#### 3.7. Actualizar status del documento
```typescript
await supabase
  .from('documents')
  .update({
    status: 'completed',
    chunk_count: chunks.length,
    processed_at: new Date().toISOString(),
  })
  .eq('id', documentId);
```

**Complejidad:** ⭐⭐⭐⭐ (Alta)
**Tiempo estimado:** 6-8 horas

---

### 4. **Búsqueda en Pinecone desde UI** ⭐ **FEATURE PEDIDA**

**Qué agregar:**

#### UI Component: Vector Search Panel

```typescript
// Nuevo componente: components/dashboard/VectorSearchPanel.tsx
<Card>
  <h3>🔍 Búsqueda en Conocimiento Base</h3>
  <input
    placeholder="Buscar en vectores de Pinecone..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  <Button onClick={handleSearch}>Buscar</Button>

  {/* Results */}
  <div className="results">
    {results.map(result => (
      <ResultCard
        key={result.id}
        text={result.metadata.text}
        score={result.score}
        document={result.metadata.filename}
        chunkIndex={result.metadata.chunkIndex}
      />
    ))}
  </div>
</Card>
```

#### API Endpoint: /api/pinecone/search

```typescript
// app/api/pinecone/search/route.ts
export async function POST(req: NextRequest) {
  const { query, workspaceId, topK = 10 } = await req.json();

  // 1. Generar embedding del query
  const queryEmbedding = await voyage.embed({
    input: query,
    model: 'voyage-3-large',
  });

  // 2. Buscar en Pinecone
  const index = pc.index('saas');
  const results = await index.namespace(workspaceId).query({
    vector: queryEmbedding.data[0].embedding,
    topK,
    includeMetadata: true,
  });

  return NextResponse.json({ results: results.matches });
}
```

**Visualización sugerida:**
- Score de similitud (0-1)
- Texto del chunk
- Nombre del documento
- Chunk index
- Highlight de palabras clave

**Complejidad:** ⭐⭐⭐ (Media-Alta)
**Tiempo estimado:** 4-5 horas

---

### 5. **Vista de Vectores/Chunks** ⭐ **FEATURE PEDIDA**

**Qué agregar:**

#### Tab "Vista de Vectores" en Documents Page

```typescript
<Tabs defaultValue="documents">
  <TabsList>
    <TabsTrigger value="documents">📄 Documentos</TabsTrigger>
    <TabsTrigger value="vectors">🧠 Vectores</TabsTrigger>
    <TabsTrigger value="search">🔍 Búsqueda</TabsTrigger>
  </TabsList>

  <TabsContent value="documents">
    {/* UI actual */}
  </TabsContent>

  <TabsContent value="vectors">
    <VectorStatsPanel />
    <VectorListTable />
  </TabsContent>

  <TabsContent value="search">
    <VectorSearchPanel />
  </TabsContent>
</Tabs>
```

#### Vector Stats Panel

Mostrar:
- Total de vectores en Pinecone (por namespace)
- Vectores por documento
- Dimensión (1024 para voyage-3-large)
- Storage usado

#### Vector List Table

Columnas:
- Document
- Chunk Index
- Preview (primeros 100 caracteres)
- Token count
- Actions (Delete chunk)

**API Endpoint:** `/api/pinecone/stats`

```typescript
export async function GET(req: NextRequest) {
  const { workspaceId } = req.query;

  const index = pc.index('saas');
  const stats = await index.describeIndexStats();
  const namespaceStats = stats.namespaces[workspaceId] || { recordCount: 0 };

  // Get chunks from Supabase for details
  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('*, documents(filename)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    totalVectors: namespaceStats.recordCount,
    dimension: stats.dimension,
    chunks,
  });
}
```

**Complejidad:** ⭐⭐⭐ (Media-Alta)
**Tiempo estimado:** 4-5 horas

---

## 🎯 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### FASE 1: Completar Upload (Prioridad CRÍTICA)
**Objetivo:** Que puedan subirse documentos y vectorizarse

**Tareas:**
1. ✅ Conectar upload button (1h)
2. ✅ Drag & drop con react-dropzone (2-3h)
3. ✅ **Implementar document processing completo** (6-8h)
   - Extracción de texto
   - Chunking
   - Embeddings con Voyage AI
   - Upsert a Pinecone
   - Guardar chunks en Supabase

**Total Fase 1:** 9-12 horas (~2 días)
**Resultado:** Sistema funcional end-to-end de upload y vectorización

---

### FASE 2: Búsqueda en Pinecone
**Objetivo:** Poder buscar en los vectores desde UI

**Tareas:**
1. ✅ API /api/pinecone/search (2h)
2. ✅ UI VectorSearchPanel component (2-3h)
3. ✅ Integrar en Documents page (1h)

**Total Fase 2:** 5-6 horas (~1 día)
**Resultado:** Búsqueda semántica funcional en UI

---

### FASE 3: Vista de Vectores
**Objetivo:** Visualizar qué hay en Pinecone

**Tareas:**
1. ✅ API /api/pinecone/stats (1h)
2. ✅ Tab system con documentos/vectores/búsqueda (2h)
3. ✅ VectorStatsPanel component (1h)
4. ✅ VectorListTable component (2h)

**Total Fase 3:** 6 horas (~1 día)
**Resultado:** Visibilidad completa del contenido vectorizado

---

### FASE 4: Mejoras UX (Opcional)
**Tareas opcionales:**
- File previews antes de upload
- Bulk delete
- Bulk upload (arrastrar carpetas)
- Export de chunks
- Re-procesamiento de documentos
- Filtros avanzados

**Total Fase 4:** 6-8 horas (según features elegidas)

---

## 📚 DEPENDENCIAS A INSTALAR

```bash
npm install react-dropzone        # Drag & drop
npm install mammoth                # DOCX parsing
npm install voyageai               # Ya instalado
npm install @pinecone-database/pinecone  # Ya instalado
npm install pdf-parse              # Ya instalado
```

---

## 🔧 CONFIGURACIÓN NECESARIA

### 1. Supabase Storage Bucket

Verificar que existe el bucket `documents`:
```sql
SELECT * FROM storage.buckets WHERE name = 'documents';
```

Si no existe:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

### 2. Pinecone Index

Ya existe: `saas` (1024 dims)
Namespaces por workspace: `ws_{workspace_id}`

### 3. Variables de entorno

Ya configuradas en .env.local:
```bash
VOYAGE_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=saas
```

---

## 📈 COMPLEJIDAD Y TIEMPO TOTAL

**Completitud actual:** 80%
**Trabajo restante:** 20%

| Fase | Complejidad | Tiempo | Prioridad |
|------|-------------|--------|-----------|
| Fase 1: Upload completo | ⭐⭐⭐⭐ | 9-12h | 🔴 CRÍTICA |
| Fase 2: Búsqueda | ⭐⭐⭐ | 5-6h | 🟠 ALTA |
| Fase 3: Vista vectores | ⭐⭐⭐ | 6h | 🟡 MEDIA |
| Fase 4: Mejoras UX | ⭐⭐ | 6-8h | 🟢 BAJA |

**Total:** 26-32 horas (~4-5 días de trabajo)

---

## 🎨 MEJORES PRÁCTICAS ENCONTRADAS (Web Research)

### Drag & Drop (2025)
- **Librería estándar:** react-dropzone
- **Visual feedback:** Cambiar borde cuando arrastras
- **Multi-method support:** Drag, click, paste
- **File previews:** Mostrar thumbnails antes de upload
- **Progress bars:** Indicador de progreso por archivo

### Document Management UX
- **Real-time updates:** ✅ Ya tienes con Supabase
- **Search & filters:** ✅ Ya tienes búsqueda básica
- **Sorting options:** Agregar sort por columna
- **Bulk operations:** Delete/download múltiples
- **Visual hierarchy:** ✅ Ya tienes con cards y tabla

### Pinecone UI
- **Vector stats dashboard:** Total, por documento, dimensión
- **Search interface:** Query box + results con scores
- **Metadata display:** Filename, chunk index, preview
- **Real-time sync:** Mostrar cuando se vectoriza

---

## 🚀 SIGUIENTE PASO RECOMENDADO

**OPCIÓN A: Empezar por Fase 1 (Recomendado)**
→ Te ayudo a implementar el procesamiento completo de documentos
→ En 2 días tendrás vectorización funcionando

**OPCIÓN B: Quick Win (Drag & Drop primero)**
→ Implemento drag & drop en 2-3h
→ Upload button conectado
→ UI completa y pulida

**OPCIÓN C: Feature completa**
→ Implemento TODO (Fases 1-3) en 4-5 días
→ Sistema profesional completo

---

## 💡 MI RECOMENDACIÓN

**Empezar por Fase 1** porque es el núcleo del sistema. Sin procesamiento de documentos, aunque tengas buena UI, no sirve de nada.

**Orden sugerido:**
1. Día 1-2: Fase 1 (Upload + Processing) → **Sistema funcional**
2. Día 3: Fase 2 (Búsqueda) → **Feature diferenciadora**
3. Día 4: Fase 3 (Vista vectores) → **Transparencia y debugging**

Después de 4 días tendrías un **sistema profesional de gestión de documentos con RAG** listo para mostrar a clientes.

---

## ❓ SIGUIENTE DECISIÓN

**¿Qué prefieres que haga?**

**A)** Implementar Fase 1 completa (Upload + Processing) → 2 días
**B)** Implementar Fase 2 completa (Búsqueda en Pinecone) → 1 día
**C)** Implementar TODO (Fases 1+2+3) → 4-5 días
**D)** Empezar solo con Drag & Drop (Quick Win) → 3 horas

**Dime cuál eliges y arranco inmediatamente** 🚀

---

**Creado por:** Claude Code
**Fecha:** 3 de Noviembre 2025
