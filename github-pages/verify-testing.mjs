import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion, sandboxBuild as testingBuild } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(pagesDir, "testing-dist");

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(absolute));
    else files.push(absolute);
  }
  return files;
}

for (const relative of ["index.html", "app.js", "style.css", "runtime-config.js", "service-worker.js", "manifest.webmanifest", "about.html", "architecture.svg", "echelle-kilometrique.css", "echelle-kilometrique.js", "pictogrammes/ciel-jour-tres-peu-nuageux.svg", "pictogrammes/calque-pluie-2.svg", "pictogrammes/calque-orage.svg", "pictogrammes/calque-grele.svg", "pictogrammes/calque-vent.svg"]) {
  await readFile(path.join(outputDir, relative));
}

const index = await readFile(path.join(outputDir, "index.html"), "utf8");
if (!index.includes("<title>Testing · Météo les Tatins</title>") || !index.includes("testing-badge") || !index.includes('href="about.html">About</a>')) {
  throw new Error("Le titre ou le badge testing manque.");
}

const liveApp = await readFile(path.join(outputDir, "app.js"), "utf8");
const engine = await readFile(path.join(outputDir, "nowcast/engine.js"), "utf8");
const mapEngine = await readFile(path.join(outputDir, "nowcast/map.js"), "utf8");
// Historical semantic checks now inspect the actual computation module too.
const app = liveApp + '\n' + engine + '\n' + mapEngine;
if (liveApp.includes('function nowcastLocalStormHazards(') || liveApp.includes('function nowcastPassageFrequencyGrid(')
  || !liveApp.includes('latestForecastData?.nowcast')) throw new Error("Le site doit utiliser les prévisions préparées par le serveur.");
if (!app.includes('url.searchParams.set("models", "ecmwf_ifs")') || app.includes('url.searchParams.set("models", "ecmwf_ifs025")')) {
  throw new Error("La prévision quotidienne Testing n’utilise pas ECMWF IFS HRES.");
}

const about = await readFile(path.join(outputDir, "about.html"), "utf8");
if (!about.includes('Nébulosité — 6 niveaux') || !about.includes('ciel-jour-tres-peu-nuageux.svg') || !about.includes('calque-pluie-2.svg') || !about.includes('calque-orage.svg') || !about.includes('calque-grele.svg') || !about.includes('calque-vent.svg') || /(?:jour-pluie-vent|jour-orage-pluie|nuit-orage-grele-vent)\.svg/.test(about)) throw new Error("Les exemples météo de l’About Testing ne sont pas composés à partir des SVG communs.");
if (!about.includes(`>v${releaseVersion}</a>`) || !about.includes('<details class="technical-details-disclosure"><summary><span>Détails techniques des API</span><span class="technical-details-toggle" aria-hidden="true">›</span></summary>') || about.includes('<details class="technical-details-disclosure" open>') || about.includes('<h2>Détails techniques des API</h2>') || !about.includes("Open-Meteo · ECMWF IFS HRES") || !about.includes("9 × 9 km") || !about.includes("actualisé toutes les 6 heures") || !about.includes("jusqu’au huitième jour") || !about.includes('combinées en <strong>« et/ou »</strong>') || !about.includes('La pluie seule est plafonnée à <strong>4/5</strong>') || !about.includes('Une durée n’est annoncée que lorsque la fin du passage est réellement connue') || !about.includes('Bordure de cellule pluvieuse') || about.includes('40 % pluie, 30 % grêle') || !about.includes('echelle-kilometrique.css?v=14') || !about.includes('echelle-kilometrique.js?v=15') || !about.includes('class="header-info-links"') || about.includes("DETAILS_TECHNIQUES_API")) {
  throw new Error("La source ECMWF IFS HRES n’est pas clairement documentée dans About Testing.");
}
const testingDisclosureEnd = about.indexOf('</details>');
const testingNowcastingHeading = about.indexOf('<h2><a href="index.html#radar-nowcast">Nowcasting</a></h2>');
if (!about.includes('</details><div class="technical-details technical-details-following"') || testingDisclosureEnd < 0 || testingNowcastingHeading < testingDisclosureEnd) throw new Error("Les chapitres About suivant les détails API restent masqués dans Testing.");
if (!about.includes('À chaque nouvelle mosaïque, environ toutes les cinq minutes') || !about.includes('La forme radar réellement détectée est conservée dans tous les calculs actifs') || !about.includes('moins de huit kilomètres du bord réel') || /rayon (?:équivalent|estimé|ancien)/i.test(about)) throw new Error("La géométrie réelle des cellules manque dans About Testing.");
for (const expected of ["0 h à 6 h le lendemain (J+1)", "Le créneau Soir couvre 18h minuit", "Sources et calculs", "sept jours", "huitième jour", "ARPEGE Météo-France", "DWD ICON-EPS", "synthèse générale Open-Meteo et le calcul de confiance écartent les heures antérieures à l’heure en cours", "Les créneaux conservent en revanche leurs plages horaires propres", "Agrégation des données horaires", "Tendance de fond par source", "Δ = m₂ − m₁", "34 points de pourcentage d’heures signalées", "Confiance générale", "convergence des modèles", "Open-Meteo ECMWF IFS HRES", "Lecture commune des couleurs météo", "Jaune — Attention", "Orange — Sérieux", "Rouge — Alerte", "0–2/5 sans couleur", "ni le rond de confiance", "forte probabilité de passage d’un orage faible reste ainsi à <strong>3/5 jaune</strong>", "décodeur OPERA <code>decbufr</code> et tables BUFR"]) {
  if (!about.includes(expected)) throw new Error(`La section Prévision semaine de l’About Testing est incomplète : ${expected}`);
}
if (about.includes("nuit de 22 h à 6 h le lendemain")) throw new Error("L’ancienne convention du créneau Nuit subsiste dans About Testing.");

