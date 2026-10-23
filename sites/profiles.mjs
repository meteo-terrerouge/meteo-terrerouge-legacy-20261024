const shared = { piaf: true, arome: true, arpege: true, pearome: true, vigilance: true };

export const siteProfiles = Object.freeze({
  tatins: {
    id: 'tatins', name: 'Météo les Tatins', place: 'Les Tatins', latitude: 44.6538, longitude: 5.5995,
    department: '26', timezone: 'Europe/Paris', apiBase: 'https://nicolas.sindelar.fr/meteo-les_tatins/',
    features: { ...shared, nowcasting: true, radar: true, pam: true, lightning: true, openMeteo: true, temperatureNormals: true }
  },
  'terre-rouge': {
    id: 'terre-rouge', name: 'Météo Terre Rouge', place: 'Terre Rouge', latitude: 44.632186, longitude: 5.631626,
    department: '26', timezone: 'Europe/Paris', forecastLayout: 'daily-rows', forecastDays: 16,
    features: { ...shared, nowcasting: false, radar: false, pam: false, lightning: false, openMeteo: true, temperatureNormals: false }
  }
});

export function siteProfile(id) {
  if (!Object.hasOwn(siteProfiles, id)) throw new Error(`Site inconnu : ${id}`);
  return structuredClone(siteProfiles[id]);
}
