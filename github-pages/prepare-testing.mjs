import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderTechnicalMarkdown } from "./render-technical-markdown.mjs";
import { releaseVersion, sandboxBuild as testingBuild } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(pagesDir, "dist");
const outputDir = path.join(pagesDir, "testing-dist");
const aboutSourceDir = path.join(pagesDir, "sandbox-grid");

async function resetOutputDirectory(directory) {
  try {
    await rm(directory, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
  } catch (error) {
    if (!error || !["EBUSY", "EPERM"].includes(error.code)) throw error;
    await mkdir(directory, { recursive: true });
    for (const entry of await readdir(directory)) {
      await rm(path.join(directory, entry), { recursive: true, force: true, maxRetries: 4, retryDelay: 200 });
    }
  }
}

await resetOutputDirectory(outputDir);
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
for (const filename of ["about.html", "architecture.svg", "echelle-kilometrique.css", "echelle-kilometrique.js"]) {
  await cp(path.join(aboutSourceDir, filename), path.join(outputDir, filename), { recursive: true });
}

const aboutPath = path.join(outputDir, "about.html");
const aboutTemplate = await readFile(aboutPath, "utf8");
const technicalMarkdown = await readFile(path.join(aboutSourceDir, "details-techniques-api.md"), "utf8");
const openMeteoSection = `## [Open-Meteo · ECMWF IFS HRES](https://open-meteo.com/en/docs/ecmwf-api) {#api-open-meteo}

- API JSON sans clé.
- Pour la prévision quotidienne et la frise 48 h de Testing, le modèle demandé est **ECMWF IFS HRES**, sur sa maille native d’environ **9 × 9 km**, afin de conserver un même scénario homogène.
- Le modèle est actualisé toutes les 6 heures. Sa résolution temporelle native est horaire jusqu’à 90 heures, puis de 3 heures jusqu’à 144 heures et de 6 heures ensuite ; Open-Meteo interpole ces échéances pour fournir la série horaire utilisée par l’interface.
- Données demandées : température, précipitations, probabilité de pluie, code météo, nébulosité, vent, rafales, lever et coucher du soleil.
- Les codes météo 95 à 99 fournissent le signal orageux Open-Meteo utilisé dans les frises et la synthèse.
- Les quatre premiers jours sont corroborés avec la prévision Météo-France ARPEGE ; IFS HRES reste la source homogène jusqu’au huitième jour.
- Le repère saisonnier des températures est une table locale générée à partir de la réanalyse ERA5-Land 1991–2020 : chaque heure prévue est comparée à la médiane de la même heure dans une fenêtre climatologique de 15 jours.
- Fuseau demandé : \`Europe/Paris\`.
- Le choix IFS HRES concerne la prévision quotidienne et la frise 48 h de Testing.
`;
const weekForecastSection = `# Prévision semaine

Dans la carte du jour J, **Nuit** correspond aux heures de **0 h à 6 h le lendemain (J+1)**. Le créneau Soir couvre 18h minuit.

## Sources et calculs

- **ECMWF IFS HRES**, obtenu par Open-Meteo, fournit le scénario horaire de référence sur sept jours. Les premières heures du huitième jour sont aussi demandées afin de calculer la dernière nuit.
- **ARPEGE Météo-France** sert de comparaison sur les quatre premiers jours.
- Après la fin d’AROME et de PE-AROME, les échéances ARPEGE déjà acquises au pas de trois heures alimentent les détails des créneaux sans appel API supplémentaire. ARPEGE étant déterministe, aucune probabilité de pluie par créneau n’est déduite de ses cumuls.
- La dispersion de **DWD ICON-EPS** complète l’estimation de l’incertitude lorsque la comparaison avec ARPEGE n’est pas disponible.

Dans chaque créneau, les températures sont les extrêmes horaires, la pluie est cumulée, la probabilité de précipitations conserve son maximum, la nébulosité est moyennée, et le vent ainsi que les rafales conservent leur maximum. La direction du vent est une moyenne circulaire. Pour Aujourd’hui, la synthèse générale Open-Meteo et le calcul de confiance écartent les heures antérieures à l’heure en cours ; les créneaux conservent leurs plages horaires propres.

## Confiance générale

Le rond placé dans le bandeau de chaque journée résume la confiance générale par une couleur verte, jaune, orange ou rouge. Au survol ou au clavier, trois lignes sur cinq détaillent séparément la **convergence des modèles**, l’**évolution des prévisions** et la **confiance**.

Lorsque les données ARPEGE sont disponibles, le score privilégie l’accord ECMWF–ARPEGE et tient aussi compte de la stabilité des ensembles et de l’évolution récente. Un désaccord important sur la pluie ou l’orage limite volontairement le niveau affiché. Sinon, la dispersion ICON-EPS sert d’indication d’incertitude.

## Risque orageux semaine

La graduation repose sur les deux signaux orageux prévisionnels disponibles, **Open-Meteo ECMWF IFS HRES** et Météo-France. La ligne Orage croise les codes 95 à 99 d’ECMWF IFS HRES avec le signal convectif Météo-France. Sans signal, elle reste à 0/5. Avec un signal, le niveau dépend de la proximité de l’échéance, de l’accord entre les sources et des apparitions ou disparitions observées dans les prévisions récentes. Les détails précisent toujours la ou les sources à l’origine du signal ; un code 96 à 99 est qualifié de phénomène violent possible.
`;
const testingOpenMeteoMarkdown = technicalMarkdown.includes("## [Open-Meteo · ECMWF IFS HRES]")
  ? technicalMarkdown
  : technicalMarkdown.replace(
    /## \[Open-Meteo\][\s\S]*?(?=\n## Cache et fréquence d’actualisation)/,
    openMeteoSection
  );
if (!testingOpenMeteoMarkdown.includes("## [Open-Meteo · ECMWF IFS HRES]")) throw new Error("Le chapitre Open-Meteo de l’About Testing n’a pas pu être adapté.");
const testingTechnicalMarkdown = testingOpenMeteoMarkdown.includes("**DWD ICON-EPS**")
  ? testingOpenMeteoMarkdown
  : testingOpenMeteoMarkdown.replace(
    /# Prévision semaine[\s\S]*?(?=\n# Techniques \/ Sécurité \/ Confidentialité)/,
    weekForecastSection
  );
if (!testingTechnicalMarkdown.includes("**DWD ICON-EPS**")) throw new Error("Le chapitre Prévision semaine de l’About Testing n’a pas pu être adapté.");
const renderedTechnicalDetails = renderTechnicalMarkdown(testingTechnicalMarkdown);
const firstTechnicalChapterEnd = renderedTechnicalDetails.indexOf("</section>") + "</section>".length;
if (firstTechnicalChapterEnd < "</section>".length) throw new Error("Le premier chapitre technique est introuvable.");
const apiTechnicalChapter = renderedTechnicalDetails.slice(0, firstTechnicalChapterEnd)
  .replace("<h2>Détails techniques des API</h2>", "");
const followingTechnicalChapters = renderedTechnicalDetails.slice(firstTechnicalChapterEnd);
const technicalDetails = '<details class="technical-details-disclosure"><summary><span>Détails techniques des API</span><span class="technical-details-toggle" aria-hidden="true">›</span></summary><div class="technical-details" aria-label="Détails techniques des API">' + apiTechnicalChapter + '</div></details><div class="technical-details technical-details-following" aria-label="Informations complémentaires">' + followingTechnicalChapters + "</div>";
const about = aboutTemplate
  .replace("<!-- DETAILS_TECHNIQUES_API -->", technicalDetails)
  .replace(/<a class="app-version"([^>]*)>v\d+\.\d{3}<\/a>/, `<div class="about-header-meta"><nav class="header-info-links" aria-label="Pages d’information"><a href="news/">News</a><span aria-hidden="true">|</span><a aria-current="page" href="about.html">About</a><span aria-hidden="true">|</span><a href="contact/">Contact</a></nav><a class="app-version"$1>v${releaseVersion}</a></div>`)
  .replace(/echelle-kilometrique\.css\?v=\d+/, "echelle-kilometrique.css?v=14")
  .replace(/echelle-kilometrique\.js\?v=\d+/, "echelle-kilometrique.js?v=15");
if (!about.includes(`>v${releaseVersion}</a>`) || !about.includes("ECMWF IFS HRES")) {
  throw new Error("La page About Testing n’a pas pu être préparée.");
}
await writeFile(aboutPath, about);

const aboutStylePath = path.join(outputDir, "echelle-kilometrique.css");
const aboutStyle = await readFile(aboutStylePath, "utf8");
await writeFile(aboutStylePath, aboutStyle + '\n.about-header-meta{display:flex;flex-direction:column;align-items:flex-end;gap:9px}.header-info-links{min-height:26px;display:flex;align-items:center;gap:7px;color:#a0a8ac;font-size:14px;font-weight:750;line-height:1;white-space:nowrap}.header-info-links a{color:#6f7f87;text-decoration:none}.header-info-links a[aria-current="page"]{color:#397a9e}.header-info-links a:hover,.header-info-links a:focus-visible{color:#397a9e;text-decoration:underline}.about-header-meta .app-version{margin-top:0}@media(max-width:760px){.about-header-meta{gap:7px}.header-info-links{font-size:12px}.about-header-meta .app-version{margin-top:0}}\n');

const scalePath = path.join(outputDir, "echelle-kilometrique.js");
const originalScale = await readFile(scalePath, "utf8");
const scale = originalScale.includes('id: "ecmwf"') ? originalScale : originalScale.replace(
  '  { id: "pearpege", label: "PE‑ARPEGE",',
  '  { id: "ecmwf", label: "Open-Meteo · ECMWF IFS HRES", detail: "Prévision quotidienne homogène jusqu’à 8 jours", sizeLabel: "≈ 9 × 9 km", color: "#3268b2", widthKm: 9, heightKm: 9, centerLatitude: tatins.latitude, centerLongitude: tatins.longitude },\n  { id: "pearpege", label: "PE‑ARPEGE",'
);
if (!scale.includes('id: "ecmwf"')) throw new Error("La maille ECMWF manque sur la carte About Testing.");
await writeFile(scalePath, scale);

// Le diagramme approuvé est copié avec les ressources About ci-dessus.
// Ne pas tenter de réécrire les textes de son image intégrée.

const indexPath = path.join(outputDir, "index.html");
const originalIndex = await readFile(indexPath, "utf8");
const index = originalIndex
  .replace("<title>Météo les Tatins</title>", "<title>Testing · Météo les Tatins</title>")
  .replace('<a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions" hidden></a>', '<nav class="header-info-links" aria-label="Pages d’information"><a href="news/">News</a><span aria-hidden="true">|</span><a href="about.html">About</a><span aria-hidden="true">|</span><a href="contact/">Contact</a></nav><a id="app-version" class="app-version" href="changelog" title="Consulter les changements des versions" hidden></a>')
  .replace("<body>", '<body><span class="testing-badge" aria-label="Environnement de test">TESTING</span>');
if (index === originalIndex || !index.includes("testing-badge")) {
  throw new Error("Le marquage de l'environnement testing n'a pas pu être ajouté.");
}
await writeFile(indexPath, index);

const stylePath = path.join(outputDir, "style.css");
const style = await readFile(stylePath, "utf8");
await writeFile(stylePath, style + '\n.testing-badge{position:fixed;right:8px;bottom:8px;z-index:9999;padding:5px 8px;border-radius:6px;color:#fff;background:#b24b18;font:800 9px system-ui;letter-spacing:.08em;box-shadow:0 2px 7px rgba(61,27,10,.24)}\n');

const manifestPath = path.join(outputDir, "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.name = "Testing · Météo les Tatins";
manifest.short_name = "Testing";
manifest.start_url = "./";
await writeFile(manifestPath, JSON.stringify(manifest));

const workerPath = path.join(outputDir, "service-worker.js");
const originalWorker = await readFile(workerPath, "utf8");
const worker = originalWorker
  .replace(/const cacheName = "[^"]+";/, `const cacheName = "meteo-testing-b${testingBuild}";`)
  .replace('const shell = [', 'const shell = ["/about.html", "/architecture.svg", "/echelle-kilometrique.css?v=14", "/echelle-kilometrique.js?v=15", ')
  .replaceAll('"/', '"/testing/');
if (worker === originalWorker || !worker.includes('"/testing/')) {
  throw new Error("Le service worker testing n'a pas pu être isolé.");
}
await writeFile(workerPath, worker);

console.log(`Testing v${releaseVersion} préparé dans ${outputDir}`);
