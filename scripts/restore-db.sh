#!/bin/bash

# ============================================
# RESPLY - Database Restore Script
# Description: Restores database from a backup
# Usage: ./scripts/restore-db.sh <backup-file.sql.gz>
# ============================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo ""
    echo "Usage: ./scripts/restore-db.sh <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -1th backups/db/backup_*.sql.gz 2>/dev/null | head -10 || echo "  (no backups found)"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Warning
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  WARNING: DATABASE RESTORE${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}This will OVERWRITE your current database with:${NC}"
echo -e "  📁 Backup: $BACKUP_FILE"
echo -e ""
echo -e "${RED}This operation CANNOT be undone!${NC}"
echo -e ""
read -p "Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando restore...${NC}"

# Decompress to temp file
TEMP_SQL="/tmp/restore_$(date +%s).sql"
echo -e "${YELLOW}📤 Descomprimiendo backup...${NC}"

if gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"; then
    echo -e "${GREEN}✅ Backup descomprimido${NC}"
else
    echo -e "${RED}❌ Error al descomprimir backup${NC}"
    exit 1
fi

# Check if Supabase is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${RED}❌ Proyecto no está linkeado a Supabase${NC}"
    echo "Linkea con: npx supabase link --project-ref YOUR_PROJECT_REF"
    rm -f "$TEMP_SQL"
    exit 1
fi

# Get database connection string
echo -e "${YELLOW}🔗 Obteniendo connection string...${NC}"

# Try to get DB URL from Supabase CLI
DB_URL=$(npx supabase status --linked 2>/dev/null | grep "DB URL" | awk '{print $3}' || echo "")

if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener DB URL automáticamente${NC}"
    echo -e "${YELLOW}Ingresa el DATABASE_URL manualmente:${NC}"
    read -s DB_URL
fi

# Restore database
echo -e "${YELLOW}🗄️  Restaurando base de datos...${NC}"
echo -e "${YELLOW}   (esto puede tomar varios minutos)${NC}"

if psql "$DB_URL" < "$TEMP_SQL" 2>&1 | grep -v "NOTICE" | grep -v "SET" > /tmp/restore_errors.log; then
    # Check if there were errors
    if [ -s /tmp/restore_errors.log ]; then
        echo -e "${YELLOW}⚠️  Restore completado con warnings:${NC}"
        cat /tmp/restore_errors.log
    else
        echo -e "${GREEN}✅ Restore completado exitosamente${NC}"
    fi
else
    echo -e "${RED}❌ Error durante el restore${NC}"
    cat /tmp/restore_errors.log 2>/dev/null || true
    rm -f "$TEMP_SQL" /tmp/restore_errors.log
    exit 1
fi

# Cleanup
rm -f "$TEMP_SQL" /tmp/restore_errors.log

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ RESTORE COMPLETADO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📁 Backup restaurado: $BACKUP_FILE"
echo -e "🕒 Timestamp: $(date)"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  Importante:${NC}"
echo -e "   1. Verifica que los datos estén correctos"
echo -e "   2. Prueba que la aplicación funcione"
echo -e "   3. Revisa los logs por si hay errores"
echo ""

exit 0
