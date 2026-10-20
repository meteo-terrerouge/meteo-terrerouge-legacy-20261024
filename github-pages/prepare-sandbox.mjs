import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion, sandboxBuild } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(pagesDir, "dist");
const outputDir = path.join(pagesDir, "sandbox-dist");
const gridPageDir = path.join(pagesDir, "sandbox-grid");

const escapeMarkdownHtml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const wrapTechnicalPictogramStacks = html => html.replace(
  /(?:<img class="technical-inline-image"[^>]*>){2,}/g,
  images => `<span class="technical-pictogram-stack">${images}</span>`
);
const renderMarkdownInline = value => wrapTechnicalPictogramStacks(escapeMarkdownHtml(value)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="technical-inline-image" src="$2" alt="$1" loading="lazy">')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'));
const markdownTableCells = line => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
const isMarkdownBlock = (line, next = "") => !line.trim()
  || /^#{1,6}\s+/.test(line)
  || /^!\[[^\]]*\]\([^)]+\)\s*$/.test(line)
  || /^```/.test(line)
  || /^[-*]\s+/.test(line)
  || /^\d+\.\s+/.test(line)
  || (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(next));
function renderTechnicalMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let index = 0;
  let chapterOpen = false;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (image) {
      html.push('<figure class="technical-figure"><img src="' + escapeMarkdownHtml(image[2]) + '" alt="' + escapeMarkdownHtml(image[1]) + '" loading="lazy"></figure>');
      index += 1;
      continue;
    }
    const fence = line.match(/^```([^\s]*)/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
      index += 1;
      html.push('<pre class="technical-diagram"><code class="language-' + escapeMarkdownHtml(fence[1] || "text") + '">' + escapeMarkdownHtml(code.join("\n")) + "</code></pre>");
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1);
      const anchor = heading[2].match(/\s+\{#([a-z0-9-]+)\}\s*$/i);
      const headingText = anchor ? heading[2].slice(0, anchor.index) : heading[2];
      if (heading[1].length === 1) {
        if (chapterOpen) html.push("</section>");
        html.push('<section class="technical-chapter">');
        chapterOpen = true;
      }
      html.push(`<h${level}${anchor ? ` id="${anchor[1]}"` : ""}>${renderMarkdownInline(headingText)}</h${level}>`);
      index += 1;
      continue;
    }
    if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || "")) {
      const headers = markdownTableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(markdownTableCells(lines[index++]));
      html.push('<div class="technical-table-scroll"><table><thead><tr>' + headers.map(cell => `<th>${renderMarkdownInline(cell)}</th>`).join("") + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(cell => `<td>${renderMarkdownInline(cell)}</td>`).join("") + '</tr>').join("") + "</tbody></table></div>");
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*]\s+/, ""));
      html.push("<ul>" + items.map(item => `<li>${renderMarkdownInline(item)}</li>`).join("") + "</ul>");
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s+/, ""));
      html.push("<ol>" + items.map(item => `<li>${renderMarkdownInline(item)}</li>`).join("") + "</ol>");
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isMarkdownBlock(lines[index], lines[index + 1] || "")) paragraph.push(lines[index++].trim());
    html.push(`<p>${renderMarkdownInline(paragraph.join(" "))}</p>`);
  }
  if (chapterOpen) html.push("</section>");
  return html.join("\n");
}

await rm(outputDir, { recursive: true, force: true, maxRetries: 12, retryDelay: 500 });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
for (const filename of ["about.html", "architecture.svg", "echelle-kilometrique.css", "echelle-kilometrique.js"]) {
  await cp(path.join(gridPageDir, filename), path.join(outputDir, filename), { recursive: true });
}
const aboutPath = path.join(outputDir, "about.html");
const aboutTemplate = await readFile(aboutPath, "utf8");
const technicalMarkdown = await readFile(path.join(gridPageDir, "details-techniques-api.md"), "utf8");
const renderedTechnicalDetails = renderTechnicalMarkdown(technicalMarkdown);
const firstTechnicalChapterEnd = renderedTechnicalDetails.indexOf("</section>") + "</section>".length;
if (firstTechnicalChapterEnd < "</section>".length) throw new Error("Le premier chapitre technique est introuvable.");
const apiTechnicalChapter = renderedTechnicalDetails.slice(0, firstTechnicalChapterEnd)
  .replace("<h2>Détails techniques des API</h2>", "");
