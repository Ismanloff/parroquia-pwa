import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqixdguidesjgovbwkua.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhkZ3VpZGVzamdvdmJ3a3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODE1NSwiZXhwIjoyMDc1MTY0MTU1fQ.tk4vYtU8xHpQ5veR78PZWB_tMBJplxvqoud24k-hGjU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  })

  if (error) {
    // Intento alternativo sin RPC
    const { data: tables, error: err2 } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name')

    if (err2) {
      console.error('Error:', err2)
      process.exit(1)
    }
    console.log('📊 Tablas en Supabase (public schema):\n')
    if (tables && tables.length > 0) {
      tables.forEach((t, i) => {
        console.log(`${i + 1}. ${t.table_name}`)
      })
      console.log(`\n✅ Total: ${tables.length} tabla(s)`)
    } else {
      console.log('⚠️  No hay tablas en el schema public')
    }
  } else {
    console.log('📊 Tablas en Supabase (public schema):\n')
    if (data && data.length > 0) {
      data.forEach((t, i) => {
        console.log(`${i + 1}. ${t.table_name} (${t.column_count} columnas)`)
      })
      console.log(`\n✅ Total: ${data.length} tabla(s)`)
    } else {
      console.log('⚠️  No hay tablas en el schema public')
    }
  }
}

listTables()
