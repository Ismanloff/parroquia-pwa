import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fqixdguidesjgovbwkua.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhkZ3VpZGVzamdvdmJ3a3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODE1NSwiZXhwIjoyMDc1MTY0MTU1fQ.tk4vYtU8xHpQ5veR78PZWB_tMBJplxvqoud24k-hGjU',
  {
    auth: { persistSession: false }
  }
)

async function listTables() {
  try {
    // Query para listar todas las tablas del schema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name')

    if (error) {
      console.log('Intentando método alternativo...')
      // Si falla, intenta obtener las tablas directamente
      const tables = ['workspaces', 'workspace_settings', 'workspace_members', 'channels',
                      'onboarding_progress', 'documents', 'document_chunks', 'conversations',
                      'messages', 'billing_subscriptions', 'mass_schedules']

      console.log('\n📊 Verificando tablas existentes:\n')
      for (const tableName of tables) {
        const { data, error } = await supabase.from(tableName).select('*').limit(0)
        if (!error) {
          // Obtener conteo
          const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true })
          console.log(`✅ ${tableName} - ${count || 0} registros`)
        } else {
          console.log(`❌ ${tableName} - no existe`)
        }
      }
    } else {
      console.log('\n📊 Tablas en Supabase (schema public):\n')
      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const { count } = await supabase
            .from(data[i].table_name)
            .select('*', { count: 'exact', head: true })
          console.log(`${i + 1}. ${data[i].table_name} - ${count || 0} registros`)
        }
        console.log(`\n✅ Total: ${data.length} tabla(s)`)
      } else {
        console.log('⚠️  No hay tablas en el schema public')
      }
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

listTables()
