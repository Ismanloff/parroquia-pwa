#!/usr/bin/env node

/**
 * Ver estado de la base de datos
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function query(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Query failed');
  }

  return res.json();
}

async function main() {
  console.log('📊 Estado de la Base de Datos\n');
  console.log(`URL: ${SUPABASE_URL}\n`);

  try {
    const count = await query("SELECT COUNT(*) as total FROM pg_tables WHERE schemaname = 'public'");
    console.log(`✅ Total de tablas: ${count || '?'}\n`);

    const tables = await query(`
      SELECT
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_name = t.tablename AND table_schema = 'public') as columns
      FROM pg_tables t
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      console.log('📋 Tablas:\n');
      tables.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.tablename} (${t.columns} columnas)`);
      });
    } else {
      console.log('⚠️  No hay tablas en el schema public');
      console.log('\n💡 Aplica las migraciones primero:');
      console.log('   Ver: APLICAR_MIGRACIONES.md');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Si ves "INTO used with a command...", usa el SQL Editor web');
  }
}

main().catch(console.error);
