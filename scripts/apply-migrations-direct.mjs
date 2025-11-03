#!/usr/bin/env node

/**
 * Aplicar migraciones directamente usando el connection pooler de Supabase
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env.local') });

const PROJECT_REF = 'vxoxjbfirzybxzllakjr';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Connection pooler (no requiere password de DB)
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;
const DB_PORT = '6543'; // Pooler port
const DB_NAME = 'postgres';
const DB_USER = `postgres.${PROJECT_REF}`;

const CONNECTION_STRING = `postgresql://${DB_USER}:${SERVICE_KEY}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require`;
const PSQL = '/opt/homebrew/opt/postgresql@15/bin/psql';

console.log('🚀 Aplicando migraciones a Supabase\n');
console.log(`📍 Proyecto: ${PROJECT_REF}`);
console.log(`🌐 URL: ${SUPABASE_URL}\n`);

// Test connection
console.log('📝 Probando conexión...');
try {
  execSync(`${PSQL} "${CONNECTION_STRING}" -c "SELECT version();" -t -A`, {
    stdio: 'pipe',
    timeout: 10000
  });
  console.log('✅ Conexión exitosa\n');
} catch (error) {
  console.error('❌ No se pudo conectar a la base de datos');
  console.error('\nError:', error.message);
  console.error('\n💡 Verifica que:');
  console.error('   1. El Service Role Key es correcto');
  console.error('   2. El proyecto de Supabase está activo');
  console.error('   3. El connection pooler está habilitado');
  process.exit(1);
}

// Aplicar migraciones
const migrationsDir = join(projectRoot, 'supabase', 'migrations');
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .filter(f => !f.startsWith('_') && !f.includes('README'))
  .sort();

if (files.length === 0) {
  console.log('⚠️  No se encontraron migraciones');
  process.exit(0);
}

console.log(`📋 Migraciones a aplicar: ${files.length}`);
files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
console.log('');

let applied = 0;
let failed = 0;

for (const file of files) {
  const filepath = join(migrationsDir, file);
  console.log(`📄 ${file}`);

  try {
    execSync(
      `${PSQL} "${CONNECTION_STRING}" -f "${filepath}" --single-transaction --set ON_ERROR_STOP=1 -q`,
      {
        stdio: 'pipe',
        timeout: 30000
      }
    );
    console.log('   ✅ Aplicada\n');
    applied++;
  } catch (error) {
    console.error('   ❌ Error:', error.stderr?.toString() || error.message);
    console.error('');
    failed++;

    // Continuar con las demás migraciones
  }
}

console.log('='.repeat(70));
console.log(`🎉 Proceso completado:`);
console.log(`   ✅ ${applied} migraciones aplicadas`);
if (failed > 0) {
  console.log(`   ❌ ${failed} migraciones fallidas`);
}
console.log('='.repeat(70));

// Verificar tablas creadas
console.log('\n📊 Tablas creadas:\n');

try {
  const result = execSync(
    `${PSQL} "${CONNECTION_STRING}" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" -t -A`,
    { encoding: 'utf-8', timeout: 5000 }
  );

  const tables = result.trim().split('\n').filter(t => t);

  if (tables.length > 0) {
    console.log(`✅ Total: ${tables.length} tablas\n`);
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
  } else {
    console.log('⚠️  No hay tablas en el schema public');
  }
} catch (error) {
  console.error('❌ No se pudieron listar las tablas');
}

console.log('\n✅ Listo!\n');
