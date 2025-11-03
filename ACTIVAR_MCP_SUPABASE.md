# 🚀 Activar MCP Oficial de Supabase

## ✅ Configuración Completada

El archivo `.claude/mcp.json` ya está actualizado con:

```json
{
  "mcpServers": {
    "pinecone": { ... },
    "supabase-official": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=fqixdguidesjgovbwkua&features=database"
    }
  }
}
```

**Configuración:**
- ✅ **Proyecto:** `fqixdguidesjgovbwkua` (Resply)
- ✅ **Features:** `database` (solo herramientas de base de datos)
- ✅ **Sin restricción read-only** (para poder ejecutar migraciones)

---

## 📋 Pasos para Activar

### Paso 1: Reiniciar Claude Code

**Opción A: Reload Window (Recomendado)**
1. Abre Command Palette: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows)
2. Busca: "Developer: Reload Window"
3. Presiona Enter

**Opción B: Reinicio Completo**
1. Cierra Claude Code completamente
2. Vuelve a abrirlo

---

### Paso 2: Autenticación OAuth

Cuando Claude Code se reinicie, **automáticamente:**

1. 🌐 Se abrirá tu navegador
2. 🔐 Te pedirá login en Supabase
3. ✅ Autoriza el acceso al proyecto "Resply" (fqixdguidesjgovbwkua)

**Importante:** Asegúrate de seleccionar la organización correcta que contiene el proyecto Resply.

---

### Paso 3: Verificar Conexión

Una vez autenticado, en esta conversación de Claude Code, di:

```
"Lista las tablas de la base de datos"
```

Si el MCP está activo, Claude podrá ejecutar SQL y mostrar las tablas existentes (si las hay).

---

## 🎯 Herramientas Disponibles

Una vez activo, tendrás acceso a:

### 1. `execute_sql`
Ejecuta SQL raw en la base de datos:
```sql
-- Ejemplo
SELECT * FROM workspaces LIMIT 5;
```

### 2. `apply_migration`
Aplica migraciones SQL con tracking:
```sql
-- Para DDL (CREATE TABLE, ALTER TABLE, etc.)
CREATE TABLE example (id uuid PRIMARY KEY);
```

### 3. Otras herramientas de DB
- Listar tablas
- Ver schema
- Crear índices
- etc.

---

## 🔧 Aplicar Migraciones

Una vez activo el MCP, podrás decir:

```
"Aplica la migración 20250102_001_init_workspace.sql"
```

Y Claude:
1. Leerá el archivo SQL
2. Lo ejecutará usando `apply_migration`
3. Verificará que se crearon las tablas
4. Aplicará la segunda migración automáticamente

---

## ⚠️ Troubleshooting

### El navegador no se abre
- Verifica que no haya bloqueadores de popups
- Intenta reiniciar Claude Code de nuevo

### Error "Unauthorized"
- Verifica que iniciaste sesión en la organización correcta
- Revoca el acceso en Supabase y vuelve a autorizar

### MCP no aparece
- Verifica que el archivo `.claude/mcp.json` se guardó correctamente
- Asegúrate de haber hecho reload/restart de Claude Code

### Error "Project not found"
- Verifica que el `project_ref` sea correcto: `fqixdguidesjgovbwkua`
- Asegúrate de tener permisos en ese proyecto

---

## 📚 Documentación Oficial

- [Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub Repo](https://github.com/supabase-community/supabase-mcp)
- [MCP Protocol](https://modelcontextprotocol.io)

---

## 🎉 ¿Todo Listo?

Una vez que hayas reiniciado Claude Code y completado el OAuth, di:

```
"MCP de Supabase activo, aplica las migraciones"
```

Y seguiremos con:
1. ✅ Aplicar `20250102_001_init_workspace.sql`
2. ✅ Aplicar `20250102_002_setup_rls.sql`
3. ✅ Verificar tablas creadas
4. ✅ Crear workspace de prueba
5. ✅ Continuar con el roadmap
