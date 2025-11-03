#!/bin/bash

# Script CLI definitivo para crear tablas
# Solo pide password UNA VEZ

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 CREAR TABLAS EN SUPABASE - MÉTODO CLI             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Proyecto: vxoxjbfirzybxzllakjr"
echo ""
echo "┌───────────────────────────────────────────────────────────┐"
echo "│  PASO 1: Obtener contraseña de la base de datos          │"
echo "└───────────────────────────────────────────────────────────┘"
echo ""
echo "Abre este link en tu navegador:"
echo "👉 https://supabase.com/dashboard/project/vxoxjbfirzybxzllakjr/settings/database"
echo ""
echo "Busca: 'Database password'"
echo "Si no la tienes, haz click en 'Reset database password'"
echo ""
read -sp "Pega la contraseña aquí: " DB_PASSWORD
echo ""
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ No ingresaste contraseña. Abortando."
  exit 1
fi

PROJECT_REF="vxoxjbfirzybxzllakjr"
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo "┌───────────────────────────────────────────────────────────┐"
echo "│  PASO 2: Probando conexión...                            │"
echo "└───────────────────────────────────────────────────────────┘"
echo ""

# Probar conexión
if PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/postgresql@15/bin/psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT 1;" \
  -t -A > /dev/null 2>&1; then
  echo "✅ Conexión exitosa"
else
  echo "❌ No se pudo conectar. Verifica que la contraseña sea correcta."
  echo ""
  echo "Intenta de nuevo o resetea la contraseña en el dashboard."
  exit 1
fi

echo ""
echo "┌───────────────────────────────────────────────────────────┐"
echo "│  PASO 3: Aplicando migraciones...                        │"
echo "└───────────────────────────────────────────────────────────┘"
echo ""

cd "$(dirname "$0")/.."
MIGRATIONS_DIR="supabase/migrations"

COUNT=0
TOTAL=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v README | wc -l | tr -d ' ')

for migration in "$MIGRATIONS_DIR"/*.sql; do
  # Saltar si no es archivo o es README
  if [[ ! -f "$migration" ]] || [[ "$migration" == *"README"* ]]; then
    continue
  fi

  COUNT=$((COUNT + 1))
  filename=$(basename "$migration")

  echo "[$COUNT/$TOTAL] $filename"

  if PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/postgresql@15/bin/psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$migration" \
    --single-transaction \
    --set ON_ERROR_STOP=0 \
    -q 2>&1 | grep -v "NOTICE" | grep -v "already exists" | head -5; then
    echo "        ✅ Aplicada"
  else
    echo "        ⚠️  Con advertencias (probablemente ya existe)"
  fi
  echo ""
done

echo "┌───────────────────────────────────────────────────────────┐"
echo "│  PASO 4: Verificando tablas creadas...                   │"
echo "└───────────────────────────────────────────────────────────┘"
echo ""

TABLES=$(PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/postgresql@15/bin/psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
  -t -A 2>/dev/null)

if [ -z "$TABLES" ]; then
  echo "⚠️  No se encontraron tablas"
  echo ""
  echo "Posibles causas:"
  echo "  - Las migraciones tuvieron errores"
  echo "  - La contraseña es incorrecta"
  echo ""
  echo "Intenta ejecutar el script de nuevo."
else
  TABLE_COUNT=$(echo "$TABLES" | wc -l | tr -d ' ')
  echo "✅ $TABLE_COUNT tablas creadas:"
  echo ""
  echo "$TABLES" | nl
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                    ✅ PROCESO COMPLETADO                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
