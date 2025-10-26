import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsDir = join(__dirname, '../attached_assets');
const outputDir = join(__dirname, '../attached_assets/optimized');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function optimizeImage(inputPath, outputName, maxWidth, quality = 85) {
  const outputPath = join(outputDir, outputName);
  
  console.log(`Optimizing ${inputPath} -> ${outputName}`);
  
  await sharp(inputPath)
    .resize(maxWidth, null, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ quality })
    .toFile(outputPath);
  
  const stats = await sharp(outputPath).metadata();
  const size = (stats.size / 1024).toFixed(2);
  console.log(`✓ Created ${outputName} (${stats.width}x${stats.height}, ${size} KB)`);
}

async function optimizeLogo(inputPath, outputName, size, quality = 90) {
  const outputPath = join(outputDir, outputName);
  
  console.log(`Optimizing logo ${inputPath} -> ${outputName}`);
  
  await sharp(inputPath)
    .resize(size, size, { fit: 'contain' })
    .webp({ quality })
    .toFile(outputPath);
  
  const stats = await sharp(outputPath).metadata();
  const fileSize = (stats.size / 1024).toFixed(2);
  console.log(`✓ Created ${outputName} (${stats.width}x${stats.height}, ${fileSize} KB)`);
}

async function main() {
  try {
    console.log('🎨 Starting image optimization...\n');
    
    // Optimize background images
    await optimizeImage(
      join(assetsDir, 'eco-bg-wide.png'),
      'eco-bg-wide.webp',
      1920,
      80
    );
    
    await optimizeImage(
      join(assetsDir, 'eco-mobile-bg.png'),
      'eco-mobile-bg.webp',
      768,
      80
    );
    
    // Logo is already optimized at 171KB WebP, but let's ensure it's optimal
    if (existsSync(join(assetsDir, 'logo-optimized.webp'))) {
      await optimizeLogo(
        join(assetsDir, 'logo-optimized.webp'),
        'logo.webp',
        128,
        90
      );
    }
    
    console.log('\n✅ Image optimization complete!');
    console.log(`Optimized images saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

main();
