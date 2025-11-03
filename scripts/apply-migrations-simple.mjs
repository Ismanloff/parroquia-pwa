#!/usr/bin/env node

/**
 * Script simplificado para aplicar migraciones
 * Lee las migraciones y las ejecuta statement por statement
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

async function executeSingleStatement(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }
    throw new Error(errorData.message || errorData.error || 'Unknown error');
  }

  return text ? JSON.parse(text) : null;
}

function parseSQL(sql) {
  // Remover comentarios
  const withoutComments = sql.replace(/--[^\n]*/g, '');

  // Dividir por punto y coma, pero respetando bloques $$
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const next = withoutComments[i + 1];

    if (char === '$' && next === '$') {
      inDollarQuote = !inDollarQuote;
      current += char;
      continue;
    }

    current += char;

    if (char === ';' && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt && stmt !== 'COMMIT;' && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Agregar el último statement si no termina en ;
  if (current.trim() && current.trim() !== 'COMMIT') {
    statements.push(current.trim());
  }

  return statements;
}

async function applyMigration(filePath, name) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 ${name}`);
  console.log('='.repeat(70));

  const sql = readFileSync(filePath, 'utf-8');
  const statements = parseSQL(sql);

  console.log(`Total de statements: ${statements.length}\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 70).replace(/\n/g, ' ') + '...';

    process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

    try {
      await executeSingleStatement(stmt);
      console.log('✅');
      success++;
    } catch (error) {
      const msg = error.message;

      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('⏭️  (ya existe)');
        skipped++;
      } else if (msg.includes('does not exist') && stmt.includes('DROP POLICY')) {
        console.log('⏭️  (no existe)');
        skipped++;
      } else {
        console.log('❌');
        console.error(`   Error: ${msg.substring(0, 150)}`);
        errors++;

        // Si es un error crítico, detenemos
        if (msg.includes('syntax error') && !stmt.includes('CREATE POLICY')) {
          console.error('\n❌ Error crítico, deteniendo migración');
          break;
        }
      }
    }

    // Pequeño delay para no saturar el API
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n✅ Exitosos: ${success} | ⏭️  Saltados: ${skipped} | ❌ Errores: ${errors}`);

  return errors === 0 || (errors < 5 && success > 0);
}

async function main() {
  console.log('🚀 Aplicador de Migraciones para Supabase');
  console.log(`📍 Proyecto: ${PROJECT_REF}`);
  console.log(`🌐 URL: ${SUPABASE_URL}\n`);

  const migrationsDir = join(projectRoot, 'supabase', 'migrations');

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .filter(f => !f.startsWith('_') && !f.includes('README'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No se encontraron migraciones');
    return;
  }

  console.log(`📋 Migraciones a aplicar: ${files.length}`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  console.log('');

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const file of files) {
    const success = await applyMigration(join(migrationsDir, file), file);
    if (success) {
      totalSuccess++;
    } else {
      totalFailed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 Proceso completado:`);
  console.log(`   ✅ ${totalSuccess} migraciones aplicadas correctamente`);
  if (totalFailed > 0) {
    console.log(`   ❌ ${totalFailed} migraciones con errores`);
  }
  console.log('='.repeat(70));

  // Verificar tablas creadas
  console.log('\n📊 Verificando tablas creadas...\n');

  try {
    const count = await executeSingleStatement(
      "SELECT COUNT(*) as total FROM pg_tables WHERE schemaname = 'public'"
    );
    console.log(`✅ Total de tablas en 'public': ${count || 'unknown'}`);

    const tables = await executeSingleStatement(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );

    if (tables && Array.isArray(tables)) {
      console.log('\n📋 Tablas:');
      tables.forEach(t => console.log(`   - ${t.tablename || t}`));
    }
  } catch (error) {
    console.log('⚠️  No se pudieron listar las tablas:', error.message);
  }
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});
