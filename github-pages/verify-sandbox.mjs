import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { releaseVersion, sandboxBuild } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(pagesDir, "sandbox-dist");

for (const relative of ["index.html", "app.js", "analytics.js", "style.css", "runtime-config.js", "service-worker.js", "changelog.html", "about.html", "contact/index.html", "contact/contact.css", "contact/contact.js", "news/index.html", "news/news.css", "news/markdown.js", "news/news.js", "architecture.svg", "echelle-kilometrique.css", "echelle-kilometrique.js", "pictogrammes/ciel-jour-tres-peu-nuageux.svg", "pictogrammes/calque-pluie-2.svg", "pictogrammes/calque-orage.svg", "pictogrammes/calque-grele.svg", "pictogrammes/calque-vent.svg", "vendor/vigilance-icons/phenomenon-1.png", "vendor/vigilance-icons/phenomenon-2.png", "vendor/vigilance-icons/phenomenon-3.png", "vendor/vigilance-icons/phenomenon-4.png", "vendor/vigilance-icons/phenomenon-5.png", "vendor/vigilance-icons/phenomenon-6.png", "vendor/vigilance-icons/phenomenon-7.png", "vendor/vigilance-icons/phenomenon-8.png", "vendor/vigilance-icons/phenomenon-9.png"]) {
  if (!await stat(path.join(outputDir, relative)).then(value => value.isFile()).catch(() => false)) throw new Error(`${relative} manque dans la sandbox.`);
}

const html = await readFile(path.join(outputDir, "index.html"), "utf8");
if (!html.includes("Sandbox · Météo les Tatins") || !html.includes("SANDBOX") || !html.includes('app.js?v=241') || !html.includes('style.css?v=175')) throw new Error("La sandbox n'est pas identifiable ou ses ressources ne sont pas renouvelées.");
if (!html.includes('class="kilometric-scale-link" href="about.html">échelle kilométrique</a>') || !html.includes('<nav class="header-info-links" aria-label="Pages d’information"><a href="news/">News</a><span aria-hidden="true">|</span><a href="about.html">About</a><span aria-hidden="true">|</span><a href="contact/">Contact</a></nav><a id="app-version"')) throw new Error("Les liens News | About | Contact ou leur alignement avant la version manquent dans la sandbox.");
if (html.includes('header-events-link') || html.includes('>Événements</a>')) throw new Error("L’accès aux événements subsiste dans l’en-tête de la sandbox.");
if (/\badmin(?:-access|\/)/i.test(html)) throw new Error("Une référence à l'administration subsiste dans la sandbox.");

for (const privateReplayFile of ["testing.html", "testing.css", "testing.js"]) {
  if (await readFile(path.join(outputDir, privateReplayFile), "utf8").then(() => true).catch(() => false)) throw new Error(`Le replay privé ne doit pas être publié dans la sandbox (${privateReplayFile}).`);
}
const contactHtml = await readFile(path.join(outputDir, "contact", "index.html"), "utf8");
const contactScript = await readFile(path.join(outputDir, "contact", "contact.js"), "utf8");
if (!contactHtml.includes('../style.css?v=175') || !contactHtml.includes('contact.css?v=4') || !contactHtml.includes('../runtime-config.js') || !contactHtml.includes('contact.js?v=1') || !contactScript.includes('new URL("api/contact", apiBase)') || !contactScript.includes('form.reportValidity()') || !contactScript.includes('submitButton.disabled = false')) throw new Error("La page Contact, ses ressources ou son envoi vers l’API sont incomplets.");

for (const privateEventPath of ["evenements.html", "evenements"]) {
  if (await stat(path.join(outputDir, privateEventPath)).then(() => true).catch(() => false)) throw new Error(`Les événements privés ne doivent pas être publiés dans la sandbox (${privateEventPath}).`);
}

const runtime = await readFile(path.join(outputDir, "runtime-config.js"), "utf8");
if (!runtime.includes('apiBase: "https://nicolas.sindelar.fr/meteo-les_tatins/"') || !runtime.includes(`releaseNumber: "${releaseVersion}"`)) throw new Error("La sandbox n'utilise pas l'API publique ou la version publiée.");

const newsHtml = await readFile(path.join(outputDir, "news", "index.html"), "utf8");
const newsScript = await readFile(path.join(outputDir, "news", "news.js"), "utf8");
if (!newsHtml.includes('<title>News · Météo les Tatins</title>') || !newsHtml.includes('<header class="site-header">') || !newsHtml.includes('<a aria-current="page" href="./">News</a><span aria-hidden="true">|</span><a href="../about.html">About</a>') || !newsHtml.includes('../runtime-config.js') || !newsHtml.includes('../analytics.js?v=4') || !newsHtml.includes('news.css?v=2') || !newsHtml.includes('markdown.js?v=1') || !newsHtml.includes('news.js?v=3') || !newsHtml.includes('id="news-article"')) throw new Error("La page News de la sandbox est incomplète ou ne reprend pas l’en-tête commun.");
if (!newsScript.includes('new URL("api/config", apiBase)') || !newsScript.includes('globalThis.newsMarkdownToHtml(content)') || !newsScript.includes('config.news?.content')) throw new Error("La page News n’est pas reliée au contenu Markdown administré.");

const worker = await readFile(path.join(outputDir, "service-worker.js"), "utf8");
if (!worker.includes('"pictogrammes"')) throw new Error("Le dossier commun des pictogrammes météo n’est pas géré par le cache sandbox.");
if (!worker.includes(`const cacheName = "meteo-sandbox-b${sandboxBuild}";`) || !worker.includes('"/sandbox/') || !worker.includes('app.js?v=241') || !worker.includes('style.css?v=175') || !worker.includes('"/sandbox/analytics.js?v=4"') || !worker.includes('"/sandbox/vendor/vigilance-icons/phenomenon-9.png"') || worker.includes('meteo-france-vigilance-sprites') || !worker.includes('"/sandbox/contact/index.html"') || !worker.includes('"/sandbox/news/index.html"') || !worker.includes('"/sandbox/news/markdown.js?v=1"') || !worker.includes('"/sandbox/news/news.js?v=3"') || !worker.includes('"/sandbox/architecture.svg"') || !worker.includes('echelle-kilometrique.css?v=14') || !worker.includes('echelle-kilometrique.js?v=15') || !worker.includes("function publicCacheTarget(url)") || !worker.includes('const publicRoots = new Set(') || !worker.includes('relativePath.split("/", 1)') || worker.includes('relativePath.split("/sandbox/", 1)') || worker.includes('url.pathname.startsWith("/api/")')) throw new Error("Le cache sandbox n'est pas isolé des routes privées.");

