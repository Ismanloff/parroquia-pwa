#!/bin/bash

# Script automático - usa variables de entorno
set -e

cd "$(dirname "$0")/.."

# Cargar .env.local
export $(grep -v '^#' .env.local | xargs)

PROJECT_REF="vxoxjbfirzybxzllakjr"
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"
DB_PORT="6543"  # Pooler port

echo "🚀 Aplicando migraciones a Supabase..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Intentar con connection pooler usando password desde JWT
# Extraer project ref del Service Role Key para formar el password
# Format: postgres.[ref]:[service-role-key]@db.[ref].supabase.co:6543/postgres

CONNECTION_STRING="postgresql://${DB_USER}:${SUPABASE_SERVICE_ROLE_KEY}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo "📝 Probando conexión..."

if /opt/homebrew/opt/postgresql@15/bin/psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
  echo "✅ Conexión exitosa"
  echo ""
else
  echo "❌ No se pudo conectar con el Service Role Key"
  echo ""
  echo "Voy a intentar con el método directo de Supabase..."
  echo ""

  # Método alternativo: usar supabase CLI
  if command -v ~/.local/bin/supabase &> /dev/null; then
    echo "Usando Supabase CLI..."

    # Aplicar migraciones con CLI
    for migration in supabase/migrations/*.sql; do
      if [[ -f "$migration" ]] && [[ "$migration" != *"README"* ]]; then
        filename=$(basename "$migration")
        echo "📄 $filename"

        # Leer el SQL
        SQL=$(cat "$migration")

        # Ejecutar via REST API
        curl -s -X POST \
          "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
          -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
          -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
          -H "Content-Type: application/json" \
          -d "{\"query\": $(echo "$SQL" | jq -Rs .)}" \
          | jq -r '.'

        echo ""
      fi
    done

    exit 0
  fi

  exit 1
fi

# Aplicar migraciones
MIGRATIONS_DIR="supabase/migrations"

for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [[ -f "$migration" ]] && [[ "$migration" != *"README"* ]]; then
    filename=$(basename "$migration")
    echo "📄 Aplicando: $filename"

    /opt/homebrew/opt/postgresql@15/bin/psql "$CONNECTION_STRING" \
      -f "$migration" \
      --single-transaction \
      --set ON_ERROR_STOP=1 \
      -q

    if [ $? -eq 0 ]; then
      echo "   ✅ Aplicada"
    else
      echo "   ❌ Error"
      exit 1
    fi
  fi
done

echo ""
echo "🎉 Migraciones aplicadas"
echo ""
echo "📊 Tablas creadas:"
echo ""

/opt/homebrew/opt/postgresql@15/bin/psql "$CONNECTION_STRING" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
  -t -A

echo ""
echo "✅ Listo!"
