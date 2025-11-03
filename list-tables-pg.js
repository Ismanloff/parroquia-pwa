import pg from 'pg'

const { Client } = pg

// Construir URL de conexión desde las credenciales de Supabase
const connectionString = 'postgresql://postgres.fqixdguidesjgovbwkua:Ramiro1955!@aws-0-us-east-1.pooler.supabase.com:6543/postgres'

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function listTables() {
  try {
    await client.connect()

    const result = await client.query(`
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    console.log('📊 Tablas en Supabase (public schema):\n')

    if (result.rows.length > 0) {
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.table_name} (${row.column_count} columnas)`)
      })
      console.log(`\n✅ Total: ${result.rows.length} tabla(s)`)
    } else {
      console.log('⚠️  No hay tablas en el schema public')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

listTables()