const scaleHtml = await readFile(path.join(outputDir, "about.html"), "utf8");
if (!scaleHtml.includes(`>v${releaseVersion}</a>`)) throw new Error("La version de la page About diverge de la version publiée.");
const scaleApp = await readFile(path.join(outputDir, "echelle-kilometrique.js"), "utf8");
const scaleStyle = await readFile(path.join(outputDir, "echelle-kilometrique.css"), "utf8");
const architecture = await readFile(path.join(outputDir, "architecture.svg"), "utf8");
if (!scaleHtml.includes('<title>Météo les Tatins &gt; About</title>') || !scaleHtml.includes('<h1><a href="index.html">Météo les Tatins</a></h1>') || !scaleHtml.includes('href="index.html#radar-nowcast"') || !scaleHtml.includes('src="analytics.js?v=4"') || !scaleHtml.includes('<h2 id="map-title">Résolution des API utilisées</h2>') || !scaleHtml.includes('class="site-header"') || !scaleHtml.includes('id="scale-map"') || !scaleHtml.includes('id="layer-controls"') || scaleHtml.includes("Ce ne sont pas tous des carrés") || scaleHtml.includes('class="sandbox-badge"') || scaleHtml.includes('id="fit-all"') || scaleHtml.includes('class="explanation"') || !scaleApp.includes('bindTooltip("Les Tatins"') || scaleApp.includes("point interrogé") || !scaleApp.includes('label: "Radar v1"') || !scaleApp.includes('id: "ecmwf"') || !scaleApp.includes('label: "Open-Meteo · ECMWF IFS HRES"') || !scaleApp.includes('sizeLabel: "≈ 9 × 9 km"') || !scaleApp.includes('detail: "Prolonge la prévision et le signal d’orage à 4 jours"') || scaleApp.includes('centre à 4,8 km') || scaleApp.includes('label: "Données publiques Radar') || scaleApp.includes('class="layer-swatch"') || (scaleApp.match(/\bid: "/g) || []).length !== 7 || !scaleApp.includes('map.setView([tatins.latitude, tatins.longitude], 13') || !scaleApp.includes('dragging: false') || !scaleApp.includes('scrollWheelZoom: "center"') || !scaleApp.includes('doubleClickZoom: "center"') || !scaleApp.includes('touchZoom: "center"') || !scaleApp.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png') || !scaleApp.includes('opacity: 0.42') || scaleApp.includes('basemaps.cartocdn.com') || !scaleApp.includes("Suit les cellules pluvio‑orageuses") || !scaleApp.includes('originLongitude: -6') || !scaleApp.includes('originLatitude: 55.4') || !scaleApp.includes('corners: [[44.6499891678') || !scaleApp.includes("const gridRadius = 5") || !scaleApp.includes("0.58 * fade * fade")) throw new Error("La page dédiée aux mailles est incomplète, décentrable ou contient des éléments superflus.");
if (!scaleHtml.includes('class="technical-details"') || (scaleHtml.match(/class="technical-chapter"/g) || []).length !== 5 || !scaleHtml.includes('<details class="technical-details-disclosure"><summary><span>Détails techniques des API</span><span class="technical-details-toggle" aria-hidden="true">›</span></summary>') || scaleHtml.includes('<details class="technical-details-disclosure" open>') || scaleHtml.includes('<h2>Détails techniques des API</h2>') || !scaleHtml.includes('Open-Meteo · ECMWF IFS HRES') || !scaleHtml.includes('9 × 9 km') || !scaleHtml.includes('actualisé toutes les 6 heures') || !scaleHtml.includes('DWD ICON-EPS') || !scaleHtml.includes('Le créneau Soir couvre 18h minuit') || !scaleHtml.includes('densité moyenne de foudre prévue sur trois heures') || !scaleHtml.includes('signal orageux dérivé des champs de foudre et de précipitations AROME') || !scaleHtml.includes('Un signal orageux est retenu à partir de 0,01') || !scaleHtml.includes('énergie convective disponible maximale et précipitations convectives') || !scaleHtml.includes('codes météo 95 à 99') || !scaleHtml.includes('<h2><a href="index.html#radar-nowcast">Nowcasting</a></h2>') || !scaleHtml.includes('<strong><a href="index.html#radar-nowcast">nowcasting</a></strong>') || !scaleHtml.includes('<h3>Risque orageux à trois heures</h3>') || !scaleHtml.includes('<h3>Lecture commune des couleurs météo</h3>') || !scaleHtml.includes('<strong>Jaune — Attention</strong>') || !scaleHtml.includes('<strong>Orange — Sérieux</strong>') || !scaleHtml.includes('<strong>Rouge — Alerte</strong>') || !scaleHtml.includes('<strong>0–2/5 sans couleur</strong>') || !scaleHtml.includes('ni le rond de confiance') || !scaleHtml.includes('combinées en <strong>« et/ou »</strong>') || !scaleHtml.includes('La pluie seule est plafonnée à <strong>4/5</strong>') || !scaleHtml.includes('Une durée n’est annoncée que lorsque la fin du passage est réellement connue') || !scaleHtml.includes('Bordure de cellule pluvieuse') || scaleHtml.includes('40 % pluie, 30 % grêle') || !scaleHtml.includes('<h2>Prévision semaine</h2>') || !scaleHtml.includes('<h3>Risque orageux semaine</h3>') || !scaleHtml.includes('<h2>Techniques / Sécurité / Confidentialité</h2>') || !scaleHtml.includes('Les prévisions publiques sont récupérées sans clé privée') || scaleHtml.includes('<h3>Analyse polarimétrique et apprentissage à trois heures</h3>') || !scaleHtml.includes('Moucherotte et de Colombis') || !scaleHtml.includes('sont des calculs locaux à valider') || scaleHtml.includes('ne remplacent pas la vigilance officielle') || !scaleHtml.includes('<h2 id="pictogrammes-meteo">Pictogrammes météo</h2>') || !scaleHtml.includes('src="pictogrammes/grele.svg?v=4"') || scaleHtml.includes('pictogrammes-meteo.png') || scaleHtml.includes('flowchart LR') || scaleHtml.includes('DETAILS_TECHNIQUES_API') || !scaleHtml.includes('<strong>meteo-lestatins.github.io :</strong>') || !scaleHtml.includes('décodeur OPERA <code>decbufr</code> et tables BUFR') || scaleHtml.includes('<strong>PWA') || !scaleHtml.includes('class="technical-table-scroll"')) throw new Error("Les détails techniques validés ne sont pas intégrés après la carte.");
if (!scaleHtml.includes('Nébulosité — 6 niveaux') || !scaleHtml.includes('ciel-jour-tres-peu-nuageux.svg') || !scaleHtml.includes('calque-pluie-2.svg') || !scaleHtml.includes('calque-orage.svg') || !scaleHtml.includes('calque-grele.svg') || !scaleHtml.includes('calque-vent.svg') || /(?:jour-pluie-vent|jour-orage-pluie|nuit-orage-grele-vent)\.svg/.test(scaleHtml)) throw new Error("Les exemples météo de l’About ne sont pas composés à partir des SVG communs.");
if (!scaleHtml.includes('class="technical-pictogram-stack"') || !scaleStyle.includes('.technical-pictogram-stack{display:grid;width:96px;height:96px;margin:0 auto}') || !scaleStyle.includes('.technical-pictogram-stack>.technical-inline-image{grid-area:1/1;margin:0}')) throw new Error("La superposition structurée des calques météo manque dans l’About.");
if (!/<img\b[^>]*\bsrc="architecture\.svg(?:\?[^"<>]*)?"[^>]*>/.test(scaleHtml)) throw new Error("Le diagramme architecture.svg manque dans About (adresse versionnée acceptée).");
if (!scaleHtml.includes('<h4>Tendance de fond par source</h4>') || !scaleHtml.includes('<strong>Δ = m₂ − m₁</strong>') || !scaleHtml.includes('<strong>−S ≤ Δ ≤ S</strong>') || !scaleHtml.includes('34 points de pourcentage d’heures signalées')) throw new Error("La méthode structurée des flèches de tendance manque dans About.");
const sandboxDisclosureEnd = scaleHtml.indexOf('</details>');
const sandboxNowcastingHeading = scaleHtml.indexOf('<h2><a href="index.html#radar-nowcast">Nowcasting</a></h2>');
if (!scaleHtml.includes('</details><div class="technical-details technical-details-following"') || sandboxDisclosureEnd < 0 || sandboxNowcastingHeading < sandboxDisclosureEnd) throw new Error("Les chapitres suivant les détails API sont masqués dans le panneau repliable.");
if (!scaleHtml.includes('<strong>Nuit</strong> correspond aux heures de <strong>0 h à 6 h le lendemain (J+1)</strong>') || !scaleHtml.includes('Le créneau Soir couvre 18h minuit') || scaleHtml.includes('nuit de 22 h à 6 h le lendemain') || !scaleHtml.includes('forte probabilité de passage d’un orage faible reste ainsi à <strong>3/5 jaune</strong>') || !scaleHtml.includes('niveau <strong>4/5 orange</strong> exige à la fois une probabilité d’au moins 60 % et une intensité d’au moins 4/5')) throw new Error("Les créneaux de nuit ou le croisement local du risque orageux manquent dans About.");
if (!scaleHtml.includes('synthèse générale Open-Meteo et le calcul de confiance écartent les heures antérieures à l’heure en cours') || !scaleHtml.includes('Les créneaux conservent en revanche leurs plages horaires propres')) throw new Error("Le traitement des heures passées est imprécis dans About.");
if (!scaleHtml.includes('Une <strong>ETA décrit uniquement la trajectoire probable d’une cellule</strong>') || !scaleHtml.includes('d’une cellule ainsi qualifiée d’orageuse')) throw new Error("La distinction entre ETA et qualification orageuse manque dans l’About sandbox.");
if (!scaleHtml.includes('À chaque nouvelle mosaïque, environ toutes les cinq minutes') || !scaleHtml.includes('La forme radar réellement détectée est conservée dans tous les calculs actifs') || !scaleHtml.includes('moins de huit kilomètres du bord réel') || /rayon (?:équivalent|estimé|ancien)/i.test(scaleHtml)) throw new Error("La géométrie réelle des cellules n’est pas complètement documentée dans About.");
if (architecture !== await readFile(path.join(pagesDir, "sandbox-grid", "architecture.svg"), "utf8") || !architecture.includes('viewBox="0 0 1120 620"') || !architecture.includes('<title id="title">') || !architecture.includes('<desc id="description">')) throw new Error("Le schéma d’architecture ou sa mise en forme est incorrect.");
if (!scaleStyle.includes('.site-header .app-version{margin-top:45px') || !scaleStyle.includes('.site-header .app-version{margin-top:38px') || !scaleStyle.includes('justify-content:flex-start;gap:8px') || !scaleStyle.includes('.technical-details-toggle{width:24px') || !scaleStyle.includes('summary>.technical-details-toggle{transform:rotate(90deg)')) throw new Error("La version ou le symbole de dépliage de la page About est incorrect.");

const style = await readFile(path.join(outputDir, "style.css"), "utf8");
const liveApp = await readFile(path.join(outputDir, "app.js"), "utf8");
const engine = await readFile(path.join(outputDir, "nowcast/engine.js"), "utf8");
const mapEngine = await readFile(path.join(outputDir, "nowcast/map.js"), "utf8");
// Historical semantic checks now inspect the actual computation module too.
const app = liveApp + '\n' + engine + '\n' + mapEngine;
if (liveApp.includes('function nowcastLocalStormHazards(') || liveApp.includes('function nowcastPassageFrequencyGrid(')
  || !liveApp.includes('latestForecastData?.nowcast') || !liveApp.includes('forecast.timelineSlots')) throw new Error("Le site doit utiliser les prévisions préparées par le serveur.");
const analyticsScript = await readFile(path.join(outputDir, "analytics.js"), "utf8");
if (!style.includes('.daily-period-card summary { min-height: 148px;') || !style.includes('.daily-period-icon > img, .daily-period-icon .layered-weather-icon, .daily-period-icon .weather-variant-icon { width: 96px; height: 96px; }')) throw new Error("La réduction des lignes de prévision semaine ou de leurs pictogrammes manque.");
if (!style.includes('.daily-period-title { grid-column: 1 / 4;') || !style.includes('.daily-vigilance-icons { min-width: 0; display: inline-flex; flex: 1 1 auto; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 3px; }')) throw new Error("Les pastilles de vigilance ne sont pas alignées sur l’axe droit du chevron du créneau.");
if (!app.includes('return "toute la journée"') || app.includes('return "du matin au soir"') || app.includes('Vent maximal · Open-Meteo') || !app.includes('const rawWindValues = finite([ecmwf.windSpeedMax, arpege.windSpeedMax]);') || !app.includes('const synthesisWindValue = mean(rawWindValues);')) throw new Error("Les corrections de synthèse semaine et de période journée manquent dans la sandbox.");
if (!html.includes('analytics.js?v=4') || !analyticsScript.includes('send("visit", pageTarget())') || !analyticsScript.includes('meteo_anonymous_visitor') || !analyticsScript.includes('api/analytics')) throw new Error("Le comptage anonyme des visiteurs par page manque dans la sandbox.");
if (!html.includes('id="news-alert"') || !app.includes('function renderNewsBanner(news)') || !app.includes('renderNewsBanner(config.news)') || !style.includes('.news-alert { min-height: 44px')) throw new Error("Le bandeau News public manque ou n’est pas piloté par la configuration.");
if (!app.includes('sourceLink("arome", "api-arome", "AROME")') || !app.includes('sourceLink("piaf", "api-piaf", "PIAF")') || !app.includes('sourceLink("pearome", "api-pe-arome", "AROME-PI")') || !app.includes('sourceLink("arome", "api-arpege", "ARPEGE")') || !app.includes('sourceLink("ensemble", "api-pe-arpege", "PE-ARPEGE")') || !app.includes('sourceLink("lightning", "api-eumetsat-li", "EUMETSAT LI")') || !app.includes('sourceLink("vigilance", "api-vigilance", "Vigilance")') || !app.includes('sourceLink("openMeteo", "api-open-meteo", "Open-Meteo")') || /sourceLink\([^\n]+https?:\/\//.test(app)) throw new Error("Les pastilles API ne conduisent pas toutes vers leur chapitre About.");
for (const anchor of ["api-radar", "api-piaf", "api-arome", "api-pe-arome", "api-arpege", "api-pe-arpege", "api-vigilance", "api-eumetsat-li", "api-open-meteo"]) {
  if (!scaleHtml.includes(`<h3 id="${anchor}"><a href="http`)) throw new Error(`Le titre externe ${anchor} manque dans About.`);
}
if (!style.includes('.header-events-link { display: none !important; }')) throw new Error("Un ancien lien Événements pourrait réapparaître depuis le cache.");
if (!style.includes('header .header-subtitle { margin-bottom: 10px; font-size: 10px; }')) throw new Error("Le sous-titre principal ne passe pas à 10 px sur mobile.");
if (!style.includes('.header-meta{gap:7px;margin-top:0}') || !style.includes('.header-info-links{display:flex;min-height:32px') || !style.includes('font-size:14px') || !style.includes('@media(max-width:760px){.header-info-links{min-height:28px;font-size:12px')) throw new Error("La taille ou l’alignement des liens News | About | Contact est incorrect dans la sandbox.");
if (!app.includes('window.location.hash === "#radar-nowcast"') || !app.includes('$("radar-nowcast")?.scrollIntoView')) throw new Error("Le lien externe vers le schéma nowcasting n’est pas pris en charge.");
if (app.includes('ECMWF IFS') || app.includes('hresStorm') || !app.includes('>Open-Meteo</button>') || !app.includes('stormSignalPictogram(stormHoverLabel, "week-source-storm-source")') || !app.includes('stormSignalPictogram(stormHoverLabel, "week-synthesis-storm-source")') || !app.includes('class="comparison-storm-marker chart-point"') || !app.includes('class="comparison-storm-layer"') || !app.includes('forecastStormPictogram(stormSourceLabel') || !app.includes('week-weather-pictograms') || !app.includes('overview-weather-pictograms') || !app.includes('class="storm-signal-cloud"') || !style.includes('.storm-signal-pictogram') || !style.includes('.comparison-storm-layer') || style.includes('background: #fff3b7')) throw new Error("Le signal d’orage ne distingue pas correctement les sources et les synthèses.");
if (!app.includes('openMeteoStorm ? "Open-Meteo"') || !app.includes('Number(pair.openMeteo.weatherCode) >= 95 ? "Open-Meteo"')) throw new Error("Le signal orageux n’identifie pas correctement Open-Meteo.");
if (!app.includes('stormTrendUsesDisplayedLevel') || !app.includes('displayedLevel: stormCombinedLevel') || !app.includes('nouveau signal orageux entré dans les 3 prochaines heures')) throw new Error("La flèche du risque orageux ne suit pas l’évolution du niveau composite affiché.");
if (!app.includes('const stormForecastSourceCount = Number(meteoFranceStormForecastActive) + Number(openMeteoStormForecastActive);') || !app.includes('const nowcastStormPassageLevel = rawStormPassageLevel;') || !app.includes('stormForecastSourceCount, orangeVigilanceActive ? 1 : 0') || app.includes('closeStormCells.length ? 2 : 0')) throw new Error("L’échelle du risque orageux ne combine pas correctement sources prévisionnelles et probabilité de passage nowcasting.");
if (!app.includes('function weekStormRisk(dateKey') || !app.includes('const temporalCeiling = horizonDays >= 4 ? 3 : horizonDays >= 2 ? 4 : 5;') || !app.includes('const level = Math.min(stabilityLevel, temporalCeiling);') || !app.includes('const nearLevel = horizonDays <= 1 ? 3 : horizonDays === 2 ? 2 : 1;') || !app.includes('const baseLevel = sources.length >= 2 ? nearLevel + 2 : nearLevel;') || !app.includes('level: Math.max(nearLevel, Math.min(5, baseLevel - instabilityPenalty))') || !app.includes('stormChangedCount) >= 2 ? 2') || !app.includes('weeklyRisk.level >= 3')) throw new Error("La graduation temporelle, convergente et persistante du risque d’orage hebdomadaire manque.");
if (!app.includes('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}') || !app.includes('opacity: 0.62') || app.includes('tiles.openfreemap.org') || app.includes('basemaps.cartocdn.com') || !app.includes('Fond © Esri') || !app.includes('class="nowcast-map-attribution"') || !style.includes('.nowcast-map-attribution{position:absolute;left:50%') || !app.includes('const localPlaceFallback = [') || !app.includes('const regionalPlaceFallback = [') || !app.includes('osm-place-label') || !style.includes('osm-place-dot')) throw new Error("Le fond raster sans libellés, sa transparence ou les noms sélectionnés du nowcasting sont incorrects dans la sandbox.");
if (!app.includes('let activeNowcastMapRadius = initialNowcastMapRadius || 60;') || !app.includes('let nowcastMapRadiusManuallySelected = initialNowcastMapRadius !== null;') || !app.includes('sessionStorage.setItem(nowcastMapRadiusSessionKey, String(activeNowcastMapRadius))') || !app.includes('let nowcastMapAutoExpanded = false;') || !app.includes('data-nowcast-radius="60"') || app.includes('data-nowcast-radius="80"') || !app.includes('const nearbyCells = cells.filter(cell => cellDistance(cell) < 60 || nowcastCellHasEtaProjection(cell));') || !app.includes('const twentyKmSaturated = nowcastMapIsSaturated(cells);') || !/if \(!nowcastMapRadiusManuallySelected\) activeNowcastMapRadius = forecast\.recommendedMapRadius/.test(app)) throw new Error("La portée large automatique, sa persistance ou la priorité du choix manuel du nowcasting est incorrecte.");
if (style.includes("nowcast-container-layout") || app.includes("compactDesktopMap") || !style.includes(".nowcast-workspace { display: block; }") || !app.includes('const { width, height } = sandboxNowcastDimensions();')) throw new Error("La carte Nowcasting ne conserve pas ses proportions d’origine.");

const changelog = await readFile(path.join(outputDir, "changelog.html"), "utf8");
const sandboxLog = await readFile(path.join(path.dirname(pagesDir), "SANDBOX-CHANGELOG.md"), "utf8");
const pendingSandboxEntries = sandboxLog.split(/\r?\n/).filter(line => / — sandbox — /.test(line));
const changelogBody = changelog.match(/<pre>([\s\S]*?)<\/pre>/)?.[1] || "";
if (!changelog.includes('class="site-header"') || !changelog.includes('<h1><a href="index.html">Météo les Tatins</a></h1>') || !changelog.includes('href="index.html#radar-nowcast"') || !changelog.includes('analytics.js?v=4') || !changelog.includes('class="header-subtitle"') || !changelog.includes('.app-version{margin-top:45px') || !changelog.includes('class="changelog-main"')) throw new Error("L’en-tête commun, le suivi anonyme ou l’alignement de sa version manque sur le changelog de la sandbox.");
if (!changelogBody.startsWith("09/08/2026 22:30 — v1.001 —") || /\n[ \t]*\n/.test(changelogBody) || changelog.includes("Journal des publications sandbox") || changelog.includes("# Versions main") || changelog.includes("data-sandbox-log")) throw new Error("Le changelog sandbox ne commence pas directement par v1.001 ou contient encore des explications et lignes vides.");
for (const entry of pendingSandboxEntries) {
  const escapedEntry = entry.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  if (!changelogBody.includes(escapedEntry)) throw new Error("Un versement sandbox en attente manque dans le changelog publié.");
}
if (!app.includes('function stormRiskIntensityStep') || !app.includes('function nowcastEtaRainEvents') || !app.includes('const stormEtaSelection = nowcastStormEtaSelection(') || !app.includes('temporalPassageCandidates.map(candidate => candidate.cell.id)')) throw new Error("Le bouton Orage sandbox ne couvre pas correctement les passages ETA.");
if (!app.includes('const stormPassageLevelChange = stormCombinedLevel - previousStormPassageLevel;') || !app.includes('displayedLevel: stormCombinedLevel') || !app.includes('sameObservationSnapshot?.displayedLevel === stormCombinedLevel')) throw new Error("La flèche Orage ne suit pas l’évolution de l’indicateur composite dans la sandbox.");
for (const expected of [
  'const peakRainIntensity = Math.max(',
  'const drizzleOnly = onlyDrizzleInThreeHours(threeHourRainSteps)',
  'const rainColorLevel = !rainMessageSequence.length || drizzleOnly ? 0 : rainIntensityStep(peakRainIntensity)',
  'function threeHourRainSignalIgnored(',
  'amount <= .01 + 1e-9',
  'threeHourRainSteps.length ? "Pas de pluie" : "Prévision indisponible"',
  'rainMessageSequence.length ? rainTrend : null',
  'const rainLabelStep = dropsThenRain ? measurableRainArrival : rainArrival',
  'const rainLabelLevel = drizzleOnly ? 0 : rainIntensityStep(rainLabelIntensity)',
  'const rainTransition = nextRainPhaseTransition(upcomingRainSteps, now, currentRainPhase)',
  '? shortTermRainTransitionLabel(rainTransition, rainTransitionPassageRisk)',
  ': dropsThenRain',
  'shortTermRainSequenceLabel(measurableRainEtaMinutes, rainLabelLevel, measurableRainPassageRisk)',
  'function rainPhaseRank(',
  'if (transition.nextPhase?.dry) return "Fin de l’épisode de pluie" + eta',
  'transition.currentPhase?.drizzle',
  'function rainPassageForStep(',
  'level >= 5 ? "Pluie violente" : level >= 4 ? "Pluie forte" : level >= 3 ? "Pluie soutenue"',
  "summaryAction('rain', rainMessageSequence.length ? rainMessageSequence : rainValue, rainColorLevel",
  '" mm · pic d’intensité : " + peakRainIntensity',
  'const maximumWind = Math.round(Math.max(0, ...windWindow.map(item => Number(item.windSpeed) || 0)))',
  'const maximumOpenMeteoWind = openMeteoWindWindow.length',
  'const maximumOpenMeteoGust = openMeteoWindWindow.length',
  'function backgroundTrendArrow(values, threshold = 0)',
  'const openMeteoWindBackgroundTrend = backgroundTrendArrow(openMeteoWindWindow.map(item => item.windSpeed), 5)',
  'const openMeteoGustBackgroundTrend = backgroundTrendArrow(openMeteoWindWindow.map(item => item.windGust), 8)',
  'const meteoFranceWindBackgroundTrend = backgroundTrendArrow(windWindow.map(item => item.windSpeed), 5)',
  'const meteoFranceGustBackgroundTrend = backgroundTrendArrow(windWindow.map(item => item.windGust), 8)',
  '"Open-Meteo\\nVent moyen : " + maximumOpenMeteoWind + " km/h " + openMeteoWindBackgroundTrend',
  '"Météo-France\\nVent moyen : " + maximumWind + " km/h " + meteoFranceWindBackgroundTrend',
  '"\\nRafales : " + maximumOpenMeteoGust + " km/h " + openMeteoGustBackgroundTrend',
  '"\\nRafales : " + maximumGust + " km/h " + meteoFranceGustBackgroundTrend',
  'const windTrendWithDetail = { ...windTrend, detail: windDetail }',
  'const shortTermWindIntensityLevel = (meanWind, gust) => {',
  'function shortTermWindLabel(',
  'level >= 4 ? "Vent très fort"',
  "summaryAction('wind', windValue, windLevel, windDetail, windTrendWithDetail, 'wind48', null, null, windColorLevel, true)"
]) {
  if (!app.includes(expected)) throw new Error("Les libellés pluie et vent ne suivent pas leur intensité ou les détails du vent manquent au survol dans la sandbox.");
}
if (!app.includes('const stormCombinedLevel = stormRiskIntensityStep(stormPassageLevel, stormIntensityLevel)') || !app.includes('function shortTermStormLabel(') || !app.includes('function shortTermRainCellLabel(') || !app.includes('function shortTermRiskQualifier(') || !app.includes('probability >= 80 ? "" : probability >= 55 ? " probable" : " possible"') || !app.includes('function shortTermHailQualifier(') || !app.includes('const violent = level >= 4;') || !app.includes('announcedPassageRiskForCell(selectedStormCell),') || !app.includes('selectedStormIntensity.hailRisk,') || !app.includes('"Bordure d’orage"') || !app.includes('"Bordure de cellule pluvieuse"') || !app.includes('"Risque d’orage dans les 3 h"') || !app.includes('const rainyCellEtaSelection = rainyCellCandidate') || app.includes('cellules à venir') || app.includes('Orage s’éloignant') || !app.includes('if (hail >= 5) return 5;') || !app.includes('if (hail >= 3) return 4;') || !app.includes('Math.min(3, lightning)')) throw new Error("Le calcul ou les libellés prudents Orage/Cellule du bouton 3 h sandbox sont incomplets.");
if (!app.includes('if (cell?.etaMinutes == null) return null;') || !app.includes('const etaMinutes = reliableEvent?.etaMinutes == null ? null : Number(reliableEvent.etaMinutes);') || !app.includes('const relevantStormEtaMinutes = stormEtaSelection.etaMinutes == null') || !app.includes('? stormLocallyObservedInterior ? 0 : null') || !app.includes('const candidates = observedCandidates.filter(event => (event?.arrivalReliable === true')) throw new Error("Une ETA absente ou périmée peut encore être interprétée comme immédiate dans la sandbox.");
if (!style.includes(".nowcast-map-column .target-point text{font-size:9px!important;font-weight:800}")) throw new Error("Le libellé compact Les Tatins manque dans la sandbox.");
if (!app.includes('const etaTargetOutsideTwentyKm = temporalPassageCandidates') || !app.includes('.some(candidate => nowcastEtaCellOutsideMap(candidate.cell, 20))') || !app.includes('const recommendedMapRadius = twentyKmSaturated || etaTargetOutsideTwentyKm ? 60')) throw new Error("Toute cellule ETA hors du champ 20 km doit imposer la vue 60 km dans la sandbox.");
if (!app.includes('(targetX + 8)') || !app.includes('(targetY - 8)') || !app.includes('>Les Tatins</text>') || !style.includes(".nowcast-map-column .target-point text{font-size:9px!important;font-weight:800}")) throw new Error("Le point et le libellé Les Tatins ne sont pas correctement adaptés dans la sandbox.");
if (!style.includes('.three-hour-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }') || !style.includes('.three-hour-actions { grid-template-columns: minmax(0, 1fr); gap: 8px; }')) throw new Error("Les boutons 3 h ne passent pas de trois colonnes à une colonne sur mobile dans la sandbox.");
if (!style.includes('grid-template-rows: minmax(0, 1fr)') || !style.includes('.now-slice { min-width: 0; height: 100%') || !style.includes('.now-bar { position: absolute; right: 0; bottom: 0; left: 0;')) throw new Error("Les barres de pluie ne disposent pas d’une hauteur de référence stable dans la sandbox.");
if (style.includes('.three-hour-action.metric-rain.level-2') || !style.includes('.three-hour-action.metric-rain.level-3') || !style.includes('.three-hour-action.metric-rain.level-4') || !style.includes('.three-hour-action.metric-rain.level-5') || !style.includes('.three-hour-action.metric-storm.level-3') || !style.includes('.three-hour-action.metric-storm.level-4') || !style.includes('.three-hour-action.metric-storm.level-5') || !style.includes('.three-hour-action.metric-wind.level-3') || !style.includes('.three-hour-action.metric-wind.level-4') || !style.includes('.three-hour-action.metric-wind.level-5')) throw new Error("Les couleurs jaune, orange et rouge des boutons pluie, orage et vent ne correspondent pas aux niveaux 3, 4 et 5 dans la sandbox.");
if (!style.includes('.three-hour-action-body > b { min-width: 0; margin-left: auto; overflow-wrap: anywhere; font-size: 15px; font-weight: 850;') || !style.includes('text-align: right; white-space: normal;') || !style.includes('.three-hour-storm-eta { font-size: 15px; font-weight: 850;')) throw new Error("Les libellés pluie et orage ne conservent pas leur typographie ou peuvent déborder dans la sandbox.");
if (!app.includes('function threeHourTrendIsSignificant(kind, trend)') || !app.includes('threeHourTrendIsSignificant(kind, trend) ? " significant" : ""') || !style.includes('.three-hour-trend.significant.croissant b') || !style.includes('.three-hour-trend.significant.decroissant b') || style.includes('.three-hour-trend.croissant b {') || style.includes('.three-hour-trend.decroissant b {')) throw new Error("Les flèches de tendance ne restent pas grises hors changement important dans la sandbox.");

if (!app.includes('function shortTermRainTrend(values, sourceDetail = "PIAF")') || !app.includes('const analysedValues = (values || []).slice(0, 12)') || !app.includes('const imminentRise = peakIndex > 0 && peak - immediate > threshold') || !app.includes('const rainTrend = shortTermRainTrend(rainTrendSteps, rainTrendSource)') || !app.includes('precipitation: item.totalPrecipitation') || !app.includes('effectiveEtaAmendment: Math.max(0, totalPrecipitation - radarAdjustedPrecipitation)') || app.includes("meteo-three-hour-rain-snapshot")) throw new Error("La tendance pluie de l’heure à venir, amendée par les ETA sans double comptage, manque dans la sandbox.");
if (!app.includes("const fullScaleRain = 4")
  || !app.includes('const label = [quantitative > 0 ? totalRain.toFixed(2) + " mm" : "", passage > 0 ? Math.round(passage) + " %" : ""].filter(Boolean).join(" · ")')
  || app.includes('const label = observed ? "observé"')
  || !app.includes('passage != null ? "\\nProbabilité de passage : " + passage + " %" : ""')
  || !app.includes('--rain-height:')
  || !style.includes('.now-value { position: absolute; left: 50%; bottom: min(calc(var(--rain-height, 0%) + 5px)')
  || !style.includes('font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;')
  || !style.includes('.now-cell-overlay-label { position: absolute; left: 50%; bottom: max(30px')) throw new Error("L’échelle des barres ou l’affichage numérique des probabilités Nowcasting manque dans la sandbox.");
if (!app.includes('class="storm-summary storm-general"><div class="three-hour-actions"') || !app.includes("summaryAction('rain'") || !app.includes("summaryAction('storm'") || !app.includes("summaryAction('wind'") || !app.includes("querySelectorAll('[data-summary-target]')") || app.includes('class="three-hour-combined-chart"') || app.includes('data-timeline-target')) throw new Error("La synthèse 3 h sandbox n’est pas rendue avec les boutons Pluie, Orage et Vent.");
if (!app.includes('function threeHourRainMessageSequence(') || !app.includes('function mergeThreeHourRainPassages(') || !app.includes('const threeHourMessageRotationEnabled = false') || !app.includes('if (!threeHourMessageRotationEnabled) return;') || !app.includes('three-hour-message-static') || !app.includes('item.endKnown === true') || !app.includes('detail = "Encore "') || !app.includes('detail = "Durée "') || !app.includes('data-three-hour-message-sequence') || !app.includes('initializeThreeHourMessageSequence(summaryElement)') || !app.includes('}, 5000);') || app.includes('threeHourRainPassageHistory') || app.includes('relation = "Passé"') || app.includes('relation = "En cours"') || app.includes('relation = hasActive || futureIndex > 0 ? "Ensuite" : "À venir"') || !style.includes('.three-hour-message-static b { min-width: 0; overflow-wrap: anywhere; font-size: 15px; font-weight: 850;') || !style.includes('.three-hour-message[data-position="previous"]') || !style.includes('.three-hour-message[data-position="next"]') || !style.includes('-webkit-mask-image: linear-gradient(to bottom') || !style.includes('@media (prefers-reduced-motion: reduce)')) throw new Error("Le message pluie fixe, sans passé et sans durée extrapolée, est incomplet dans la synthèse 3 h sandbox.");
if (!app.includes('function nowcastEvidenceIsFresh(') || !app.includes('signal?.detected === true') || !app.includes('String(signal.source || "").trim().length > 0') || !app.includes('cell?.polarimetry?.classification === "hail"') || !app.includes('function nowcastCellHasIntenseRainSignal(') || !app.includes('rainIntensityStep(Math.max(0, Number(cell?.maximum) || 0)) >= 4') || !app.includes('const stormCandidateCells = nearbyCells.filter') || !app.includes('nowcastCellHasStormEvidence(cell, lightning, radar.observedAt, now)') || !app.includes('Math.abs(evidenceTime - radarTime) <= 12 * 60000') || !app.includes('Math.abs(currentTime - radarTime) <= 15 * 60000') || !app.includes(')) <= 8') || app.includes('convectiveSignal === true') || app.includes('Number(cell.risks?.storm) >= 30') || app.includes('Indice convectif') || app.includes('\\nOrage :') || !app.includes('const passageCandidates = stormCandidateCells')) throw new Error("La qualification prudente d’une cellule orageuse est incomplète dans la sandbox.");
if (!app.includes('function polarimetricHailRisk(cell)') || !app.includes('scoreBasis !== "fraction-of-compatible-strong-pixels"') || !app.includes('return "non évaluée";') || app.includes('Grêle : risque " + hailRisk')) throw new Error("Le calcul polarimétrique de la grêle est incomplet dans la sandbox.");
if (!app.includes('conditionalIntensity: profiledIntensity') || !app.includes('rainEtaPassage: etaPassage') || !app.includes('overview-rain-nowcast-probability') || !app.includes('"PIAF : " + basePiaf.toFixed(2) + " mm"') || !app.includes('"\\nNowcasting observé : +"') || !app.includes('"\\nNowcasting prévu si passage : +"') || !app.includes('presence-only') || !app.includes('--amendment-bottom:') || !app.includes('--amendment-height:') || !style.includes('bottom: var(--amendment-bottom, 0%)') || !style.includes('height: var(--amendment-height, 4%)') || !style.includes('.overview-temperature .overview-rain-nowcast-probability {')) throw new Error("La séparation PIAF/Nowcasting ou le cumul conditionnel manque sur les frises pluie de la sandbox.");
if (!app.includes('function withHourlyNowcast(forecast, hourlyRain, options = {})') || !app.includes('options.includeCurrentHour') || !app.includes('const hasCurrentShortTerm = arome.hours.some') || !app.includes('const forecastStart = hasCurrentShortTerm ? currentHour : nextHour')) throw new Error("L’heure courante PIAF/Nowcasting peut encore disparaître de la frise 48 h.");
const threeHourLinks = app.match(/const threeHourLinks[\s\S]+?;\r?\n\r?\nfunction renderRainApiLinks/)?.[0] || "";
if (!threeHourLinks.includes("nowcastDisplayLink()") || !threeHourLinks.includes('sourceLink("piaf"') || !threeHourLinks.includes('sourceLink("arome"') || !threeHourLinks.includes("lightningLink()") || !threeHourLinks.includes("vigilanceLink()") || threeHourLinks.includes("openMeteoLink()")) throw new Error("Les sources de l’encadré 3 h sont incorrectes dans la sandbox.");
if (!app.includes("if (!nowcastMapRadiusManuallySelected) activeNowcastMapRadius = forecast.recommendedMapRadius") || app.includes("if (activeNowcastMapRadius === 20) nowcastMapRadiusManuallySelected = false") || !app.includes("nowcastCellRepresentativeRain(cell, radar.currentPrecipitation)") || !app.includes("nowcastFlashesNearCell(cell, lightning, radar.observedAt")) throw new Error("Le choix manuel de portée ou l’intensité locale des cellules est incorrect dans la sandbox.");
if (!app.includes("function nowcastCellRainProfilePassages") || !app.includes("const rainProfilePassages = nowcastCellRainProfilePassages(cell)") || !app.includes("function nowcastProjectionFresh") || !app.includes("function nowcastProjectionProfileSignature") || !app.includes("const samePassage = passageOverlap") || !app.includes("function nowcastEtaRainEligible") || !app.includes("event?.projectionReliable === true") || !app.includes("nowcastProjectionFresh(event, referenceTime)") || !app.includes('["profile", "shape"].includes(event?.projectionKind)') || !app.includes("function nowcastEtaRainRateAt") || !app.includes("Math.max(0, ...eligibleEvents.map") || !app.includes("maximumRate * (end - start) / 3600000")) throw new Error("La sélection prudente, l’expiration ou l’intégration sans double cumul des profils Nowcasting manque dans la sandbox.");
if (!app.includes('function nowcastCellOverlayPlacement({ cellBounds, targetBounds = null, viewport, overlaySize })')
  || !app.includes('const targetOverlap = nowcastRectangleIntersectionArea(rectangle, targetBounds);')
  || !app.includes('avoidsTarget: targetOverlap === 0')
  || !app.includes('const targetBounds = relative(targetRectangle);')
  || !app.includes('targetBounds.left -= 8;')
  || !app.includes('const placement = nowcastCellOverlayPlacement({')
  || !app.includes('panel.dataset.placement = placement.placement;')
  || !app.includes('class="nowcast-cell-map-overlay passage-')
  || !app.includes('data-nowcast-cell-overlay="')
  || !app.includes('data-nowcast-cell-trigger="')
  || !app.includes('role="tooltip" hidden')
  || !style.includes('.nowcast-cell-map-overlay { width: min(238px, calc(100% - 16px)); position: absolute;')
  || !style.includes('.nowcast-cell-map-overlay[hidden] { display: none; }')
  || !style.includes('.nowcast-cell-map-overlay.is-visible { opacity: 1; }')
  || !style.includes('.radar-cell:focus, .radar-cell:hover, .radar-cell-marker.is-active .radar-cell')) {
  throw new Error("La surimpression commune ne se place pas correctement près de la cellule ou peut masquer inutilement Les Tatins.");
}
if (!app.includes('const cellDistance = radarCellEdgeDistance;')
  || !app.includes('const distanceKm = metric.distanceKm;')
  || !app.includes('const hasEta = Number.isFinite(etaMinutes) && etaMinutes >= 0 && etaMinutes <= 240;')
  || !app.includes('? etaMinutes < 1 ? "0min" : compactMinutesLabel(Math.max(1, etaMinutes))')
  || !app.includes('? etaMinutes < 1 ? "ETA 0min" : "ETA dans " + compactMinutesLabel(Math.max(1, etaMinutes))')
  || !app.includes('class="nowcast-cell-map-head"')
  || !app.includes('<b>Passage ')
  || !app.includes('<b>ETA ')
  || !app.includes('nowcastMetricPictogram("hail", hailLevel, hailLabel, true, true, false)')
  || !app.includes('nowcastMetricPictogram("rain", rainLevel,')
  || !app.includes('nowcastMetricPictogram("lightning", lightningLevel, lightningLabel, true, true, false)')
  || !app.includes('window.METEO_REPLAY ? "Foudre : donnée non archivée" : "Foudre : donnée indisponible"')
  || !app.includes('aria-label="Intensités grêle, pluie et foudre"')
  || !app.includes('<span class="hail">')
  || !app.includes('<span class="rain">')
  || !app.includes('<span class="lightning">')
  || !style.includes('.nowcast-cell-map-intensities { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));')
  || !app.includes('const speed = Number(cell.track?.speedKmh);')
  || !app.includes('const trackedSince = cell.trackedSince ? hourFormat.format(new Date(cell.trackedSince)) : "—";')
  || !app.includes('const confidence = cell.track?.confidence == null ? null : Math.round(Number(cell.track.confidence));')
  || !app.includes('class="nowcast-cell-map-meta"')
  || !app.includes('<small>vitesse</small>')
  || !app.includes('<small>suivi depuis</small>')
  || !app.includes('<small>trajectoire</small>')
  || (app.match(/class="hail-letter"/g) || []).length !== 2
  || !style.includes('.week-metric-pictogram.hail svg .hail-letter')
  || !app.includes('· vitesse " + speedText + " km/h · suivie depuis " + trackedSince + " · confiance trajectoire " + confidenceText')) {
  throw new Error("Le contenu compact de la cellule, son ETA, sa distance au bord ou ses trois indicateurs sont incomplets dans la sandbox.");
}
if (!app.includes('function initializeNowcastCellOverlays(root)')
  || !app.includes('role="button" data-nowcast-cell-trigger="')
  || !app.includes('aria-controls="')
  || !app.includes('aria-expanded="false"')
  || !app.includes('marker.addEventListener("pointerenter", () => show(trigger));')
  || !app.includes('marker.addEventListener("pointerleave", () => restorePinnedOrClose(marker));')
  || !app.includes('marker.addEventListener("focusin", () => show(trigger));')
  || !app.includes('marker.addEventListener("focusout", () => requestAnimationFrame(() => restorePinnedOrClose(marker)));')
  || !app.includes('trigger.addEventListener("click", event => {')
  || !app.includes('trigger.addEventListener("keydown", event => {')
  || !app.includes('if (event.key === "Enter" || event.key === " ")')
  || !app.includes('trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));')
  || !app.includes('if (event.key === "Escape")')
  || !app.includes('map.addEventListener("click", () => {')
  || !app.includes('initializeNowcastCellOverlays(element);')) {
  throw new Error("Le survol, le focus, le clic/tap ou le clavier ne pilotent pas complètement la surimpression de cellule.");
}
for (const legacyCellUi of [
  "nowcast-cells-panel",
  "nowcast-cell-card",
  "nowcast-cell-grid",
  "nowcast-cell-primary",
  "nowcast-cell-distance",
  "nowcast-cell-eta",
  "nowcast-cell-intensity",
  "nowcast-cell-details",
  "nowcast-cell-detail-hazards",
  "nowcast-convective",
  "cell-distance-badge",
  "cell-distance-link",
  "cell-intensity-dot",
  "data-nowcast-cell=\"",
  "disappearedCellCard",
  "showMappedCell",
  "hideMappedCell",
  "showCellDetails",
  "hideCellDetails",
  "panel-selected",
  "map-selected",
  "Distance au centre",
  "Base trajectoire",
  "Horizon trajectoire",
  "Indice pluie radar",
  "Fin de détection",
  '? etaMinutes < 1 ? "Now"',
  "hailLabel, true, hailRisk != null"
]) {
  if (app.includes(legacyCellUi) || style.includes(legacyCellUi)) throw new Error("L’ancien affichage de cellule subsiste dans la sandbox : " + legacyCellUi);
}
if (!changelog.includes(`v${releaseVersion} —`)) throw new Error("La sandbox ne reprend pas la version demandée du changelog.");

console.log("Vérification sandbox terminée : production, cache et administration isolés.");

if (!app.includes("summaryElement.innerHTML = sandboxThreeHourTimeline(") || !style.includes(".horizon-timeline .tone-5")) throw new Error("La frise 3 h et les couleurs About manquent.");

if (!html.includes('id="nowcast-details" class="three-hour-detail" hidden') || style.includes("#nowcast-details{display:none!important}") || !app.includes("sandboxToggleRainDetails()") || app.includes("return; // Carte mise de côté")) throw new Error("Le détail cumul et la carte nowcasting doivent pouvoir s’ouvrir ensemble.");
