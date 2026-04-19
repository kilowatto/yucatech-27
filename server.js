/**
 * Yucatech Gallery — servidor local
 * Sin dependencias externas. Solo Node.js.
 *
 * Uso:  node server.js
 * URL:  http://localhost:3000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT       = 3000;
const ROOT       = __dirname;
const IMAGES_DIR = path.join(ROOT, 'images');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.webm': 'video/webm',
  '.m4v':  'video/x-m4v',
  '.avi':  'video/x-msvideo',
  '.otf':  'font/otf',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi']);

// Ensure images folder exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── /gallery-files — dynamic directory listing ──────────────────────────
  if (req.url === '/gallery-files') {
    try {
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── Static file server ───────────────────────────────────────────────────
  let urlPath = req.url.split('?')[0];
  try { urlPath = decodeURIComponent(urlPath); } catch (_) {}
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));

  // Security: block path traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : err.message);
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n  Yucatech Gallery Server');
  console.log('  ───────────────────────────────────');
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  Fotos:   pon imágenes/videos en  →  images/`);
  console.log('  ───────────────────────────────────\n');
});
