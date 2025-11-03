#!/bin/bash

# ============================================
# RESPLY - Database Backup Script
# Description: Creates a backup of Supabase database
# Usage: ./scripts/backup-db.sh
# ============================================

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/db"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗄️  Iniciando backup de Supabase DB...${NC}\n"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no está instalado${NC}"
    echo "Instala con: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${RED}❌ Proyecto no está linkeado a Supabase${NC}"
    echo "Linkea con: npx supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Create backup using Supabase CLI
echo -e "${YELLOW}📥 Descargando dump de la base de datos...${NC}"
if npx supabase db dump --linked > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup SQL creado: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Error al crear backup${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}🗜️  Comprimiendo backup...${NC}"
gzip -f "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
echo -e "${GREEN}✅ Backup comprimido: $COMPRESSED_FILE${NC}"

# Get file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo -e "${GREEN}📦 Tamaño: $FILE_SIZE${NC}"

# Optional: Upload to S3 (requires AWS CLI and env vars)
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
    echo -e "${YELLOW}☁️  Subiendo a S3...${NC}"

    if command -v aws &> /dev/null; then
        if aws s3 cp "$COMPRESSED_FILE" "s3://$AWS_S3_BACKUP_BUCKET/db-backups/backup_$TIMESTAMP.sql.gz"; then
            echo -e "${GREEN}✅ Backup subido a S3: s3://$AWS_S3_BACKUP_BUCKET/db-backups/${NC}"
        else
            echo -e "${YELLOW}⚠️  No se pudo subir a S3 (continuando...)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  AWS CLI no instalado, saltando S3 upload${NC}"
    fi
fi

# Cleanup: Keep only last 30 backups locally
echo -e "${YELLOW}🧹 Limpiando backups antiguos (manteniendo últimos 30)...${NC}"
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')

if [ "$BACKUP_COUNT" -gt 30 ]; then
    ls -t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +31 | xargs rm -f
    REMOVED=$((BACKUP_COUNT - 30))
    echo -e "${GREEN}✅ Eliminados $REMOVED backups antiguos${NC}"
else
    echo -e "${GREEN}✅ Solo hay $BACKUP_COUNT backups, no se requiere cleanup${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ BACKUP COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📁 Archivo: $COMPRESSED_FILE"
echo -e "📦 Tamaño: $FILE_SIZE"
echo -e "🕒 Timestamp: $TIMESTAMP"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Optional: Send notification (Slack, Discord, etc.)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ Database backup completed: $FILE_SIZE at $TIMESTAMP\"}" \
        &> /dev/null || true
fi

exit 0
