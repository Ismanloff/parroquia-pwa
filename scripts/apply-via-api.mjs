#!/usr/bin/env node

/**
 * Aplicar migraciones usando la API REST de Supabase directamente
 * Este método bypassa todos los problemas de exec_sql
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'vxoxjbfirzybxzllakjr';

console.log('🚀 Aplicando migraciones via API REST\n');
console.log(`📍 Proyecto: ${PROJECT_REF}`);
console.log(`🌐 URL: ${SUPABASE_URL}\n`);

// Función para ejecutar SQL via Management API
async function executeSqlDirect(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.text();
}

// Leer y aplicar migraciones
const migrationsDir = join(projectRoot, 'supabase', 'migrations');
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .filter(f => !f.startsWith('_') && !f.includes('README'))
  .sort();

if (files.length === 0) {
  console.log('⚠️  No se encontraron migraciones');
  process.exit(0);
}

console.log(`📋 Migraciones encontradas: ${files.length}\n`);

let totalApplied = 0;

for (const file of files) {
  const filepath = join(migrationsDir, file);
  console.log(`${'='.repeat(70)}`);
  console.log(`📄 ${file}`);
  console.log('='.repeat(70));

  const sql = readFileSync(filepath, 'utf-8');

  // Dividir en batches por CREATE TABLE, CREATE INDEX, etc
  // para evitar timeouts
  const statements = [];
  let current = '';
  let inFunction = false;

  const lines = sql.split('\n');

  for (const line of lines) {
    // Detectar inicio/fin de funciones
    if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
      inFunction = true;
    }

    current += line + '\n';

    // Si encontramos un punto y coma y no estamos en una función, es un statement
    if (line.trim().endsWith(';') && !inFunction) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--') && stmt !== 'COMMIT;') {
        statements.push(stmt);
      }
      current = '';
    }

    // Detectar fin de función
    if (line.includes('$$ LANGUAGE') || line.includes('$$;')) {
      inFunction = false;
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Agregar el último statement si quedó algo
  if (current.trim()) {
    statements.push(current.trim());
  }

  console.log(`Total de statements: ${statements.length}\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';

    process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

    try {
      await executeSqlDirect(stmt);
      console.log('✅');
      success++;
    } catch (error) {
      const msg = error.message;

      if (msg.includes('already exists')) {
        console.log('⏭️  (ya existe)');
        skipped++;
      } else if (msg.includes('does not exist') && stmt.includes('DROP')) {
        console.log('⏭️  (no existe)');
        skipped++;
      } else {
        console.log('❌');
        console.error(`   ${msg.substring(0, 150)}`);
        errors++;
      }
    }

    // Delay para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ ${success} exitosos | ⏭️  ${skipped} saltados | ❌ ${errors} errores\n`);

  if (success > 0) {
    totalApplied++;
  }
}

console.log('='.repeat(70));
console.log(`🎉 ${totalApplied}/${files.length} migraciones aplicadas`);
console.log('='.repeat(70));

// Verificar tablas
console.log('\n📊 Verificando tablas creadas...\n');

try {
  const result = await executeSqlDirect(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );

  const tables = JSON.parse(result || '[]');

  if (Array.isArray(tables) && tables.length > 0) {
    console.log(`✅ ${tables.length} tablas creadas:\n`);
    tables.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.tablename || t}`);
    });
  } else {
    console.log('⚠️  No se encontraron tablas');
  }
} catch (error) {
  console.log('⚠️  No se pudieron listar las tablas:', error.message);
}

console.log('\n✅ Proceso completado!\n');
