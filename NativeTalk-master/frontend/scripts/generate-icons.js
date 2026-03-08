import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgBuffer = readFileSync(join(__dirname, '../public/icon.svg'));

// Gerar ícones em diferentes tamanhos
const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(__dirname, `../public/pwa-${size}x${size}.png`));
    
    console.log(`✅ Gerado: pwa-${size}x${size}.png`);
  }
  
  // Gerar apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(__dirname, '../public/apple-touch-icon.png'));
  
  console.log('✅ Gerado: apple-touch-icon.png');
  
  // Gerar favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));
  
  console.log('✅ Gerado: favicon.png');
}

generateIcons().catch(console.error);
