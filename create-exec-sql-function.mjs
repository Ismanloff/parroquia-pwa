import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
  'https://fqixdguidesjgovbwkua.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhkZ3VpZGVzamdvdmJ3a3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODE1NSwiZXhwIjoyMDc1MTY0MTU1fQ.tk4vYtU8xHpQ5veR78PZWB_tMBJplxvqoud24k-hGjU',
  {
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
)

async function createExecSqlFunction() {
  try {
    console.log('📦 Creando función exec_sql en Supabase...\n')

    // Intentar ejecutar usando el cliente HTTP directo
    const response = await fetch('https://fqixdguidesjgovbwkua.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhkZ3VpZGVzamdvdmJ3a3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODE1NSwiZXhwIjoyMDc1MTY0MTU1fQ.tk4vYtU8xHpQ5veR78PZWB_tMBJplxvqoud24k-hGjU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaXhkZ3VpZGVzamdvdmJ3a3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODE1NSwiZXhwIjoyMDc1MTY0MTU1fQ.tk4vYtU8xHpQ5veR78PZWB_tMBJplxvqoud24k-hGjU',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: `
          CREATE OR REPLACE FUNCTION exec_sql(query text, params json DEFAULT '[]'::json)
          RETURNS json AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE query INTO result;
            RETURN result;
          EXCEPTION
            WHEN OTHERS THEN
              RAISE EXCEPTION 'Error ejecutando SQL: %', SQLERRM;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error de API:', errorText)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    console.log('✅ Función exec_sql creada exitosamente!')
    console.log('\n📝 Ahora puedes usar el MCP local de Supabase')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('⚠️  NO PROBLEM - Solución alternativa:')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log('Abre el SQL Editor de Supabase:')
    console.log('👉 https://app.supabase.com/project/fqixdguidesjgovbwkua/sql/new\n')
    console.log('Y ejecuta este SQL:\n')
    console.log(readFileSync('setup-exec-sql-function.sql', 'utf-8'))
    console.log('\nDespués de ejecutar la función, el MCP local funcionará perfectamente.')
  }
}

createExecSqlFunction()
