import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { siteProfile } from '../sites/profiles.mjs';
import { createForecastCollectors } from '../weather/collectors.mjs';
import { prepareBasicForecast } from '../public/forecast-core.js';
import { sourceDue, mergeWeatherState, publicWeatherFiles } from '../weather/state.mjs';
import { collectWeather } from '../scripts/collect-weather.mjs';
import { prepareSite } from '../scripts/prepare-site.mjs';
import { runInNewContext } from 'node:vm';

const now = Date.parse('2026-10-20T18:10:00Z');
const piaf = { fetchedAt: now, coverageId: 'RAIN___2026-10-20T18.10.00Z_PT5M', values: Array.from({ length: 36 }, (_, i) => ({ seconds: (i + 1) * 300, precipitation: .1 })) };

test('le profil simple utilise PIAF sans radar et expire les échéances réellement écoulées', () => {
  const data = { piaf };
  const first = prepareBasicForecast(data, now);
  assert.equal(first.rainSteps.length, 36);
  assert.ok(first.timelineSlots.length > 0);
  assert.ok(first.timelineSlots.every(slot => !slot.storm && !slot.hail && !slot.nowcast));
  assert.ok(!first.rainTrend.detail.includes('NaN'));
  const later = prepareBasicForecast(data, now + 3600000);
  assert.ok(later.rainTrend.detail.includes('premier signal +5 min'), 'les délais sont relatifs à maintenant et non au début du cycle');
  assert.ok(Math.abs(first.quarterHourRain.reduce((s, v) => s + v.precipitation, 0) - 3.6) < 1e-9);
  assert.equal(first.quarterHourRain.length, 13, 'les quarts d’heure incomplets de bord restent représentés');
  assert.ok(first.hourlyRain.length > 0);
  assert.equal(first.rainSteps.some(v => v.effectiveRadarAmendment > 0 || v.effectiveEtaAmendment > 0), false);
  const expired = prepareBasicForecast(data, now + 4 * 3600000);
  assert.equal(expired.quarterHourRain.length, 0);
  assert.equal(expired.hourlyRain.length, 0);
  assert.equal(expired.timelineSlots.length, 0);
  assert.equal(expired.rainValue, 'Prévision indisponible');
  assert.equal(prepareBasicForecast({}).windValue, 'Indisponible');
});

test('le profil simple alimente la même frise publiée, sans inventer de cellule radar', async () => {
  const forecast = prepareBasicForecast({ piaf, latitude: 44.632186, longitude: 5.631626,
    arome: { hours: [{ time: new Date(now).toISOString(), cloudCover: 100, windSpeed: 5, windGust: 15, stormSignal: true }] } }, now);
  const script = await readFile(new URL('../github-pages/three-hour-timeline.js', import.meta.url), 'utf8');
  const context = { slots: forecast.timelineSlots, now, hourFormat: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
    escapeText: value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    shortTermRiskQualifier: () => 'possible', shortTermWindLabel: () => 'Vent', stormRiskIntensityStep: () => 0 };
  runInNewContext(script + '\nresult = sandboxThreeHourTimeline(slots, now);', context);
  assert.ok(context.result.includes('class="horizon-scroll'));
  assert.ok(context.result.includes('class="horizon-period'));
  assert.ok(context.result.includes('pictogrammes/calque-pluie-'));
  assert.ok(!context.result.includes('Signal AROME'));
  assert.ok(context.result.includes('Orage possible'));
  assert.ok(context.result.includes('pictogrammes/calque-orage.svg'));
  const withoutStorm = prepareBasicForecast({ piaf, latitude: 44.632186, longitude: 5.631626,
    vigilance: { stormSignal: true },
    arome: { hours: [{ time: new Date(now).toISOString(), cloudCover: 100, windSpeed: 5, windGust: 15, stormSignal: false }] } }, now);
  assert.ok(withoutStorm.timelineSlots.every(slot => !slot.modelStorm), 'une alerte plus large ne devient pas un orage au point');
  assert.deepEqual(forecast.timelineSlots.map(slot => [slot.level, slot.label]), withoutStorm.timelineSlots.map(slot => [slot.level, slot.label]), 'les précipitations restent celles de PIAF');
  assert.ok(!context.result.includes('data-open-nowcast-link'));
});

