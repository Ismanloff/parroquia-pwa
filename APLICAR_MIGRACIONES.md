# 🚀 Aplicar Migraciones - Resply

## Arquitectura Confirmada ✅

**Pinecone (Vectores):**
- Embeddings de documentos (1024 dims, Voyage AI)
- Búsqueda semántica RAG
- Namespace por tenant: `saas_tenant_{id}`

**Supabase (Datos Estructurados):**
- Conversaciones y mensajes de chat
- Workspaces (tenants) y usuarios
- Metadata de documentos (sin vectores)
- Billing y subscripciones

---

## Paso 1: Abrir SQL Editor

👉 [Abrir SQL Editor de Supabase](https://app.supabase.com/project/fqixdguidesjgovbwkua/sql)

---

## Paso 2: Copiar y Ejecutar Migración 1

Copia **TODO** el contenido del archivo:
```
/Users/admin/Movies/Proyecto SaaS/resply/supabase/migrations/20250102_001_init_workspace.sql
```

O usa este comando para verlo:
```bash
cat "/Users/admin/Movies/Proyecto SaaS/resply/supabase/migrations/20250102_001_init_workspace.sql"
```

**Luego:**
1. Pégalo en el SQL Editor
2. Click en **"Run"** (esquina inferior derecha)
3. Espera ver: ✅ "Success. No rows returned"

**Crea:**
- 10 tablas (workspaces, workspace_settings, workspace_members, channels, onboarding_progress, documents, document_chunks, conversations, messages, billing_subscriptions)
- Índices optimizados
- RLS habilitado

---

## Paso 3: Copiar y Ejecutar Migración 2

Copia **TODO** el contenido del archivo:
```
/Users/admin/Movies/Proyecto SaaS/resply/supabase/migrations/20250102_002_setup_rls.sql
```

O usa este comando:
```bash
cat "/Users/admin/Movies/Proyecto SaaS/resply/supabase/migrations/20250102_002_setup_rls.sql"
```

**Luego:**
1. Pégalo en el SQL Editor
2. Click en **"Run"**
3. Espera confirmación

**Crea:**
- Políticas RLS para todas las tablas
- Funciones helper: `get_user_workspaces()`, `has_workspace_permission()`
- Aislamiento multi-tenant por workspace

---

## Paso 4: Verificar Tablas

👉 [Ver Tablas en Supabase](https://app.supabase.com/project/fqixdguidesjgovbwkua/editor)

Deberías ver estas 10 tablas:
- ✅ workspaces
- ✅ workspace_settings
- ✅ workspace_members
- ✅ channels (con campos WhatsApp Business API)
- ✅ onboarding_progress
- ✅ documents
- ✅ document_chunks (sin campo `embedding`, solo `pinecone_id`)
- ✅ conversations
- ✅ messages
- ✅ billing_subscriptions

---

## Siguiente Paso

Una vez aplicadas las migraciones, vuelve a Claude Code y di:

```
"Migraciones aplicadas, continuemos"
```

Y seguiremos con:
1. 🏢 Crear workspace de prueba (tenant_001)
2. 🔧 Actualizar pineconeTool.ts para usar workspace_id de DB
3. 🌐 Crear middleware para extraer tenant desde subdomain
4. ⚡ Migrar a AsyncLocalStorage

---

## Sobre MCP y SQL

**Tu pregunta:** "¿Para qué sirve MCP si no deja usar SQL?"

**Respuesta:** El MCP **SÍ permite ejecutar SQL** con la herramienta `execute_sql`, pero:
- Necesita estar **activo/running** en la sesión de Claude Code
- En esta sesión no está cargado aún
- Por eso estamos usando SQL Editor manual (más rápido para este caso)

Una vez que el MCP esté activo (después de reiniciar Claude Code), podrás ejecutar SQL directamente desde chat sin abrir el navegador.
