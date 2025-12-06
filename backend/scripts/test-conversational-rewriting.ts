/**
 * Script para testear Conversational Rewriting
 */
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function isFollowUpQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();

  // Muy corta (menos de 20 caracteres, probablemente incompleta)
  if (lowerMessage.length < 20) {
    // Empieza con conectores de seguimiento
    const followUpStarters = ['y ', '¿y ', 'también', 'qué tal', 'que tal', 'y el', 'y la', 'y los'];
    if (followUpStarters.some(starter => lowerMessage.startsWith(starter))) {
      return true;
    }
  }

  // Preguntas extremadamente cortas (menos de 15 caracteres)
  if (lowerMessage.length < 15 && !lowerMessage.includes('qué') && !lowerMessage.includes('que')) {
    return true;
  }

  return false;
}

async function rewriteWithContext(
  currentMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  console.log(`\n🔄 Reescribiendo: "${currentMessage}"`);
  console.log('─'.repeat(60));

  const recentHistory = conversationHistory.slice(-6);
  const contextLines = recentHistory.map(msg =>
    `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
  ).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `Eres un experto en reescribir preguntas de seguimiento.

Tu tarea: Reescribir la pregunta del usuario para que sea COMPLETA y AUTO-CONTENIDA usando el contexto de la conversación previa.

Reglas:
- Incorpora el contexto necesario de mensajes anteriores
- Mantén la intención original del usuario
- Sé específico y claro
- Si se refiere a algo mencionado antes, inclúyelo explícitamente
- Máximo 20 palabras
- Añade contexto parroquial si es relevante

Ejemplos:
Usuario anterior: "actividades para jóvenes"
Pregunta actual: "y para matrimonios?"
Reescritura: "¿Qué actividades hay para matrimonios en la parroquia?"

Usuario anterior: "qué es Eloos"
Pregunta actual: "y Bartimeo?"
Reescritura: "¿Qué es el grupo Bartimeo de la parroquia?"

Responde SOLO con la pregunta reescrita, sin explicaciones.`
      },
      {
        role: 'user',
        content: `Contexto de la conversación:\n${contextLines}\n\nPregunta actual del usuario: ${currentMessage}\n\nReescribe la pregunta:`
      }
    ]
  });

  const rewritten = response.choices[0].message.content?.trim() || currentMessage;

  console.log('\n📝 Contexto:');
  contextLines.split('\n').forEach(line => console.log(`   ${line}`));
  console.log('\n✅ Reescrito a:');
  console.log(`   "${rewritten}"`);

  return rewritten;
}

async function testConversation() {
  console.log('🧪 TESTING CONVERSATIONAL REWRITING');
  console.log('═'.repeat(60));

  // Caso 1: Pregunta sobre actividades con seguimiento
  let history: Array<{ role: string; content: string }> = [
    { role: 'user', content: '¿Qué actividades hay para jóvenes?' },
    { role: 'assistant', content: 'Hay varios grupos para jóvenes: Bartimeo, Edge, Lifeteen...' }
  ];

  if (isFollowUpQuestion('y para matrimonios?')) {
    await rewriteWithContext('y para matrimonios?', history);
  }

  // Caso 2: Preguntas sobre grupos específicos
  history = [
    { role: 'user', content: '¿Qué es Eloos?' },
    { role: 'assistant', content: 'Eloos es un grupo de jóvenes que incluye Eloos Superación y Eloos Entrega...' }
  ];

  if (isFollowUpQuestion('y Bartimeo?')) {
    await rewriteWithContext('y Bartimeo?', history);
  }

  // Caso 3: Pregunta corta sin contexto claro
  history = [
    { role: 'user', content: 'cuéntame sobre la catequesis' },
    { role: 'assistant', content: 'Hay catequesis de infancia, Edge, Lifeteen y catecumenado de adultos...' }
  ];

  if (isFollowUpQuestion('horarios?')) {
    await rewriteWithContext('horarios?', history);
  }

  // Caso 4: Pregunta normal (NO debería reescribirse)
  console.log('\n🔍 Prueba con pregunta normal (NO follow-up):');
  console.log(`   "¿Qué es Oro y Café?" → ${isFollowUpQuestion('¿Qué es Oro y Café?') ? 'FOLLOW-UP ❌' : 'NORMAL ✅'}`);
}

testConversation().catch(console.error);
