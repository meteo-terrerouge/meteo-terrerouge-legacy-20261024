import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { mergeWeatherState } from '../weather/state.mjs';
import { siteProfile } from '../sites/profiles.mjs';
const [updatesDirectory, stateDirectory] = process.argv.slice(2);
if (!updatesDirectory || !stateDirectory) throw new Error('Usage : merge-weather-state.mjs mises-a-jour etats');
await mkdir(stateDirectory, { recursive: true });
for (const name of await readdir(updatesDirectory)) {
  if (!name.endsWith('.json')) continue;
  const incoming = JSON.parse(await readFile(path.join(updatesDirectory, name), 'utf8'));
  const profile = siteProfile(incoming.siteId);
  if (incoming.latitude !== profile.latitude || incoming.longitude !== profile.longitude) throw new Error('Coordonnées invalides.');
  const filename = path.join(stateDirectory, profile.id + '.json');
  const previous = await readFile(filename, 'utf8').then(JSON.parse).catch(error => { if (error.code === 'ENOENT') return {}; throw error; });
  await writeFile(filename, JSON.stringify(mergeWeatherState(previous, incoming)));
}
