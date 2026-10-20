import { realpathSync } from "node:fs";
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { siteProfile } from '../sites/profiles.mjs';
import { publicWeatherFiles } from '../weather/state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const publishedBuilds = new Map();

// This is the presentation actually published on GitHub Pages. Reuse its
// preparation rather than making another copy of its HTML/CSS/JS transforms.
async function publishedSiteAssets(version) {
  if (!publishedBuilds.has(version)) {
    const build = (async () => {
      for (const file of ['prepare-pages.mjs', 'prepare-sandbox.mjs', 'prepare-release.mjs']) {
        await run(process.execPath, [path.join(root, 'github-pages', file), `--version=${version}`], { cwd: root });
      }
      return path.join(root, 'github-pages/release-dist');
    })();
    publishedBuilds.set(version, build);
    build.catch(() => publishedBuilds.delete(version));
  }
  return publishedBuilds.get(version);
}

export async function prepareSite({ id, output, entry = {}, dataMode, releaseNumber, canonicalUrl = '' }) {
  const profile = siteProfile(id);
  if (!releaseNumber) {
    const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
    releaseNumber = [...changelog.matchAll(/— v(\d+\.\d{3}) —/g)].at(-1)?.[1];
  }
  dataMode ||= profile.features.nowcasting ? 'server' : 'static';
  if (!['server', 'static'].includes(dataMode)) throw new Error('Mode de données invalide.');
  const target = path.resolve(root, output || path.join(root, '.cache/sites', id));
  // Never clean an arbitrary user path or the source tree.
  const allowed = path.join(root, '.cache/sites') + path.sep;
  if (!target.startsWith(allowed)) throw new Error('La sortie doit se trouver dans .cache/sites/.');
  if (entry.siteId && (entry.siteId !== id || entry.latitude !== profile.latitude || entry.longitude !== profile.longitude)) throw new Error('Les données ne correspondent pas au site demandé.');
  const source = await publishedSiteAssets(releaseNumber);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, filter(filename) {
    const part = path.relative(source, filename).split(path.sep)[0];
    return !['admin', 'evenements', 'evenements.html'].includes(part)
      && (profile.features.nowcasting || !['contact', 'news'].includes(part));
  } });
  const runtime = { apiBase: dataMode === 'server' ? profile.apiBase : './', dataMode, site: profile, changelogUrl: 'changelog.html', releaseNumber };
  await writeFile(path.join(target, 'runtime-config.js'), `window.METEO_RUNTIME_CONFIG = Object.freeze(${JSON.stringify(runtime, null, 2)});\n`);
  let html = await readFile(path.join(target, 'index.html'), 'utf8');
  html = html.replace(/app\.js\?v=\d+/, `app.js?v=${releaseNumber.replaceAll('.', '')}`);
  html = html.replaceAll('Météo les Tatins', profile.name).replaceAll('Les Tatins', profile.place)
    .replace(/\s*<a\b[^>]*class="admin-access"[^>]*>.*?<\/a>/g, '')
    .replace(/<script src="analytics.js\?v=4"><\/script>/, '')
    .replace(/<script src="runtime-config.js[^\"]*"><\/script>/, `<script src="runtime-config.js?v=${releaseNumber}"></script>`);
  if (canonicalUrl) {
    const url = new URL(canonicalUrl);
    if (url.protocol !== 'https:') throw new Error('L’URL publique doit utiliser HTTPS.');
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url.href.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`);
  } else html = html.replace(/\s*<link rel="canonical"[^>]*>/, '');
  if (id !== 'tatins') html = html.replace(/\s*<meta name="google-site-verification"[^>]*>/, '');
  if (!profile.features.nowcasting) {
    html = html.replace(/<p class="header-subtitle">.*?<\/p>/, '<p class="header-subtitle">Prévisions météo Météo-France à l’échelle kilométrique</p>')
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="Prévisions météo Météo-France pour ${profile.place} : températures, pluie et vent.">`)
      .replace(/\s*<link rel="preconnect"[^>]*>/g, '')
      .replace(/<button id="horizon-nowcast-toggle"[\s\S]*?<\/button>/, '')
      .replace(/<nav class="header-info-links"[\s\S]*?<\/nav>/, '')
      .replace(/<a id="app-version"[^>]*>[\s\S]*?<\/a>/, '')
      .replaceAll('Prévisions quotidiennes sur 7 jours', 'Prévisions quotidiennes sur 4 jours');
    // Keep the same DOM identifiers used by shared charts; hide the optional map.
    html = html.replace('id="nowcast-details"', 'id="nowcast-details" data-feature="nowcasting"');
  }
  await writeFile(path.join(target, 'index.html'), html);
  if (id !== 'tatins') {
    for (const filename of ['about.html', 'architecture.svg', 'echelle-kilometrique.css', 'echelle-kilometrique.js']) {
      await rm(path.join(target, filename), { force: true });
    }
  }
  // These files otherwise retain the canonical Tatins URLs from the shared
  // Pages build. The new site's public address is not configured yet.
  if (!canonicalUrl) {
    await rm(path.join(target, 'sitemap.xml'), { force: true });
    await writeFile(path.join(target, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  }
  const manifest = JSON.parse(await readFile(path.join(target, 'manifest.webmanifest'), 'utf8'));
  Object.assign(manifest, { id: './', name: profile.name, short_name: profile.place, start_url: './', scope: './' });
  await writeFile(path.join(target, 'manifest.webmanifest'), JSON.stringify(manifest));
  await mkdir(path.join(target, 'data'), { recursive: true });
  for (const [filename, payload] of Object.entries(publicWeatherFiles(profile, entry, releaseNumber))) await writeFile(path.join(target, 'data', filename), JSON.stringify(payload));
  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  const escaped = changelog.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  await writeFile(path.join(target, 'changelog.html'), '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Historique</title><pre>' + escaped + '</pre></html>');
  const prefix = `meteo-${id}-`;
  const styleUrl = html.match(/href="(style\.css\?v=\d+)"/)?.[1];
  const appUrl = html.match(/src="(app\.js\?v=\d+)"/)?.[1];
  if (!styleUrl || !appUrl) throw new Error('Les ressources de la présentation GitHub Pages sont introuvables.');
  const shell = ['./', 'index.html', `runtime-config.js?v=${releaseNumber}`, appUrl, styleUrl, `forecast-core.js?v=${releaseNumber}`, 'nowcast/engine.js', 'nowcast/map.js', 'manifest.webmanifest'];
  const worker = `const prefix = ${JSON.stringify(prefix)};
const cacheName = prefix + ${JSON.stringify(releaseNumber)};
const shell = ${JSON.stringify(shell)}.map(p => new URL(p, self.registration.scope).href);
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(c => c.addAll(shell)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(prefix) && k !== cacheName).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url), scope = new URL(self.registration.scope);
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.pathname.includes('/api/')) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) await (await caches.open(cacheName)).put(event.request, response.clone());
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match(new URL('index.html', scope).href) : Response.error()))));
});\n`;
  await writeFile(path.join(target, 'service-worker.js'), worker);
  await writeFile(path.join(target, '.nojekyll'), '');
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const arg = (name, fallback) => process.argv.find(v => v.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
  const entry = arg('state') ? JSON.parse(await readFile(arg('state'), 'utf8')) : {};
  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  const releaseNumber = [...changelog.matchAll(/— v(\d+\.\d{3}) —/g)].at(-1)?.[1];
  console.log(await prepareSite({ id: arg('site', 'terre-rouge'), output: arg('output'), entry, dataMode: arg('data-mode'), canonicalUrl: arg('url', ''), releaseNumber }));
}
