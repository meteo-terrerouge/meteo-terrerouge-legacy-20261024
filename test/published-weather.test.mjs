import test from 'node:test';
import assert from 'node:assert/strict';
import { siteProfile } from '../sites/profiles.mjs';
import { publicWeatherFiles, mergeWeatherState } from '../weather/state.mjs';
import { restorePublishedWeather } from '../weather/published-state.mjs';

const profile = siteProfile('terre-rouge');
const state = (fetchedAt = 100) => ({ siteId: profile.id, latitude: profile.latitude, longitude: profile.longitude,
  piaf: { fetchedAt, coverageId: 'RAIN___2026-10-23T12.00.00Z_PT5M', values: [{ seconds: 300, precipitation: .1 }] },
  arome: { fetchedAt, runTime: '2026-10-23T09:00:00Z', hours: [{ time: '2026-10-23T15:00:00Z', rain: 1.15 }] },
  arpegeWeek: { fetchedAt, runTime: '2026-10-23T00:00:00Z', days: [{ date: '2026-10-23' }], hours: [] },
  openMeteo: { fetchedAt, hours: [{ time: '2026-10-24T00:00:00Z', rain: .2 }] } });
const server = (entry, calls = []) => async (url, options) => {
  calls.push({ url, options });
  const files = publicWeatherFiles(profile, entry);
  return { ok: true, json: async () => files[new URL(url).pathname.split('/').at(-1)] };
};

test('un cache évincé est reconstruit depuis les JSON publics du bon lieu, sans transmettre de clé', async () => {
  const original = state(), calls = [];
  const { entry, warnings } = await restorePublishedWeather({ profile, fetchImpl: server(original, calls) });
  assert.deepEqual(entry, original);
  assert.deepEqual(warnings, []);
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.equal(new URL(url).origin, 'https://meteo-terrerouge.github.io');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers, undefined);
    assert.equal(options.cache, 'no-store');
  }
});

test('la restauration et les publications concurrentes gardent le cycle le plus récent de chaque source', async () => {
  const cached = state(200), publicEntry = state(150);
  publicEntry.piaf = { ...publicEntry.piaf, fetchedAt: 300, coverageId: 'RAIN___2026-10-23T12.05.00Z_PT5M' };
  const restored = await restorePublishedWeather({ profile, entry: cached, fetchImpl: server(publicEntry) });
  assert.deepEqual(restored.entry.piaf, publicEntry.piaf);
  assert.deepEqual(restored.entry.arome, cached.arome);
  const lateForecastJob = state(250);
  lateForecastJob.arome = { ...lateForecastJob.arome, runTime: '2026-10-23T12:00:00Z' };
  const merged = mergeWeatherState(restored.entry, lateForecastJob);
  assert.deepEqual(merged.piaf, publicEntry.piaf, 'un traitement long ne republie pas un ancien PIAF');
  assert.deepEqual(merged.arome, lateForecastJob.arome);
});

test('une panne réseau conserve les acquisitions, et une panne week conserve ARPEGE', async () => {
  const cached = state(100);
  const failure = await restorePublishedWeather({ profile, entry: cached, fetchImpl: async () => { throw Error('network'); } });
  assert.strictEqual(failure.entry, cached);
  assert.equal(failure.warnings.length, 2);
  const newer = state(200);
  const partial = await restorePublishedWeather({ profile, entry: cached, fetchImpl: async (url, options) =>
    url.includes('week.json') ? { ok: false, status: 503 } : server(newer)(url, options) });
  assert.deepEqual(partial.entry.arome, newer.arome);
  assert.deepEqual(partial.entry.arpegeWeek, cached.arpegeWeek);
  assert.equal(partial.warnings.length, 1);
});

test('aucune donnée publique des Tatins ni de coordonnées différentes ne peut entrer dans Terre Rouge', async () => {
  const fetchOther = async (url, options) => {
    const response = await server(state())(url, options);
    const payload = await response.json();
    if (url.includes('dashboard.json')) payload.data.latitude += .01;
    return { ok: true, json: async () => payload };
  };
  await assert.rejects(restorePublishedWeather({ profile, fetchImpl: fetchOther }), /coordonnées/);
  await assert.rejects(restorePublishedWeather({ profile: siteProfile('tatins'), fetchImpl: () => { throw Error('ne doit pas être appelé'); } }), /réservée/);
});
