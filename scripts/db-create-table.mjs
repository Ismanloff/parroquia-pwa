#!/usr/bin/env node

/**
 * Utilidad para crear tablas en Supabase
 * Genera el SQL y lo muestra para copiar al SQL Editor
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TABLE_NAME = process.argv[2];

if (!TABLE_NAME) {
  console.log('❌ Debes especificar el nombre de la tabla');
  console.log('\nUso:');
  console.log('  node scripts/db-create-table.mjs nombre_tabla');
  console.log('\nEjemplo:');
  console.log('  node scripts/db-create-table.mjs  users');
  process.exit(1);
}

const template = `-- Tabla: ${TABLE_NAME}
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE ${TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- Política de ejemplo: solo lectura autenticada
CREATE POLICY "${TABLE_NAME}_read"
ON ${TABLE_NAME}
FOR SELECT
USING (auth.role() = 'authenticated');

-- Índices
CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_created ON ${TABLE_NAME}(created_at DESC);
`;

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const filename = `${timestamp}_create_${TABLE_NAME}.sql`;
const filepath = join(__dirname, '../supabase/migrations', filename);

writeFileSync(filepath, template);

console.log('✅ Migración creada:\n');
console.log(`  📄 ${filename}\n`);
console.log('📋 SQL generado:\n');
console.log('─'.repeat(70));
console.log(template);
console.log('─'.repeat(70));
console.log('\n💡 Próximos pasos:\n');
console.log('1. Edita el archivo de migración y ajusta las columnas');
console.log('2. Copia el SQL y pégalo en:');
console.log('   👉 https://supabase.com/dashboard/project/vxoxjbfirzybxzllakjr/sql/new');
console.log('3. Haz click en "Run"\n');
