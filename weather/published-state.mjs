import { mergeWeatherState } from './state.mjs';

// Published JSON is durable recovery when GitHub's acquisition caches are evicted.
// Only the dedicated Terre Rouge host is read; no API credential is sent here.
export async function restorePublishedWeather({ profile, entry = {}, fetchImpl = fetch }) {
  if (profile.id !== 'terre-rouge') throw new Error('Restauration publique réservée à Terre Rouge.');
  const warnings = [];
  const base = 'https://meteo-terrerouge.github.io/data/';
  const get = async name => {
    try {
      const response = await fetchImpl(base + name + '?restore=' + Date.now(), {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch {
      warnings.push(name + ' inaccessible ; conservation des acquisitions en cache.');
      return null;
    }
  };
  const [dashboard, week] = await Promise.all([get('dashboard.json'), get('week.json')]);
  const data = dashboard?.data;
  if (!data) return { entry, warnings };
  if (data.latitude !== profile.latitude || data.longitude !== profile.longitude) {
    throw new Error('Les données publiques ne correspondent pas aux coordonnées de Terre Rouge.');
  }
  const incoming = { ...data, siteId: profile.id, latitude: profile.latitude, longitude: profile.longitude };
  if (week?.data) incoming.arpegeWeek = week.data;
  return { entry: mergeWeatherState(entry, incoming), warnings };
}
