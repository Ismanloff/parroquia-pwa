# 🔒 Instrucciones para Asegurar Endpoints de Notificaciones

## ⚠️ Problema Actual

Los endpoints de notificaciones están usando la **service role key** sin autenticación, lo que permite que cualquier visitante:

- Liste todos los tokens push de todos los usuarios
- Envíe notificaciones masivas sin autenticación
- Elimine tokens de cualquier usuario

**Archivos afectados:**
- `resply/app/api/notifications/tokens/route.ts` (línea 10)
- `resply/app/api/notifications/send/route.ts` (línea 10)

---

## ✅ Solución

He creado versiones seguras de estos endpoints:

- `resply/app/api/notifications/tokens/route.SECURE.ts` ✅
- `resply/app/api/notifications/send/route.SECURE.ts` ✅

---

## 📋 Pasos para Aplicar la Corrección

### Paso 1: Revisar las versiones seguras

Abre y revisa los archivos `.SECURE.ts` para entender los cambios:

```bash
# Revisar endpoints seguros
cat resply/app/api/notifications/tokens/route.SECURE.ts
cat resply/app/api/notifications/send/route.SECURE.ts
```

**Cambios principales:**

1. ✅ Usan `createClient()` (cliente autenticado) en lugar de service role
2. ✅ Validan autenticación con `supabase.auth.getUser()`
3. ✅ RLS filtra automáticamente por `user_id`
4. ✅ Control de acceso basado en roles para notificaciones masivas

### Paso 2: Respaldar archivos originales

```bash
cd resply/app/api/notifications

# Respaldar archivos originales
cp tokens/route.ts tokens/route.INSECURE.backup
cp send/route.ts send/route.INSECURE.backup
```

### Paso 3: Reemplazar con versiones seguras

```bash
# Reemplazar con versiones seguras
mv tokens/route.SECURE.ts tokens/route.ts
mv send/route.SECURE.ts send/route.ts
```

### Paso 4: Crear tabla de roles (si no existe)

Si tu aplicación necesita roles de usuario (admin, user, etc.), crea esta migración:

```bash
# Usando el MCP oficial de Supabase
```

```javascript
await mcp__supabase__apply_migration({
  name: "add_user_roles",
  query: `
    -- Agregar columna de rol a user_profiles
    alter table if exists user_profiles
    add column if not exists role text default 'user' check (role in ('user', 'admin', 'moderator'));

    -- Crear índice para búsquedas rápidas
    create index if not exists idx_user_profiles_role on user_profiles(role);

    -- Comentario
    comment on column user_profiles.role is 'Rol del usuario: user (predeterminado), admin, moderator';
  `
});
```

**O usando SQL directamente:**

```sql
-- En el SQL Editor de Supabase Dashboard
alter table if exists user_profiles
add column if not exists role text default 'user' check (role in ('user', 'admin', 'moderator'));

create index if not exists idx_user_profiles_role on user_profiles(role);

comment on column user_profiles.role is 'Rol del usuario: user (predeterminado), admin, moderator';
```

### Paso 5: Asignar rol de admin a tu usuario

```sql
-- Reemplaza 'tu-user-id' con tu UUID real
update user_profiles
set role = 'admin'
where id = 'tu-user-id';

-- O si quieres asignar admin al primer usuario registrado:
update user_profiles
set role = 'admin'
where id = (select id from user_profiles order by created_at asc limit 1);
```

### Paso 6: Verificar que RLS está habilitado

```sql
-- Verificar que push_tokens tiene RLS habilitado
select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'push_tokens';

-- Verificar políticas existentes
select
  policyname,
  cmd as operation,
  qual as using_expression
from pg_policies
where tablename = 'push_tokens';
```

Si RLS no está habilitado o faltan políticas, aplica esta migración:

```javascript
await mcp__supabase__apply_migration({
  name: "secure_push_tokens_table",
  query: `
    -- Habilitar RLS
    alter table push_tokens enable row level security;

    -- Política: Los usuarios solo pueden ver sus propios tokens
    drop policy if exists "Users can view their own tokens" on push_tokens;
    create policy "Users can view their own tokens"
      on push_tokens for select
      to authenticated
      using (auth.uid() = user_id);

    -- Política: Los usuarios pueden insertar sus propios tokens
    drop policy if exists "Users can insert their own tokens" on push_tokens;
    create policy "Users can insert their own tokens"
      on push_tokens for insert
      to authenticated
      with check (auth.uid() = user_id);

    -- Política: Los usuarios pueden actualizar sus propios tokens
    drop policy if exists "Users can update their own tokens" on push_tokens;
    create policy "Users can update their own tokens"
      on push_tokens for update
      to authenticated
      using (auth.uid() = user_id);

    -- Política: Los usuarios pueden eliminar sus propios tokens
    drop policy if exists "Users can delete their own tokens" on push_tokens;
    create policy "Users can delete their own tokens"
      on push_tokens for delete
      to authenticated
      using (auth.uid() = user_id);

    -- Política adicional: Los admins pueden ver todos los tokens
    drop policy if exists "Admins can view all tokens" on push_tokens;
    create policy "Admins can view all tokens"
      on push_tokens for select
      to authenticated
      using (
        exists (
          select 1 from user_profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  `
});
```

### Paso 7: Probar los endpoints seguros

**Prueba 1: Intentar acceder sin autenticación (debe fallar)**

```bash
curl -X GET http://localhost:3000/api/notifications/tokens
# Esperado: {"error":"No autenticado"}
```

**Prueba 2: Registrar token con autenticación**

```bash
# Primero obtén un token de sesión válido desde tu frontend
# Luego:
curl -X POST http://localhost:3000/api/notifications/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"token":"fcm-token-example"}'
```

**Prueba 3: Enviar notificación como admin**

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_SESSION_TOKEN" \
  -d '{
    "title": "Prueba",
    "body": "Notificación de prueba",
    "targetUserId": "all"
  }'
```

---

## 🔍 Verificación de Seguridad

Usa el MCP oficial para verificar que todo está seguro:

```javascript
// Verificar advisors de seguridad
await mcp__supabase__get_advisors({ type: 'security' });

// Verificar RLS en push_tokens
await mcp__supabase__execute_sql({
  query: `
    select
      t.tablename,
      t.rowsecurity as rls_enabled,
      count(p.policyname) as policy_count
    from pg_tables t
    left join pg_policies p on t.tablename = p.tablename
    where t.schemaname = 'public'
      and t.tablename = 'push_tokens'
    group by t.tablename, t.rowsecurity;
  `
});
```

---

## 📚 Diferencias Clave

| Aspecto | ❌ Versión Insegura | ✅ Versión Segura |
|---------|-------------------|-------------------|
| **Cliente Supabase** | Service Role Key | Cliente autenticado |
| **Autenticación** | Ninguna | `supabase.auth.getUser()` |
| **Filtrado de datos** | Manual/ninguno | RLS automático |
| **Acceso a tokens** | Todos los usuarios | Solo propios tokens |
| **Notificaciones** | Cualquiera puede enviar | Solo admins (masivas) |
| **Logs** | Mínimos | Detallados por rol |

---

## 🚀 Próximos Pasos

1. ✅ Aplicar estos cambios
2. ✅ Verificar que RLS está habilitado
3. ✅ Asignar roles de admin
4. ✅ Probar endpoints con Postman/curl
5. ✅ Actualizar frontend para manejar autenticación
6. ✅ Documentar API para el equipo

---

## 📖 Referencias

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [GUIA_MCP_SUPABASE.md](./GUIA_MCP_SUPABASE.md)
- [SECURITY_ALERT.md](./SECURITY_ALERT.md)
