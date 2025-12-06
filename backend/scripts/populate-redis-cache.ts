/**
 * Script para poblar Redis Cloud con FAQ y sus variaciones
 *
 * Uso: REDIS_URL=your_redis_url npx ts-node backend/scripts/populate-redis-cache.ts
 */

import Redis from 'ioredis';

interface CacheEntry {
  question: string;
  answer: string;
  timestamp: number;
  normalizedQuestion: string;
}

const TTL = 60 * 60 * 24 * 30; // 30 días para FAQ precargadas
const REDIS_PREFIX = 'semantic_cache:';
const INDEX_KEY = 'semantic_cache:index';

// FAQ Data con variaciones (las mismas 43 del memoryCache)
const FAQ_DATA = [
  {
    "question": "¿Qué es el Aula de Biblia y Teología?",
    "answer": "Es un espacio de formación bíblica y teológica abierto a todos los que deseen profundizar en su fe. Se realiza los jueves a las 20:00h en el Salón Transfiguración. No se requiere conocimiento previo, solo ganas de aprender y crecer en la comprensión de la fe.",
    "variations": [
      "aula biblia teologia",
      "que es aula de biblia",
      "clases biblia parroquia",
      "estudiar biblia",
      "formacion biblica",
      "curso teologia parroquia"
    ]
  },
  {
    "question": "¿Cuándo es el Taller Mercadillo Solidario?",
    "answer": "Se realiza los miércoles de 17:30h a 19:30h en la Parroquia Transfiguración del Señor. Es un taller de artesanías y manualidades cuyos beneficios se destinan íntegramente a ayudar a personas necesitadas.",
    "variations": [
      "taller mercadillo solidario",
      "mercadillo solidario horario",
      "cuando es mercadillo",
      "taller manualidades parroquia",
      "artesanias parroquia",
      "taller solidario"
    ]
  },
  {
    "question": "¿Qué es la Oración de las Madres?",
    "answer": "Es un grupo de oración que nació en Inglaterra en 1995, donde las madres se reúnen para poner en manos de Dios a sus hijos. Se celebra los sábados a las 10:00h en la Parroquia Nuestra Señora de la Soledad. Todas las madres son bienvenidas, sin importar la edad de sus hijos.",
    "variations": [
      "oracion de madres",
      "que es oracion madres",
      "grupo madres parroquia",
      "reunion madres sabado",
      "oracion por hijos",
      "grupo madres oracion"
    ]
  },
  {
    "question": "¿Qué es Dalmanuta?",
    "answer": "Es un grupo de fe y vida para adultos mayores de 40 años que se reúne los martes quincenales de 20:00h a 21:15h en la Parroquia Transfiguración del Señor. Combina formación en fe con convivencia, incluyendo matrimonios, viudos, personas consagradas y religiosos.",
    "variations": [
      "dalmanuta grupo",
      "que es dalmanuta",
      "grupo adultos parroquia",
      "grupo fe vida adultos",
      "dalmanuta mayores 40",
      "grupo adultos 40 años"
    ]
  },
  {
    "question": "¿Cuándo se reúne la Cofradía de la Virgen Inmaculada del Guano?",
    "answer": "Se reúnen los segundos sábados de cada mes a las 17:30h en la Parroquia Nuestra Señora de la Soledad. Es una comunidad de devotos ecuatorianos que animan la liturgia de las 19:30h.",
    "variations": [
      "cofradia virgen guano",
      "virgen inmaculada guano",
      "grupo ecuatorianos parroquia",
      "cofradia ecuatoriana",
      "virgen del guano",
      "cuando reunion cofradia guano"
    ]
  },
  {
    "question": "¿Cuál es el horario de atención de Cáritas Parroquial?",
    "answer": "Martes de 12:30h a 14:00h, miércoles de 18:00h a 20:00h, y jueves de 18:00h a 20:00h en los despachos parroquiales. Cáritas atiende y acoge a familias en situación de necesidad y vulnerabilidad.",
    "variations": [
      "horario caritas",
      "cuando abre caritas",
      "caritas parroquial horario",
      "atencion caritas",
      "horario atencion caritas",
      "cuando puedo ir caritas"
    ]
  },
  {
    "question": "¿Cuándo es la catequesis de infancia?",
    "answer": "En la Parroquia Nuestra Señora de la Soledad: lunes de 17:30h a 18:30h. En la Parroquia Transfiguración del Señor: jueves de 18:00h a 19:00h. Está dirigida a niños a partir de 2º de Primaria para la preparación de los sacramentos.",
    "variations": [
      "catequesis niños",
      "cuando es catequesis",
      "horario catequesis infancia",
      "catequesis primera comunion",
      "catequesis para niños",
      "catequesis horario"
    ]
  },
  {
    "question": "¿Qué es Oro y Café?",
    "answer": "Es un encuentro mensual para matrimonios y parejas que se celebra el tercer sábado de cada mes de 17:30h a 19:00h en la Parroquia Transfiguración del Señor. Combina un tiempo de oración ante el Santísimo (Oro) y un momento de convivencia tomando café.",
    "variations": [
      "oro y cafe",
      "grupo matrimonios",
      "oro cafe parejas",
      "encuentro matrimonios parroquia",
      "grupo parejas parroquia",
      "que es oro y cafe"
    ]
  },
  {
    "question": "¿Qué es EDGE?",
    "answer": "Es un programa de catequesis LifeTeen para preadolescentes de 10 a 13 años. Se realiza los domingos a las 12:00h después de la Misa de familia en la Parroquia Transfiguración del Señor. Combina enseñanza, juegos, música y momentos de oración adaptados a su edad.",
    "variations": [
      "edge catequesis",
      "que es edge",
      "catequesis 10 13 años",
      "edge lifeteen",
      "catequesis preadolescentes",
      "edge para niños"
    ]
  },
  {
    "question": "¿Qué es LifeTeen?",
    "answer": "Es el programa de catequesis para adolescentes de 14 a 18 años. Se realiza los domingos a las 12:00h después de la Misa de familia en la Parroquia Transfiguración del Señor. Incluye videos, testimonios, dinámicas y debates sobre temas relevantes para su edad.",
    "variations": [
      "lifeteen",
      "catequesis adolescentes",
      "catequesis 14 18 años",
      "que es lifeteen",
      "grupo adolescentes parroquia",
      "catequesis jovenes"
    ]
  },
  {
    "question": "¿Cuándo se reza el rosario en la parroquia?",
    "answer": "La Hermandad de Nuestra Señora de la Soledad reza el rosario diario de lunes a domingo a las 19:00h (excepto miércoles) en la Parroquia Nuestra Señora de la Soledad. El cuarto sábado de cada mes hay rosario especial seguido de Misa.",
    "variations": [
      "horario rosario",
      "cuando rosario parroquia",
      "rezar rosario",
      "rosario diario",
      "hora rosario",
      "rosario en la iglesia"
    ]
  },
  {
    "question": "¿Qué talleres ofrece el Taller San Juan Evangelista?",
    "answer": "Ofrece costura, montaje de prendas y arreglos (lunes y martes 10:00h-13:00h), punto y ganchillo (viernes 10:00h-13:00h), costura a máquina y bordados (lunes 10:00h-13:00h), pintura en tela (martes 17:00h-20:00h) y encajes de bolillos (viernes 17:00h-20:00h). Todo en la Parroquia Nuestra Señora de la Soledad.",
    "variations": [
      "taller san juan evangelista",
      "talleres manualidades",
      "aprender costura",
      "clases costura parroquia",
      "taller punto ganchillo",
      "talleres parroquia"
    ]
  },
  // Continúa con más FAQ...
];