test('les créneaux écoulés restent visibles et grisés même sans historique acquis', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('  const periodCard =');
  const end = source.indexOf('  const openMeteoByDate =', start);
  const context = { forecastPeriodAvailable: () => false, appNow: () => now,
    forecastLocalDateTime: () => new Date(now - 3600000), slotDateKey: date => date,
    escapeText: value => String(value) };
  const script = source.slice(start, end) + '\nresult = periodCard(null, "Matin", "", {endHour:12}, "2026-10-20", "2026-10-20:morning");';
  runInNewContext(script, context);
  assert.ok(context.result.includes('daily-period-past'));
  assert.ok(context.result.includes('Matin'));
  assert.ok(context.result.includes('Prévisions de cette période non acquises.'));
  context.forecastLocalDateTime = () => new Date(now + 3600000);
  runInNewContext('{ ' + script + ' }', context);
  assert.equal(context.result, '', 'une période future sans données reste indisponible');
});

test('les corrections radar stockées ne contaminent pas PIAF dans le profil simple', () => {
  const contaminated = { ...piaf, values: piaf.values.map(v => ({ ...v, nowcastPrecipitation: 99, radarAdjustedPrecipitation: 99 })) };
  assert.deepEqual(prepareBasicForecast({ piaf: contaminated }, now), prepareBasicForecast({ piaf }, now));
});

test('les caches et états de lieux différents ne sont jamais mélangés ; une publication ancienne ne remplace pas une récente', () => {
  const p = siteProfile('terre-rouge');
  const state = { siteId: p.id, latitude: p.latitude, longitude: p.longitude, arome: { fetchedAt: 20, runTime: '2026-10-20T12:00:00Z' } };
  assert.throws(() => mergeWeatherState(state, { ...state, siteId: 'tatins' }));
  assert.equal(mergeWeatherState(state, { ...state, arome: { fetchedAt: 30, runTime: '2026-10-20T09:00:00Z' } }).arome, state.arome);
  assert.equal(mergeWeatherState(state, { ...state, arome: { fetchedAt: 10, runTime: '2026-10-20T12:00:00Z' } }).arome, state.arome);
  assert.ok(sourceDue('arpegeWeek', { arpegeWeek: { fetchedAt: now, activeDayValidUntil: new Date(now - 1).toISOString() } }, now));
  assert.ok(!sourceDue('piaf', { piaf: { fetchedAt: now } }, now + 60000));
});

test('le collecteur commun interroge les coordonnées demandées et conserve les cumuls PIAF PT5M', async () => {
  const date = new Date(Date.now() - 600000).toISOString().slice(0, 19).replace(/T(\d\d):(\d\d):(\d\d)/, 'T$1.$2.$3') + 'Z';
  const id = 'RAIN___' + date + '_PT5M';
  const requests = [];
  const api = createForecastCollectors({ piafWcs: 'https://example.test', piafApiKey: 'test', mfText: async url => {
    requests.push(String(url));
    return String(url).includes('GetCapabilities') ? `<wcs:CoverageId>${id}</wcs:CoverageId>` : '<gml:tupleList>0.1</gml:tupleList>';
  } });
  const p = siteProfile('terre-rouge');
  const result = await api.buildPiaf(p.latitude, p.longitude, { done: 0 });
  assert.equal(result.values.length, 36);
  assert.equal(result.values[0].precipitation, .1);
  assert.equal(requests.length, 37);
  const subsets = new URL(requests[1]).searchParams.getAll('subset');
  assert.ok(subsets.includes(`lat(${p.latitude})`));
  assert.ok(subsets.includes(`long(${p.longitude})`));
});

test('une collecte en échec garde les dernières prévisions ; le groupe PIAF ne lance aucun autre modèle', async () => {
  const profile = siteProfile('terre-rouge');
  const previous = { ...piaf, fetchedAt: Date.now() - 3600000 };
  const result = await collectWeather({ profile, entry: { piaf: previous }, group: 'piaf', token: 'SECRET-TEST', collectors: {
    buildPiaf: async () => { throw new Error('Erreur SECRET-TEST'); },
    buildArome: () => { throw new Error('AROME ne doit pas être appelé'); }
  } });
  assert.equal(result.entry.piaf, previous);
  assert.deepEqual(result.errors, [{ source: 'piaf', message: 'Erreur [masqué]' }]);
  await assert.rejects(collectWeather({ profile, entry: { siteId: 'tatins' }, collectors: {} }), /autre lieu/);
});

test('ARPEGE renouvelle la journée active même si son cache de six heures n’est pas expiré', async () => {
  const api = createForecastCollectors({ arpegeWcs: 'https://example.test', cacheExpired: () => false,
    mfText: async () => { throw new Error('nouvelle acquisition demandée'); } });
  const previous = { runTime: new Date().toISOString(), days: [{}, {}, {}, {}], hours: [{}], activeDayValidUntil: new Date(Date.now() - 60000).toISOString() };
  await assert.rejects(api.buildArpegeWeek(44, 5, {}, previous), /nouvelle acquisition demandée/);
});

