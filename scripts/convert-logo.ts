import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function convertLogo() {
  try {
    await sharp(join(projectRoot, 'attached_assets/logo-optimized.webp'))
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(join(projectRoot, 'resources/logo.png'));
    
    console.log('✅ Logo converted successfully to resources/logo.png');
  } catch (error) {
    console.error('❌ Error converting logo:', error);
    process.exit(1);
  }
}

convertLogo();