function normalize(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ');
}

async function populateRedisCache() {
  console.log('\n🚀 Iniciando población de Redis Cloud con FAQ...\n');

  if (!process.env.REDIS_URL) {
    console.error('❌ Error: REDIS_URL no está configurada');
    console.log('\nUso: REDIS_URL=your_redis_url npx ts-node backend/scripts/populate-redis-cache.ts\n');
    process.exit(1);
  }

  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });

  console.log('🔗 Conectado a Redis Cloud');

  let totalEntries = 0;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < FAQ_DATA.length; i++) {
    const item = FAQ_DATA[i];
    const { question, answer, variations } = item;

    try {
      // Guardar pregunta principal
      const normalizedQuestion = normalize(question);
      const mainKey = `${REDIS_PREFIX}${normalizedQuestion}`;

      const mainEntry: CacheEntry = {
        question,
        answer,
        timestamp: Date.now(),
        normalizedQuestion,
      };

      await redis.setex(mainKey, TTL, JSON.stringify(mainEntry));
      await redis.sadd(INDEX_KEY, mainKey);

      console.log(`✅ [${i + 1}/${FAQ_DATA.length}] Principal: "${question.substring(0, 60)}..."`);
      successCount++;
      totalEntries++;

      // Guardar cada variación
      if (variations && variations.length > 0) {
        for (const variation of variations) {
          const normalizedVariation = normalize(variation);
          const variationKey = `${REDIS_PREFIX}${normalizedVariation}`;

          const variationEntry: CacheEntry = {
            question: variation,
            answer,
            timestamp: Date.now(),
            normalizedQuestion: normalizedVariation,
          };

          await redis.setex(variationKey, TTL, JSON.stringify(variationEntry));
          await redis.sadd(INDEX_KEY, variationKey);

          totalEntries++;
        }

        console.log(`   ➕ ${variations.length} variaciones guardadas`);
      }

    } catch (error) {
      console.error(`❌ Error en "${question}":`, error);
      errorCount++;
    }

    // Pequeña pausa para no saturar Redis
    if (i < FAQ_DATA.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Cerrar conexión
  await redis.quit();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ FAQ exitosas: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📦 Total FAQ: ${FAQ_DATA.length}`);
  console.log(`💾 Total entradas en Redis: ${totalEntries}`);
  console.log(`⏰ TTL: ${TTL / 60 / 60 / 24} días`);
  console.log('\n✨ Redis Cloud poblado exitosamente!\n');
}

// Ejecutar
populateRedisCache().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
