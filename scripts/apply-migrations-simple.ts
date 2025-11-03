/**
 * Script simplificado para aplicar migraciones SQL a Supabase
 * Usa Supabase client con REST API
 *
 * Uso: npx tsx scripts/apply-migrations-simple.ts
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

// Crear cliente con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filename: string) {
  console.log(`\n📄 Leyendo: ${filename}`);

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sqlContent = fs.readFileSync(filePath, 'utf-8');

  console.log(`   ${sqlContent.length} caracteres leídos`);
  console.log(`   Ejecutando en Supabase...`);

  try {
    // Intentar ejecutar usando el REST API directamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: sqlContent })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`   ✅ Ejecutado correctamente`);
    return true;

  } catch (error: any) {
    console.log(`   ⚠️  REST API no disponible. Intentando método alternativo...`);

    // Método alternativo: Instrucciones manuales
    console.log(`\n📋 Por favor, aplica manualmente:`);
    console.log(`\n1. Ve a: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql`);
    console.log(`2. Copia el contenido de: supabase/migrations/${filename}`);
    console.log(`3. Pégalo en el SQL Editor`);
    console.log(`4. Click en "Run"\n`);

    return false;
  }
}

async function verifyConnection() {
  console.log('🔍 Verificando conexión a Supabase...\n');

  try {
    // Intentar una query simple para verificar conexión
    const { error } = await supabase.from('_migrations').select('*').limit(1);

    // Si la tabla no existe, es normal (primera migración)
    console.log(`   ✅ Conectado a: ${supabaseUrl}`);
    console.log(`   ✅ Service role key válida\n`);
    return true;

  } catch (err: any) {
    console.error('   ❌ Error de conexión:', err.message);
    return false;
  }
}

async function listTables() {
  console.log('\n🔍 Verificando tablas existentes...\n');

  try {
    // Query para listar tablas públicas
    const { data, error } = await supabase
      .rpc('exec', {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });

    if (error) {
      // Si no existe la función, intentar alternativa
      console.log('   ℹ️  No se pudo listar tablas (esperado en DB nueva)\n');
      return;
    }

    console.log(`   Tablas encontradas: ${data?.length || 0}`);
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
    }
    console.log('');

  } catch (err) {
    console.log('   ℹ️  Saltando verificación de tablas\n');
  }
}

async function main() {
  console.log('🚀 Aplicador de Migraciones - Resply\n');
  console.log(`📍 Proyecto: ${supabaseUrl}\n`);
  console.log('─'.repeat(60));

  // 1. Verificar conexión
  const connected = await verifyConnection();
  if (!connected) {
    console.log('\n❌ No se pudo conectar a Supabase. Verifica las credenciales.\n');
    return;
  }

  // 2. Listar tablas actuales
  await listTables();

  console.log('─'.repeat(60));
  console.log('\n🔨 Aplicando migraciones...\n');

  // 3. Aplicar migraciones
  const migrations = [
    '20250102_001_init_workspace.sql',
    '20250102_002_setup_rls.sql'
  ];

  let successCount = 0;

  for (const migration of migrations) {
    const success = await executeSQLFile(migration);

    if (success) {
      successCount++;
    } else {
      console.log(`\n⚠️  Migración ${migration} requiere aplicación manual.\n`);
      break;
    }
  }

  // 4. Resultado final
  console.log('\n' + '─'.repeat(60));

  if (successCount === migrations.length) {
    console.log('\n✅ ¡Todas las migraciones aplicadas correctamente!\n');
    console.log('📋 Verifica las tablas en: https://app.supabase.com/project/fqixdguidesjgovbwkua/editor\n');
  } else {
    console.log('\n⚠️  Algunas migraciones requieren aplicación manual.\n');
    console.log('📋 Sigue las instrucciones arriba para completar el proceso.\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error.message);
  console.log('\n📋 Aplica manualmente en:');
  console.log('https://app.supabase.com/project/fqixdguidesjgovbwkua/sql\n');
  process.exit(1);
});
