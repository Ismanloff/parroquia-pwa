/**
 * Script de prueba para ver la estructura de respuesta de Voyage AI
 */

import { VoyageAIClient } from 'voyageai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testVoyage() {
  console.log('\n🧪 Probando Voyage AI API...\n');

  const voyageai = new VoyageAIClient({
    apiKey: process.env.VOYAGE_API_KEY!
  });

  try {
    const result = await voyageai.embed({
      input: ['Hola mundo', 'Segunda prueba'],
      model: 'voyage-3-large',
      inputType: 'document',
      outputDimension: 1024
    });

    console.log('📦 Respuesta completa:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🔍 Estructura detectada:');
    console.log('typeof result:', typeof result);
    console.log('result keys:', Object.keys(result));

    if (Array.isArray(result)) {
      console.log('✅ result es un array con', result.length, 'elementos');
    }

    // @ts-ignore
    if (result.data) {
      // @ts-ignore
      console.log('✅ result.data existe con', result.data.length, 'embeddings');
    }

    // @ts-ignore
    if (result.embeddings) {
      // @ts-ignore
      console.log('✅ result.embeddings existe con', result.embeddings.length, 'embeddings');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

testVoyage();
