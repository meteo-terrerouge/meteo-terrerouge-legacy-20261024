import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { releaseVersion } from "./version.mjs";

const pagesDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(pagesDir);
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(pagesDir, "dist");

async function hash(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function filesBelow(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

const identicalFiles = ["nowcast/engine.js", "nowcast/map.js", "forecast-core.js", "app.js", "analytics.js", "manifest.webmanifest", ...await filesBelow(path.join(publicDir, "contact"), "contact"), ...await filesBelow(path.join(publicDir, "news"), "news"), ...await filesBelow(path.join(publicDir, "vendor"), "vendor")];
const publishedFiles = await filesBelow(outputDir);
const forbiddenServerFiles = new Set([
  ".env",
  ".env.example",
  "package.json",
  "package-lock.json",
  "server.mjs",
  "radar.mjs",
  "pam.mjs",
  "pam-worker.mjs",
  "api-archive.mjs",
  "backup-archive.mjs",
  "testing-archive.mjs",
  "testing-archive-worker.mjs",
  "contact-mailer.mjs"
]);
const leakedServerFiles = publishedFiles.filter(relative => forbiddenServerFiles.has(relative.replaceAll("\\", "/")));
if (leakedServerFiles.length) throw new Error(`Des fichiers serveur ont atteint la génération GitHub Pages : ${leakedServerFiles.join(", ")}`);

for (const relative of identicalFiles) {
  const sourceHash = await hash(path.join(publicDir, relative));
  const pagesHash = await hash(path.join(outputDir, relative));
  if (sourceHash !== pagesHash) throw new Error(`${relative} differe entre le site principal et GitHub Pages.`);
}

const composableSkyFiles = [
  "ciel-jour-2.svg", "ciel-jour-3.svg", "ciel-jour-4.svg", "ciel-jour-5.svg", "ciel-jour-tres-peu-nuageux.svg",
  "ciel-nuit-2.svg", "ciel-nuit-3.svg", "ciel-nuit-4.svg", "ciel-nuit-5.svg", "ciel-nuit-tres-peu-nuageux.svg"
];
for (const filename of composableSkyFiles) {
  const svg = await readFile(path.join(outputDir, "pictogrammes", filename), "utf8");
  const transform = svg.match(/data-part="cloud" transform="translate\(([-\d.]+) ([-\d.]+)\) translate\(64 64\) scale\(([-\d.]+)\)/);
  if (!transform) throw new Error(`Le repère du nuage composable manque dans ${filename}.`);
  const cloudBottom = Number(transform[2]) + 64 + (88.5 - 64) * Number(transform[3]);
  if (Math.abs(cloudBottom - 80) > 0.01) throw new Error(`Le nuage de ${filename} n'est pas aligné sur la ligne commune y=80.`);
}
const rainLayer = await readFile(path.join(outputDir, "pictogrammes", "calque-pluie-3.svg"), "utf8");
const snowLayer = await readFile(path.join(outputDir, "pictogrammes", "calque-neige-2.svg"), "utf8");
const hailLayer = await readFile(path.join(outputDir, "pictogrammes", "calque-grele.svg"), "utf8");
const hailTransform = hailLayer.match(/transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)"/);
if ((rainLayer.match(/data-part="drop" d="M[-\d.]+ 92 /g) || []).length !== 3
  || (snowLayer.match(/data-part="snowflake" transform="translate\([-\d.]+ 102\)"/g) || []).length !== 2
  || !hailTransform
  || Math.abs(Number(hailTransform[2]) + 44 * Number(hailTransform[3]) - 92) > 0.01) {
  throw new Error("Les calques pluie, neige et grêle ne partagent plus la ligne de précipitations y=92.");
}

const liveApp = await readFile(path.join(outputDir, "app.js"), "utf8");
const engine = await readFile(path.join(outputDir, "nowcast/engine.js"), "utf8");
const mapEngine = await readFile(path.join(outputDir, "nowcast/map.js"), "utf8");
// Historical semantic checks now inspect the actual computation module too.
const appScript = liveApp + '\n' + engine + '\n' + mapEngine;
if (liveApp.includes('function nowcastLocalStormHazards(') || liveApp.includes('function nowcastPassageFrequencyGrid(')
  || !liveApp.includes('latestForecastData?.nowcast')) throw new Error("Le site doit utiliser les prévisions préparées par le serveur.");
if (/\bactiveRainSource\b/.test(appScript)) throw new Error("L’ancien sélecteur de pluie 3 h subsiste dans app.js.");
if (!appScript.includes('const useOpenMeteo = Boolean(window.METEO_REPLAY && !data.piaf);')) throw new Error("La synthèse pluie 3 h unique Météo-France + Nowcasting est absente.");
if (!appScript.includes("rainShortTerm: true") || !appScript.includes("conditionalIntensity") || !appScript.includes("rainEtaPassage: etaPassage")) throw new Error("La fusion conditionnelle des cumuls PIAF et Nowcasting dans la frise 48 h est incomplète.");
if (appScript.includes('const rainValue = formatRainAmount(rainAmount) + " mm";')) throw new Error("La synthèse pluie 3 h affiche encore directement le cumul total.");
if (!appScript.includes('overview-rain-nowcast-band') || !appScript.includes('overview-nowcast-rain-stripes')) throw new Error("La part Nowcasting n’est pas matérialisée en orange sur la frise 48 h.");
if (!appScript.includes('overview-rain-nowcast-probability') || !appScript.includes('"PIAF : " + basePiaf.toFixed(2) + " mm"') || !appScript.includes('"\\nNowcasting observé : +"') || !appScript.includes('"\\nNowcasting prévu si passage : +"') || !appScript.includes('presence-only') || !appScript.includes('Probabilité de passage : ') || !appScript.includes('--amendment-bottom:') || !appScript.includes('--amendment-height:')) throw new Error("PIAF, l’amendement Nowcasting et sa probabilité ne sont pas séparés sur les frises pluie.");
if (!appScript.includes('function withHourlyNowcast(forecast, hourlyRain, options = {})') || !appScript.includes('options.includeCurrentHour') || !appScript.includes('const forecastStart = hasCurrentShortTerm ? currentHour : nextHour')) throw new Error("L’heure courante couverte par PIAF peut encore disparaître de la frise 48 h.");
if (!appScript.includes('const imminentRise = peakIndex > 0 && peak - immediate > threshold')) throw new Error("Un pic de pluie imminent peut encore être annoncé en baisse.");
if (!appScript.includes('class="storm-summary storm-general"><div class="three-hour-actions"') || !appScript.includes("summaryAction('rain'") || !appScript.includes("summaryAction('storm'") || !appScript.includes("summaryAction('wind'") || !appScript.includes("querySelectorAll('[data-summary-target]')") || appScript.includes('class="three-hour-combined-chart"') || appScript.includes('data-timeline-target')) throw new Error("La synthèse 3 h n’est pas rendue avec les boutons Pluie, Orage et Vent.");
if (!appScript.includes('function threeHourRainMessageSequence(') || !appScript.includes('function mergeThreeHourRainPassages(') || !appScript.includes('const threeHourMessageRotationEnabled = false') || !appScript.includes('if (!threeHourMessageRotationEnabled) return;') || !appScript.includes('three-hour-message-static') || !appScript.includes('item.endKnown === true') || !appScript.includes('detail = "Encore "') || !appScript.includes('detail = "Durée "') || !appScript.includes('data-three-hour-message-sequence') || !appScript.includes('initializeThreeHourMessageSequence(summaryElement)') || !appScript.includes('}, 5000);') || appScript.includes('threeHourRainPassageHistory') || appScript.includes('relation = "Passé"') || appScript.includes('relation = "En cours"') || appScript.includes('relation = hasActive || futureIndex > 0 ? "Ensuite" : "À venir"')) throw new Error("Le message pluie fixe, sans passé et sans durée extrapolée, est incomplet dans la synthèse 3 h.");
if (!appScript.includes('function nowcastEvidenceIsFresh(') || !appScript.includes('signal?.detected === true') || !appScript.includes('String(signal.source || "").trim().length > 0') || !appScript.includes('cell?.polarimetry?.classification === "hail"') || !appScript.includes('function nowcastCellHasIntenseRainSignal(') || !appScript.includes('rainIntensityStep(Math.max(0, Number(cell?.maximum) || 0)) >= 4') || !appScript.includes('const stormCandidateCells = nearbyCells.filter') || !appScript.includes('nowcastCellHasStormEvidence(cell, lightning, radar.observedAt, now)') || !appScript.includes('Math.abs(evidenceTime - radarTime) <= 12 * 60000') || !appScript.includes('Math.abs(currentTime - radarTime) <= 15 * 60000') || !appScript.includes(')) <= 8') || appScript.includes('convectiveSignal === true') || appScript.includes('Number(cell.risks?.storm) >= 30') || appScript.includes('Indice convectif') || appScript.includes('\\nOrage :') || !appScript.includes('const passageCandidates = stormCandidateCells')) throw new Error("La qualification prudente d’une cellule orageuse est incomplète.");
if (!appScript.includes('function polarimetricHailRisk(cell)') || !appScript.includes('scoreBasis !== "fraction-of-compatible-strong-pixels"') || !appScript.includes('return "non évaluée";') || appScript.includes('Grêle : risque " + hailRisk')) throw new Error("Un score de grêle non polarimétrique peut encore être affiché.");
const threeHourLinks = appScript.match(/const threeHourLinks[\s\S]+?;\r?\n\r?\nfunction renderRainApiLinks/)?.[0] || "";
if (!threeHourLinks.includes("nowcastDisplayLink()") || !threeHourLinks.includes('sourceLink("piaf"') || !threeHourLinks.includes('sourceLink("arome"') || !threeHourLinks.includes("lightningLink()") || !threeHourLinks.includes("vigilanceLink()") || threeHourLinks.includes("openMeteoLink()")) throw new Error("Les sources de l’encadré 3 h sont incorrectes.");
if (!appScript.includes("function nowcastCellRainProfilePassages") || !appScript.includes("const rainProfilePassages = nowcastCellRainProfilePassages(cell)") || !appScript.includes("function nowcastProjectionFresh") || !appScript.includes("function nowcastProjectionProfileSignature") || !appScript.includes("const samePassage = passageOverlap") || !appScript.includes("function nowcastEtaRainEligible") || !appScript.includes("event?.projectionReliable === true") || !appScript.includes("nowcastProjectionFresh(event, referenceTime)") || !appScript.includes('["profile", "shape"].includes(event?.projectionKind)') || !appScript.includes("function nowcastEtaRainRateAt") || !appScript.includes("Math.max(0, ...eligibleEvents.map") || !appScript.includes("maximumRate * (end - start) / 3600000")) throw new Error("La sélection prudente, l’expiration ou l’intégration sans double cumul des profils Nowcasting manque.");
if (!appScript.includes('radarCellShapeRuns') || !appScript.includes('raster-shape')) throw new Error("La carte Nowcasting ne dessine pas l’emprise radar réelle des cellules.");
if (!appScript.includes('function nowcastCellOverlayPlacement(') || !appScript.includes('function initializeNowcastCellOverlays(') || !appScript.includes('data-nowcast-cell-trigger') || !appScript.includes('data-nowcast-cell-overlay') || !appScript.includes("Passage ' + escapeText(passageText) + '") || !appScript.includes('ETA \' + escapeText(etaText)') || !appScript.includes('nowcast-cell-map-intensities') || !appScript.includes('nowcast-cell-map-meta') || !appScript.includes('<small>vitesse</small>') || !appScript.includes('<small>suivi depuis</small>') || !appScript.includes('<small>trajectoire</small>') || (appScript.match(/class="hail-letter"/g) || []).length !== 2) throw new Error("La surimpression compacte des cellules ou ses libellés sont absents de la carte Nowcasting.");
if (appScript.includes('nowcast-cells-panel') || appScript.includes('nowcast-cell-card') || appScript.includes('Distance du centre') || appScript.includes('Distance au centre') || appScript.includes('Base trajectoire') || appScript.includes('Horizon trajectoire') || appScript.includes('Indice pluie radar') || appScript.includes('cell-distance-badge')) throw new Error("Une ancienne fiche ou une information technique de cellule subsiste.");
if (!appScript.includes('function nowcastMapCoverage') || !appScript.includes('function nowcastMapIsSaturated') || !appScript.includes('const twentyKmSaturated = nowcastMapIsSaturated(cells);')) throw new Error("Le passage automatique de la carte saturée de 20 à 60 km est absent.");
if (!appScript.includes('function nowcastEtaCellOutsideMap') || !appScript.includes('const etaTargetOutsideTwentyKm = temporalPassageCandidates') || !appScript.includes('.some(candidate => nowcastEtaCellOutsideMap(candidate.cell, 20))') || !appScript.includes('const recommendedMapRadius = twentyKmSaturated || etaTargetOutsideTwentyKm ? 60')) throw new Error("Le passage à 60 km pour toute cellule ETA hors champ est absent.");
if (!appScript.includes('function stormRiskIntensityStep') || !appScript.includes('function stormHazardIntensityStep') || !appScript.includes('function nowcastLocalStormHazards(') || !appScript.includes('nowcastLocalStormHazards(cell, radar, lightning, etaRainEvents, now)') || !appScript.includes('const level = flashes > 0 || rain >= 30 || hailRisk > 0 ? stormHazardIntensityStep(rainLevel, hailLevel, lightningLevel) : null') || !appScript.includes('.filter(candidate => candidate.level != null)') || appScript.includes('const weightedLevel = (rainLevel') || !appScript.includes('function nowcastEtaRainEvents') || !appScript.includes('const stormEtaSelection = nowcastStormEtaSelection(') || !appScript.includes('temporalPassageCandidates.map(candidate => candidate.cell.id)')) throw new Error("Le bouton Orage ne couvre pas correctement les passages ETA et la qualification locale de leur intensité.");
if (!appScript.includes('const stormPassageLevelChange = stormCombinedLevel - previousStormPassageLevel;') || !appScript.includes('displayedLevel: stormCombinedLevel') || !appScript.includes('sameObservationSnapshot?.displayedLevel === stormCombinedLevel')) throw new Error("La flèche Orage ne suit pas l’évolution de l’indicateur composite.");
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
  if (!appScript.includes(expected)) throw new Error("Les libellés pluie et vent ne suivent pas leur intensité ou les détails du vent manquent au survol.");
}
if (!appScript.includes('const stormCombinedLevel = stormRiskIntensityStep(stormPassageLevel, stormIntensityLevel)') || !appScript.includes('function shortTermStormLabel(') || !appScript.includes('function shortTermRainCellLabel(') || !appScript.includes('function shortTermRiskQualifier(') || !appScript.includes('probability >= 80 ? "" : probability >= 55 ? " probable" : " possible"') || !appScript.includes('function shortTermHailQualifier(') || !appScript.includes('const violent = level >= 4;') || !appScript.includes('announcedPassageRiskForCell(selectedStormCell),') || !appScript.includes('selectedStormIntensity.hailRisk,') || !appScript.includes('"Bordure d’orage"') || !appScript.includes('"Bordure de cellule pluvieuse"') || !appScript.includes('"Risque d’orage dans les 3 h"') || !appScript.includes('const rainyCellEtaSelection = rainyCellCandidate') || appScript.includes('cellules à venir') || appScript.includes('Orage s’éloignant') || !appScript.includes('if (hail >= 5) return 5;') || !appScript.includes('if (hail >= 3) return 4;') || !appScript.includes('Math.min(3, lightning)')) throw new Error("Le calcul ou les libellés prudents Orage/Cellule du bouton 3 h sont incomplets.");
if (!appScript.includes('durationMinutes: measuredSpeedKmh > 2')
  || !appScript.includes('const relevantStormDurationUncertain = stormEtaSelection.durationUncertain === true;')
  || !appScript.includes('const relevantStormDurationBeyondHorizon = stormEtaSelection.durationBeyondHorizon === true;')
  || !appScript.includes('const stormDurationLabel = displayedHasEta')
  || appScript.includes('"Durée incertaine"')
  || appScript.includes('"Durée plus de 3 h"')
  || appScript.includes('Pluie projetée ~')
  || !appScript.includes('&& !displayedDurationUncertain')
  || !appScript.includes('&& !displayedDurationBeyondHorizon')
  || !appScript.includes('&& !displayedOnUncertainBorder')
  || !appScript.includes('(displayedActive ? "Encore " : "Durée ")')) throw new Error("Une durée non calculable ou tronquée peut encore être affichée dans la synthèse Orage.");
if (!appScript.includes('function compactMinutesLabel(') || !appScript.includes('String(remaining).padStart(2, "0")') || !appScript.includes('class="nowcast-cell-map-head"') || !appScript.includes('? etaMinutes < 1 ? "0min" : compactMinutesLabel(Math.max(1, etaMinutes))')) throw new Error("Les ETA ne passent pas des minutes au format compact en heures.");
if (!appScript.includes('if (cell?.etaMinutes == null) return null;') || !appScript.includes('const etaMinutes = reliableEvent?.etaMinutes == null ? null : Number(reliableEvent.etaMinutes);') || !appScript.includes('const relevantStormEtaMinutes = stormEtaSelection.etaMinutes == null') || !appScript.includes('? stormLocallyObservedInterior ? 0 : null') || !appScript.includes('const candidates = observedCandidates.filter(event => (event?.arrivalReliable === true')) throw new Error("Une ETA absente ou périmée peut encore être interprétée comme immédiate.");

const adminFiles = await filesBelow(path.join(outputDir, "admin"), "admin");
if (adminFiles.length !== 1 || adminFiles[0] !== path.join("admin", "index.html")) throw new Error("GitHub Pages doit contenir uniquement la redirection d'administration.");
const adminRedirect = await readFile(path.join(outputDir, "admin", "index.html"), "utf8");
if (!adminRedirect.includes('href="https://nicolas.sindelar.fr/meteo-les_tatins/admin/"') || !adminRedirect.includes('http-equiv="refresh"') || !adminRedirect.includes('Content-Security-Policy') || adminRedirect.includes("<script") || /admin\.(?:js|css)/i.test(adminRedirect)) {
  throw new Error("La redirection d'administration GitHub Pages est absente ou contient l'interface privée.");
}

const sourceHtml = await readFile(path.join(publicDir, "index.html"), "utf8");
const pagesHtml = await readFile(path.join(outputDir, "index.html"), "utf8");
const expectedHtml = sourceHtml
  .replace(/\s*<a\b[^>]*class=["'][^"']*\badmin-access\b[^"']*["'][^>]*>.*?<\/a>/is, "")
  .replace(/(<script\s+src=["']analytics\.js\?v=4["']><\/script>)/i, `<script src="runtime-config.js?v=${releaseVersion}"></script>\n$1`);
if (pagesHtml !== expectedHtml) throw new Error("index.html contient une difference autre que le retrait de l'administration et la configuration API.");
if (/\badmin(?:-access|\/)/i.test(pagesHtml)) throw new Error("Une reference a l'administration subsiste dans la page GitHub.");
if (!pagesHtml.includes("<title>Météo les Tatins</title>") || !pagesHtml.includes("<h1>Météo les Tatins</h1>")) throw new Error("Le titre public attendu est absent.");
if (!pagesHtml.includes("Prévisions météo à l’échelle kilométrique via API publiques")) throw new Error("Le sous-titre kilométrique attendu est absent.");
if (!pagesHtml.includes('<meta name="description" content="Prévisions météo ultra-locales pour Les Tatins, à Boulc, Drôme (26410), via des API publiques et le nowcasting. Avertissement en cas de phénomènes violents jusqu’à 3 h à l’avance.">') || !pagesHtml.includes('<meta name="google-site-verification" content="ktzmGxESIf1ub1yuZDzsBGKYQJEbW1SWYMcWCvhaXVE">') || !pagesHtml.includes('<link rel="canonical" href="https://meteo-lestatins.github.io/">')) throw new Error("Les balises techniques invisibles du référencement sont absentes.");
if (!/app\.js\?v=\d+/.test(pagesHtml) || !pagesHtml.includes('analytics.js?v=4') || !/style\.css\?v=\d+/.test(pagesHtml)) throw new Error("Le renouvellement des ressources publiques est absent.");
if (pagesHtml.includes('header-events-link') || pagesHtml.includes('>Événements</a>')) throw new Error("L’accès aux événements subsiste dans l’en-tête public.");
for (const privateEventPath of ["evenements.html", "evenements"]) {
  if (await stat(path.join(outputDir, privateEventPath)).then(() => true).catch(() => false)) throw new Error(`Les événements privés ne doivent pas être publiés sur GitHub Pages (${privateEventPath}).`);
}

const sourceStyle = await readFile(path.join(publicDir, "style.css"), "utf8");
const pagesStyle = await readFile(path.join(outputDir, "style.css"), "utf8");
const expectedStyle = sourceStyle.split(/\r?\n/).filter(line => !line.includes(".admin-access")).join("\n");
if (pagesStyle !== expectedStyle || /admin-access/i.test(pagesStyle)) throw new Error("Les styles GitHub different autrement que par le retrait de l'administration.");
if (!pagesStyle.includes('.three-hour-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }') || !pagesStyle.includes('.three-hour-actions { grid-template-columns: minmax(0, 1fr); gap: 8px; }')) throw new Error("Les trois indicateurs 3 h ne passent pas de trois colonnes à une colonne sur mobile.");
if (!pagesStyle.includes('.three-hour-message-static {') || !pagesStyle.includes('.three-hour-message-static b {') || !pagesStyle.includes('.three-hour-message-static b { min-width: 0; overflow-wrap: anywhere; font-size: 15px; font-weight: 850;') || !pagesStyle.includes('.three-hour-message-sequence {') || !pagesStyle.includes('.three-hour-message[data-position="previous"]') || !pagesStyle.includes('.three-hour-message[data-position="next"]') || !pagesStyle.includes('-webkit-mask-image: linear-gradient(to bottom') || !pagesStyle.includes('@media (prefers-reduced-motion: reduce)')) throw new Error("Le message pluie fixe n’a pas la bonne typographie ou le mécanisme de défilement dormant manque.");
if (!appScript.includes('function threeHourTrendIsSignificant(kind, trend)') || !appScript.includes('threeHourTrendIsSignificant(kind, trend) ? " significant" : ""') || !pagesStyle.includes('.three-hour-trend.significant.croissant b') || !pagesStyle.includes('.three-hour-trend.significant.decroissant b') || pagesStyle.includes('.three-hour-trend.croissant b {') || pagesStyle.includes('.three-hour-trend.decroissant b {')) throw new Error("Les flèches de tendance ne restent pas grises hors changement important.");
if (!pagesStyle.includes('header .header-subtitle { margin-bottom: 10px; font-size: 10px; }')) throw new Error("Le sous-titre principal ne passe pas à 10 px sur mobile.");

const runtime = await readFile(path.join(outputDir, "runtime-config.js"), "utf8");
if (!runtime.includes('apiBase: "https://nicolas.sindelar.fr/meteo-les_tatins/"')) throw new Error("L'API de production GitHub Pages n'est pas configuree.");
if (!runtime.includes('changelogUrl: "changelog.html"') || /changelogUrl:\s*["']https?:/i.test(runtime)) throw new Error("Le changelog GitHub doit rester sur le domaine GitHub Pages.");
if (!runtime.includes(`releaseNumber: "${releaseVersion}"`)) throw new Error(`La version publique GitHub Pages n'est pas verrouillee sur v${releaseVersion}.`);

const changelog = await readFile(path.join(outputDir, "changelog.html"), "utf8");
const changelogBody = changelog.match(/<pre>([\s\S]*?)<\/pre>/)?.[1] || "";
if (!changelog.includes(`v${releaseVersion} —`) || !changelog.includes('analytics.js?v=4') || changelogBody.includes("nicolas.sindelar.fr")) throw new Error("Le changelog GitHub principal ne contient pas la version demandée, le suivi anonyme ou affiche une adresse serveur.");
if (/\n[ \t]*\n/.test(changelogBody)) throw new Error("Le changelog GitHub contient des lignes vides entre les versions.");

const newsScript = await readFile(path.join(outputDir, "news", "news.js"), "utf8");
const newsMarkdownScript = await readFile(path.join(outputDir, "news", "markdown.js"), "utf8");
if (!newsScript.includes("globalThis.newsMarkdownToHtml(content)")) throw new Error("La page News n’utilise pas le parseur Markdown partagé.");
const newsContext = {};
runInNewContext(`${newsMarkdownScript}\nglobalThis.renderedNews = globalThis.newsMarkdownToHtml("# Titre\\n\\nPremier paragraphe.\\n\\nDeuxième paragraphe.\\n\\n- élément");`, newsContext);
if (newsContext.renderedNews !== "<h1>Titre</h1>\n<p>Premier paragraphe.</p>\n<p>Deuxième paragraphe.</p>\n<ul><li>élément</li></ul>") {
  throw new Error("Le rendu Markdown de la page News n’isole pas correctement les titres, paragraphes et listes.");
}

console.log(`Verification terminee : ${identicalFiles.length} fichiers publics identiques, administration remplacée par une redirection.`);
