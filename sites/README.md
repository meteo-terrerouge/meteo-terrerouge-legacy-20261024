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
Il prépare un ou deux sites et fournit des archives téléchargeables. Par défaut,
il ne déploie rien. L'option explicite `publish=true`, réservée au dépôt
`meteo-terrerouge/meteo-terrerouge.github.io` et au profil `terre-rouge`, publie
la sortie générée sur Pages après vérification des données principales.
Les secrets à configurer
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
Le profil Terre Rouge lit uniquement ses JSON statiques. Sa collecte récupère
Open-Meteo sans clé privée, jusqu’à 16 jours, avec un renouvellement horaire
et conservation du dernier résultat valide en cas d’échec. Le navigateur ne
contacte pas Open-Meteo ni le serveur des Tatins pour ces prévisions.

La vue `daily-rows` affiche une frise combinée par jour, sans défilement
horizontal. Les informations et le réglage de hauteur se placent au-dessus.
Le pas affiché dépend uniquement de la largeur disponible : les courbes de
température gardent les points horaires disponibles, les annotations et
pictogrammes sont espacés et la pluie est cumulée par créneau affiché sans
perte de volume. Aucune adaptation au pas natif des modèles n’est activée.
Pour aujourd’hui, la frise conserve la journée entière, de minuit à minuit.
Un voile fortement grisé et désaturé couvre les heures écoulées, y compris les
pictogrammes et la pluie, jusqu’au repère de l’heure actuelle exacte. Les totaux
portent sur la journée complète ; les données manquantes restent absentes.
Température et précipitations sont seules visibles
par défaut ; les pictogrammes météo restent dans une rangée fixe, alignés sous
les horaires, indépendamment des déplacements des courbes. Leurs colonnes
réservent au moins 64 pixels pour rendre lisibles les pictogrammes agrandis.
Les pictogrammes mesurent 69 pixels (+15 %). Pour aujourd’hui, un pictogramme
« Ce soir » reste visible au-dessus du voile grisé lorsqu’aucun créneau futur
ne peut plus accueillir un pictogramme, même dans la dernière minute.
Les barres de pluie partent du bord inférieur du graphique, sans marge horaire.
Les bords utilisent les points acquis des jours voisins pour prolonger les
courbes jusqu’aux limites du graphique. La pluie des marges ne rentre pas dans
le total du jour. Les prolongements sans données restent vides.
Le fond jour/nuit
reprend le fondu continu et les couleurs de la frise 48 h des Tatins. La
nébulosité s’affiche en zone grisée translucide, sans ligne ni marqueurs.
Les commandes de la frise 48 h sont partagées avec cette vue : clic pour
afficher/masquer, glissement vertical pour déplacer les courbes et horizontal
pour la transparence. Vent, rafales et nébulosité sont activables. Le signal
orageux est intégré au pictogramme météo, sans commande ni courbe distincte.
Chaque journée dispose aussi d’un réglage de hauteur de 240 à 480 pixels et
d’une réinitialisation. Les réglages sont conservés à l’actualisation
des données pendant la session ; les Tatins gardent leur présentation.
AROME puis ARPEGE ont priorité sur les échéances acquises ; Open-Meteo
complète les champs absents et prolonge la série. Ses modèles sont choisis
automatiquement par le service pour atteindre la portée de 16 jours.
À partir du huitième jour, les lignes sont marquées « Tendance ».

Une frise indépendante couvre les trois prochaines heures : pluie PIAF au
pas source de cinq minutes, courbe de température et pictogrammes météo.
Température et nébulosité suivent les mêmes priorités de sources que les jours.
Les pictogrammes pluvieux utilisent uniquement l’intensité PIAF disponible.
Elle affiche l’intensité en mm/h et le cumul restant sur la période réellement
couverte. Les échéances expirées sont retirées, les lacunes ne sont pas reliées
et aucune donnée n’est prolongée au-delà de sa validité. Sans PIAF valide, elle
signale l’indisponibilité dans l’accessibilité et l’infobulle de sa légende tout
en gardant température et ciel s’ils sont acquis. Aucun paragraphe d’aide n’est
ajouté sous les graphiques. La rubrique porte un seul titre « Les 3 prochaines
heures » et le sous-titre d’origine du site est conservé.

Les cumuls ARPEGE sur plusieurs heures sont répartis selon le recouvrement
de chaque heure, sans addition aux pluies AROME ou Open-Meteo de la même
période. Les champs continus ARPEGE sont interpolés entre points disponibles
(écart maximal de six heures). Les codes Open-Meteo 95, 96 et 99 indiquent
un orage possible : ils ne sont pas transformés en probabilité chiffrée.
Les champs inconnus restent absents des graphiques. Les journées partielles
et leurs cumuls incomplets sont signalés.

Avant activation en continu : choisir les dépôts/URL et la publication des
données, garantir une restauration durable hors du cache Actions, séparer les
exécutions PIAF courtes des collectes longues, puis raccorder progressivement
les acquisitions communes des Tatins à Actions. Ce dernier basculement n'est
pas activé dans cette première étape : il devra préserver les instantanés
cohérents du nowcasting et la cadence PIAF des Tatins. Actions ne garantit pas
un lancement ponctuel et sa planification minimale est de 5 min.

Le workflow `refresh-terre-rouge.yml` prépare une collecte PIAF toutes les 5 min
(minutes 3, 8, etc.) et les autres prévisions chaque heure à la minute 17 UTC.
Les deux collectes sont indépendantes ; les durées de cache restent propres
à chaque source (AROME et Open-Meteo 1 h, ARPEGE 6 h, etc.). La planification
GitHub peut démarrer en retard ; ce n'est pas une garantie à la minute.
La publication fusionne les dernières acquisitions par cycle et date de
collecte, sous un verrou couvrant fusion, génération et déploiement. Un
traitement prévision long ne doit pas remplacer un PIAF plus récent.
Les caches PIAF, prévisions et fusion finale sont séparés ; les JSON publics
servent de restauration durable si GitHub évince les caches. Une panne
partielle garde les acquisitions réussies et est signalée en échec dans Actions.
Le workflow est limité au dépôt Terre Rouge : aucune collecte ou publication
Tatins. Son installation sur la branche par défaut active la planification et
la publication automatique, explicitement autorisées par l’utilisateur le
23 octobre 2026. Le workflow manuel reste disponible pour les diagnostics.

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
