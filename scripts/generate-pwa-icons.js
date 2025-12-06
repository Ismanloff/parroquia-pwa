/**
 * Script para generar iconos PWA en diferentes tamaños
 *
 * Usa sharp para redimensionar el icono base
 * Si no tienes sharp: npm install --save-dev sharp
 *
 * USO: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Tamaños necesarios para PWA
const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

const INPUT_ICON = path.join(__dirname, '../assets/images/icon.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generando iconos PWA...\n');

  try {
    // Intentar usar sharp
    const sharp = require('sharp');

    // Verificar que existe el icono de entrada
    if (!fs.existsSync(INPUT_ICON)) {
      console.error(`❌ No se encontró el icono: ${INPUT_ICON}`);
      process.exit(1);
    }

    // Crear directorio de salida si no existe
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generar cada tamaño
    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      await sharp(INPUT_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generado: icon-${size}x${size}.png`);
    }

    console.log('\n🎉 ¡Todos los iconos generados exitosamente!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ sharp no está instalado.\n');
      console.log('Opción 1: Instalar sharp:');
      console.log('  npm install --save-dev sharp\n');
      console.log('Opción 2: Usar herramienta online:');
      console.log('  1. Ve a: https://realfavicongenerator.net/');
      console.log('  2. Sube: assets/images/icon.png');
      console.log('  3. Genera iconos PWA');
      console.log('  4. Descarga y extrae en: public/icons/\n');
      console.log('Opción 3: Usar script alternativo sin dependencias (ver más abajo)\n');

      // Crear script alternativo usando jimp (más ligero)
      createAlternativeScript();
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

function createAlternativeScript() {
  const alternativeScript = `
/**
 * Script alternativo usando jimp (más ligero que sharp)
 *
 * Instalar: npm install --save-dev jimp
 * Usar: node scripts/generate-icons-jimp.js
 */

const Jimp = require('jimp');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const INPUT = path.join(__dirname, '../assets/images/icon.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generate() {
  const image = await Jimp.read(INPUT);

  for (const size of SIZES) {
    await image
      .clone()
      .resize(size, size)
      .writeAsync(path.join(OUTPUT_DIR, \`icon-\${size}x\${size}.png\`));

    console.log(\`✅ icon-\${size}x\${size}.png\`);
  }

  console.log('🎉 Listo!');
}

generate().catch(console.error);
`;

  const scriptPath = path.join(__dirname, 'generate-icons-jimp.js');
  fs.writeFileSync(scriptPath, alternativeScript.trim());
  console.log(`\n📝 Script alternativo creado: ${scriptPath}`);
}

// Ejecutar
generateIcons();
