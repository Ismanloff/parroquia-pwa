/**
 * Script para verificar que las tablas fueron creadas correctamente
 * Uso: npx tsx scripts/verify-tables.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXPECTED_TABLES = [
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

async function verifyTable(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(0);

    if (error) {
      console.log(`   ❌ ${tableName} - Error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ ${tableName}`);
    return true;
  } catch (err: any) {
    console.log(`   ❌ ${tableName} - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando tablas en Supabase...\n');
  console.log(`📍 ${supabaseUrl}\n`);
  console.log('─'.repeat(60));

  let successCount = 0;

  for (const table of EXPECTED_TABLES) {
    const exists = await verifyTable(table);
    if (exists) successCount++;
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Resultado: ${successCount}/${EXPECTED_TABLES.length} tablas verificadas\n`);

  if (successCount === EXPECTED_TABLES.length) {
    console.log('✅ ¡Todas las tablas fueron creadas correctamente!\n');
    console.log('🎯 Siguiente paso: Crear workspace de prueba tenant_001\n');
    return true;
  } else {
    console.log('⚠️  Faltan algunas tablas. Revisa que las migraciones se aplicaron.\n');
    console.log(`🔗 SQL Editor: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql\n`);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
});
