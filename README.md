# Météo Terre Rouge

Site : https://meteo-terrerouge.github.io/

Les composants graphiques et les collecteurs sont partagés avec Météo les Tatins.
Le profil Terre Rouge utilise Météo-France, sans radar ni nowcasting.

## Publication manuelle

Dans Actions, lancer « Préparer les sites météo » avec :
- site : terre-rouge
- group : all pour les sources arrivées à échéance, piaf pour PIAF uniquement
- publish : true pour publier le résultat sur GitHub Pages

Sans publish, le workflow fournit seulement une archive téléchargeable.
Les données principales sont vérifiées avant publication. Aucune planification automatique n'est activée.
La clé est conservée dans le secret METEO_FRANCE_API_KEY_TERRE_ROUGE.
Ne jamais ajouter une clé dans les sources ou dans les fichiers publics.

## Préparation locale

`npm ci`

`npm run build:site -- --site=terre-rouge`

Le site généré se trouve dans `.cache/sites/terre-rouge/`.
La racine du dépôt contient les sources et ne doit pas servir de racine de publication.
Consulter `sites/README.md` pour l'architecture et les limites actuelles.
