/**
 * Script INTELIGENTE para subir CUALQUIER documento a Pinecone
 * Usa GPT-4o + Structured Outputs para metadata automática
 *
 * Basado en mejores prácticas 2025:
 * - GPT-4o alcanza 100% confiabilidad en JSON schema
 * - Function calling > JSON mode para extracción estructurada
 * - Metadata dinámica mejora significativamente RAG
 *
 * Ejecutar: npx tsx backend/scripts/upload-intelligent-to-pinecone.ts <archivo>
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ===== SCHEMA DE METADATA (Pydantic-style con Zod) =====
// Esto garantiza 100% de confiabilidad según investigación 2025

const MetadataSchema = z.object({
  titulo: z.string().describe('Título descriptivo del contenido (máx 100 caracteres)'),

  categoria_pastoral: z.enum([
    'sacramentos',
    'catequesis',
    'liturgia',
    'caritas',
    'grupos_oracion',
    'jovenes',
    'familias',
    'formacion',
    'comunidad_china',
    'informacion_general'
  ]).describe('Categoría pastoral principal del documento'),

  tipo_contenido: z.enum([
    'actividad_pastoral',
    'guia_sacramentos',
    'horarios_misas',
    'material_catequesis',
    'boletin_parroquial',
    'inscripcion_actividad',
    'comunicado_urgente',
    'formacion_fe',
    'documento_administrativo',
    'preguntas_frecuentes',
    'contactos_servicios',
    'otro'
  ]).describe('Tipo de contenido del documento'),

  parroquia_ubicacion: z.enum(['soledad', 'transfiguracion', 'ambas'])
    .describe('Parroquia a la que pertenece (Soledad, Transfiguración, o ambas)'),

  audiencia_objetivo: z.enum([
    'ninos_catequesis',
    'jovenes',
    'adultos',
    'familias',
    'tercera_edad',
    'catequistas',
    'comunidad_china',
    'publico_general'
  ]).describe('Audiencia objetivo del contenido'),

  keywords_principales: z.array(z.string())
    .min(3)
    .max(10)
    .describe('Palabras clave principales extraídas del contenido. Incluye nombres propios de grupos, actividades, conceptos clave'),

  keywords_sinonimos: z.array(z.string())
    .max(10)
    .describe('Sinónimos y términos relacionados que ayudarían a encontrar este contenido'),

  descripcion_corta: z.string()
    .max(300)
    .describe('Resumen conciso del contenido en 1-2 frases (máx 300 caracteres)'),

  dia_semana: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'no_aplica'])
    .optional()
    .describe('Día de la semana si es una actividad regular'),

  horario: z.string()
    .optional()
    .describe('Horario de la actividad si aplica (ej: "19:00h", "10:00h a 12:00h")'),

  nivel_urgencia: z.enum(['alta', 'media', 'baja'])
    .describe('Nivel de urgencia o prioridad del contenido'),

  temporada_liturgica: z.enum([
    'adviento',
    'navidad',
    'cuaresma',
    'semana_santa',
    'pascua',
    'tiempo_ordinario',
    'no_aplica'
  ]).describe('Temporada litúrgica si es relevante'),

  contiene_horarios: z.boolean()
    .describe('¿El documento contiene horarios específicos?'),

  contiene_fechas: z.boolean()
    .describe('¿El documento contiene fechas específicas?'),

  requiere_inscripcion: z.boolean()
    .describe('¿La actividad/contenido requiere inscripción previa?')
});

type DocumentMetadata = z.infer<typeof MetadataSchema>;

// ===== FUNCIÓN INTELIGENTE: EXTRACCIÓN DE METADATA CON GPT-4o =====

async function extractMetadataIntelligent(
  content: string,
  fileName: string,
  openai: OpenAI
): Promise<DocumentMetadata> {

  console.log('🧠 Usando GPT-4o + Structured Outputs para extracción inteligente...');

  const systemPrompt = `Eres un experto en análisis de documentos parroquiales católicos.

Tu tarea es extraer metadata precisa de documentos sobre:
- Actividades y grupos parroquiales (Eloos, Cáritas, catequesis, etc.)
- Sacramentos (bautismo, matrimonio, confirmación)
- Horarios de misas y eventos
- Información general de la parroquia

CONTEXTO PARROQUIAL:
- Parroquias: "Nuestra Señora de la Soledad" y "Transfiguración del Señor" (Madrid)
- Audiencias: niños, jóvenes, adultos, familias, tercera edad, comunidad china
- Actividades: misas, sacramentos, catequesis, Cáritas, grupos de oración, formación

INSTRUCCIONES CRÍTICAS:

1. **KEYWORDS PRINCIPALES**:
   - Incluye nombres propios específicos (ej: "Eloos", "Dalmanuta", "Bartimeo")
   - Incluye términos técnicos relevantes (ej: "primera comunión", "eucaristía")
   - Incluye verbos de acción si son relevantes (ej: "servir", "ayudar", "rezar")

2. **KEYWORDS SINÓNIMOS**:
   - Piensa en cómo la gente buscaría este contenido
   - Incluye variaciones (ej: "voluntariado" para "servicio", "jóvenes" para "adolescentes")
   - Incluye contexto (ej: "ayuda personas calle" para Eloos Entrega)

3. **CATEGORIZACIÓN**:
   - Lee TODO el documento antes de categorizar
   - Elige la categoría MÁS específica posible

4. **DESCRIPCIÓN CORTA**:
   - Resume QUÉ es + PARA QUIÉN + CUÁNDO/DÓNDE
   - Máximo 300 caracteres, conciso y descriptivo

Analiza el documento y extrae metadata estructurada.`;

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06', // Modelo con Structured Outputs (100% confiabilidad)
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Archivo: ${fileName}\n\nContenido:\n${content.substring(0, 8000)}` }
    ],
    response_format: zodResponseFormat(MetadataSchema, 'metadata_extraction'),
    temperature: 0.1, // Baja temperatura para mayor consistencia
  });

  const metadata = completion.choices[0].message.parsed;

  if (!metadata) {
    throw new Error('GPT-4o no pudo parsear metadata');
  }

  console.log('✅ Metadata extraída con éxito');
  return metadata;
}

// ===== CHUNKING INTELIGENTE V2 =====
// Mejoras 2025:
// - Chunk size reducido: 1000 → 600 chars (mejor precisión)
// - Mantiene contexto del título en cada chunk
// - Etiquetas semánticas específicas

interface ChunkWithContext {
  content: string;
  sectionTitle: string | null;
  tags: string[]; // Tags específicos: info_padrinos, docs_matrimonio, etc.
}

function intelligentChunkV2(content: string, maxChunkSize: number = 600): ChunkWithContext[] {
  const chunks: ChunkWithContext[] = [];

  // Detectar si es Markdown con headers
  if (content.includes('##')) {
    // Dividir por secciones (## TÍTULO)
    const sections = content.split(/\n## /);

    // Primer chunk (antes del primer ##)
    if (sections[0].trim().length > 0) {
      const introChunk = sections[0].trim();
      if (introChunk.length <= maxChunkSize) {
        chunks.push({
          content: introChunk,
          sectionTitle: null,
          tags: extractSemanticTags(introChunk)
        });
      } else {
        // Dividir intro si es muy larga
        const introChunks = splitLongText(introChunk, maxChunkSize);
        introChunks.forEach(c => chunks.push({
          content: c,
          sectionTitle: null,
          tags: extractSemanticTags(c)
        }));
      }
    }

    // Procesar cada sección
    for (let i = 1; i < sections.length; i++) {
      const section = '## ' + sections[i];

      // Extraer título de la sección
      const titleMatch = section.match(/^## (.+?)(\n|$)/);
      const sectionTitle = titleMatch ? titleMatch[1].trim() : null;

      // Si la sección es pequeña, mantener completa
      if (section.length <= maxChunkSize) {
        chunks.push({
          content: section,
          sectionTitle,
          tags: extractSemanticTags(section, sectionTitle)
        });
      } else {
        // Sección grande: dividir pero MANTENER contexto del título
        const sectionBody = section.substring(section.indexOf('\n') + 1);
        const subChunks = splitLongText(sectionBody, maxChunkSize - 50); // Reservar espacio para título

        subChunks.forEach(subChunk => {
          // Agregar título como contexto al inicio de cada subchunk
          const chunkWithContext = sectionTitle
            ? `## ${sectionTitle}\n\n${subChunk}`
            : subChunk;

          chunks.push({
            content: chunkWithContext,
            sectionTitle,
            tags: extractSemanticTags(subChunk, sectionTitle)
          });
        });
      }
    }
  } else {
    // Texto sin estructura: dividir por párrafos
    const textChunks = splitLongText(content, maxChunkSize);
    textChunks.forEach(c => chunks.push({
      content: c,
      sectionTitle: null,
      tags: extractSemanticTags(c)
    }));
  }

  return chunks.filter(c => c.content.length > 50); // Filtrar chunks muy pequeños
}

// Dividir texto largo en chunks más pequeños
function splitLongText(text: string, maxSize: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Extraer tags semánticos específicos del contenido
function extractSemanticTags(content: string, sectionTitle?: string | null): string[] {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerTitle = sectionTitle?.toLowerCase() || '';

  // Tags de sacramentos
  if (lowerContent.includes('padrino') || lowerContent.includes('madrina') || lowerTitle.includes('padrino')) {
    tags.push('info_padrinos');
  }
  if (lowerContent.includes('testigo')) {
    tags.push('info_testigos');
  }
  if (lowerContent.includes('expediente matrimonial') || lowerContent.includes('documentación') && lowerContent.includes('matrimonio')) {
    tags.push('docs_matrimonio');
  }
  if (lowerContent.includes('bautismo') || lowerTitle.includes('bautismo')) {
    tags.push('info_bautismo');
  }
  if (lowerContent.includes('confirmación') || lowerTitle.includes('confirmación')) {
    tags.push('info_confirmacion');
  }
  if (lowerContent.includes('primera comunión') || lowerTitle.includes('comunión')) {
    tags.push('info_primera_comunion');
  }

  // Tags de grupos/actividades
  if (lowerContent.includes('eloos') || lowerTitle.includes('eloos')) {
    tags.push('grupo_eloos');
  }
  if (lowerContent.includes('oro y café') || lowerTitle.includes('oro y café')) {
    tags.push('grupo_oro_y_cafe');
  }
  if (lowerContent.includes('cáritas') || lowerTitle.includes('cáritas')) {
    tags.push('grupo_caritas');
  }
  if (lowerContent.includes('oración') && lowerContent.includes('madres')) {
    tags.push('grupo_oracion_madres');
  }
  if (lowerContent.includes('catequesis')) {
    tags.push('info_catequesis');
  }

  // Tags de documentación
  if (lowerContent.includes('dni') || lowerContent.includes('certificado') || lowerContent.includes('documentación')) {
    tags.push('requiere_documentos');
  }
  if (lowerContent.includes('horario') || lowerContent.match(/\d{1,2}:\d{2}h/)) {
    tags.push('contiene_horarios');
  }
  if (lowerContent.includes('inscripción') || lowerContent.includes('formulario')) {
    tags.push('requiere_inscripcion');
  }

  return tags;
}

// ===== FUNCIÓN PRINCIPAL =====

async function uploadIntelligentDocument(filePath: string) {
  console.log('🚀 Iniciando subida INTELIGENTE a Pinecone...\n');

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

  // Leer archivo
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`📖 Archivo: ${fileName}`);
  console.log(`📏 Tamaño: ${content.length} caracteres\n`);

  // 1. EXTRAER METADATA INTELIGENTEMENTE con GPT-4o
  const metadata = await extractMetadataIntelligent(content, fileName, openai);

  console.log('\n📊 Metadata extraída:');
  console.log(`   Título: ${metadata.titulo}`);
  console.log(`   Categoría: ${metadata.categoria_pastoral}`);
  console.log(`   Tipo: ${metadata.tipo_contenido}`);
  console.log(`   Parroquia: ${metadata.parroquia_ubicacion}`);
  console.log(`   Audiencia: ${metadata.audiencia_objetivo}`);
  console.log(`   Keywords: ${metadata.keywords_principales.join(', ')}`);
  console.log(`   Sinónimos: ${metadata.keywords_sinonimos.join(', ')}`);
  if (metadata.dia_semana && metadata.dia_semana !== 'no_aplica') {
    console.log(`   Día: ${metadata.dia_semana}`);
  }
  if (metadata.horario) {
    console.log(`   Horario: ${metadata.horario}`);
  }

  // 2. CHUNKING INTELIGENTE V2 (600 chars, mantiene contexto)
  console.log('\n✂️  Aplicando chunking inteligente V2...');
  console.log('   - Chunk size: 600 chars (↓ desde 1000)');
  console.log('   - Mantiene contexto del título en cada chunk');
  console.log('   - Genera tags semánticos específicos');
  const chunksWithContext = intelligentChunkV2(content, 600);
  console.log(`✅ Generados ${chunksWithContext.length} chunks semánticos con contexto\n`);

  // Mostrar distribución de tags
  const allTags = new Set<string>();
  chunksWithContext.forEach(c => c.tags.forEach(t => allTags.add(t)));
  if (allTags.size > 0) {
    console.log(`🏷️  Tags detectados: ${Array.from(allTags).join(', ')}\n`);
  }

  // 3. GENERAR EMBEDDINGS Y SUBIR
  console.log('⬆️  Subiendo a Pinecone...');

  for (let i = 0; i < chunksWithContext.length; i++) {
    const chunkData = chunksWithContext[i];

    // Texto enriquecido para embedding (mejora búsqueda)
    const enrichedText = `${metadata.titulo}\n\n${chunkData.content}\n\nKeywords: ${metadata.keywords_principales.join(', ')}, ${metadata.keywords_sinonimos.join(', ')}`;

    // Generar embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: enrichedText,
      dimensions: 3072
    });

    // ID único
    const id = `${fileName.replace(/\.[^.]+$/, '')}_chunk_${i}`;

    // Subir a Pinecone con metadata enriquecida
    await index.upsert([{
      id,
      values: embeddingResponse.data[0].embedding,
      metadata: {
        ...metadata,
        pageContent: chunkData.content,
        section_title: chunkData.sectionTitle || '', // Convert null to empty string
        semantic_tags: chunkData.tags.join(','), // Tags específicos
        file_name: fileName,
        chunk_index: i,
        total_chunks: chunksWithContext.length
      } as any
    }]);

    const tagsStr = chunkData.tags.length > 0 ? ` [${chunkData.tags.join(', ')}]` : '';
    console.log(`   ✅ Chunk ${i + 1}/${chunksWithContext.length}${tagsStr}`);
  }

  console.log(`\n🎉 Completado! ${chunksWithContext.length} chunks subidos a Pinecone`);
  console.log(`💡 Metadata generada automáticamente con GPT-4o (100% confiable)`);
}

// EJECUTAR
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Uso: npx tsx backend/scripts/upload-intelligent-to-pinecone.ts <archivo>');
  console.error('   Ejemplo: npx tsx backend/scripts/upload-intelligent-to-pinecone.ts actividades.md');
  process.exit(1);
}

uploadIntelligentDocument(filePath).catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
