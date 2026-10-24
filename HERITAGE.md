# Héritage automatique — préparation

- Configuration du lieu : site.json.
- Source suivie : nicklausFR/bulletin-local-meteo-france, branche main.
- Chaque exécution récupère et teste main, puis réutilise le même commit pour collecter et publier.
- Une modification du moteur est reprise automatiquement à la prochaine exécution programmée.
- Les cadences PIAF et prévisions, les caches, la restauration publique et le verrou de publication sont conservés.
- La fusion garde la dernière acquisition de chaque source.
- Le mode manuel cached vérifie le raccordement sans nouvelle collecte ; publish reste désactivé par défaut et interdit hors de main.
- Cette branche n'est pas intégrée : le site de production reste sur son fonctionnement actuel.

La fusion de cette PR activera le suivi automatique lors des prochaines exécutions planifiées. Aucun déploiement n'est effectué pendant la préparation.
