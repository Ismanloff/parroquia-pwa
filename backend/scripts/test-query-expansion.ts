/**
 * Script para testear Query Expansion
 */
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function expandQuery(query: string): Promise<string[]> {
  console.log(`\n🔍 Query original: "${query}"`);
  console.log('─'.repeat(60));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Eres un experto en reformular preguntas sobre parroquias católicas.

Genera 3 variaciones breves de la pregunta del usuario para mejorar búsquedas:

1. Una versión expandida (añade "qué es", "información sobre", etc)
2. Una versión con sinónimos y términos relacionados
3. Una versión con contexto específico (grupo parroquial, actividad, sacramento)

REGLAS CRÍTICAS:
- PRESERVA nombres propios EXACTAMENTE: "Eloos", "Oro y Café", "Bartimeo", "Dalmanuta"
- Si detectas un nombre de grupo/actividad, úsalo tal cual en todas las variaciones
- Sé CONCISO (máximo 15 palabras por variación)
- Si la query es solo un nombre, expándela a pregunta
- Añade contexto parroquial/católico relevante

Ejemplos:
"oro y café" →
información sobre el grupo Oro y Café de la parroquia
encuentro de parejas Oro y Café horarios y actividades
grupo matrimonial Oro y Café en las parroquias

Responde SOLO con las 3 variaciones, una por línea, sin numeración.`
      },
      {
        role: 'user',
        content: query
      }
    ]
  });

  const content = response.choices[0].message.content || '';
  const variations = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 3);

  console.log('\n📝 Variaciones generadas:\n');
  variations.forEach((v, i) => {
    console.log(`${i + 1}. ${v}`);
  });

  return [query, ...variations];
}

async function main() {
  console.log('🧪 TESTING QUERY EXPANSION');
  console.log('═'.repeat(60));

  // Probar con queries problemáticas
  await expandQuery('oro y café');
  await expandQuery('congregaciones');
  await expandQuery('eloos');
  await expandQuery('bartimeo');
  await expandQuery('qué actividades hay');
}

main().catch(console.error);