const followingTechnicalChapters = renderedTechnicalDetails.slice(firstTechnicalChapterEnd);
const technicalDetails = '<details class="technical-details-disclosure"><summary><span>Détails techniques des API</span><span class="technical-details-toggle" aria-hidden="true">›</span></summary><div class="technical-details" aria-label="Détails techniques des API">' + apiTechnicalChapter + '</div></details><div class="technical-details technical-details-following" aria-label="Informations complémentaires">' + followingTechnicalChapters + "</div>";
if (!aboutTemplate.includes("<!-- DETAILS_TECHNIQUES_API -->")) throw new Error("L’emplacement des détails techniques manque dans about.html.");
const about = aboutTemplate
  .replace("<!-- DETAILS_TECHNIQUES_API -->", technicalDetails)
  .replace(/(<a class="app-version"[^>]*>)v\d+\.\d{3}(<\/a>)/, `$1v${releaseVersion}$2`);
if (!about.includes(`>v${releaseVersion}</a>`)) throw new Error("La version de la page About n’a pas pu être actualisée.");
await writeFile(aboutPath, about);

const indexPath = path.join(outputDir, "index.html");
const originalHtml = await readFile(indexPath, "utf8");
const html = originalHtml
  .replace('<h2 id="three-hour-title">Dans les 3 h</h2>', '<h2 id="three-hour-title">Dans les 3 h</h2><button id="horizon-nowcast-toggle" type="button" aria-controls="nowcast-details" aria-expanded="false"><span>Carte radar</span><img src="pictogrammes/carte-radar.png?v=2" width="36" height="36" alt=""></button>')
  .replace('<div id="now-chart"', '<div class="horizon-detail-scroll"><div class="horizon-detail-track"><div id="now-chart"')
  .replace('<div id="rain-axis" class="rain-axis" aria-label="Heures des précipitations"></div>', '<div id="rain-axis" class="rain-axis" aria-label="Heures des précipitations"></div></div></div>')
  .replace("<title>Météo les Tatins</title>", "<title>Sandbox · Météo les Tatins</title>")
  .replace(/style\.css\?v=\d+/, 'style.css?v=175')
  .replace(/app\.js\?v=\d+/, 'app.js?v=241')
  .replace('Prévisions météo via API publiques et <a', 'Prévisions météo à l’échelle kilométrique via API publiques et <a')
  .replace('à l’échelle kilométrique via API publiques', 'à l’<a class="kilometric-scale-link" href="about.html">échelle kilométrique</a> via API publiques')
  .replace('<a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions" hidden></a>', '<nav class="header-info-links" aria-label="Pages d’information"><a href="news/">News</a><span aria-hidden="true">|</span><a href="about.html">About</a><span aria-hidden="true">|</span><a href="contact/">Contact</a></nav><a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions" hidden></a>')
  .replace("<body>", '<body><span class="sandbox-badge" aria-label="Version de test">SANDBOX</span>');
if (html === originalHtml) throw new Error("Le marquage de la sandbox n'a pas pu être ajouté.");
await writeFile(indexPath, html);

const contactIndexPath = path.join(outputDir, "contact", "index.html");
const originalContactIndex = await readFile(contactIndexPath, "utf8");
const contactIndex = originalContactIndex.replace(/\.\.\/style\.css\?v=\d+/, "../style.css?v=175");
if (contactIndex === originalContactIndex) throw new Error("La feuille de style partagée de la page Contact n'a pas pu être renouvelée.");
await writeFile(contactIndexPath, contactIndex);

const changelogPath = path.join(outputDir, "changelog.html");
const originalChangelog = await readFile(changelogPath, "utf8");
const sandboxLog = await readFile(path.join(path.dirname(pagesDir), "SANDBOX-CHANGELOG.md"), "utf8");
const pendingSandboxLog = sandboxLog
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => / — sandbox — /.test(line))
  .join("\n");
