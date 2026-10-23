# Météo Terre Rouge

Destination prévue : meteo-terrerouge/meteo-terrerouge.github.io.
Sources et composants partagés avec Météo les Tatins ; profil terre-rouge sans radar ni nowcasting.

## Vérifier localement

`npm ci`

`npm run build:site -- --site=terre-rouge`

## Préparer des données avec GitHub Actions

Ajouter uniquement le secret METEO_FRANCE_API_KEY_TERRE_ROUGE dans Settings → Secrets and variables → Actions.
Puis lancer « Préparer les sites météo » avec site=terre-rouge et group=all.
Télécharger l’artefact site-terre-rouge. Il contient le site statique et ses données publiques.

Cette étape ne publie rien. Ne pas activer Pages à la racine des sources : la sortie à publier est .cache/sites/terre-rouge/.
Le workflow refresh-terre-rouge.yml collecte et publie automatiquement PIAF toutes les 5 min et les autres prévisions chaque heure, uniquement dans le dépôt Terre Rouge.
Son installation sur la branche principale active cette cadence : obtenir l’autorisation explicite de publication avant l’import.
Les jetons et états météo locaux ne font pas partie de cet import.

Consulter sites/README.md pour l’architecture et les limites actuelles.
