/**
 * Memory Cache como alternativa a Vercel KV
 * Se puebla automáticamente desde FAQ data al iniciar
 * Se reinicia con cada deploy pero es instantáneo
 */

interface CacheEntry {
  question: string;
  answer: string;
  timestamp: number;
  normalizedQuestion: string;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 hora en miliseconds
  private initialized = false;

  // Palabras clave que indican pregunta relacionada con calendario (NO cachear)
  private readonly CALENDAR_KEYWORDS = [
    'evento', 'eventos', 'actividad', 'actividades',
    'hoy', 'mañana', 'próximo', 'proxima', 'próxima',
    'cuando', 'cuándo', 'fecha', 'fechas',
    'semana', 'mes', 'día', 'dia',
    'calendario', 'programado', 'programada',
    'qué hay', 'que hay'
  ];

  // Respuestas cortas/genéricas que NO se deben cachear
  private readonly GENERIC_RESPONSES = [
    'gracias', 'ok', 'vale', 'entendido', 'perfecto',
    'si', 'no', 'claro', 'hola', 'adios', 'adiós',
    'bien', 'mal', 'bueno', 'genial'
  ];

  constructor() {
    // Auto-inicializar con FAQ data
    this.initializeFromFAQ();
  }

  /**
   * Inicializa el cache con las preguntas frecuentes
   */
  private initializeFromFAQ() {
    if (this.initialized) return;

    // FAQ Data embebida (las 43 preguntas con variaciones)
    // Cada entrada puede tener múltiples formas de preguntar lo mismo
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
                  "cuando puedo ir caritas",
                  "que horario hay de caritas",
                  "que horario tiene caritas",
                  "a que hora abre caritas",
                  "horario de caritas parroquial"
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
            "question": "¿Qué es Eloos Entrega?",
            "answer": "Es un grupo de jóvenes que sale todos los viernes a las 19:00h desde la Parroquia Nuestra Señora de la Soledad para servir a personas en situación de calle. Llevan comida, kits de higiene y sobre todo presencia y escucha. Es una escuela de humanidad y servicio.",
            "variations": [
                  "eloos entrega",
                  "que es eloos entrega",
                  "eloos servicio",
                  "grupo eloos",
                  "eloos viernes",
                  "servicio calle eloos",
                  "que es eloos",
                  "eloos"
            ]
      },
      {
            "question": "¿Qué es Eloos Superación?",
            "answer": "Es un grupo deportivo que se reúne todos los sábados de 10:00h a 12:30h en el Colegio Nuestra Señora de Fátima. Realizan fútbol, voleibol y baloncesto. El segundo sábado de cada mes hacen salidas a la montaña. Dirigido a jóvenes que buscan crecer a través del deporte.",
            "variations": [
                  "eloos superacion",
                  "que es eloos superacion",
                  "eloos deporte",
                  "eloos deportes",
                  "eloos futbol",
                  "eloos sabado",
                  "grupo deportivo eloos"
            ]
      },
      {
            "question": "¿Qué hacen los Voluntarios de Visita a Enfermos?",
            "answer": "Realizan visitas regulares a domicilios, residencias y hospitales para acomañar a personas mayores y enfermas. Llevan la comunión a quienes no pueden desplazarse. Se reúnen el último jueves de cada mes y celebran Misa por los enfermos. Ubicados en la Parroquia Nuestra Señora de la Soledad."
      },
      {
            "question": "¿Qué es el grupo El Pozo?",
            "answer": "Es un grupo juvenil que se reúne los 4 sábados de cada mes por la tarde en la Parroquia Nuestra Señora de la Soledad. Animan la misa de los domingos a las 19:30h, realizan servicio los sábados por la mañana y hacen salidas a la montaña los segundos sábados del mes."
      },
      {
            "question": "¿Qué es Bartimeo?",
            "answer": "Son encuentros de espiritualidad para adolescentes de 16 a 18 años del Arciprestazgo de Usera. Se celebran dos retiros de fin de semana al año, uno en otoño y otro en primavera. Es una experiencia intensa de fe y convivencia."
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
      {
            "question": "¿Qué es el Centro de Jóvenes MIES?",
            "answer": "Es un espacio de formación de Misioneros de la Esperanza para jóvenes de 17 años en adelante. Se reúnen los sábados quincenales a las 19:00h en el Salón Transfiguración. Combinan formación vocacional con dinámicas y participación en encuentros interprovinciales.",
            "variations": [
                  "mies jovenes",
                  "centro jovenes mies",
                  "misioneros esperanza",
                  "grupo mies",
                  "que es mies",
                  "formacion vocacional jovenes"
            ]
      },
      {
            "question": "¿Hay actividades MIES para niños?",
            "answer": "Sí, el Centro de Niños y Juveniles MIES es para niños de 8 a 13 años y juveniles de 14 a 17 años. Se reúnen los sábados quincenales a las 17:00h en el Salón Transfiguración. Utilizan dinámicas, juegos, manualidades y canciones adaptadas a cada edad.",
            "variations": [
                  "mies niños",
                  "actividades mies niños",
                  "grupo mies infantil",
                  "mies 8 13 años",
                  "juveniles mies",
                  "mies para niños"
            ]
      },
      {
            "question": "¿Qué es el catecumenado de adultos?",
            "answer": "Es el camino de iniciación cristiana para adultos que desean recibir el Bautismo, Primera Comunión o Confirmación. Se realiza los martes a las 20:00h en el Salón Transfiguración. Incluye formación doctrinal, lectura de la Palabra y momentos de oración.",
            "variations": [
                  "catecumenado adultos",
                  "bautismo adultos",
                  "confirmacion adultos",
                  "catequesis adultos",
                  "primera comunion adultos",
                  "preparacion sacramentos adultos"
            ]
      },
      {
            "question": "¿Qué documentos necesito para casarme por la Iglesia?",
            "answer": "Necesitas: DNI o pasaporte vigente, partida de bautismo (validez 6 meses legalizada si es de otra Diócesis), partida literal de nacimiento, fe de vida y estado (declaración jurada), amonestaciones, certificado del curso de preparación al matrimonio, y documentación adicional según casos especiales (divorcio, nulidad o viudez).",
            "variations": [
                  "documentos boda iglesia",
                  "que necesito casarme iglesia",
                  "papeles matrimonio religioso",
                  "requisitos boda religiosa",
                  "documentacion matrimonio",
                  "casarse por iglesia papeles"
            ]
      },
      {
            "question": "¿Dónde pedir cita para el expediente matrimonial?",
            "answer": "En el Arzobispado de Madrid, Calle Bailén 8, teléfono 914 546 400 o 915 427 906, email curia@archidiocesis.madrid. Debes asistir con los testigos y toda la documentación preparada.",
            "variations": [
                  "cita expediente matrimonial",
                  "donde pedir cita boda",
                  "arzobispado madrid cita",
                  "expediente matrimonial donde",
                  "tramitar boda religiosa",
                  "cita matrimonio religioso"
            ]
      },
      {
            "question": "¿Qué requisitos deben cumplir los padrinos de bautismo?",
            "answer": "Al menos uno debe estar bautizado y confirmado en la Iglesia Católica, ser mayor de 16 años, estar soltero/a o casado por la Iglesia. Pueden ser solo uno o dos (máximo uno y una). Deben presentar certificado de bautismo y confirmación.",
            "variations": [
                  "requisitos padrinos bautismo",
                  "quien puede ser padrino",
                  "padrinos bautizo requisitos",
                  "que se necesita ser padrino",
                  "condiciones padrinos",
                  "padrino bautismo catolico"
            ]
      },
      {
            "question": "¿Qué documentación necesito para bautizar a mi hijo?",
            "answer": "Para los padres: certificado de matrimonio religioso, DNI de ambos, certificado de nacimiento del menor y libro de familia. Los padres deben ser católicos practicantes y estar casados religiosamente. Para padrinos: certificado de bautismo y confirmación.",
            "variations": [
                  "documentos bautismo bebe",
                  "que necesito bautizar hijo",
                  "papeles bautizo",
                  "documentacion bautismo",
                  "requisitos bautizar niño",
                  "bautizar bebe documentos"
            ]
      },
      {
            "question": "¿Cuándo se celebran los bautizos?",
            "answer": "En la Parroquia Transfiguración del Señor: segundos sábados del mes a las 18:00h. En la Parroquia Nuestra Señora de la Soledad: cuartos sábados del mes a las 12:30h. El bautismo se realiza al menos un mes después de entregar la solicitud.",
            "variations": [
                  "horario bautizos",
                  "cuando son bautismos",
                  "fecha bautizo parroquia",
                  "sabados bautismo",
                  "cuando bautizan",
                  "calendario bautizos"
            ]
      },
      {
            "question": "¿Qué comunidades religiosas están presentes en las parroquias?",
            "answer": "Hay 6 comunidades: Hermanitas de Jesús (San Carlos de Foucauld), Hijas de Jesús (Santa Cándida María), Carmelitas Misioneras (Beato Francisco Palau), Hermanas Caridad de la Asunción (Padre Esteban Pernet), Clérigos de San Viator (Padre Luis Querbes) y Religiosas de los Ángeles Custodios (Beata Rafaela Ybarra).",
            "variations": [
                  "comunidades religiosas",
                  "monjas parroquia",
                  "hermanas parroquia",
                  "congregaciones religiosas",
                  "religiosas en parroquia",
                  "ordenes religiosas parroquia"
            ]
      },
      {
            "question": "¿Cuál es el teléfono de la Parroquia Transfiguración del Señor?",
            "answer": "El teléfono es 91 475 18 75. Dirección: c/ Isabelita Usera, 34",
            "variations": [
                  "telefono transfiguracion",
                  "contacto parroquia transfiguracion",
                  "telefono parroquia isabelita usera",
                  "llamar transfiguracion",
                  "numero transfiguracion",
                  "telefono parroquia"
            ]
      },
      {
            "question": "¿Cuál es el teléfono de la Parroquia Nuestra Señora de la Soledad?",
            "answer": "El teléfono es 91 792 42 45. Dirección: c/ Visitación, 1",
            "variations": [
                  "telefono soledad",
                  "contacto parroquia soledad",
                  "telefono parroquia visitacion",
                  "llamar soledad",
                  "numero soledad",
                  "telefono parroquia soledad"
            ]
      },
      {
            "question": "¿Qué debo llevar el día del bautismo?",
            "answer": "Debes traer una vela para la celebración, vestido o pañuelo blanco para el menor, y preparar sobre-ofrenda voluntaria según las posibilidades familiares.",
            "variations": [
                  "que llevar bautizo",
                  "que necesito dia bautismo",
                  "cosas para bautizo",
                  "vela bautismo",
                  "ropa bautizo bebe",
                  "preparar bautizo"
            ]
      },
      {
            "question": "¿Puedo bautizar a mi hijo si tiene más de 5 años?",
            "answer": "Sí, pero los niños mayores de 5 años deben comenzar el proceso de catequesis de infancia previo al bautismo.",
            "variations": [
                  "bautizar niño 5 años",
                  "bautismo niño mayor",
                  "bautizar niño grande",
                  "bautizo niños mayores",
                  "bautizar hijo mayor 5 años",
                  "bautismo niño escuela"
            ]
      },
      {
            "question": "¿Puedo descargar el formulario de solicitud de bautismo?",
            "answer": "Sí, puedes descargarlo desde la web soledadtransfiguracion.com/solicitud-bautismo. Debe rellenarse con MAYÚSCULAS y entregarse en el despacho parroquial.",
            "variations": [
                  "formulario bautismo",
                  "descargar solicitud bautismo",
                  "donde solicitud bautizo",
                  "formulario bautizo online",
                  "pedir bautismo online",
                  "web bautismo"
            ]
      },
      {
            "question": "¿Qué compromiso adquieren los padres en el bautismo?",
            "answer": "Los padres deben comprometerse públicamente a educar cristianamente al menor en la Religión Católica, según el espíritu del Evangelio y las enseñanzas de la Iglesia.",
            "variations": [
                  "compromiso padres bautismo",
                  "obligaciones padres bautizo",
                  "que prometen padres bautismo",
                  "responsabilidad padres bautismo",
                  "compromiso bautismo padres",
                  "deber padres bautizo"
            ]
      },
      {
            "question": "¿Cuántos padrinos puede tener un niño en el bautismo?",
            "answer": "Puede tener solo un padrino o madrina, o dos (uno y una como máximo).",
            "variations": [
                  "cuantos padrinos bautismo",
                  "numero padrinos bautizo",
                  "cuantos padrinos permitidos",
                  "un o dos padrinos",
                  "padrinos bautismo cantidad",
                  "cuantos padrinos pueden ser"
            ]
      },
      {
            "question": "¿Qué información genealógica necesito para el bautismo?",
            "answer": "Información completa de abuelos paternos y maternos: ciudad o pueblo de nacimiento, provincia (departamento) y país de origen de todos.",
            "variations": [
                  "datos abuelos bautismo",
                  "informacion genealogica bautizo",
                  "datos familiares bautismo",
                  "informacion abuelos bautizo",
                  "datos origen familia bautismo",
                  "genealogia bautismo"
            ]
      },
      {
            "question": "¿Hay actividades para jóvenes universitarios?",
            "answer": "Sí, el Centro de Jóvenes MIES acoge a jóvenes de 17 años en adelante, El Pozo es para jóvenes, y Eloos Entrega y Eloos Superación son grupos juveniles activos que realizan servicio y actividades deportivas.",
            "variations": [
                  "grupo jovenes universidad",
                  "actividades jovenes adultos",
                  "grupo universitarios parroquia",
                  "jovenes 18 años parroquia",
                  "que hay para jovenes",
                  "grupos juventud parroquia"
            ]
      },
      {
            "question": "¿Puedo participar en Cáritas como voluntario?",
            "answer": "Sí, Cáritas Parroquial necesita voluntarios para escuchar, acoger y ayudar a familias en situación de necesidad. Puedes contactar en los horarios de atención: martes 12:30h-14:00h, miércoles y jueves 18:00h-20:00h.",
            "variations": [
                  "voluntario caritas",
                  "ayudar caritas",
                  "ser voluntario caritas",
                  "colaborar caritas",
                  "trabajar caritas",
                  "participar caritas voluntario"
            ]
      },
      {
            "question": "¿Hay algún grupo para parejas jóvenes?",
            "answer": "Sí, Oro y Café es un encuentro mensual para matrimonios y parejas que se celebra el tercer sábado de cada mes de 17:30h a 19:00h en la Parroquia Transfiguración del Señor.",
            "variations": [
                  "grupo parejas jovenes",
                  "matrimonios jovenes parroquia",
                  "encuentro parejas",
                  "grupo novios",
                  "parejas jovenes parroquia",
                  "actividad matrimonios"
            ]
      },
      {
            "question": "¿Dónde puedo aprender a hacer manualidades?",
            "answer": "En el Taller Mercadillo Solidario (miércoles 17:30h-19:30h en Transfiguración) o en el Taller San Juan Evangelista (varios horarios en Soledad) que ofrece costura, punto, ganchillo, bordados, pintura en tela y encajes de bolillos.",
            "variations": [
                  "aprender manualidades",
                  "clases manualidades parroquia",
                  "taller costura",
                  "donde aprender coser",
                  "clases punto ganchillo",
                  "talleres creativos"
            ]
      },
      {
            "question": "¿Hay actividades al aire libre?",
            "answer": "Sí, Eloos Superación hace salidas a la montaña el segundo sábado de cada mes, y El Pozo también organiza salidas a la montaña los segundos sábados del mes.",
            "variations": [
                  "actividades montaña",
                  "salidas aire libre",
                  "excursiones parroquia",
                  "actividades naturaleza",
                  "senderismo parroquia",
                  "salidas montaña"
            ]
      },
      {
            "question": "¿Qué es la Hermandad de Nuestra Señora de la Soledad?",
            "answer": "Es el grupo de devotos que cuida la imagen de la Virgen de la Soledad, su ropero y altar. Sostienen el rezo diario del rosario a las 19:00h (excepto miércoles) y organizan las celebraciones especiales marianas, incluida la novena y fiesta de la Virgen.",
            "variations": [
                  "hermandad soledad",
                  "hermandad virgen soledad",
                  "grupo virgen soledad",
                  "cofradia soledad",
                  "devotos virgen soledad",
                  "hermandad parroquia"
            ]
      },
      {
            "question": "¿Cuándo es la fiesta de la Virgen de la Soledad?",
            "answer": "Durante la novena preparatoria se reza el rosario de los Siete Dolores cada día. En el día de la fiesta se realizan actos especiales como la ofrenda floral. La Hermandad coordina todos estos actos.",
            "variations": [
                  "fiesta virgen soledad",
                  "cuando fiesta virgen",
                  "celebracion virgen soledad",
                  "dia virgen soledad",
                  "novena virgen soledad",
                  "festividad virgen"
            ]
      },
      {
            "question": "¿Puedo formar parte de la animación litúrgica?",
            "answer": "Sí, el grupo El Pozo anima la misa de los domingos a las 19:30h en Nuestra Señora de la Soledad, y la Cofradía de la Virgen del Guano anima la liturgia de las 19:30h los segundos sábados.",
            "variations": [
                  "cantar misa",
                  "grupo musica liturgica",
                  "coro parroquia",
                  "animar misa",
                  "musica liturgica",
                  "participar liturgia"
            ]
      },
      {
            "question": "¿Hay formación bíblica para adultos?",
            "answer": "Sí, el Aula de Biblia y Teología se realiza los jueves a las 20:00h en el Salón Transfiguración. Está abierto a toda persona interesada en profundizar en la Biblia y la teología, sin conocimientos previos necesarios.",
            "variations": [
                  "estudiar biblia adultos",
                  "formacion biblica",
                  "curso biblia",
                  "clases biblia adultos",
                  "aprender biblia",
                  "estudio biblico adultos"
            ]
      }
];

