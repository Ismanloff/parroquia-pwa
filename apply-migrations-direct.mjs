import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

// Conexión DIRECTA a Supabase (no pooler)
const client = new Client({
  host: 'db.fqixdguidesjgovbwkua.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Ramiro1955!',
  ssl: { rejectUnauthorized: false }
})

async function runMigrations() {
  try {
    await client.connect()
    console.log('✅ Conectado a Supabase PostgreSQL\n')

    // Migración 1: Crear tablas
    console.log('🚀 Ejecutando Migración 1: Crear tablas principales...\n')
    const migration1 = readFileSync('supabase/migrations/20250102_001_init_workspace.sql', 'utf-8')

    await client.query(migration1)
    console.log('✅ Migración 1 completada\n')

    // Migración 2: RLS y políticas
    console.log('🚀 Ejecutando Migración 2: Configurar RLS y políticas...\n')
    const migration2 = readFileSync('supabase/migrations/20250102_002_setup_rls.sql', 'utf-8')

    await client.query(migration2)
    console.log('✅ Migración 2 completada\n')

    // Verificar tablas creadas
    console.log('📊 Verificando tablas creadas...\n')
    const result = await client.query(`
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('mass_schedules')
      ORDER BY table_name;
    `)

    console.log('Tablas creadas:')
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.table_name} (${row.column_count} columnas)`)
    })

    console.log(`\n🎉 Total: ${result.rows.length} tablas creadas exitosamente!`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.detail) console.error('Detalle:', error.detail)
    if (error.hint) console.error('Sugerencia:', error.hint)
    if (error.position) console.error('Posición:', error.position)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
