/**
 * Script para aplicar migraciones SQL a Supabase usando postgres directo
 * Uso: npx tsx scripts/apply-migrations-pg.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Extraer project ref de la URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ No se pudo extraer project_ref de SUPABASE_URL');
  process.exit(1);
}

// Construir connection string de PostgreSQL
// Formato: postgresql://postgres:[SERVICE_ROLE_KEY]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function executeSQLFile(client: pg.Client, filename: string) {
  console.log(`\n📄 Aplicando: ${filename}`);

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sqlContent = fs.readFileSync(filePath, 'utf-8');

  console.log(`   ${sqlContent.length} caracteres leídos`);

  try {
    // Ejecutar el SQL completo
    await client.query(sqlContent);
    console.log(`   ✅ Migración aplicada correctamente`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error al ejecutar migración:`, error.message);
    return false;
  }
}

async function verifyTables(client: pg.Client) {
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

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const existingTables = result.rows.map(row => row.table_name);

  console.log(`\n   Tablas encontradas: ${existingTables.length}`);

  for (const table of expectedTables) {
    if (existingTables.includes(table)) {
      console.log(`   ✅ ${table}`);
    } else {
      console.log(`   ❌ ${table} - NO EXISTE`);
    }
  }

  return expectedTables.every(t => existingTables.includes(t));
}

async function main() {
  console.log('🚀 Aplicando migraciones a Supabase (PostgreSQL directo)\n');
  console.log(`📍 Proyecto: ${supabaseUrl}\n`);
  console.log('─'.repeat(60));

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Conectar
    console.log('\n🔌 Conectando a PostgreSQL...');
    await client.connect();
    console.log('   ✅ Conectado correctamente\n');

    console.log('─'.repeat(60));

    // Aplicar migraciones en orden
    const migrations = [
      '20250102_001_init_workspace.sql',
      '20250102_002_setup_rls.sql'
    ];

    for (const migration of migrations) {
      const success = await executeSQLFile(client, migration);

      if (!success) {
        console.log(`\n❌ Error al aplicar ${migration}. Abortando.\n`);
        process.exit(1);
      }
    }

    console.log('\n' + '─'.repeat(60));

    // Verificar que se crearon las tablas
    const allTablesCreated = await verifyTables(client);

    console.log('\n' + '─'.repeat(60));

    if (allTablesCreated) {
      console.log('\n✅ ¡Todas las migraciones aplicadas correctamente!');
      console.log('✅ Las 10 tablas fueron creadas exitosamente\n');
    } else {
      console.log('\n⚠️  Algunas tablas no se crearon. Revisa los errores arriba.\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    console.log('\nDetalles:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
