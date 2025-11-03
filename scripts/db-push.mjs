#!/usr/bin/env node

/**
 * Script para aplicar migraciones a Supabase sin usar CLI
 * Usa el REST API directamente con el Service Role Key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

// Crear tabla de migraciones si no existe
async function createMigrationsTable() {
  const { error } = await supabase.rpc('query', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  if (error && !error.message.includes('Could not find the function')) {
    console.error('⚠️  No se pudo crear tabla de migraciones:', error.message);
  }
}

// Obtener migraciones ya aplicadas
async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from('_migrations')
    .select('name')
    .order('name');

  if (error) {
    if (error.message.includes('relation "_migrations" does not exist')) {
      return [];
    }
    throw error;
  }

  return data?.map(m => m.name) || [];
}

// Registrar migración como aplicada
async function recordMigration(name) {
  const { error } = await supabase
    .from('_migrations')
    .insert({ name });

  if (error) {
    console.warn(`⚠️  No se pudo registrar migración ${name}:`, error.message);
  }
}

// Ejecutar SQL usando endpoint directo de Postgres
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'SQL execution failed');
  }

  return data;
}

// Aplicar una migración
async function applyMigration(filePath, name) {
  console.log(`\n📄 Aplicando: ${name}`);

  const sql = readFileSync(filePath, 'utf-8');

  try {
    // Ejecutar SQL directamente via psql endpoint (bypassing RPC)
    const url = supabaseUrl.replace('https://', '');
    const dbHost = `db.${url.split('.')[0]}.supabase.co`;

    // Como no tenemos la password de DB, usamos el método de SQL Editor
    // que es ejecutar statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'COMMIT');

    console.log(`   Total statements: ${statements.length}`);

    let success = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        await executeSql(statement + ';');
        success++;
        process.stdout.write('.');
      } catch (err) {
        failed++;
        if (!err.message.includes('already exists')) {
          console.error(`\n   ❌ Error: ${err.message.substring(0, 100)}`);
        } else {
          process.stdout.write('s'); // s = skipped (already exists)
        }
      }
    }

    console.log(`\n   ✅ ${success} exitosos, ${failed} errores`);
    await recordMigration(name);
    return true;

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Aplicando migraciones a Supabase\n');
  console.log(`URL: ${supabaseUrl}\n`);

  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('_'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No se encontraron migraciones');
    return;
  }

  console.log(`📋 ${files.length} migraciones encontradas\n`);

  // Nota: No podemos usar _migrations table sin función query
  // Aplicaremos todas las migraciones

  let applied = 0;
  let failed = 0;

  for (const file of files) {
    const success = await applyMigration(join(migrationsDir, file), file);
    if (success) {
      applied++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${applied} migraciones aplicadas`);
  if (failed > 0) {
    console.log(`❌ ${failed} migraciones fallidas`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