    console.log(`💾 Inicializando Memory Cache con ${FAQ_DATA.length} preguntas...`);

    for (const item of FAQ_DATA) {
      const { question, answer } = item;
      const variations = (item as any).variations || [];

      // Guardar la pregunta principal
      const normalizedQuestion = this.normalize(question);
      this.cache.set(normalizedQuestion, {
        question,
        answer,
        timestamp: Date.now(),
        normalizedQuestion,
      });

      // Guardar cada variación apuntando a la misma respuesta
      for (const variation of variations) {
        const normalizedVariation = this.normalize(variation);
        this.cache.set(normalizedVariation, {
          question: variation, // Usar la variación como pregunta
          answer,
          timestamp: Date.now(),
          normalizedQuestion: normalizedVariation,
        });
      }
    }

    this.initialized = true;
    console.log(`✅ Memory Cache inicializado con ${this.cache.size} entradas`);
  }

  /**
   * Normaliza una pregunta para comparación
   */
  private normalize(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[¿?¡!.,;:]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Verifica si la pregunta es sobre calendario/eventos
   */
  private isCalendarRelated(question: string): boolean {
    const normalized = this.normalize(question);
    return this.CALENDAR_KEYWORDS.some(keyword =>
      normalized.includes(keyword.toLowerCase())
    );
  }

  /**
   * Verifica si es una respuesta genérica corta
   */
  private isGenericResponse(question: string): boolean {
    const normalized = this.normalize(question);
    const words = normalized.split(' ').filter(w => w.length > 0);

    if (words.length === 0) return false;

    if (words.length <= 3) {
      const allGeneric = words.every(word => this.GENERIC_RESPONSES.includes(word));
      if (allGeneric) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcula similitud entre dos strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;

    const words1 = str1.split(' ').filter(w => w.length > 0);
    const words2 = str2.split(' ').filter(w => w.length > 0);

    const lengthDiff = Math.abs(words1.length - words2.length);
    const maxLength = Math.max(words1.length, words2.length);

    if (lengthDiff / maxLength > 0.5) {
      return 0;
    }

    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    const basicSimilarity = commonWords / totalWords;

    if (maxLength <= 3) {
      return words1.length === words2.length && commonWords === totalWords ? 1 : 0;
    }

    return basicSimilarity;
  }

  /**
   * Busca en cache una pregunta similar
   */
  async get(question: string): Promise<string | null> {
    // NO cachear preguntas sobre calendario
    if (this.isCalendarRelated(question)) {
      return null;
    }

    // NO cachear respuestas genéricas
    if (this.isGenericResponse(question)) {
      return null;
    }

    const normalizedQuestion = this.normalize(question);

    // Buscar coincidencia exacta
    const exactMatch = this.cache.get(normalizedQuestion);
    if (exactMatch) {
      // Verificar TTL
      if (Date.now() - exactMatch.timestamp < this.TTL) {
        console.log('⚡ Memory Cache HIT (exacto):', question);
        return exactMatch.answer;
      } else {
        this.cache.delete(normalizedQuestion);
      }
    }

    // Buscar coincidencia semántica (≥95% similitud)
    for (const [key, entry] of this.cache.entries()) {
      // Verificar TTL
      if (Date.now() - entry.timestamp >= this.TTL) {
        this.cache.delete(key);
        continue;
      }

      const similarity = this.calculateSimilarity(normalizedQuestion, entry.normalizedQuestion);

      // Threshold ajustado a 75% para capturar más variaciones naturales
      if (similarity >= 0.75) {
        console.log(`⚡ Memory Cache HIT (${Math.round(similarity * 100)}% similar):`, question);
        return entry.answer;
      }
    }

    console.log('❌ Memory Cache MISS:', question);
    return null;
  }

  /**
   * Guarda una respuesta en cache
   */
  async set(question: string, answer: string): Promise<void> {
    if (this.isCalendarRelated(question)) {
      return;
    }

    if (this.isGenericResponse(question)) {
      return;
    }

    const normalizedQuestion = this.normalize(question);

    this.cache.set(normalizedQuestion, {
      question,
      answer,
      timestamp: Date.now(),
      normalizedQuestion,
    });

    console.log('💾 Memory Cache guardado:', question);
  }

  /**
   * Limpia entradas expiradas
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.TTL) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Memory Cache cleanup: ${removed} entradas expiradas removidas`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  async getStats() {
    const entries: Array<{ question: string; age: number }> = [];

    for (const entry of this.cache.values()) {
      entries.push({
        question: entry.question,
        age: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
      });
    }

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    console.log('🗑️ Memory Cache completamente limpiado');
  }
}

// Instancia singleton del cache
export const memoryCache = new MemoryCache();

// Cleanup periódico cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    await memoryCache.cleanup();
  }, 10 * 60 * 1000);
}
