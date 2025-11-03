/**
 * Script de prueba para el chatbot con Pinecone
 *
 * Uso:
 * npx tsx scripts/test-chatbot.ts
 */

async function testChatbot() {
  console.log('\n🧪 Probando chatbot con Pinecone...\n');

  const testQuery = 'Cuáles son los precios de los planes de Resply?';
  const tenant_id = 'tenant_001';

  console.log(`📝 Pregunta: "${testQuery}"`);
  console.log(`🏢 Tenant ID: ${tenant_id}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/chat/message-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testQuery,
        tenant_id: tenant_id,
        conversationHistory: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('📡 Respuesta recibida (streaming):\n');
    console.log('─'.repeat(60));

    // Leer el stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                process.stdout.write(data.content);
                fullResponse += data.content;
              } else if (data.type === 'tool_call') {
                console.log(`\n\n🔧 [Tool Call] ${data.toolName}`);
                if (data.args) {
                  console.log(`   Args:`, JSON.stringify(data.args, null, 2));
                }
              } else if (data.type === 'tool_result') {
                console.log(`\n✅ [Tool Result] ${data.toolName}`);
                console.log(`   Longitud: ${data.result?.length || 0} caracteres`);
              }
            } catch (e) {
              // Ignorar líneas que no sean JSON
            }
          }
        }
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Prueba completada!\n');
    console.log(`📊 Longitud de respuesta: ${fullResponse.length} caracteres\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Ejecutar
testChatbot().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
