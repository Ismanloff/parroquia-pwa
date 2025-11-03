#!/usr/bin/env node

/**
 * Ejecutar consultas SQL en Supabase
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sqlArg = process.argv[2];

if (!sqlArg) {
  console.log('❌ Debes especificar una consulta SQL o archivo');
  console.log('\nUso:');
  console.log('  node scripts/db-query.mjs "SELECT * FROM users LIMIT 5"');
  console.log('  node scripts/db-query.mjs archivo.sql');
  process.exit(1);
}

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
  let sql;

  // Si es un archivo, leerlo
  if (sqlArg.endsWith('.sql')) {
    sql = readFileSync(sqlArg, 'utf-8');
  } else {
    sql = sqlArg;
  }

  console.log('🔍 Ejecutando consulta:\n');
  console.log(sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
  console.log('\n' + '─'.repeat(70) + '\n');

  try {
    const result = await query(sql);
    console.log('✅ Resultado:\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Si ves "INTO used with a command...", usa el SQL Editor web:');
    console.log('   👉 https://supabase.com/dashboard/project/vxoxjbfirzybxzllakjr/sql/new');
  }
}

main().catch(console.error);
