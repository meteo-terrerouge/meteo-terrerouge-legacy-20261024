import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(pagesDir);
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(pagesDir, "dist");

await rm(outputDir, { recursive: true, force: true, maxRetries: 12, retryDelay: 500 });
await mkdir(outputDir, { recursive: true });
await cp(publicDir, outputDir, {
  recursive: true,
  filter(source) {
    const relative = path.relative(publicDir, source);
    return relative !== "admin"
      && !relative.startsWith(`admin${path.sep}`)
      && relative !== "evenements.html"
      && relative !== "evenements"
      && !relative.startsWith(`evenements${path.sep}`);
  }
});

await cp(path.join(pagesDir, "runtime-config.js"), path.join(outputDir, "runtime-config.js"));
const runtimePath = path.join(outputDir, "runtime-config.js");
const runtime = (await readFile(runtimePath, "utf8"))
  .replace(/releaseNumber: "[^"]+"/, `releaseNumber: "${releaseVersion}"`);
await writeFile(runtimePath, runtime);
await writeFile(path.join(outputDir, ".nojekyll"), "");

const adminTarget = "https://nicolas.sindelar.fr/meteo-les_tatins/admin/";
const adminRedirectDir = path.join(outputDir, "admin");
await mkdir(adminRedirectDir, { recursive: true });
await writeFile(path.join(adminRedirectDir, "index.html"), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; base-uri \'self\'; object-src \'none\'; frame-src \'none\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'; form-action \'self\'"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=' + adminTarget + '"><link rel="canonical" href="' + adminTarget + '"><title>Administration · Météo les Tatins</title></head><body><p>Redirection vers <a href="' + adminTarget + '">l’administration Météo les Tatins</a>…</p></body></html>');

const changelog = await readFile(path.join(rootDir, "CHANGELOG.md"), "utf8");
const normalizedChangelog = changelog
  .split(/\r?\n/)
  .map(line => line.trimEnd())
  .filter(line => line.trim())
  .join("\n");
const escapedChangelog = normalizedChangelog
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const changelogHtml = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; base-uri \'self\'; object-src \'none\'; frame-src \'none\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\' https://nicolas.sindelar.fr; form-action \'self\'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Historique des versions · Météo les Tatins</title><style>'
  + ':root{color-scheme:light dark}body{margin:0;padding:16px;overflow:auto}pre{width:max-content;min-width:100%;margin:0;white-space:pre;font:13px/1.6 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace}'
  + `</style><script src="runtime-config.js?v=${releaseVersion}" defer></script><script src="analytics.js?v=4" defer></script></head><body><pre>` + escapedChangelog + '</pre></body></html>';
await writeFile(path.join(outputDir, "changelog.html"), changelogHtml);

const indexPath = path.join(outputDir, "index.html");
const originalHtml = await readFile(indexPath, "utf8");
const withoutAdmin = originalHtml.replace(/\s*<a\b[^>]*class=["'][^"']*\badmin-access\b[^"']*["'][^>]*>.*?<\/a>/is, "");
if (withoutAdmin === originalHtml) throw new Error("Le lien d'administration n'a pas ete trouve dans index.html.");
const html = withoutAdmin.replace(
  /(<script\s+src=["']analytics\.js\?v=4["']><\/script>)/i,
  `<script src="runtime-config.js?v=${releaseVersion}"></script>\n$1`
);
if (html === withoutAdmin) throw new Error("Le point d'insertion de runtime-config.js n'a pas ete trouve.");
await writeFile(indexPath, html);

const stylePath = path.join(outputDir, "style.css");
const originalStyle = await readFile(stylePath, "utf8");
const style = originalStyle
  .split(/\r?\n/)
  .filter(line => !line.includes(".admin-access"))
  .join("\n");
await writeFile(stylePath, style);

const workerPath = path.join(outputDir, "service-worker.js");
const originalWorker = await readFile(workerPath, "utf8");
const worker = originalWorker.replace('const shell = [', `const shell = ["/runtime-config.js?v=${releaseVersion}", "/changelog.html", `);
if (worker === originalWorker) throw new Error("La liste de cache du service worker n'a pas ete trouvee.");
await writeFile(workerPath, worker);

console.log(`Site GitHub Pages prepare dans ${outputDir}`);
