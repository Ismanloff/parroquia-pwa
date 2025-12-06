import { NextResponse } from 'next/server';
import Redis from 'ioredis';

/**
 * Endpoint para sincronizar Redis Cloud con las FAQ del Memory Cache
 * GET /api/admin/sync-redis-from-memory
 *
 * Este endpoint copia solo las FAQ con variaciones embebidas desde la fuente original
 */
export async function GET() {
  try {
    // Verificar que REDIS_URL esté configurada
    if (!process.env.REDIS_URL) {
      return NextResponse.json({
        success: false,
        error: 'REDIS_URL no está configurada',
      }, { status: 500 });
    }

    console.log('🚀 Iniciando sincronización de Redis Cloud con FAQ...');

    // Conectar a Redis
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });

    const TTL = 60 * 60 * 24 * 30; // 30 días para FAQ precargadas
    const REDIS_PREFIX = 'semantic_cache:';
    const INDEX_KEY = 'semantic_cache:index';

    // FAQ Data completa con variaciones - copiada directamente de memoryCache.ts
    const FAQ_WITH_VARIATIONS = getFAQData();

    let totalEntries = 0;
    let faqCount = 0;

    for (const item of FAQ_WITH_VARIATIONS) {
      const { question, answer, variations } = item;

      try {
        // Guardar pregunta principal
        const normalizedQuestion = normalize(question);
        const mainKey = `${REDIS_PREFIX}${normalizedQuestion}`;

        const mainEntry = {
          question,
          answer,
          timestamp: Date.now(),
          normalizedQuestion,
        };

        await redis.setex(mainKey, TTL, JSON.stringify(mainEntry));
        await redis.sadd(INDEX_KEY, mainKey);

        faqCount++;
        totalEntries++;

        // Guardar cada variación
        if (variations && variations.length > 0) {
          for (const variation of variations) {
            const normalizedVariation = normalize(variation);
            const variationKey = `${REDIS_PREFIX}${normalizedVariation}`;

            const variationEntry = {
              question: variation,
              answer,
              timestamp: Date.now(),
              normalizedQuestion: normalizedVariation,
            };

            await redis.setex(variationKey, TTL, JSON.stringify(variationEntry));
            await redis.sadd(INDEX_KEY, variationKey);

            totalEntries++;
          }
        }

        console.log(`✅ [${faqCount}/${FAQ_WITH_VARIATIONS.length}] "${question.substring(0, 50)}..." + ${variations?.length || 0} variaciones`);

      } catch (error: any) {
        console.error(`❌ Error guardando "${question}":`, error.message);
      }

      // Pequeña pausa para no saturar Redis
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Cerrar conexión
    await redis.quit();

    const result = {
      success: true,
      message: 'Redis Cloud sincronizado exitosamente',
      stats: {
        faqCount,
        totalEntries,
        ttlDays: 30,
      },
    };

    console.log('✨ Redis Cloud sincronizado!', result.stats);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Error sincronizando Redis:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al sincronizar Redis',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

/**
 * Normaliza una pregunta (igual que en semanticCache.ts)
 */
function normalize(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;:]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Retorna las FAQ con variaciones
 * Esta data es la misma que está embebida en memoryCache.ts
 */
function getFAQData() {
  // Solo las FAQ que tienen variaciones definidas
  return [
    {
      "question": "¿Qué es el Aula de Biblia y Teología?",
      "answer": "Es un espacio de formación bíblica y teológica abierto a todos los que deseen profundizar en su fe. Se realiza los jueves a las 20:00h en el Salón Transfiguración. No se requiere conocimiento previo, solo ganas de aprender y crecer en la comprensión de la fe.",
      "variations": ["aula biblia teologia", "que es aula de biblia", "clases biblia parroquia", "estudiar biblia", "formacion biblica", "curso teologia parroquia"]
    },
    {
      "question": "¿Cuándo es el Taller Mercadillo Solidario?",
      "answer": "Se realiza los miércoles de 17:30h a 19:30h en la Parroquia Transfiguración del Señor. Es un taller de artesanías y manualidades cuyos beneficios se destinan íntegramente a ayudar a personas necesitadas.",
      "variations": ["taller mercadillo solidario", "mercadillo solidario horario", "cuando es mercadillo", "taller manualidades parroquia", "artesanias parroquia", "taller solidario"]
    },
    {
      "question": "¿Qué es la Oración de las Madres?",
      "answer": "Es un grupo de oración que nació en Inglaterra en 1995, donde las madres se reúnen para poner en manos de Dios a sus hijos. Se celebra los sábados a las 10:00h en la Parroquia Nuestra Señora de la Soledad. Todas las madres son bienvenidas, sin importar la edad de sus hijos.",
      "variations": ["oracion de madres", "que es oracion madres", "grupo madres parroquia", "reunion madres sabado", "oracion por hijos", "grupo madres oracion"]
    },
    {
      "question": "¿Qué es Dalmanuta?",
      "answer": "Es un grupo de fe y vida para adultos mayores de 40 años que se reúne los martes quincenales de 20:00h a 21:15h en la Parroquia Transfiguración del Señor. Combina formación en fe con convivencia, incluyendo matrimonios, viudos, personas consagradas y religiosos.",
      "variations": ["dalmanuta grupo", "que es dalmanuta", "grupo adultos parroquia", "grupo fe vida adultos", "dalmanuta mayores 40", "grupo adultos 40 años"]
    },
    {
      "question": "¿Cuándo se reúne la Cofradía de la Virgen Inmaculada del Guano?",
      "answer": "Se reúnen los segundos sábados de cada mes a las 17:30h en la Parroquia Nuestra Señora de la Soledad. Es una comunidad de devotos ecuatorianos que animan la liturgia de las 19:30h.",
      "variations": ["cofradia virgen guano", "virgen inmaculada guano", "grupo ecuatorianos parroquia", "cofradia ecuatoriana", "virgen del guano", "cuando reunion cofradia guano"]
    },
    {
      "question": "¿Cuál es el horario de atención de Cáritas Parroquial?",
      "answer": "Martes de 12:30h a 14:00h, miércoles de 18:00h a 20:00h, y jueves de 18:00h a 20:00h en los despachos parroquiales. Cáritas atiende y acoge a familias en situación de necesidad y vulnerabilidad.",
      "variations": ["horario caritas", "cuando abre caritas", "caritas parroquial horario", "atencion caritas", "horario atencion caritas", "cuando puedo ir caritas"]
    },
    {
      "question": "¿Cuándo es la catequesis de infancia?",
      "answer": "En la Parroquia Nuestra Señora de la Soledad: lunes de 17:30h a 18:30h. En la Parroquia Transfiguración del Señor: jueves de 18:00h a 19:00h. Está dirigida a niños a partir de 2º de Primaria para la preparación de los sacramentos.",
      "variations": ["catequesis niños", "cuando es catequesis", "horario catequesis infancia", "catequesis primera comunion", "catequesis para niños", "catequesis horario"]
    },
    {
      "question": "¿Qué es Oro y Café?",
      "answer": "Es un encuentro mensual para matrimonios y parejas que se celebra el tercer sábado de cada mes de 17:30h a 19:00h en la Parroquia Transfiguración del Señor. Combina un tiempo de oración ante el Santísimo (Oro) y un momento de convivencia tomando café.",
      "variations": ["oro y cafe", "grupo matrimonios", "oro cafe parejas", "encuentro matrimonios parroquia", "grupo parejas parroquia", "que es oro y cafe"]
    },
    {
      "question": "¿Qué es EDGE?",
      "answer": "Es un programa de catequesis LifeTeen para preadolescentes de 10 a 13 años. Se realiza los domingos a las 12:00h después de la Misa de familia en la Parroquia Transfiguración del Señor. Combina enseñanza, juegos, música y momentos de oración adaptados a su edad.",
      "variations": ["edge catequesis", "que es edge", "catequesis 10 13 años", "edge lifeteen", "catequesis preadolescentes", "edge para niños"]
    },
    {
      "question": "¿Qué es LifeTeen?",
      "answer": "Es el programa de catequesis para adolescentes de 14 a 18 años. Se realiza los domingos a las 12:00h después de la Misa de familia en la Parroquia Transfiguración del Señor. Incluye videos, testimonios, dinámicas y debates sobre temas relevantes para su edad.",
      "variations": ["lifeteen", "catequesis adolescentes", "catequesis 14 18 años", "que es lifeteen", "grupo adolescentes parroquia", "catequesis jovenes"]
    },
    {
      "question": "¿Cuándo se reza el rosario en la parroquia?",
      "answer": "La Hermandad de Nuestra Señora de la Soledad reza el rosario diario de lunes a domingo a las 19:00h (excepto miércoles) en la Parroquia Nuestra Señora de la Soledad. El cuarto sábado de cada mes hay rosario especial seguido de Misa.",
      "variations": ["horario rosario", "cuando rosario parroquia", "rezar rosario", "rosario diario", "hora rosario", "rosario en la iglesia"]
    },
    {
      "question": "¿Qué talleres ofrece el Taller San Juan Evangelista?",
      "answer": "Ofrece costura, montaje de prendas y arreglos (lunes y martes 10:00h-13:00h), punto y ganchillo (viernes 10:00h-13:00h), costura a máquina y bordados (lunes 10:00h-13:00h), pintura en tela (martes 17:00h-20:00h) y encajes de bolillos (viernes 17:00h-20:00h). Todo en la Parroquia Nuestra Señora de la Soledad.",
      "variations": ["taller san juan evangelista", "talleres manualidades", "aprender costura", "clases costura parroquia", "taller punto ganchillo", "talleres parroquia"]
    },
    {
      "question": "¿Qué es el Centro de Jóvenes MIES?",
      "answer": "Es un espacio de formación de Misioneros de la Esperanza para jóvenes de 17 años en adelante. Se reúnen los sábados quincenales a las 19:00h en el Salón Transfiguración. Combinan formación vocacional con dinámicas y participación en encuentros interprovinciales.",
      "variations": ["mies jovenes", "centro jovenes mies", "misioneros esperanza", "grupo mies", "que es mies", "formacion vocacional jovenes"]
    },
    {
      "question": "¿Hay actividades MIES para niños?",
      "answer": "Sí, el Centro de Niños y Juveniles MIES es para niños de 8 a 13 años y juveniles de 14 a 17 años. Se reúnen los sábados quincenales a las 17:00h en el Salón Transfiguración. Utilizan dinámicas, juegos, manualidades y canciones adaptadas a cada edad.",
      "variations": ["mies niños", "actividades mies niños", "grupo mies infantil", "mies 8 13 años", "juveniles mies", "mies para niños"]
    },
    {
      "question": "¿Qué es el catecumenado de adultos?",
      "answer": "Es el camino de iniciación cristiana para adultos que desean recibir el Bautismo, Primera Comunión o Confirmación. Se realiza los martes a las 20:00h en el Salón Transfiguración. Incluye formación doctrinal, lectura de la Palabra y momentos de oración.",
      "variations": ["catecumenado adultos", "bautismo adultos", "confirmacion adultos", "catequesis adultos", "primera comunion adultos", "preparacion sacramentos adultos"]
    },
    {
      "question": "¿Qué documentos necesito para casarme por la Iglesia?",
      "answer": "Necesitas: DNI o pasaporte vigente, partida de bautismo (validez 6 meses legalizada si es de otra Diócesis), partida literal de nacimiento, fe de vida y estado (declaración jurada), amonestaciones, certificado del curso de preparación al matrimonio, y documentación adicional según casos especiales (divorcio, nulidad o viudez).",
      "variations": ["documentos boda iglesia", "que necesito casarme iglesia", "papeles matrimonio religioso", "requisitos boda religiosa", "documentacion matrimonio", "casarse por iglesia papeles"]
    },
    {
      "question": "¿Dónde pedir cita para el expediente matrimonial?",
      "answer": "En el Arzobispado de Madrid, Calle Bailén 8, teléfono 914 546 400 o 915 427 906, email curia@archidiocesis.madrid. Debes asistir con los testigos y toda la documentación preparada.",
      "variations": ["cita expediente matrimonial", "donde pedir cita boda", "arzobispado madrid cita", "expediente matrimonial donde", "tramitar boda religiosa", "cita matrimonio religioso"]
    },
    {
      "question": "¿Qué requisitos deben cumplir los padrinos de bautismo?",
      "answer": "Al menos uno debe estar bautizado y confirmado en la Iglesia Católica, ser mayor de 16 años, estar soltero/a o casado por la Iglesia. Pueden ser solo uno o dos (máximo uno y una). Deben presentar certificado de bautismo y confirmación.",
      "variations": ["requisitos padrinos bautismo", "quien puede ser padrino", "padrinos bautizo requisitos", "que se necesita ser padrino", "condiciones padrinos", "padrino bautismo catolico"]
    },
    {
      "question": "¿Qué documentación necesito para bautizar a mi hijo?",
      "answer": "Para los padres: certificado de matrimonio religioso, DNI de ambos, certificado de nacimiento del menor y libro de familia. Los padres deben ser católicos practicantes y estar casados religiosamente. Para padrinos: certificado de bautismo y confirmación.",
      "variations": ["documentos bautismo bebe", "que necesito bautizar hijo", "papeles bautizo", "documentacion bautismo", "requisitos bautizar niño", "bautizar bebe documentos"]
    },
    {
      "question": "¿Cuándo se celebran los bautizos?",
      "answer": "En la Parroquia Transfiguración del Señor: segundos sábados del mes a las 18:00h. En la Parroquia Nuestra Señora de la Soledad: cuartos sábados del mes a las 12:30h. El bautismo se realiza al menos un mes después de entregar la solicitud.",
      "variations": ["horario bautizos", "cuando son bautismos", "fecha bautizo parroquia", "sabados bautismo", "cuando bautizan", "calendario bautizos"]
    },
    {
      "question": "¿Qué comunidades religiosas están presentes en las parroquias?",
      "answer": "Hay 6 comunidades: Hermanitas de Jesús (San Carlos de Foucauld), Hijas de Jesús (Santa Cándida María), Carmelitas Misioneras (Beato Francisco Palau), Hermanas Caridad de la Asunción (Padre Esteban Pernet), Clérigos de San Viator (Padre Luis Querbes) y Religiosas de los Ángeles Custodios (Beata Rafaela Ybarra).",
      "variations": ["comunidades religiosas", "monjas parroquia", "hermanas parroquia", "congregaciones religiosas", "religiosas en parroquia", "ordenes religiosas parroquia"]
    },
    {
      "question": "¿Cuál es el teléfono de la Parroquia Transfiguración del Señor?",
      "answer": "El teléfono es 91 475 18 75. Dirección: c/ Isabelita Usera, 34",
      "variations": ["telefono transfiguracion", "contacto parroquia transfiguracion", "telefono parroquia isabelita usera", "llamar transfiguracion", "numero transfiguracion", "telefono parroquia"]
    },
    {
      "question": "¿Cuál es el teléfono de la Parroquia Nuestra Señora de la Soledad?",
      "answer": "El teléfono es 91 792 42 45. Dirección: c/ Visitación, 1",
      "variations": ["telefono soledad", "contacto parroquia soledad", "telefono parroquia visitacion", "llamar soledad", "numero soledad", "telefono parroquia soledad"]
    },
    {
      "question": "¿Qué debo llevar el día del bautismo?",
      "answer": "Debes traer una vela para la celebración, vestido o pañuelo blanco para el menor, y preparar sobre-ofrenda voluntaria según las posibilidades familiares.",
      "variations": ["que llevar bautizo", "que necesito dia bautismo", "cosas para bautizo", "vela bautismo", "ropa bautizo bebe", "preparar bautizo"]
    },
    {
      "question": "¿Puedo bautizar a mi hijo si tiene más de 5 años?",
      "answer": "Sí, pero los niños mayores de 5 años deben comenzar el proceso de catequesis de infancia previo al bautismo.",
      "variations": ["bautizar niño 5 años", "bautismo niño mayor", "bautizar niño grande", "bautizo niños mayores", "bautizar hijo mayor 5 años", "bautismo niño escuela"]
    },
    {
      "question": "¿Puedo descargar el formulario de solicitud de bautismo?",
      "answer": "Sí, puedes descargarlo desde la web soledadtransfiguracion.com/solicitud-bautismo. Debe rellenarse con MAYÚSCULAS y entregarse en el despacho parroquial.",
      "variations": ["formulario bautismo", "descargar solicitud bautismo", "donde solicitud bautizo", "formulario bautizo online", "pedir bautismo online", "web bautismo"]
    },
    {
      "question": "¿Qué compromiso adquieren los padres en el bautismo?",
      "answer": "Los padres deben comprometerse públicamente a educar cristianamente al menor en la Religión Católica, según el espíritu del Evangelio y las enseñanzas de la Iglesia.",
      "variations": ["compromiso padres bautismo", "obligaciones padres bautizo", "que prometen padres bautismo", "responsabilidad padres bautismo", "compromiso bautismo padres", "deber padres bautizo"]
    },
    {
      "question": "¿Cuántos padrinos puede tener un niño en el bautismo?",
      "answer": "Puede tener solo un padrino o madrina, o dos (uno y una como máximo).",
      "variations": ["cuantos padrinos bautismo", "numero padrinos bautizo", "cuantos padrinos permitidos", "un o dos padrinos", "padrinos bautismo cantidad", "cuantos padrinos pueden ser"]
    },
    {
      "question": "¿Qué información genealógica necesito para el bautismo?",
      "answer": "Información completa de abuelos paternos y maternos: ciudad o pueblo de nacimiento, provincia (departamento) y país de origen de todos.",
      "variations": ["datos abuelos bautismo", "informacion genealogica bautizo", "datos familiares bautismo", "informacion abuelos bautizo", "datos origen familia bautismo", "genealogia bautismo"]
    },
    {
      "question": "¿Hay actividades para jóvenes universitarios?",
      "answer": "Sí, el Centro de Jóvenes MIES acoge a jóvenes de 17 años en adelante, El Pozo es para jóvenes, y Eloos Entrega y Eloos Superación son grupos juveniles activos que realizan servicio y actividades deportivas.",
      "variations": ["grupo jovenes universidad", "actividades jovenes adultos", "grupo universitarios parroquia", "jovenes 18 años parroquia", "que hay para jovenes", "grupos juventud parroquia"]
    },
    {
      "question": "¿Puedo participar en Cáritas como voluntario?",
      "answer": "Sí, Cáritas Parroquial necesita voluntarios para escuchar, acoger y ayudar a familias en situación de necesidad. Puedes contactar en los horarios de atención: martes 12:30h-14:00h, miércoles y jueves 18:00h-20:00h.",
      "variations": ["voluntario caritas", "ayudar caritas", "ser voluntario caritas", "colaborar caritas", "trabajar caritas", "participar caritas voluntario"]
    },
    {
      "question": "¿Hay algún grupo para parejas jóvenes?",
      "answer": "Sí, Oro y Café es un encuentro mensual para matrimonios y parejas que se celebra el tercer sábado de cada mes de 17:30h a 19:00h en la Parroquia Transfiguración del Señor.",
      "variations": ["grupo parejas jovenes", "matrimonios jovenes parroquia", "encuentro parejas", "grupo novios", "parejas jovenes parroquia", "actividad matrimonios"]
    },
    {
      "question": "¿Dónde puedo aprender a hacer manualidades?",
      "answer": "En el Taller Mercadillo Solidario (miércoles 17:30h-19:30h en Transfiguración) o en el Taller San Juan Evangelista (varios horarios en Soledad) que ofrece costura, punto, ganchillo, bordados, pintura en tela y encajes de bolillos.",
      "variations": ["aprender manualidades", "clases manualidades parroquia", "taller costura", "donde aprender coser", "clases punto ganchillo", "talleres creativos"]
    },
    {
      "question": "¿Hay actividades al aire libre?",
      "answer": "Sí, Eloos Superación hace salidas a la montaña el segundo sábado de cada mes, y El Pozo también organiza salidas a la montaña los segundos sábados del mes.",
      "variations": ["actividades montaña", "salidas aire libre", "excursiones parroquia", "actividades naturaleza", "senderismo parroquia", "salidas montaña"]
    },
    {
      "question": "¿Qué es la Hermandad de Nuestra Señora de la Soledad?",
      "answer": "Es el grupo de devotos que cuida la imagen de la Virgen de la Soledad, su ropero y altar. Sostienen el rezo diario del rosario a las 19:00h (excepto miércoles) y organizan las celebraciones especiales marianas, incluida la novena y fiesta de la Virgen.",
      "variations": ["hermandad soledad", "hermandad virgen soledad", "grupo virgen soledad", "cofradia soledad", "devotos virgen soledad", "hermandad parroquia"]
    },
    {
      "question": "¿Cuándo es la fiesta de la Virgen de la Soledad?",
      "answer": "Durante la novena preparatoria se reza el rosario de los Siete Dolores cada día. En el día de la fiesta se realizan actos especiales como la ofrenda floral. La Hermandad coordina todos estos actos.",
      "variations": ["fiesta virgen soledad", "cuando fiesta virgen", "celebracion virgen soledad", "dia virgen soledad", "novena virgen soledad", "festividad virgen"]
    },
    {
      "question": "¿Puedo formar parte de la animación litúrgica?",
      "answer": "Sí, el grupo El Pozo anima la misa de los domingos a las 19:30h en Nuestra Señora de la Soledad, y la Cofradía de la Virgen del Guano anima la liturgia de las 19:30h los segundos sábados.",
      "variations": ["cantar misa", "grupo musica liturgica", "coro parroquia", "animar misa", "musica liturgica", "participar liturgia"]
    },
    {
      "question": "¿Hay formación bíblica para adultos?",
      "answer": "Sí, el Aula de Biblia y Teología se realiza los jueves a las 20:00h en el Salón Transfiguración. Está abierto a toda persona interesada en profundizar en la Biblia y la teología, sin conocimientos previos necesarios.",
      "variations": ["estudiar biblia adultos", "formacion biblica", "curso biblia", "clases biblia adultos", "aprender biblia", "estudio biblico adultos"]
    },
  ];
}
