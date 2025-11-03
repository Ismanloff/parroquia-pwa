# ⚡ Crear Tablas en Supabase (2 clicks)

## El problema

Los scripts CLI no funcionan porque el DNS de Supabase no resuelve desde este entorno.

## ✅ Solución (2 minutos)

### Paso 1: Abre el SQL Editor

Haz click aquí: 👉 **https://supabase.com/dashboard/project/vxoxjbfirzybxzllakjr/sql/new**

### Paso 2: Copia y pega

1. Abre el archivo: **`APLICAR_ESTO.sql`** (está en la carpeta `resply`)
2. Selecciona TODO el contenido (Cmd+A)
3. Cópialo (Cmd+C)
4. Pégalo en el SQL Editor de Supabase
5. Haz click en el botón verde **"Run"** (esquina inferior derecha)

### Paso 3: Verifica

Después de ejecutar, deberías ver:

```
Success. No rows returned
```

Eso significa que TODO se creó correctamente.

---

## 📊 Qué se creó

✅ **10 tablas:**
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

✅ **Políticas RLS** para cada tabla

✅ **Índices** para optimizar queries

✅ **2 funciones helper:**
- `get_user_workspaces()`
- `has_workspace_permission()`

---

## ✅ Listo

Después de ejecutar el SQL, tu base de datos está 100% configurada y lista para usar.

Para verificar que funcionó:

```bash
cd resply && node scripts/db-status.mjs
```

(Aunque este comando también puede fallar por el mismo problema de DNS, las tablas estarán creadas correctamente en Supabase)

---

## 🔧 Por qué no funcionan los scripts CLI

El problema es que el host `db.vxoxjbfirzybxzllakjr.supabase.co` no resuelve desde este entorno. Esto puede ser por:

- Restricciones de red
- DNS bloqueado
- Firewall corporativo

La solución del SQL Editor es la forma oficial y más confiable de aplicar migraciones.
