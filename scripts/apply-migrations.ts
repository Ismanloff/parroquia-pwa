/**
 * Script para aplicar migraciones SQL a Supabase
 * Uso: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Crear cliente con service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filename: string) {
  console.log(`\n📄 Aplicando: ${filename}`);

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  // Dividir en statements individuales (separados por ;)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');

  console.log(`   ${statements.length} statements SQL encontrados`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip undefined or empty
    if (!statement) continue;

    // Skip comentarios
    if (statement.startsWith('--')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        // Si no existe la función exec_sql, usar query directo
        const { error: directError } = await supabase.from('_migration_test').select().limit(0);

        if (directError && directError.message.includes('does not exist')) {
          console.log(`   ⚠️  No se puede ejecutar RPC. Aplicar manualmente en UI de Supabase.`);
          console.log(`   📋 URL: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`);
          return false;
        }

        throw error;
      }

      process.stdout.write('.');
    } catch (err: any) {
      console.error(`\n   ❌ Error en statement ${i + 1}:`, err.message);
      console.log(`   SQL:`, statement.substring(0, 100) + '...');
      throw err;
    }
  }

  console.log(`\n   ✅ Migración aplicada correctamente`);
  return true;
}

async function verifyTables() {
  console.log(`\n🔍 Verificando tablas creadas...`);

  const expectedTables = [
    'workspaces',
    'workspace_settings',
    'workspace_members',
    'channels',
    'onboarding_progress',
    'documents',
    'document_chunks',
    'conversations',
    'messages',
    'billing_subscriptions'
  ];

  for (const table of expectedTables) {
    try {
      // Intentar hacer un SELECT para verificar que la tabla existe
      const { error } = await supabase.from(table).select('*').limit(0);

      if (error) {
        console.log(`   ❌ ${table}: No existe o error`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: Error al verificar`);
    }
  }
}

async function main() {
  console.log('🚀 Aplicando migraciones a Supabase...\n');
  console.log(`📍 Proyecto: ${supabaseUrl}\n`);

  try {
    // Aplicar migraciones en orden
    const migrations = [
      '20250102_001_init_workspace.sql',
      '20250102_002_setup_rls.sql'
    ];

    for (const migration of migrations) {
      const success = await applyMigration(migration);

      if (!success) {
        console.log(`\n⚠️  Aplicación automática falló. Pasos manuales:`);
        console.log(`\n1. Ve a: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`);
        console.log(`2. Copia el contenido de: supabase/migrations/${migration}`);
        console.log(`3. Pégalo en el SQL Editor y ejecuta\n`);
        return;
      }
    }

    // Verificar que se crearon las tablas
    await verifyTables();

    console.log(`\n✅ Todas las migraciones aplicadas correctamente!`);

  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    console.log(`\n📋 Aplica manualmente en: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql\n`);
    process.exit(1);
  }
}

main();