test('les deux sites partagent à l’octet près les scripts, styles et symboles, avec des identités et caches séparés', async () => {
  const outputTatins = await prepareSite({ id: 'tatins', output: '.cache/sites/test-tatins' });
  const outputTerre = await prepareSite({ id: 'terre-rouge', output: '.cache/sites/test-terre-rouge' });
  for (const asset of ['app.js', 'style.css', 'forecast-core.js', 'daily-rows.js', 'nowcast/engine.js', 'pictogrammes/calque-pluie-3.svg']) {
    const hash = async dir => createHash('sha256').update(await readFile(`${dir}/${asset}`)).digest('hex');
    assert.equal(await hash(outputTatins), await hash(outputTerre), asset);
  }
  const html = await readFile(`${outputTerre}/index.html`, 'utf8');
  assert.ok(html.includes('<h1>Météo Terre Rouge</h1>'));
  assert.ok(html.includes('class="forecast-rows-layout"'));
  assert.ok(html.includes('id="piaf-three-hour-chart"'));
  assert.ok(html.includes('<p class="header-subtitle">Prévisions météo Météo-France à l’échelle kilométrique</p>'));
  assert.equal((html.match(/<h2 id="three-hour-title">Les 3 prochaines heures<\/h2>/g) || []).length, 1);
  assert.ok(!html.includes('<h2 id="three-hour-title">Dans les 3 h</h2>'));
  assert.ok(!(await readFile(`${outputTatins}/index.html`, 'utf8')).includes('id="piaf-three-hour-chart"'));
  assert.match(html, /<article class="forecast-day-row three-hour-card" aria-labelledby="three-hour-title">\s*<div class="forecast-day-header">\s*<h2 id="three-hour-title">Les 3 prochaines heures<\/h2>/);
  assert.ok(html.includes('Prévisions quotidiennes sur 16 jours'));
  assert.ok(!html.includes('Météo les Tatins'));
  assert.ok(!html.includes('google-site-verification'));
  const release = JSON.parse(await readFile(`${outputTerre}/data/config.json`, 'utf8')).releaseNumber;
  const styleUrl = `style.css?v=${release.replaceAll('.', '')}`;
  assert.ok(html.includes(styleUrl), 'la feuille de style est versionnée avec la version réellement publiée');
  assert.ok(html.includes('horizon-detail-track'), 'le détail pluie doit suivre la présentation publiée');
  assert.ok(!html.includes('Carte radar'), 'le bouton radar est réservé aux Tatins');
  assert.ok(!html.includes('about.html'));
  assert.ok(!html.includes('id="app-version"'));
  assert.ok((await readFile(`${outputTatins}/index.html`, 'utf8')).includes('id="app-version"'));
  const sharedApp = await readFile(`${outputTerre}/app.js`, 'utf8');
  assert.match(sharedApp, /function renderThreeHourSummary\(forecast\) \{\s*const summaryElement = \$\("three-hour-summary"\);\s*if \(dailyRowsLayout\)/);
  assert.ok(sharedApp.includes('function sandboxThreeHourTimeline('), 'le rendu de la frise publiée est partagé');
  assert.ok(sharedApp.includes('summaryElement.innerHTML = sandboxThreeHourTimeline(forecast.timelineSlots'));
  assert.ok(sharedApp.includes("summaryElement.insertAdjacentHTML('afterbegin', cycleLabel)"));
  assert.ok((await readFile(`${outputTerre}/style.css`, 'utf8')).includes('.horizon-scroll'));
  const worker = await readFile(`${outputTerre}/service-worker.js`, 'utf8');
  assert.ok(worker.includes(styleUrl), 'le service worker précharge la même URL CSS que la page');
  assert.ok(worker.includes('k.startsWith(prefix)'));
  assert.ok(worker.includes('meteo-terre-rouge-'));
  assert.equal(JSON.parse(await readFile(`${outputTerre}/manifest.webmanifest`, 'utf8')).scope, './');
  const config = await readFile(`${outputTerre}/runtime-config.js`, 'utf8');
  assert.ok(config.includes('"dataMode": "static"'));
  assert.ok(!config.includes('apikey'));
  assert.ok(publicWeatherFiles(siteProfile('terre-rouge'))['dashboard.json'].data.nowcast === undefined);
  await assert.rejects(prepareSite({ id: 'terre-rouge', output: '.' }), /sortie/);
});
