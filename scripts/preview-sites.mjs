import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.cache/sites');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const port = Number(process.env.PREVIEW_PORT || 4174);
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
    const filename = (await stat(target)).isDirectory() ? path.join(target, 'index.html') : target;
    const content = await readFile(filename);
    res.writeHead(200, { 'content-type': types[path.extname(filename)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Ressource absente'); }
}).listen(port, '127.0.0.1', () => console.log(`Terre Rouge : http://127.0.0.1:${port}/terre-rouge/\nTatins : http://127.0.0.1:${port}/tatins/`));