const escapedPendingSandboxLog = pendingSandboxLog
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const pendingSandboxSuffix = escapedPendingSandboxLog ? "\n" + escapedPendingSandboxLog : "";
const changelog = originalChangelog
  .replace(/<style>[\s\S]*?<\/style>/, '<style>:root{color-scheme:light;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#242424;background:#fff}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff}.site-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 28px 12px;border-bottom:1px solid #d4d4d4}.site-header h1{margin:0;font-size:38px;line-height:1;letter-spacing:-.03em}.site-header h1 a{color:#242424;text-decoration:none}.header-subtitle{margin:7px 0 0;color:#e99512;font-size:15px;font-weight:850;letter-spacing:.02em}.header-subtitle a{color:inherit;text-underline-offset:3px}.app-version{margin-top:45px;color:#8a969c;font-size:10px;font-weight:700;line-height:1;text-decoration:none}.changelog-main{padding:22px 28px;overflow:auto}.changelog-main pre{width:max-content;min-width:100%;margin:0;white-space:pre;font:13px/1.6 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace}@media(max-width:760px){.site-header{padding:16px 16px 10px}.site-header h1{font-size:31px}.header-subtitle{margin-bottom:10px;font-size:10px}.app-version{margin-top:38px}.changelog-main{padding:16px}}</style>')
  .replace('<body><pre>', `<body><header class="site-header"><div><h1><a href="index.html">Météo les Tatins</a></h1><p class="header-subtitle">Prévisions météo à l’échelle kilométrique via API publiques et <a href="index.html#radar-nowcast">nowcasting</a></p></div><a class="app-version" href="changelog.html">v${releaseVersion}</a></header><main class="changelog-main"><pre>`)
  .replace('</pre></body>', pendingSandboxSuffix + '</pre></main></body>');
if (changelog === originalChangelog || !changelog.includes('class="site-header"')) throw new Error("L’en-tête du changelog n’a pas pu être ajouté à la sandbox.");
await writeFile(changelogPath, changelog);

const stylePath = path.join(outputDir, "style.css");
const style = await readFile(stylePath, "utf8");
await writeFile(stylePath, style + '\n.sandbox-badge{position:fixed;right:8px;bottom:8px;z-index:9999;padding:4px 7px;border-radius:6px;color:#fff;background:#7b4db3;font:800 9px system-ui;letter-spacing:.08em;box-shadow:0 2px 7px rgba(41,25,62,.22)}.header-meta{gap:7px;margin-top:0}.header-info-links{display:flex;min-height:32px;align-items:center;gap:6px;color:#a0a8ac;font-size:14px;font-weight:750;line-height:1}.header-info-links a{color:#6f7f87;text-decoration:none}.header-info-links a:hover{color:#397a9e;text-decoration:underline}@media(max-width:760px){.header-info-links{min-height:28px;font-size:12px}}\n');

const basemapStyle = await readFile(stylePath, "utf8");
await writeFile(stylePath, basemapStyle
  + '\n.nowcast-map-attribution{position:absolute;left:50%;bottom:3px;z-index:3;transform:translateX(-50%);padding:1px 4px;border-radius:3px;color:#61737d;background:rgba(255,255,255,.72);font:600 7px system-ui;white-space:nowrap}.nowcast-map-attribution a{color:inherit;text-decoration:none}\n');

const targetLabelStyle = await readFile(stylePath, "utf8");
await writeFile(stylePath, targetLabelStyle
  + '\n.nowcast-map-column .target-point text{font-size:9px!important;font-weight:800}\n');

const appPath = path.join(outputDir, "app.js");
const originalApp = (await readFile(appPath, "utf8")).replace(/\r\n?/g, "\n");
const app = originalApp
  .replace('function bindHeaderNowcastLink() {', 'function bindHeaderNowcastLink() {\n  $("horizon-nowcast-toggle")?.addEventListener("click", () => setNowcastOpen($("nowcast-details").hidden));')
  .replace('  titleToggle?.setAttribute("aria-expanded", String(open));', '  titleToggle?.setAttribute("aria-expanded", String(open));\n  $("horizon-nowcast-toggle")?.setAttribute("aria-expanded", String(open));')
  .replace('const slotTime = hourFormat.format(slotTimes[index]);', 'const slotTime = hourFormat.format(new Date(slotIntervals[index].start)) + "–" + hourFormat.format(new Date(slotIntervals[index].end));')
  .replace('const values = isTimedForecast ? piaf.values : piafQuarterHourRain(piaf, radar);', 'const values = isTimedForecast ? piaf.values : piafQuarterHourRain(piaf, radar).filter(item => item.intervalEnd > appNow());')
  .replace('  $("rain-bars").innerHTML = slices + aversePeriods + cellPeriods + noRainPeriod;', '  sandboxSyncRainDetails(slotIntervals);\n  $("rain-bars").innerHTML = slices + aversePeriods + cellPeriods + noRainPeriod;')
  .replace('        if (!details) return;', '        if (button.dataset.summaryTarget === "rain" && button.closest(".horizon-scroll")) { sandboxToggleRainDetails(); return; }\n        if (!details) return;')
  .replace('    initializeThreeHourMessageSequence(summaryElement);', '    initializeThreeHourMessageSequence(summaryElement);\n    summaryElement.querySelector(".horizon-scroll")?.addEventListener("click", event => { if (!event.target.closest("button")) sandboxToggleRainDetails(); });\n    sandboxBindRainScroll();')
  .replaceAll('const width = window.matchMedia("(max-width: 600px)").matches ? 360 : 640;\n  const height = 360;', 'const { width, height } = sandboxNowcastDimensions();')

  .replace('summaryElement.innerHTML = cycleLabel + generalExpertise;', "summaryElement.innerHTML = sandboxThreeHourTimeline(forecast.timelineSlots, now, forecast.ongoingStorm);\n    if (cycleLabel) summaryElement.insertAdjacentHTML('afterbegin', cycleLabel);")
  .replace('releaseNumber = String(config.releaseNumber || "");', 'releaseNumber = String(runtimeConfig.releaseNumber || config.releaseNumber || "");')
  .replace('  }).setView([point.lat, point.lon], mapRadiusKm === 20 ? 9 : 7);', '  }).setView([point.lat, point.lon], mapRadiusKm === 20 ? 9 : 7);\n  window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, opacity: 0.62, attribution: "" }).addTo(nowcastLeafletMap);')
  .replaceAll('<div class="storm-map"><div class="storm-map-leaflet" aria-hidden="true"></div>', '<div class="storm-map"><div class="storm-map-leaflet" aria-hidden="true"></div><div class="nowcast-map-attribution"><a href="https://www.esri.com/" target="_blank" rel="noopener">Fond © Esri</a></div>');
