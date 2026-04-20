/**
 * Script de build para Cloudflare Workers.
 * Copia los archivos necesarios a dist/ y genera el manifest de la galería.
 *
 * Build command en Cloudflare: node build.js
 * Deploy command:              npx wrangler deploy
 */

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi']);

// ── 1. Limpiar y crear dist/ ────────────────────────────────────────────────
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ── 2. Copiar archivos estáticos ─────────────────────────────────────────────
for (const file of ['index.html', 'colors_and_type.css']) {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}

// ── 3. Copiar directorios ────────────────────────────────────────────────────
for (const dir of ['assets', 'fonts', 'images']) {
  copyDir(path.join(ROOT, dir), path.join(DIST, dir));
}

// ── 4. Generar manifest de galería en dist/images/ ───────────────────────────
const imagesDir = path.join(DIST, 'images');
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir, { withFileTypes: true })
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

  fs.writeFileSync(path.join(imagesDir, 'manifest.json'), JSON.stringify(files, null, 2));
  console.log(`  manifest.json: ${files.length} archivos · ${files.filter(f => f.type === 'image').length} fotos · ${files.filter(f => f.type === 'video').length} videos`);
}

console.log('  Build completo → dist/');

// ── Utilidad ─────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
