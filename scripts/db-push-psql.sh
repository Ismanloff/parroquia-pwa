#!/bin/bash

# Script para aplicar migraciones usando psql directamente
# Bypassa el problema de exec_sql

PROJECT_REF="vxoxjbfirzybxzllakjr"
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

echo "🔐 Necesitas la contraseña de la base de datos"
echo ""
echo "Para obtenerla:"
echo "1. Ve a: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
echo "2. Copia la contraseña de 'Database password' o resetéala"
echo ""
read -sp "Pega la contraseña aquí: " DB_PASSWORD
echo ""
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ No ingresaste contraseña"
  exit 1
fi

echo "🚀 Conectando a Supabase..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Aplicar migraciones
MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"

for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [[ -f "$migration" ]] && [[ "$migration" != *"README"* ]]; then
    filename=$(basename "$migration")
    echo "📄 Aplicando: $filename"

    PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/postgresql@15/bin/psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -f "$migration" \
      --single-transaction \
      --set ON_ERROR_STOP=1

    if [ $? -eq 0 ]; then
      echo "✅ $filename aplicada correctamente"
    else
      echo "❌ Error aplicando $filename"
      exit 1
    fi
    echo ""
  fi
done

echo "🎉 Todas las migraciones aplicadas"
echo ""
echo "Verificando tablas creadas..."
echo ""

PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/postgresql@15/bin/psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo ""
echo "✅ Listo! Las tablas están creadas"
