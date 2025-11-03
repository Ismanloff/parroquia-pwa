# Migraciones de Base de Datos - Resply

## Aplicar Migraciones Manualmente

### Opción 1: SQL Editor de Supabase (Recomendado)

1. **Ir al SQL Editor:**
   https://app.supabase.com/project/fqixdguidesjgovbwkua/sql

2. **Aplicar migración 1:**
   - Copia todo el contenido de `20250102_001_init_workspace.sql`
   - Pégalo en el SQL Editor
   - Click en "Run" (esquina inferior derecha)
   - Espera confirmación: "Success. No rows returned"

3. **Aplicar migración 2:**
   - Copia todo el contenido de `20250102_002_setup_rls.sql`
   - Pégalo en el SQL Editor
   - Click en "Run"
   - Espera confirmación

4. **Verificar tablas creadas:**
   - Ve a: https://app.supabase.com/project/fqixdguidesjgovbwkua/editor
   - Deberías ver estas tablas:
     - workspaces
     - workspace_settings
     - workspace_members
     - channels
     - onboarding_progress
     - documents
     - document_chunks
     - conversations
     - messages
     - billing_subscriptions

---

### Opción 2: Supabase CLI (Si está instalado)

```bash
# Instalar Supabase CLI (macOS)
brew install supabase/tap/supabase

# Linkear proyecto
supabase link --project-ref fqixdguidesjgovbwkua

# Aplicar migraciones
supabase db push
```

---

### Opción 3: psql (Avanzado)

```bash
# Conectar usando la contraseña de DB de Supabase
# (La puedes obtener en: Settings > Database > Connection String)

psql "postgresql://postgres:[YOUR-PASSWORD]@db.fqixdguidesjgovbwkua.supabase.co:5432/postgres"

# Luego ejecutar:
\i supabase/migrations/20250102_001_init_workspace.sql
\i supabase/migrations/20250102_002_setup_rls.sql
```

---

## Contenido de las Migraciones

### 20250102_001_init_workspace.sql
Crea la estructura base de datos multi-tenant:
- ✅ Tablas principales (workspaces, channels, documents, conversations, messages)
- ✅ Índices optimizados para queries multi-tenant
- ✅ Soporte para Voyage AI embeddings (1024 dims)
- ✅ Campos WhatsApp Business API en channels
- ✅ Campo pinecone_namespace en workspaces
- ✅ Habilita RLS en todas las tablas

### 20250102_002_setup_rls.sql
Configura las políticas de seguridad:
- ✅ Políticas RLS para aislamiento multi-tenant
- ✅ Permisos basados en roles (owner/admin/agent/viewer)
- ✅ Funciones helper: get_user_workspaces(), has_workspace_permission()

---

## Verificación Post-Migración

Después de aplicar ambas migraciones, ejecuta este query en SQL Editor:

```sql
-- Verificar que las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'workspaces',
  'workspace_settings',
  'workspace_members',
  'channels',
  'documents',
  'document_chunks',
  'conversations',
  'messages',
  'billing_subscriptions'
)
ORDER BY table_name;

-- Debería retornar 9 tablas
```

---

## Rollback (Si algo sale mal)

```sql
-- PRECAUCIÓN: Esto borra TODAS las tablas
DROP TABLE IF EXISTS billing_subscriptions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspace_settings CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
```

---

## Siguiente Paso

Después de aplicar las migraciones, crear un workspace de prueba:

```sql
INSERT INTO workspaces (id, name, slug, plan, pinecone_namespace)
VALUES (
  gen_random_uuid(),
  'Workspace Demo',
  'demo',
  'pro',
  'saas_tenant_001'
) RETURNING *;
```
