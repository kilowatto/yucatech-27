/**
 * Genera images/manifest.json escaneando la carpeta images/.
 * Cloudflare Pages lo corre automáticamente en cada deploy
 * (build command: node generate-manifest.js).
 * También puedes correrlo manualmente antes de un push:
 *   node generate-manifest.js
 */

const fs   = require('fs');
const path = require('path');

const IMAGES_DIR   = path.join(__dirname, 'images');
const MANIFEST_OUT = path.join(IMAGES_DIR, 'manifest.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi']);

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('  Carpeta images/ creada.');
}

const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

const files = entries
  .filter(e => e.isFile())
  .map(e => e.name)
  .filter(name => {
    const ext = path.extname(name).toLowerCase();
    return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext);
  })
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(name => ({
    name,
    url:  `/images/${encodeURIComponent(name)}`,
    type: VIDEO_EXTS.has(path.extname(name).toLowerCase()) ? 'video' : 'image',
  }));

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(files, null, 2));

console.log(`  manifest.json generado: ${files.length} archivos`);
console.log(`  ${files.filter(f => f.type === 'image').length} fotos · ${files.filter(f => f.type === 'video').length} videos`);
