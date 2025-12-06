/**
 * Script para subir contenido de actividades_parroquiales.md a Pinecone
 * con keywords inteligentes y metadata rica
 *
 * Ejecutar: npx tsx backend/scripts/upload-markdown-to-pinecone.ts
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface ActivitySection {
  title: string;
  content: string;
  lugar?: string;
  dia?: string;
  horario?: string;
  dirigidoA?: string;
  descripcion: string;
}

interface DocumentMetadata {
  titulo: string;
  categoria_pastoral: string;
  tipo_contenido: string;
  parroquia_ubicacion: string;
  audiencia_objetivo: string;
  keywords_principales: string[];
  keywords_sinonimos: string[];
  dia_semana?: string;
  horario?: string;
  descripcion_corta: string;
  nivel_urgencia: string;
  temporada_liturgica: string;
}

// Detectar categoría pastoral basada en contenido
function detectCategoria(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();

  if (/bautismo|confirmación|matrimonio|sacramento/.test(text)) return 'sacramentos';
  if (/catequesis|primera comunión|edge|lifeteen/.test(text)) return 'catequesis';
  if (/misa|liturgia|eucaristía|adoración/.test(text)) return 'liturgia';
  if (/cáritas|ayuda|necesitados|vulnerabilidad/.test(text)) return 'caritas';
  if (/rosario|oración|adoración|madres/.test(text)) return 'grupos_oracion';
  if (/jóvenes|eloos|bartimeo|pozo|mies/.test(text)) return 'jovenes';
  if (/familia|matrimonio|pareja|oro y café/.test(text)) return 'familias';
  if (/biblia|teología|formación|catecumenado/.test(text)) return 'formacion';

  return 'informacion_general';
}

// Detectar audiencia objetivo
function detectAudiencia(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();

  if (/niños|infantil|8.?13 años/.test(text)) return 'ninos_catequesis';
  if (/adolescentes|14.?18 años|16.?18 años/.test(text)) return 'jovenes';
  if (/jóvenes|17 años en adelante/.test(text)) return 'jovenes';
  if (/adultos|mayores de 40/.test(text)) return 'adultos';
  if (/familia|pareja|matrimonio/.test(text)) return 'familias';
  if (/mayores|tercera edad/.test(text)) return 'tercera_edad';

  return 'publico_general';
}

// Detectar parroquia
function detectParroquia(content: string): string {
  const text = content.toLowerCase();

  const hasSoledad = /soledad|visitación/i.test(text);
  const hasTransfiguracion = /transfiguración|isabelita usera/i.test(text);

  if (hasSoledad && !hasTransfiguracion) return 'soledad';
  if (hasTransfiguracion && !hasSoledad) return 'transfiguracion';

  return 'ambas';
}

// Extraer día de la semana
function extractDia(content: string): string | undefined {
  const diaMatch = content.match(/\*\*Día:\*\*\s*([^\n]+)/i);
  if (diaMatch) {
    const dia = diaMatch[1].toLowerCase();
    if (/lunes/i.test(dia)) return 'lunes';
    if (/martes/i.test(dia)) return 'martes';
    if (/miércoles/i.test(dia)) return 'miércoles';
    if (/jueves/i.test(dia)) return 'jueves';
    if (/viernes/i.test(dia)) return 'viernes';
    if (/sábado/i.test(dia)) return 'sábado';
    if (/domingo/i.test(dia)) return 'domingo';
  }
  return undefined;
}

// Extraer horario
function extractHorario(content: string): string | undefined {
  const horarioMatch = content.match(/\*\*Horario:\*\*\s*([^\n]+)/i);
  if (horarioMatch) return horarioMatch[1].trim();

  // Buscar patrones de hora en el contenido
  const horaMatch = content.match(/\b(\d{1,2}):(\d{2})h?\b/);
  if (horaMatch) return horaMatch[0];

  return undefined;
}

// Generar keywords inteligentes
function generateSmartKeywords(title: string, content: string): {
  principales: string[];
  sinonimos: string[];
} {
  const titleWords = title
    .toLowerCase()
    .replace(/[^\wáéíóúñü\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['grupo', 'para', 'los', 'las'].includes(w));

  const principales = [...new Set(titleWords)];

  // Agregar keywords del contenido (primeras frases importantes)
  const contentLower = content.toLowerCase();
  const sinonimos: string[] = [];

  // Detectar keywords específicas según el título
  if (/eloos entrega/i.test(title)) {
    principales.push('eloos', 'eloos entrega', 'servicio calle');
    sinonimos.push('voluntariado jóvenes', 'ayuda personas calle', 'servicio social', 'amor en acción');
  }

  if (/eloos superación/i.test(title)) {
    principales.push('eloos', 'eloos superación', 'deporte');
    sinonimos.push('fútbol', 'voleibol', 'baloncesto', 'montaña', 'actividad deportiva');
  }

  if (/cáritas/i.test(title)) {
    principales.push('cáritas', 'ayuda social');
    sinonimos.push('ayuda necesitados', 'caridad', 'vulnerabilidad', 'familias necesitadas');
  }

  if (/catequesis/i.test(title)) {
    principales.push('catequesis', 'primera comunión');
    sinonimos.push('iniciación cristiana', 'formación niños', 'preparación sacramentos');
  }

  if (/edge/i.test(title)) {
    principales.push('edge', 'lifeteen', 'preadolescentes');
    sinonimos.push('catequesis 10-13 años', 'catequesis adolescentes');
  }

  if (/lifeteen/i.test(title)) {
    principales.push('lifeteen', 'adolescentes');
    sinonimos.push('catequesis 14-18 años', 'jóvenes adolescentes');
  }

  if (/oro y café/i.test(title)) {
    principales.push('oro y café', 'parejas', 'matrimonios');
    sinonimos.push('encuentro matrimonios', 'adoración parejas', 'espiritualidad pareja');
  }

  if (/dalmanuta/i.test(title)) {
    principales.push('dalmanuta', 'adultos', 'mayores 40');
    sinonimos.push('grupo adultos', 'fe y vida', 'formación adultos');
  }

  if (/bartimeo/i.test(title)) {
    principales.push('bartimeo', 'retiro adolescentes');
    sinonimos.push('encuentro adolescentes', 'retiro fin de semana', 'arciprestazgo usera');
  }

  if (/pozo/i.test(title)) {
    principales.push('el pozo', 'grupo juvenil');
    sinonimos.push('jóvenes soledad', 'animación litúrgica', 'servicio jóvenes');
  }

  if (/mies/i.test(title)) {
    principales.push('mies', 'misioneros esperanza');
    sinonimos.push('vocación misionera', 'formación vocacional');
  }

  if (/biblia|teología/i.test(title)) {
    principales.push('biblia', 'teología', 'formación');
    sinonimos.push('estudio bíblico', 'formación fe', 'teología pastoral');
  }

  if (/mercadillo/i.test(title)) {
    principales.push('mercadillo solidario', 'artesanías');
    sinonimos.push('manualidades', 'taller creativo', 'caridad');
  }

  if (/taller san juan/i.test(title)) {
    principales.push('taller', 'manualidades', 'costura');
    sinonimos.push('bordado', 'punto', 'ganchillo', 'encajes', 'pintura tela');
  }

  return {
    principales: principales.slice(0, 8),
    sinonimos: sinonimos.slice(0, 8)
  };
}

// Generar descripción corta (primeras 150 palabras de la descripción)
function generateDescripcionCorta(content: string): string {
  const descMatch = content.match(/###\s*Descripción\s*\n([\s\S]+?)(?=\n---|\n##|$)/);
  if (descMatch) {
    const desc = descMatch[1]
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const words = desc.split(/\s+/);
    return words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
  }
  return '';
}

// Parsear el archivo MD en secciones
function parseMarkdownSections(filePath: string): ActivitySection[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections: ActivitySection[] = [];

  // Dividir por ## (títulos de nivel 2)
  const parts = content.split(/\n## /);

  for (let i = 1; i < parts.length; i++) { // Skip header
    const section = parts[i];
    const lines = section.split('\n');
    const title = lines[0].trim();

    // Extraer metadata estructurada
    const lugar = section.match(/\*\*Lugar:\*\*\s*([^\n]+)/)?.[1]?.trim();
    const dia = section.match(/\*\*Día:\*\*\s*([^\n]+)/)?.[1]?.trim();
    const horario = section.match(/\*\*Horario:\*\*\s*([^\n]+)/)?.[1]?.trim();
    const dirigidoA = section.match(/\*\*Dirigido a:\*\*\s*([^\n]+)/)?.[1]?.trim();

    // Extraer descripción
    const descMatch = section.match(/###\s*Descripción\s*\n([\s\S]+?)(?=\n---|\n##|$)/);
    const descripcion = descMatch ? descMatch[1].trim() : '';

    sections.push({
      title,
      content: section,
      lugar,
      dia,
      horario,
      dirigidoA,
      descripcion
    });
  }

  return sections;
}

// Función principal
async function uploadMarkdownToPinecone() {
  console.log('🚀 Iniciando subida de actividades_parroquiales.md a Pinecone...\n');

  // Verificar variables de entorno
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!pineconeApiKey || !openaiApiKey) {
    console.error('❌ Variables de entorno faltantes');
    process.exit(1);
  }

  // Inicializar clientes
  const pc = new Pinecone({ apiKey: pineconeApiKey });
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const index = pc.index('parroquias');

  // Leer archivo MD
  const mdPath = path.resolve(__dirname, '../../Downloads/actividades_parroquiales.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`❌ Archivo no encontrado: ${mdPath}`);
    process.exit(1);
  }

  console.log('📖 Parseando archivo MD...');
  const sections = parseMarkdownSections(mdPath);
  console.log(`✅ Encontradas ${sections.length} actividades\n`);

  let uploaded = 0;

  for (const section of sections) {
    console.log(`📄 Procesando: ${section.title}`);

    // Generar metadata inteligente
    const keywords = generateSmartKeywords(section.title, section.content);
    const categoria = detectCategoria(section.title, section.content);
    const audiencia = detectAudiencia(section.title, section.content);
    const parroquia = detectParroquia(section.content);
    const dia = extractDia(section.content);
    const horario = extractHorario(section.content);
    const descripcionCorta = generateDescripcionCorta(section.content);

    const metadata: DocumentMetadata = {
      titulo: section.title,
      categoria_pastoral: categoria,
      tipo_contenido: 'actividad_pastoral',
      parroquia_ubicacion: parroquia,
      audiencia_objetivo: audiencia,
      keywords_principales: keywords.principales,
      keywords_sinonimos: keywords.sinonimos,
      dia_semana: dia,
      horario: horario,
      descripcion_corta: descripcionCorta,
      nivel_urgencia: 'media',
      temporada_liturgica: 'no_aplica'
    };

    console.log(`   📊 Metadata:`);
    console.log(`      Categoría: ${metadata.categoria_pastoral}`);
    console.log(`      Audiencia: ${metadata.audiencia_objetivo}`);
    console.log(`      Parroquia: ${metadata.parroquia_ubicacion}`);
    console.log(`      Keywords: ${metadata.keywords_principales.join(', ')}`);
    console.log(`      Sinónimos: ${metadata.keywords_sinonimos.join(', ')}`);
    if (dia) console.log(`      Día: ${dia}`);
    if (horario) console.log(`      Horario: ${horario}`);

    // Generar embedding
    console.log(`   🧠 Generando embedding...`);
    const textToEmbed = `${section.title}\n\n${descripcionCorta}\n\nKeywords: ${keywords.principales.join(', ')}, ${keywords.sinonimos.join(', ')}`;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: textToEmbed,
      dimensions: 3072
    });

    // Subir a Pinecone
    console.log(`   ⬆️  Subiendo a Pinecone...`);
    const id = `actividad_${section.title.toLowerCase().replace(/[^\w]+/g, '_')}`;

    await index.upsert([{
      id,
      values: embeddingResponse.data[0].embedding,
      metadata: {
        ...metadata,
        pageContent: section.descripcion,
        file_name: 'actividades_parroquiales.md'
      } as any
    }]);

    uploaded++;
    console.log(`   ✅ Subido correctamente\n`);
  }

  console.log(`🎉 Completado! ${uploaded} actividades subidas a Pinecone`);
}

// Ejecutar
uploadMarkdownToPinecone().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
