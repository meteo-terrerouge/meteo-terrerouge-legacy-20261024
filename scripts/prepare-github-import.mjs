import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A new destination each time: never clean an existing checkout or import.
const target = path.join(root, '.cache', 'github-import', `terre-rouge-${Date.now()}`);
await mkdir(target, { recursive: true });
const copy = async name => cp(path.join(root, name), path.join(target, name), { recursive: true });
for (const name of ['package.json', 'package-lock.json', '.gitignore', 'CHANGELOG.md',
  'SANDBOX-CHANGELOG.md', 'async-pool.mjs', 'weather', 'sites', 'scripts', '.github']) await copy(name);
await mkdir(path.join(target, 'test'), { recursive: true });
for (const name of ['shared-sites.test.mjs', 'daily-rows.test.mjs', 'published-weather.test.mjs']) await copy('test/' + name);
await cp(path.join(root, 'public'), path.join(target, 'public'), {
  recursive: true,
  filter: source => !path.relative(path.join(root, 'public'), source).split(path.sep).includes('admin')
});
await mkdir(path.join(target, 'github-pages'), { recursive: true });
for (const entry of await readdir(path.join(root, 'github-pages'), { withFileTypes: true })) {
  if (entry.name === 'sandbox-grid' || (entry.isFile() && /\.(mjs|js|css)$/.test(entry.name))) {
    await copy(`github-pages/${entry.name}`);
  }
}
await writeFile(path.join(target, 'README.md'), `# Météo Terre Rouge

Destination prévue : meteo-terrerouge/meteo-terrerouge.github.io.
Sources et composants partagés avec Météo les Tatins ; profil terre-rouge sans radar ni nowcasting.

## Vérifier localement

\`npm ci\`

\`npm run build:site -- --site=terre-rouge\`

## Préparer des données avec GitHub Actions

Ajouter uniquement le secret METEO_FRANCE_API_KEY_TERRE_ROUGE dans Settings → Secrets and variables → Actions.
Puis lancer « Préparer les sites météo » avec site=terre-rouge et group=all.
Télécharger l’artefact site-terre-rouge. Il contient le site statique et ses données publiques.

Cette étape ne publie rien. Ne pas activer Pages à la racine des sources : la sortie à publier est .cache/sites/terre-rouge/.
Le workflow refresh-terre-rouge.yml collecte et publie automatiquement PIAF toutes les 5 min et les autres prévisions chaque heure, uniquement dans le dépôt Terre Rouge.
Son installation sur la branche principale active cette cadence : obtenir l’autorisation explicite de publication avant l’import.
Les jetons et états météo locaux ne font pas partie de cet import.

Consulter sites/README.md pour l’architecture et les limites actuelles.
`);
console.log(target);
