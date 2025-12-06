/**
 * Preview de cómo quedarían las keywords del MD
 */

import * as fs from 'fs';
import * as path from 'path';

// Copiar las funciones del script principal
function generateSmartKeywords(title: string, content: string) {
  const titleWords = title
    .toLowerCase()
    .replace(/[^\wáéíóúñü\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['grupo', 'para', 'los', 'las', 'del'].includes(w));

  const principales = [...new Set(titleWords)];
  const sinonimos: string[] = [];

  if (/eloos entrega/i.test(title)) {
    principales.push('eloos', 'eloos entrega', 'servicio calle');
    sinonimos.push('voluntariado jóvenes', 'ayuda personas calle', 'servicio social', 'amor en acción');
  }

  if (/cáritas/i.test(title)) {
    principales.push('cáritas', 'ayuda social');
    sinonimos.push('ayuda necesitados', 'caridad', 'vulnerabilidad', 'familias necesitadas');
  }

  if (/edge/i.test(title)) {
    principales.push('edge', 'lifeteen', 'preadolescentes');
    sinonimos.push('catequesis 10-13 años', 'catequesis adolescentes');
  }

  return { principales: principales.slice(0, 8), sinonimos: sinonimos.slice(0, 8) };
}

function detectCategoria(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();
  if (/cáritas|ayuda|necesitados/.test(text)) return 'caritas';
  if (/jóvenes|eloos/.test(text)) return 'jovenes';
  if (/catequesis|edge|lifeteen/.test(text)) return 'catequesis';
  return 'informacion_general';
}

// Leer archivo
const mdPath = '/Users/admin/Downloads/actividades_parroquiales.md';
const content = fs.readFileSync(mdPath, 'utf-8');

// Extraer 3 ejemplos
const examples = [
  { title: 'ELOOS ENTREGA - AMOR EN ACCIÓN', start: content.indexOf('## ELOOS ENTREGA') },
  { title: 'CÁRITAS PARROQUIAL', start: content.indexOf('## CÁRITAS PARROQUIAL') },
  { title: 'EDGE - CATEQUESIS LIFETEEN (10-13 AÑOS)', start: content.indexOf('## EDGE') }
];

console.log('📊 PREVIEW DE KEYWORDS GENERADAS\n');
console.log('='.repeat(80));

for (const example of examples) {
  if (example.start === -1) continue;

  const sectionEnd = content.indexOf('\n---', example.start);
  const sectionContent = content.substring(example.start, sectionEnd > 0 ? sectionEnd : example.start + 500);

  const keywords = generateSmartKeywords(example.title, sectionContent);
  const categoria = detectCategoria(example.title, sectionContent);

  console.log(`\n📄 ${example.title}`);
  console.log('-'.repeat(80));
  console.log(`Categoría: ${categoria}`);
  console.log(`\nKeywords Principales (${keywords.principales.length}):`);
  keywords.principales.forEach((k, i) => console.log(`   ${i + 1}. "${k}"`));
  console.log(`\nKeywords Sinónimos (${keywords.sinonimos.length}):`);
  keywords.sinonimos.forEach((k, i) => console.log(`   ${i + 1}. "${k}"`));
  console.log('='.repeat(80));
}
