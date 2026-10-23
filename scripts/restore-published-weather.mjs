import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { siteProfile } from '../sites/profiles.mjs';
import { restorePublishedWeather } from '../weather/published-state.mjs';

const arg = (name, fallback) => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const profile = siteProfile(arg('site', 'terre-rouge'));
const filename = path.resolve(arg('state', '.cache/weather-state/terre-rouge.json'));
const entry = await readFile(filename, 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return {};
  throw error;
});
const result = await restorePublishedWeather({ profile, entry });
await mkdir(path.dirname(filename), { recursive: true });
await writeFile(filename + '.tmp', JSON.stringify(result.entry));
await rename(filename + '.tmp', filename);
for (const warning of result.warnings) console.log('::warning::' + warning);
console.log('Restauration Terre Rouge : ' + ['piaf', 'arome', 'arpegeWeek', 'openMeteo'].filter(key => result.entry[key]).join(', '));
