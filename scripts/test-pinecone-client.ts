/**
 * Script para probar el cliente real de Pinecone
 *
 * Uso:
 * npx tsx scripts/test-pinecone-client.ts
 */

import { pinecone } from '../app/lib/pinecone';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function testPineconeClient() {
  console.log('\n🧪 Probando cliente real de Pinecone...\n');

  try {
    // 1. Verificar inicialización
    console.log('1️⃣  Test: Inicialización del cliente');
    const indexName = process.env.PINECONE_INDEX_NAME || 'saas';
    const testNamespace = 'test_pinecone_client_' + Date.now();

    console.log(`   Índice: ${indexName}`);
    console.log(`   Namespace de prueba: ${testNamespace}`);

    // 2. Test: Conectar al índice
    console.log('\n2️⃣  Test: Conectar al índice');
    const index = pinecone.index(indexName);
    console.log('   ✅ Índice conectado');

    // 3. Test: Obtener namespace
    console.log('\n3️⃣  Test: Obtener namespace');
    const ns = index.namespace(testNamespace);
    console.log('   ✅ Namespace obtenido');

    // 4. Test: Verificar que deleteAll() no arroja error (namespace vacío)
    console.log('\n4️⃣  Test: deleteAll() en namespace vacío');
    await ns.deleteAll();
    console.log('   ✅ deleteAll() ejecutado sin errores');

    // 5. Test: Verificar que deleteMany() no arroja error (namespace vacío)
    console.log('\n5️⃣  Test: deleteMany() con filtro en namespace vacío');
    await ns.deleteMany({ created_by: 'test_user_123' });
    console.log('   ✅ deleteMany() ejecutado sin errores');

    // 6. Test: Acceso a cliente raw
    console.log('\n6️⃣  Test: Acceso al cliente raw');
    const rawClient = pinecone._client;
    console.log('   ✅ Cliente raw accesible');

    // 7. Test: Acceso a índice raw
    console.log('\n7️⃣  Test: Acceso al índice raw');
    const rawIndex = index._raw;
    const stats = await rawIndex.describeIndexStats();
    console.log(`   ✅ Stats obtenidas: ${stats.totalRecordCount} vectores totales`);

    // 8. Test: Métodos legacy (deprecated)
    console.log('\n8️⃣  Test: Métodos legacy (con warnings esperados)');
    await pinecone.deleteNamespace(testNamespace);
    console.log('   ✅ deleteNamespace() ejecutado');

    await pinecone.deleteVectors(testNamespace, ['test_id_1', 'test_id_2']);
    console.log('   ✅ deleteVectors() ejecutado');

    console.log('\n✅ TODOS LOS TESTS PASARON!\n');
    console.log('📝 Resumen:');
    console.log('   - Cliente Pinecone inicializado correctamente');
    console.log('   - Conexión al índice funcional');
    console.log('   - Operaciones de namespace funcionan');
    console.log('   - deleteAll() y deleteMany() operativos');
    console.log('   - Acceso a APIs raw disponible');
    console.log('   - Métodos legacy funcionan (deprecated)');
    console.log('\n🎉 Cliente real de Pinecone implementado correctamente!\n');

  } catch (error: any) {
    console.error('\n❌ Error en tests:', error.message);
    console.error(error);
    throw error;
  }
}

// Ejecutar
if (require.main === module) {
  testPineconeClient().catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

export { testPineconeClient };
