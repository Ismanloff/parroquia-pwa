# ✅ Setup CLI Completo para Supabase

Todo está listo para gestionar tu base de datos desde la línea de comandos.

---

## 📦 Lo que se instaló

1. **Supabase CLI** - Instalado en `~/.local/bin/supabase`
2. **PostgreSQL Client (psql)** - Instalado via Homebrew
3. **Scripts personalizados** - En `resply/scripts/`

---

## 🚀 Aplicar migraciones AHORA (Método CLI)

Ejecuta este comando:

```bash
cd resply && ./scripts/db-push-psql.sh
```

**Te pedirá la contraseña de la base de datos:**

1. Abre: https://supabase.com/dashboard/project/vxoxjbfirzybxzllakjr/settings/database
2. Busca "Database password"
3. Cópiala (o resetéala si no la tienes)
4. Pégala cuando el script te la pida

El script aplicará automáticamente todas las migraciones y te mostrará las tablas creadas.

---

## 🛠️ Scripts disponibles

Todos en `resply/scripts/`:

### 1. **db-push-psql.sh** - Aplicar migraciones (recomendado)
```bash
./scripts/db-push-psql.sh
```
Aplica todas las migraciones usando psql directamente.

### 2. **db-status.mjs** - Ver estado de la DB
```bash
node scripts/db-status.mjs
```
Muestra cuántas tablas tienes y sus detalles.

### 3. **db-create-table.mjs** - Crear nueva tabla
```bash
node scripts/db-create-table.mjs nombre_tabla
```
Genera una nueva migración con template.

### 4. **db-query.mjs** - Ejecutar SQL
```bash
node scripts/db-query.mjs "SELECT * FROM workspaces LIMIT 5"
```
Ejecuta consultas SQL directamente.

---

## 📋 Supabase CLI - Comandos útiles

Para usar Supabase CLI, primero agrégalo al PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Luego podrás usar:

```bash
# Ver  versión
supabase --version

# Generar nueva migración
supabase migration new nombre_migracion

# Aplicar migraciones (requiere login)
supabase db push

# Descargar schema remoto
supabase db pull

# Ver differencias
supabase db diff
```

**Nota:** Para usar estos comandos necesitas hacer login:
```bash
supabase login
```

---

## 🎯 Workflow recomendado

### Para crear nuevas tablas:

1. **Genera migración:**
   ```bash
   cd resply
   node scripts/db-create-table.mjs users
   ```

2. **Edita el archivo generado:**
   ```bash
   code supabase/migrations/[timestamp]_create_users.sql
   ```

3. **Aplica con psql:**
   ```bash
   ./scripts/db-push-psql.sh
   ```

### Para consultas rápidas:

```bash
node scripts/db-query.mjs "SELECT COUNT(*) FROM workspaces"
```

---

## 🔧 Troubleshooting

### Si el script `db-push-psql.sh` falla:

1. Verifica que tienes PostgreSQL instalado:
   ```bash
   /opt/homebrew/opt/postgresql@15/bin/psql --version
   ```

2. Verifica la contraseña de DB en Supabase Dashboard

3. Prueba la conexión manualmente:
   ```bash
   PGPASSWORD="tu_password" /opt/homebrew/opt/postgresql@15/bin/psql \
     -h db.vxoxjbfirzybxzllakjr.supabase.co \
     -U postgres \
     -d postgres \
     -c "SELECT version();"
   ```

### Si quieres resetear todo:

```bash
# Eliminar todas las tablas (⚠️ CUIDADO)
node scripts/db-query.mjs "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Volver a aplicar migraciones
./scripts/db-push-psql.sh
```

---

## 📚 Siguiente paso

**Ejecuta ahora:**

```bash
cd resply && ./scripts/db-push-psql.sh
```

Y tendrás todas tus tablas creadas en menos de 1 minuto.
