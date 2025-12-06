/**
 * Script para actualizar memoryCache.ts con el FAQ completo que incluye variaciones
 */

import * as fs from 'fs';
import * as path from 'path';

// Leer el FAQ desde el archivo
const faqPath = path.join(process.cwd(), 'Cache', 'faq_parroquial.json');
const memoryCachePath = path.join(process.cwd(), 'backend', 'app', 'api', 'chat', 'utils', 'memoryCache.ts');

console.log('📖 Leyendo FAQ desde:', faqPath);
const faqData = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));

console.log(`✅ FAQ cargado con ${faqData.length} preguntas`);

// Leer el archivo actual de memoryCache
const currentCache = fs.readFileSync(memoryCachePath, 'utf-8');

// Generar el array de FAQ_DATA como string
const faqDataString = JSON.stringify(faqData, null, 6);

// Reemplazar la sección FAQ_DATA en el archivo
const updatedCache = currentCache.replace(
  /const FAQ_DATA = \[[\s\S]*?\];/,
  `const FAQ_DATA = ${faqDataString};`
);

// Escribir el archivo actualizado
fs.writeFileSync(memoryCachePath, updatedCache, 'utf-8');

console.log('✅ memoryCache.ts actualizado con FAQ completo incluyendo variaciones');
console.log(`📊 Total de entradas: ${faqData.length} preguntas`);

// Contar total de variaciones
let totalVariations = 0;
for (const item of faqData) {
  if (item.variations) {
    totalVariations += item.variations.length;
  }
}

console.log(`📊 Total de variaciones: ${totalVariations}`);
console.log(`📊 Total de entradas en cache: ${faqData.length + totalVariations} (preguntas + variaciones)`);
console.log('\n✨ Script completado!');
