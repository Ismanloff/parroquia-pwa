/**
 * Script para aplicar migraciones usando Supabase Management API
 * Uso: npx tsx scripts/apply-migrations-api.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function executeSQLDirect(sql: string): Promise<boolean> {
  console.log('   Intentando ejecutar SQL...');

  try {
    // Intentar usando REST API de PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('   ✅ Ejecutado con REST API');
      return true;
    }
  } catch (error) {
    // Continuar con siguiente método
  }

  console.log('   ⚠️  No se pudo ejecutar automáticamente');
  return false;
}

async function applyMigration(filename: string) {
  console.log(`\n📄 ${filename}`);
  console.log('─'.repeat(60));

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`   ${sql.length} caracteres`);

  const success = await executeSQLDirect(sql);

  if (!success) {
    console.log('\n   📋 Aplicar manualmente:');
    console.log(`   1. Abre: https://app.supabase.com/project/${projectRef}/sql`);
    console.log(`   2. Copia el contenido del archivo:`);
    console.log(`      ${filePath}`);
    console.log(`   3. Pégalo y haz clic en "Run"\n`);

    // Guardar SQL en un archivo temporal para facilitar copia
    const tempFile = path.join(__dirname, '..', `temp_${filename}`);
    fs.writeFileSync(tempFile, sql, 'utf-8');
    console.log(`   💾 SQL guardado en: ${tempFile}`);
    console.log(`   Puedes abrirlo y copiar el contenido fácilmente.\n`);
  }

  return success;
}

async function listCurrentTables() {
  console.log('\n🔍 Verificando tablas actuales...\n');

  try {
    // Intentar listar tablas usando información schema
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_tables`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`   Tablas encontradas: ${data.length || 0}\n`);
    } else {
      console.log('   ℹ️  No se pudieron listar tablas (puede ser normal en DB nueva)\n');
    }
  } catch (error) {
    console.log('   ℹ️  Verificación de tablas no disponible\n');
  }
}

async function main() {
  console.log('🚀 Aplicador de Migraciones - Resply\n');
  console.log(`📍 Proyecto: ${supabaseUrl}`);
  console.log(`📍 Ref: ${projectRef}\n`);
  console.log('═'.repeat(60));

  await listCurrentTables();

  console.log('═'.repeat(60));
  console.log('\n🔨 Aplicando migraciones...\n');

  const migrations = [
    '20250102_001_init_workspace.sql',
    '20250102_002_setup_rls.sql'
  ];

  let manualRequired = false;

  for (const migration of migrations) {
    const success = await applyMigration(migration);

    if (!success) {
      manualRequired = true;
    }
  }

  console.log('═'.repeat(60));

  if (manualRequired) {
    console.log('\n⚠️  ACCIÓN REQUERIDA:\n');
    console.log('Las migraciones no se pudieron aplicar automáticamente.');
    console.log('Por favor, sigue las instrucciones arriba para aplicarlas manualmente.\n');
    console.log('Es muy rápido (2 minutos): abrir SQL Editor → copiar → pegar → Run\n');
    console.log(`🔗 SQL Editor: https://app.supabase.com/project/${projectRef}/sql\n`);
    console.log('Una vez aplicadas, ejecuta este comando para verificar:');
    console.log('   npx tsx scripts/verify-tables.ts\n');
  } else {
    console.log('\n✅ ¡Todas las migraciones aplicadas!\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
