import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cacheVersion, releaseVersion } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(pagesDir, "sandbox-dist");
const outputDir = path.join(pagesDir, "release-dist");

await rm(outputDir, { recursive: true, force: true, maxRetries: 12, retryDelay: 500 });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
const indexPath = path.join(outputDir, "index.html");
const originalHtml = await readFile(indexPath, "utf8");
const html = originalHtml
  .replace("<title>Sandbox · Météo les Tatins</title>", "<title>Météo les Tatins</title>")
  .replace('<span class="sandbox-badge" aria-label="Version de test">SANDBOX</span>', "")
  .replace('<a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions" hidden></a>', `<a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions">v${releaseVersion}</a>`);
if (html === originalHtml || /SANDBOX|sandbox-badge/.test(html)) throw new Error("Les marqueurs de sandbox n’ont pas été retirés de la page principale.");
if (!html.includes(`>v${releaseVersion}</a>`)) throw new Error("La version principale n’a pas pu être inscrite dans l’en-tête.");
if (!html.includes('<span aria-hidden="true">|</span><a href="contact/">Contact</a>')) throw new Error("Le lien Contact manque dans la version principale.");
await writeFile(indexPath, html);

const newsIndexPath = path.join(outputDir, "news", "index.html");
const originalNewsIndex = await readFile(newsIndexPath, "utf8");
if (!originalNewsIndex.includes('<span aria-hidden="true">|</span><a href="../contact/">Contact</a>')) throw new Error("Le lien Contact manque dans la page News principale.");

const stylePath = path.join(outputDir, "style.css");
const originalStyle = await readFile(stylePath, "utf8");
const style = originalStyle.replace(/\.sandbox-badge\{[^}]+\}/, "");
if (style === originalStyle || style.includes(".sandbox-badge")) throw new Error("Le style du badge sandbox n’a pas été retiré.");
await writeFile(stylePath, style);

const changelogPath = path.join(outputDir, "changelog.html");
const originalChangelog = await readFile(changelogPath, "utf8");
const changelog = originalChangelog
  .replace(/<span data-sandbox-log>[\s\S]*?<\/span>\n\n# Versions main\n\n/, "")
  .replace(/\n[^\n<]* — sandbox — [^\n<]*(?=\n|<\/pre>)/g, "");
if (changelog.includes("data-sandbox-log") || changelog.includes("# Journal des publications sandbox") || changelog.includes(" — sandbox — ")) {
  throw new Error("Le journal sandbox n'a pas pu être retiré de la version principale.");
}
await writeFile(changelogPath, changelog);

const informationStylePath = path.join(outputDir, "echelle-kilometrique.css");
const originalInformationStyle = await readFile(informationStylePath, "utf8");
const informationStyle = originalInformationStyle.replace(/\.sandbox-badge\{[^}]+\}/, "");
if (informationStyle === originalInformationStyle || informationStyle.includes(".sandbox-badge")) throw new Error("Le style About conserve le badge sandbox.");
await writeFile(informationStylePath, informationStyle);

const manifestPath = path.join(outputDir, "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.name = "Météo les Tatins";
manifest.short_name = "Les Tatins";
manifest.start_url = "/";
await writeFile(manifestPath, JSON.stringify(manifest));

const workerPath = path.join(outputDir, "service-worker.js");
const originalWorker = await readFile(workerPath, "utf8");
const worker = originalWorker
  .replace(/const cacheName = "[^"]+";/, `const cacheName = "meteo-main-v${cacheVersion}-r1";`)
  .replaceAll('"/sandbox/', '"/');
if (worker === originalWorker || worker.includes("/sandbox/")) throw new Error("Le service worker principal conserve un chemin de sandbox.");
await writeFile(workerPath, worker);

await writeFile(path.join(outputDir, "robots.txt"), "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /sandbox/\nDisallow: /testing/\nDisallow: /evenements.html\nDisallow: /evenements/\n\nSitemap: https://meteo-lestatins.github.io/sitemap.xml\n");
await writeFile(path.join(outputDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://meteo-lestatins.github.io/</loc></url>
  <url><loc>https://meteo-lestatins.github.io/about.html</loc></url>
  <url><loc>https://meteo-lestatins.github.io/news/</loc></url>
  <url><loc>https://meteo-lestatins.github.io/contact/</loc></url>
</urlset>
`);

console.log(`Version principale v${releaseVersion} préparée dans ${outputDir}`);
