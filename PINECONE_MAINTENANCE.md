# 🧹 PINECONE MAINTENANCE GUIDE

**Comprehensive guide for managing Pinecone vector database in Resply SaaS**

## Table of Contents
- [Overview](#overview)
- [Available Scripts](#available-scripts)
- [Common Maintenance Tasks](#common-maintenance-tasks)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

Resply uses **Pinecone** as a vector database for storing document embeddings used in RAG (Retrieval-Augmented Generation). Each workspace has its own **namespace** in Pinecone for data isolation.

### Architecture
- **Index Name**: `saas` (configurable via `PINECONE_INDEX_NAME`)
- **Dimensions**: 1024 (Voyage-3-Large embeddings)
- **Metric**: Cosine similarity
- **Namespace Strategy**: One namespace per workspace (using workspace ID)

### Data Flow
1. User uploads document → Supabase Storage
2. Document processed → Text extraction + chunking
3. Chunks embedded → Voyage AI (1024 dimensions)
4. Vectors upserted → Pinecone namespace
5. Metadata saved → Supabase `document_chunks` table

---

## Available Scripts

### 1. verify-pinecone.ts - Index Inspection

**Purpose**: Verify Pinecone connection, list all namespaces, and show sample vectors.

**Usage**:
```bash
npx tsx scripts/verify-pinecone.ts
```

**Output Example**:
```
🔍 Verificando configuración de Pinecone...

✅ Cliente Pinecone inicializado correctamente
📦 Índice: saas

📊 Estadísticas del índice:
   Total de vectores: 84
   Dimensiones: 1024

📁 Namespaces (1):
   🗂️  26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
      Vectores: 84
      ⭐ Workspace "Ismael" detectado
      📄 Sample de vectores (primeros 5):
         1. ba0f15ba-91fe-4442-a061-189c749b5c69_chunk_11
            Document ID: ba0f15ba-91fe-4442-a061-189c749b5c69
            Filename: 04_Guia_Vehiculos_Stock.pdf
```

**When to Use**:
- After document uploads (verify vectors created)
- Debugging RAG search issues
- Checking namespace structure
- Identifying workspace IDs

---

### 2. audit-pinecone-orphans.mjs - Orphan Detection

**Purpose**: Detect vectors in Pinecone without corresponding documents in Supabase.

**Usage**:
```bash
# Audit all workspaces
node scripts/audit-pinecone-orphans.mjs

# Audit specific workspace
node scripts/audit-pinecone-orphans.mjs ismael
node scripts/audit-pinecone-orphans.mjs test
node scripts/audit-pinecone-orphans.mjs 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
```

**Output Example**:
```
🔍 AUDITORÍA DE VECTORES HUÉRFANOS EN PINECONE

📁 Namespace: 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
   Vectores en Pinecone: 5
   Documentos en Supabase: 0

   ⚠️  ¡VECTORES HUÉRFANOS DETECTADOS! (1 documentos sin registro)

   📄 Document IDs huérfanos:
      1. 6b1b96ee-d45e-4ba9-a3a5-8953f42c762b
         Filename: ENSAYO CRÍTICO.docx

   💡 Recomendación: Ejecuta cleanup-workspace-vectors.mjs para limpiar
      Comando: node scripts/cleanup-workspace-vectors.mjs 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
```

**When to Use**:
- After deleting documents manually from Supabase
- Before implementing automatic cleanup
- Monthly maintenance audits
- Investigating storage discrepancies

**What Are Orphaned Vectors?**
Vectors exist in Pinecone but their source document was deleted from Supabase. This happens when:
- Documents deleted before automatic cleanup was implemented
- Manual database operations
- Failed cleanup operations

---

### 3. cleanup-workspace-vectors.mjs - Interactive Cleanup

**Purpose**: Safely delete all vectors from a specific workspace namespace.

**Usage**:
```bash
node scripts/cleanup-workspace-vectors.mjs <workspace_id>
```

**Examples**:
```bash
node scripts/cleanup-workspace-vectors.mjs ismael
node scripts/cleanup-workspace-vectors.mjs test
node scripts/cleanup-workspace-vectors.mjs 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
```

**Interactive Flow**:
```
🧹 LIMPIEZA DE VECTORES DE PINECONE
📦 Workspace ID: ismael

✅ Conectado al índice: saas
✅ Namespace encontrado: 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4

📊 Obteniendo estadísticas...
📈 Estadísticas ANTES de la limpieza:
   Namespace: 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
   Total de vectores: 5

📄 Sample de vectores a eliminar:
   1. 6b1b96ee-d45e-4ba9-a3a5-8953f42c762b_chunk_0
      Document ID: 6b1b96ee-d45e-4ba9-a3a5-8953f42c762b
      Filename: ENSAYO CRÍTICO.docx

⚠️  ⚠️  ⚠️  ADVERTENCIA ⚠️  ⚠️  ⚠️

🗑️  Estás a punto de ELIMINAR 5 vectores del namespace "26ca2ee9-..."
   Esta operación NO se puede deshacer.

💡 Si deseas cancelar, presiona Ctrl+C ahora.

⏳ Esperando 5 segundos... (Presiona Ctrl+C para cancelar)

🧹 Eliminando vectores...
✅ Comando de eliminación enviado

🔍 Verificando eliminación...

📊 RESULTADOS DE LA LIMPIEZA:
═══════════════════════════════
   Namespace: 26ca2ee9-4e53-4a3d-acc3-9359cda25cb4
   Vectores ANTES: 5
   Vectores DESPUÉS: 0
   Vectores eliminados: 5

✅ ¡LIMPIEZA EXITOSA! El namespace está completamente vacío.
```

**Safety Features**:
- 5-second countdown with Ctrl+C cancellation
- Before/after statistics
- Sample preview of vectors to be deleted
- Verification step after deletion

**When to Use**:
- Cleaning up orphaned vectors (after audit)
- Resetting a test workspace
- Removing all vectors before re-indexing
- Workspace deletion (manual cleanup)

---

## Common Maintenance Tasks

### Task 1: Clean Up After Manual Document Deletion

**Scenario**: You deleted documents directly from Supabase before automatic cleanup was implemented.

**Steps**:
1. Run audit to identify orphans:
   ```bash
   node scripts/audit-pinecone-orphans.mjs
   ```

2. Review the orphaned document IDs listed

3. Clean up the workspace:
   ```bash
   node scripts/cleanup-workspace-vectors.mjs <workspace_id>
   ```

4. Verify cleanup:
   ```bash
   npx tsx scripts/verify-pinecone.ts
   ```

---

### Task 2: Verify Document Upload Success

**Scenario**: User uploaded documents, want to verify vectors were created.

**Steps**:
1. Check Supabase for document records:
   ```sql
   SELECT id, filename, status, uploaded_at
   FROM documents
   WHERE workspace_id = '<workspace_id>'
   ORDER BY uploaded_at DESC;
   ```

2. Verify vectors in Pinecone:
   ```bash
   npx tsx scripts/verify-pinecone.ts
   ```

3. Check vector count matches document count:
   - Each document creates multiple chunks (varies by size)
   - Look for `documentId` in vector metadata

---

### Task 3: Monthly Maintenance Audit

**Recommended monthly routine to keep Pinecone clean.**

**Steps**:
1. **Audit all workspaces**:
   ```bash
   node scripts/audit-pinecone-orphans.mjs > audit-report-$(date +%Y%m%d).txt
   ```

2. **Review report**:
   - Check for orphaned vectors
   - Identify workspaces with discrepancies

3. **Clean up if needed**:
   ```bash
   node scripts/cleanup-workspace-vectors.mjs <workspace_id>
   ```

4. **Verify index stats**:
   ```bash
   npx tsx scripts/verify-pinecone.ts
   ```

5. **Document in logs**:
   - Save audit reports
   - Note any cleanup actions taken
   - Track vector count trends

---

### Task 4: Test RAG System After Changes

**Scenario**: After Pinecone changes, verify RAG search still works.

**Steps**:
1. **Upload test document**:
   - Use dashboard: http://localhost:3000/dashboard/documents
   - Upload a small PDF (e.g., 1-2 pages)

2. **Verify vectors created**:
   ```bash
   npx tsx scripts/verify-pinecone.ts
   ```

3. **Test RAG search**:
   ```bash
   curl -X POST http://localhost:3000/api/chat/rag-search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "test query",
       "workspaceId": "<workspace_id>",
       "topK": 3
     }' | jq
   ```

4. **Verify results**:
   - Check `results` array has items
   - Verify `score` values (>0.5 is good)
   - Confirm `filename` matches uploaded document

5. **Test chat with RAG**:
   - Use chat widget or `/api/chat/generate`
   - Ask question about document content
   - Verify response uses document context

---

## Troubleshooting

### Issue 1: No Vectors Created After Upload

**Symptoms**:
- Document shows status `completed` in Supabase
- But `npx tsx scripts/verify-pinecone.ts` shows 0 vectors

**Possible Causes**:
1. **Processing failed silently**
   - Check server logs for errors
   - Look for "Document X processed successfully"

2. **Wrong namespace**
   - Verify workspace ID matches
   - Check for typos in namespace

3. **Pinecone API issues**
   - Test connection with verify script
   - Check API key validity

**Solution**:
```bash
# Check document status
psql $DATABASE_URL -c "SELECT id, filename, status FROM documents WHERE id = '<doc_id>';"

# Re-trigger processing (if needed)
curl -X POST http://localhost:3000/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{"documentId": "<doc_id>"}'

# Verify vectors created
npx tsx scripts/verify-pinecone.ts
```

---

### Issue 2: RAG Search Returns Irrelevant Results

**Symptoms**:
- Search returns results but they don't match query
- Low similarity scores (<0.4)

**Possible Causes**:
1. **Wrong namespace**
   - Search in different workspace's namespace

2. **Outdated vectors**
   - Document updated but vectors not refreshed

3. **Poor query embedding**
   - Query too short or vague

**Solution**:
```bash
# Verify namespace
npx tsx scripts/verify-pinecone.ts

# Check sample vectors in workspace
# Make sure they're from correct documents

# Test with more specific query
curl -X POST http://localhost:3000/api/chat/rag-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "very specific question about document content",
    "workspaceId": "<workspace_id>",
    "topK": 5
  }' | jq
```

---

### Issue 3: Audit Shows Many Orphans

**Symptoms**:
- `audit-pinecone-orphans.mjs` reports many orphaned vectors
- Namespace has vectors but no documents in Supabase

**Possible Causes**:
1. **Documents deleted manually**
   - Before automatic cleanup was implemented

2. **Cleanup webhook failed**
   - Check Edge Function logs

3. **Namespace mismatch**
   - Workspace ID changed

**Solution**:
```bash
# Option 1: Clean up entire workspace
node scripts/cleanup-workspace-vectors.mjs <workspace_id>

# Option 2: Re-upload documents
# If documents should exist, re-upload them through dashboard

# Option 3: Investigate logs
# Check Edge Function logs for cleanup failures
npx supabase functions logs document-cleanup-webhook
```

---

### Issue 4: Prompt Caching Not Working with RAG

**Symptoms**:
- Cache hit rate always 0%
- No green emoji (🟢) in logs

**Possible Causes**:
1. **Not enough tokens**
   - Need >1024 tokens for caching
   - Check log: "Cached: 0/XXX tokens"

2. **Context changing every request**
   - Different RAG chunks each time
   - Randomized chunk order

3. **Streaming endpoint**
   - Caching monitoring only works on non-streaming

**Solution**:
```bash
# Test with enough context
node test-rag-caching-request.mjs  # Uses 10 chunks

# Check logs for token count
# Should see: "🔴 ... Cached: 0/2043 tokens" (first request)
# Then: "🟢 ... Cached: 1920/2043 tokens" (second request)

# If still 0%, check:
# 1. Same context being sent?
# 2. Using non-stream endpoint?
# 3. OpenAI API version correct?
```

---

## Best Practices

### 1. Automatic Cleanup

**Always rely on automatic cleanup for document deletions.**

Current implementation:
- Edge Function: `document-cleanup-webhook`
- Triggered on: Document deletion from Supabase
- Action: Deletes vectors from Pinecone namespace

**Verification**:
```sql
-- Check Edge Function is deployed
SELECT * FROM pg_stat_user_functions
WHERE funcname LIKE '%cleanup%';
```

---

### 2. Namespace Naming Convention

**Use workspace IDs directly as namespaces (no prefix).**

✅ **Correct**:
```typescript
const namespace = workspaceId;  // "26ca2ee9-4e53-4a3d-acc3-9359cda25cb4"
```

❌ **Incorrect**:
```typescript
const namespace = `ws_${workspaceId}`;  // Don't add prefix
```

**Reason**: Simplicity and consistency. Scripts are designed to work with both formats, but direct workspace IDs are cleaner.

---

### 3. Monitoring Strategy

**Set up regular monitoring to catch issues early.**

**Weekly**:
- Check vector count trends
- Review processing errors in logs

**Monthly**:
- Run full audit: `node scripts/audit-pinecone-orphans.mjs`
- Clean up any orphans found
- Review namespace growth

**Quarterly**:
- Evaluate Pinecone costs vs usage
- Consider archiving inactive workspaces
- Optimize chunking strategy if needed

---

### 4. Testing Strategy

**Always test in development before production changes.**

**Before deploying Pinecone changes**:
1. Test upload in dev workspace
2. Verify vectors created
3. Test RAG search functionality
4. Test chat with RAG context
5. Run audit to check for issues
6. Document any anomalies

**Test workspaces**:
- Keep "test" workspace for experiments
- Clean up after tests: `node scripts/cleanup-workspace-vectors.mjs test`
- Don't use production workspaces for testing

---

### 5. Data Retention Policy

**Define clear policies for vector retention.**

**Recommendations**:
- **Active workspaces**: Keep all vectors
- **Inactive workspaces** (>90 days no activity):
  - Archive documents to cold storage
  - Delete vectors from Pinecone
  - Document in workspace metadata

- **Deleted workspaces**:
  - Clean up vectors immediately
  - Run: `node scripts/cleanup-workspace-vectors.mjs <workspace_id>`

---

### 6. Cost Optimization

**Pinecone costs scale with vector count. Optimize storage.**

**Strategies**:
1. **Efficient Chunking**:
   - Current: 800 chars per chunk, 100 char overlap
   - Monitor average chunks per document
   - Adjust if too granular or too coarse

2. **Deduplication**:
   - Avoid uploading duplicate documents
   - Check filename before upload
   - Use content hash for exact duplicates

3. **Namespace Cleanup**:
   - Delete orphaned vectors regularly
   - Archive inactive workspaces
   - Monitor growth trends

**Check Costs**:
- Pinecone dashboard: https://app.pinecone.io/
- Monitor vector count: `npx tsx scripts/verify-pinecone.ts`
- Calculate: ~$0.096/month per 100k vectors (serverless)

---

## Scripts Quick Reference

| Script | Purpose | Usage | When to Use |
|--------|---------|-------|-------------|
| `verify-pinecone.ts` | Inspect index | `npx tsx scripts/verify-pinecone.ts` | Debugging, verification |
| `audit-pinecone-orphans.mjs` | Find orphans | `node scripts/audit-pinecone-orphans.mjs [workspace]` | Monthly audit, after manual deletions |
| `cleanup-workspace-vectors.mjs` | Delete vectors | `node scripts/cleanup-workspace-vectors.mjs <id>` | Cleanup orphans, reset workspace |
| `test-rag-caching-request.mjs` | Test caching | `node test-rag-caching-request.mjs` | Verify prompt caching with RAG |

---

## Environment Variables

Required for all scripts:

```bash
# Pinecone
PINECONE_API_KEY=pk-xxxx
PINECONE_INDEX_NAME=saas

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Voyage AI (for embeddings)
VOYAGE_API_KEY=pa-xxxx
```

---

## Additional Resources

- **Pinecone Docs**: https://docs.pinecone.io/
- **Voyage AI Docs**: https://docs.voyageai.com/
- **OpenAI Prompt Caching**: [PROMPT_CACHING_IMPLEMENTATION.md](PROMPT_CACHING_IMPLEMENTATION.md)
- **Project Overview**: [MIGRATION_TODO.md](MIGRATION_TODO.md)

---

**Last Updated**: 2025-01-05
**Maintained By**: Claude (Anthropic AI)
**Version**: 1.0.0