const routedApp = app.replace('bindHeaderNowcastLink();\nregisterServiceWorker();\nrenderAppVersion();', 'bindHeaderNowcastLink();\nregisterServiceWorker();\nif (window.location.hash === "#radar-nowcast") {\n  const nowcastDetails = $("nowcast-details");\n  if (nowcastDetails) {\n    nowcastDetails.hidden = false;\n    $("header-nowcast-link")?.setAttribute("aria-expanded", "true");\n    $("nowcast-title-toggle")?.setAttribute("aria-expanded", "true");\n    requestAnimationFrame(() => $("radar-nowcast")?.scrollIntoView({ block: "start" }));\n  }\n}\nrenderAppVersion();');
if (routedApp === originalApp
  || routedApp.includes("compactDesktopMap")
  || !routedApp.includes('const { width, height } = sandboxNowcastDimensions();')

  || !routedApp.includes("World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}")
  || routedApp.includes("tiles.openfreemap.org")
  || routedApp.includes("basemaps.cartocdn.com")
  || !routedApp.includes('window.location.hash === "#radar-nowcast"')
  || !routedApp.includes("nowcast-cell-map-overlay")
  || !routedApp.includes("data-nowcast-cell-trigger")
  || !routedApp.includes("initializeNowcastCellOverlays")
  || !routedApp.includes("nowcastCellOverlayPlacement")) {
  throw new Error("La carte compacte ou la surimpression commune des cellules n'a pas pu être générée dans la sandbox.");
}
await writeFile(appPath, routedApp + '\n' + await readFile(path.join(pagesDir, 'three-hour-timeline.js'), 'utf8'));
await writeFile(stylePath, await readFile(stylePath, 'utf8') + '\n' + await readFile(path.join(pagesDir, 'three-hour-timeline.css'), 'utf8') + await readFile(path.join(pagesDir, 'nowcast-layout.css'), 'utf8'));

const manifestPath = path.join(outputDir, "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.name = "Sandbox · Météo les Tatins";
manifest.start_url = "./";
await writeFile(manifestPath, JSON.stringify(manifest));

const workerPath = path.join(outputDir, "service-worker.js");
const worker = (await readFile(workerPath, "utf8"))
  .replace(/const cacheName = "[^"]+";/, `const cacheName = "meteo-sandbox-b${sandboxBuild}";`)
  .replace('const shell = [', 'const shell = ["/pictogrammes/carte-radar.png?v=2", "/about.html", "/architecture.svg", "/echelle-kilometrique.css?v=14", "/echelle-kilometrique.js?v=15", ')
  .replace(/style\.css\?v=\d+/, 'style.css?v=175')
  .replace(/app\.js\?v=\d+/, 'app.js?v=241')
  .replaceAll('"/', '"/sandbox/')
  .replace('relativePath.split("/sandbox/", 1)', 'relativePath.split("/", 1)');
await writeFile(workerPath, worker);

console.log(`Sandbox GitHub Pages préparée dans ${outputDir}`);