const scale = await readFile(path.join(outputDir, "echelle-kilometrique.js"), "utf8");
if (!scale.includes('id: "ecmwf"') || !scale.includes('label: "Open-Meteo · ECMWF IFS HRES"') || !scale.includes('sizeLabel: "≈ 9 × 9 km"') || !scale.includes("centerLatitude: tatins.latitude") || !scale.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png') || !scale.includes('opacity: 0.42') || scale.includes('basemaps.cartocdn.com') || (scale.match(/\bid: "/g) || []).length !== 7) {
  throw new Error("La maille ECMWF IFS HRES manque sur la carte About Testing.");
}

const architecture = await readFile(path.join(outputDir, "architecture.svg"), "utf8");
if (architecture !== await readFile(path.join(pagesDir, "sandbox-grid", "architecture.svg"), "utf8") || !architecture.includes('viewBox="0 0 1120 620"') || !architecture.includes('<title id="title">') || !architecture.includes('<desc id="description">')) {
  throw new Error("Le schéma About Testing diffère du diagramme approuvé ou ses métadonnées sont incomplètes.");
}

const htmlFiles = (await filesBelow(outputDir)).filter(filename => filename.endsWith(".html"));
for (const filename of htmlFiles) {
  const html = await readFile(filename, "utf8");
  if (html.includes('name="robots"') && /content="[^"]*noindex/i.test(html)) {
    throw new Error(`${path.relative(outputDir, filename)} bloque encore son indexation.`);
  }
}

const runtime = await readFile(path.join(outputDir, "runtime-config.js"), "utf8");
if (!runtime.includes('apiBase: "https://nicolas.sindelar.fr/meteo-les_tatins/"') || !runtime.includes(`releaseNumber: "${releaseVersion}"`)) {
  throw new Error("Testing n'utilise pas l'API publique ou la version attendue.");
}

const manifest = JSON.parse(await readFile(path.join(outputDir, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "./" || manifest.name !== "Testing · Météo les Tatins") {
  throw new Error("Le manifeste testing n'est pas isolé.");
}

const worker = await readFile(path.join(outputDir, "service-worker.js"), "utf8");
if (!worker.includes('"pictogrammes"')) throw new Error("Le dossier commun des pictogrammes météo n’est pas géré par le cache Testing.");
if (!worker.includes(`const cacheName = "meteo-testing-b${testingBuild}";`) || !worker.includes('"/testing/') || !worker.includes('"/testing/about.html"') || !worker.includes('"/testing/architecture.svg"') || !worker.includes('echelle-kilometrique.js?v=15') || worker.includes('"/sandbox/') || worker.includes('"/interface/')) {
  throw new Error("Le cache testing n'est pas isolé de main et de la sandbox.");
}

const adminEntries = await readdir(path.join(outputDir, "admin"));
if (adminEntries.length !== 1 || adminEntries[0] !== "index.html") {
  throw new Error("Testing expose des fichiers d'administration.");
}

console.log("Vérification testing terminée : répertoire, cache et administration isolés.");
