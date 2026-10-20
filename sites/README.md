# Un code météo, deux profils

Les collecteurs de `weather/collectors.mjs` sont utilisés par le serveur des
Tatins et par `scripts/collect-weather.mjs`. Aucun serveur ne démarre à leur
importation. Les jetons restent fournis à l'exécution et ne sont jamais copiés
dans les profils, les JSON publics ou le site généré.

`sites/profiles.mjs` définit les coordonnées, l'identité et les fonctions de
chaque lieu. Les fichiers `public/app.js`, `public/style.css`, les composants
graphiques et tous les pictogrammes restent communs aux deux sites.

La préparation des profils réutilise la chaîne de génération du site GitHub
Pages (`prepare-pages`, `prepare-sandbox`, `prepare-release`), et pas seulement
le dossier `public/`. Les deux profils reçoivent ainsi les styles, la frise
trois heures et les adaptations graphiques de la version effectivement publiée.
Terre Rouge alimente cette même frise avec PIAF et AROME, sans trajectoires radar.

## Préparation locale

```powershell
npm run build:site -- --site=terre-rouge
npm run build:site -- --site=tatins
```

Les sorties sont respectivement `.cache/sites/terre-rouge/` et
`.cache/sites/tatins/`. Sans état météo, Terre Rouge indique que les données
sont en attente. Ces sorties ne sont pas déployées par les scripts.

La collecte lit exclusivement `METEO_FRANCE_API_KEY` dans l'environnement du
processus. Après avoir renseigné cette variable localement, sans la publier :

```powershell
npm run collect:site -- --site=terre-rouge --state=.cache/weather/terre-rouge.json --output=.cache/weather/terre-rouge.json
npm run build:site -- --site=terre-rouge --state=.cache/weather/terre-rouge.json
```

`--group=piaf` limite la collecte à PIAF ; `--group=forecast` traite les autres
sources. Les règles existantes de renouvellement restent utilisées : PIAF
4 min, AROME 1 h, PE-AROME 3 h, intervalles 6 h, vigilance 30 min, ARPEGE 6 h
ou passage à la prochaine échéance active. Une exécution ne recharge pas une
source encore valide. Les derniers résultats réussis survivent aux échecs.

Les dates de validité viennent des cycles météo, pas de la date de
publication. Le profil simple utilise les mêmes agrégations PIAF et les mêmes
graphiques que les Tatins, sans corrections radar. Les échéances PIAF périmées
sont retirées ; une absence de données ne devient pas « pas de pluie ».
Le référentiel de normales de température actuellement propre aux Tatins
n'est pas appliqué à Terre Rouge.

## GitHub Actions : première étape manuelle

Le workflow `prepare-weather-sites.yml` est uniquement déclenchable à la main.
Il prépare un ou deux sites et fournit des archives téléchargeables. Il ne
déploie rien et n'écrit pas dans un dépôt distant. Les secrets à configurer
dans le dépôt choisi sont `METEO_FRANCE_API_KEY_TATINS` et
`METEO_FRANCE_API_KEY_TERRE_ROUGE` : aucun repli d'un jeton sur l'autre lieu.

Un cache GitHub distinct par lieu conserve l'état entre les exécutions. Un
échec partiel reste signalé dans Actions, même si une archive avec les
dernières données valides a pu être construite. Le cache GitHub reste un
accélérateur qui peut être évincé ; avant une exploitation continue, les
dernières données publiées devront également servir de restauration durable.

## Migration des Tatins et étapes restantes

Le profil Tatins utilise pour l'instant l'API du serveur actuel. Son radar,
PAM, sa foudre, le nowcasting, l'administration et la cadence PIAF actuelle
restent côté serveur. Le serveur utilise déjà le module de collecteurs commun.
Le profil Terre Rouge lit uniquement ses JSON statiques et n'appelle ni le
serveur des Tatins ni Open-Meteo.

Avant activation en continu : choisir les dépôts/URL et la publication des
données, garantir une restauration durable hors du cache Actions, séparer les
exécutions PIAF courtes des collectes longues, puis raccorder progressivement
les acquisitions communes des Tatins à Actions. Ce dernier basculement n'est
pas activé dans cette première étape : il devra préserver les instantanés
cohérents du nowcasting et la cadence PIAF des Tatins. Actions ne garantit pas
un lancement ponctuel et sa planification minimale est de 5 min.

Le déploiement reste effectué par l'utilisateur.

## Préparation du dépôt Terre Rouge

Le compte prévu est `meteo-terrerouge`, le dépôt
`meteo-terrerouge.github.io` et l'adresse finale
`https://meteo-terrerouge.github.io/`.

`node scripts/prepare-github-import.mjs` prépare un nouveau dossier sous
`.cache/github-import/`, avec une liste explicite des sources nécessaires.
Il n'embarque ni `.env`, ni états météo locaux, ni historique Git, ni serveur
des Tatins. La génération utilise toujours les mêmes sources graphiques et
collecteurs. Ce dossier est un instantané d'import : les évolutions restent
à effectuer dans le code commun puis à synchroniser, sans créer de variantes
manuelles des composants dans chaque dépôt.

Dans le dépôt Terre Rouge, seul le secret
`METEO_FRANCE_API_KEY_TERRE_ROUGE` est nécessaire. Le workflow manuel doit être
lancé avec `site=terre-rouge`. La première vérification consiste à télécharger
l'artefact et vérifier ses données avant d'activer la publication. Pages ne
doit pas publier la racine des sources : le site généré est la sortie
`.cache/sites/terre-rouge/`.
