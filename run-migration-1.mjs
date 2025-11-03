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

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migración 1: Crear tablas principales...\n')

    const sql = readFileSync('supabase/migrations/20250102_001_init_workspace.sql', 'utf-8')

    // Dividir el SQL en statements individuales (por punto y coma)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT')

    console.log(`📝 Ejecutando ${statements.length} statements SQL...\n`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Extraer el tipo de statement para logging
      const typeMatch = statement.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s+(\w+)/i)
      const type = typeMatch ? `${typeMatch[1]} ${typeMatch[2]}` : 'SQL'

      try {
        const { error } = await supabase.rpc('exec', { sql: statement })

        if (error) {
          // Intentar ejecutar directamente si RPC no funciona
          throw error
        }

        successCount++
        console.log(`✅ ${i + 1}/${statements.length} - ${type}`)
      } catch (err) {
        // Algunos errores son esperados (ej: IF NOT EXISTS)
        if (err.message && err.message.includes('already exists')) {
          successCount++
          console.log(`⚠️  ${i + 1}/${statements.length} - ${type} (ya existe)`)
        } else {
          errorCount++
          console.log(`❌ ${i + 1}/${statements.length} - ${type}`)
          console.log(`   Error: ${err.message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Completados: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log('='.repeat(50))

    if (errorCount === 0) {
      console.log('\n🎉 Migración completada exitosamente!')
    } else {
      console.log('\n⚠️  Migración completada con algunos errores')
    }

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message)
    process.exit(1)
  }
}

runMigration()
