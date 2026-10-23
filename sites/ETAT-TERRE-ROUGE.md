# Survol sans date — v3.295

- Correction demandée : retirer la date et l’heure entre parenthèses du survol
  des indicateurs 3 h et journées. Conserver la source et l’âge en minutes/heures.
- Exemple : « PIAF : il y a 12 min ». Indicateur non interactif et seuils inchangés.

# Publication vérifiée — v3.294

- Commit Terre Rouge 30c02f8cef10c9265f884ec0116430c965b18933 ; exécution
  40014635470 : collecte PIAF et déploiement réussis.
- Navigateur public : « Pas de pluie » sans partiel ; survol par source avec âge
  (ex. AROME il y a 49 min), date exacte conservée ; PIAF acquis à 21:51.
- Vérification serveur pour la suite : SSH nicklaus@nicolas.sindelar.fr accessible,
  service meteo-boulc actif, environ 76 Go libres, Node système v18.19.1.
  sudo non interactif refuse : mot de passe nécessaire. Aucune modification serveur.
- La fiabilisation de la cadence de collecte demeure à faire, indépendamment
  de la correction des libellés. Ne pas présenter la relance manuelle comme une solution.

# Correction du survol et de la frise — 23 octobre 2026, v3.294

- L’indicateur non interactif affiche pour chaque source l’âge en minutes ou heures,
  puis la date et l’heure exactes. Même rendu dans la frise 3 h et les jours.
- « Pas de pluie » dans la frise n’est plus suivi de « partiel » lorsque les valeurs
  acquises sont nulles. La couverture reste décrite au survol du cumul ; un cumul
  positif incomplet conserve sa précision, sans changer ni compléter les données.
- Seuils de fraîcheur et collecte inchangés. La fiabilisation du renouvellement
  reste à traiter : ordonnanceur GitHub irrégulier et cache Pages constatés.
- Validation : 83 tests check:sites passent et syntaxe app.js vérifiée.

# Audit de fraîcheur PIAF — 23 octobre 2026, vers 21 h 37

L’utilisateur signale « actualisation ancienne » après publication et demande
si GitHub Actions est réellement programmé. Audit en lecture seule, aucun réglage modifié.

- Workflow 394028127 actif, cron toutes les 5 min aux minutes 3, 8, etc. et prévisions
  à la minute 17. La cadence des départs réellement observés est irrégulière :
  dernières exécutions planifiées à 20:46, 20:57 puis 21:21 ; aucune autre à 21:36.
- Exécution 40010739549 réussie : 37 requêtes PIAF, aucune erreur, acquisition
  à 21:21:55, cycle 19:10 UTC. Artefact weather-update-piaf téléchargé et vérifié.
- Artefact Pages github-pages 12525389000 de cette même exécution : contient bien
  le nouveau PIAF acquis à 21:21:55. Déploiement automatique 7286843817 réussi.
- Pourtant à 21:36:52, le JSON public renvoyait toujours le cycle 19:05 UTC acquis
  à 21:17:13, même avec URL unique et requête no-cache. En-têtes : X-Cache HIT,
  Age 523, Cache-Control max-age=600, Last-Modified 19:17:39 UTC.
  Un décalage de cache Pages s’ajoute donc aux déclenchements irréguliers.
- Documentation officielle GitHub : les événements schedule peuvent être
  retardés, voire abandonnés sous charge. Source :
  https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
- Ne pas promettre un renouvellement fiable toutes les 5 min avec ce seul
  montage GitHub Actions + GitHub Pages. Le workflow est correctement programmé
  et fonctionne, mais l’âge des JSON effectivement servis doit rester surveillé
  et l’indicateur ne doit pas être artificiellement reverdi.

# Version publiée — 23 octobre 2026, v3.293

- Publication vérifiée sur https://meteo-terrerouge.github.io/ : nouveau titre,
  seize cartes, huit mentions Tendance, aucun saint du jour.
- Commit de production : 3650feacac2323163e260f1fb960a9c0fc7e7e0c.
- Exécution de collecte et publication réussie : 40010114426
  (https://github.com/meteo-terrerouge/meteo-terrerouge.github.io/actions/runs/40010114426).
  PIAF et prévisions : succès ; déploiement Pages : succès.
- JSON publics vérifiés : version 3.293, coordonnées cibles correctes, cycle PIAF
  du 23/10 à 19:05 UTC récupéré à 21:17 heure de Paris, AROME récupéré à 21:02.
  Navigateur public : indicateur vert, données récentes et aucune erreur console.
- Scripts et styles publics comparés à l’aperçu validé : identiques après
  normalisation CRLF/LF (différence Windows/Linux uniquement).
- Workflow refresh-terre-rouge.yml actif et inchangé : PIAF toutes les 5 min,
  prévisions contrôlées chaque heure selon leurs cycles ; publication automatique.
  Les départs réels restent soumis à l’ordonnanceur GitHub. Navigateur : JSON relus
  chaque minute. La version en ligne utilise les données régulièrement publiées.
- Premier renouvellement planifié après publication vérifié : exécution
  40010739549, événement schedule, commit 3650fea ; collecte PIAF et publication
  réussies. Le fonctionnement automatique a donc été observé sur la nouvelle version.
- Déploiement Pages initial : 7286752833, environnement github-pages.
- Point de restauration v3.280 conservé. Copie locale dédiée propre après commit.
- Contrôles : 393 tests, check et check:pages passent dans le code commun ;
  82 tests check:sites passent dans le dépôt dédié.
- Capture publique : terre-rouge-publie-v3293.png dans les visualisations du chat.

# Publication autorisée — 23 octobre 2026, v3.293

L’utilisateur demande explicitement « on vire la Saint du jour et on publie »,
puis confirme que les données en ligne doivent être actualisées régulièrement.
Cette demande autorise la publication de la présentation validée sur Terre Rouge.

- Saint du jour retiré : code de récupération, lien, styles et autorisation CSP
  Nominis supprimés. Aucun appel externe au calendrier.
- Présentation des cartes activée dans le profil Terre Rouge par défaut ; les
  workflows de génération n’ont plus besoin d’une option expérimentale.
- En-tête Boulc>Terre Rouge, altitude et coordonnées cibles, soleil sans flèches
  avec Levé/Couché, phase lunaire ; frise 3 h et seize jours avec Tendance conservés.
- Sources et collecte inchangées : PIAF planifié toutes les 5 min, contrôle des
  autres prévisions chaque heure avec caches et cycles natifs, publication
  automatique sérialisée. Les déclenchements réels peuvent être retardés par GitHub.
  Les navigateurs relisent les données publiées chaque minute.
- Dépôt vérifié : meteo-terrerouge/meteo-terrerouge.github.io, main.
  Site : https://meteo-terrerouge.github.io/. Sauvegarde v3.280 et son tag conservés.
- Contrôles avant publication : 393 tests passent, check et check:pages passent ;
  aperçu généré avec le profil de production et des JSON publics récents : seize
  cartes, nouveau titre, aucune mention ni connexion Nominis.

# Pictogrammes solaires — 23 octobre 2026, v3.292 non publiée

- Les libellés visibles Lever/Coucher du soleil sont remplacés par deux SVG
  assortis : soleils sur un horizon, sans flèches (correction utilisateur),
  lever jaune et coucher orangé. Heures conservées à côté.
- Mentions « Levé » et « Couché » à côté des pictogrammes et des horaires ;
  libellés complets au survol et noms accessibles. Phase lunaire conservée.
- Titre agrandi : 30 à 48 px selon l’écran, sans espaces autour du chevron.
  « Terre Rouge » reste groupé sur mobile.
- Saint du jour récupéré par l’API officielle Nominis, avec date explicite en
  Europe/Paris et contrôle de la date retournée. Seuls nom et lien sont utilisés ;
  aucun HTML tiers injecté. Lien HTTPS vers Nominis pour l’attribution.
- Une acquisition par date dans la page ; nouvel essai après 15 min si échec,
  délai de 8 s. Pas de saint périmé après minuit. Connexion externe ajoutée à la
  CSP uniquement pour l’aperçu ; les données météo restent locales.
- Source et documentation : https://nominis.cef.fr/contenus/integrations.html ;
  API https://nominis.cef.fr/json/saintdujour.php?annee=2026&mois=10&jour=23.
- Validation : 82 tests check:sites passent ; navigateur : Saint Jean de Capistran
  reçu de Nominis, lien HTTPS correct, titre agrandi, aucune flèche. Petit écran
  contrôlé sans débordement. Capture : terre-rouge-pictogrammes-soleil.png.
- Même aperçu local, aucun push ni déploiement.

# Titre compact et Lune — 23 octobre 2026, v3.291 non publiée

- Titre exactement « Météo Boulc>Terre Rouge », sans espaces ni marge autour
  du chevron ; titre de l’onglet harmonisé.
- Date retirée de la ligne lever/coucher. Horaires solaires maintenus.
- Phase de la Lune ajoutée à côté : nom français et disque éclairé calculé par
  le moteur lunaire déjà présent. Mise à jour chaque minute avec les heures solaires.
  Le disque calculé est utilisé car le SVG Meteocons nommé « gibbeuse » du dépôt
  représente en réalité un croissant et ne correspond pas à la phase affichée.
- Validation : 82 tests check:sites passent, contrôle navigateur du titre sans
  espaces, absence de date avant les heures et présence de la phase lunaire.
- Même aperçu local, aucun push ni déploiement. Capture :
  terre-rouge-titre-lune.png dans les visualisations du chat.

# Nouvel en-tête et frise allégée — 23 octobre 2026, v3.290 non publiée

- Titre « Météo Boulc > Terre Rouge ». Coordonnées du point demandé affichées
  (44,632186° N · 5,631626° E), altitude 1 155 m déjà confirmée par l’utilisateur.
  Ne pas afficher les coordonnées ni l’altitude de la maille Open-Meteo.
- Date du jour complète, lever et coucher du soleil calculés avec le moteur
  astronomique existant aux coordonnées Terre Rouge, affichés en Europe/Paris.
  Mise à jour chaque minute, indépendante du chargement des données météo.
- Ancien sous-titre descriptif remplacé par ces informations. Changement réservé
  à l’aperçu avec --presentation=tatins-rows ; en-têtes publics non modifiés.
- Frise 3 h : suppression du libellé « Précip. PIAF mm/h équiv. eau » et des
  sources textuelles ; les sources restent dans l’indicateur d’actualisation.
  Les éventuelles légendes pluie/neige restent présentes. Minimum bleu, maximum
  rouge. Unités et nature des cumuls toujours accessibles dans les infobulles.
- Validation : 82 tests check:sites passent, y compris coordonnées/altitude
  cibles et conservation des rendus par défaut. Navigateur : horaires du 23/10
  (08:03 et 18:42), date courante, couleurs distinctes et absence des deux textes
  dans le diagramme 3 h. Vérification mobile sans débordement.
- Même aperçu local, aucun push ni déploiement. Capture :
  terre-rouge-entete-local.png dans les visualisations du chat.

# Dates et encadré Tendance — 23 octobre 2026, v3.289 non publiée

- Date à la suite du jour dans toutes les cartes, y compris Aujourd’hui et Demain.
- « Tendance » avant les pictogrammes de courbe et d’actualisation ; fond jaune
  et espacement de l’encadré restaurés, sans barre verticale.
- Validation : 81 tests check:sites passent ; navigateur : date intégrée au titre
  dès Aujourd’hui, ordre Tendance/courbe/actualisation, fond jaune et bordure nulle.
- Même aperçu local, aucun push ni déploiement. Capture :
  terre-rouge-dates-tendance-jaune.png dans les visualisations du chat.

# Repli du créneau au clic courbe — 23 octobre 2026, v3.288 non publiée

- Le pictogramme de courbe referme tout créneau déployé de ce même jour,
  avant d’ouvrir ou fermer le graphique. L’état du créneau est également remis
  à zéro pour les prochains rafraîchissements. Les autres jours sont inchangés.
- Fermeture par la croix : comportement précédent conservé. Position de page
  et placement du graphique au-dessus de la rangée conservés.
- Validation : syntaxe vérifiée et aperçu reconstruit ; navigateur, créneau Soir
  d’Aujourd’hui ouvert puis clic courbe : aucun créneau ouvert et courbe visible.
- Même aperçu local, aucun push ni déploiement. Capture :
  terre-rouge-courbe-creneau-replie.png dans les visualisations du chat.

# Indicateurs et en-têtes — 23 octobre 2026, v3.287 non publiée

- Les pictogrammes d’actualisation sont désormais uniquement indicatifs : aucun
  bouton, aucun clic, aucun arrêt de tabulation. Couleur et infobulle indiquent
  l’ancienneté des sources ; un indicateur ajouté au titre des 3 h. PIAF : vert
  jusqu’à 10 min, orange jusqu’à 20 min, rouge ensuite ; autres sources inchangées.
- Boutons de courbe immédiatement à côté des indicateurs. Sur les 3 h, le bouton
  affiche/masque le diagramme en conservant le résumé min/max et précipitations.
- Résumé 3 h enrichi après pluie/neige si le vent moyen atteint « modéré »
  (20 km/h), les rafales « modérées » (35 km/h), ou qu’un signal d’orage existe.
  Valeurs et sources priorisées sur la seule fenêtre de trois heures ; aucune
  mention négative ajoutée lorsque ces phénomènes restent faibles ou absents.
- Au-delà d’une semaine, date à la suite du jour (« Samedi 31 oct. »). « Tendance »
  à côté des pictogrammes de courbe et d’actualisation, sans barre verticale.
- Courbe quotidienne placée juste au-dessus de la rangée concernée, sur toute
  la largeur. Aucun défilement automatique ; position conservée lors du clic.
  Ordre recalculé selon le nombre de colonnes après redimensionnement.
- Validation : 81 tests check:sites passent ; navigateur à 320 et 1280 px sans
  débordement, 17 indicateurs non interactifs, dates/Tendance vérifiées, bouton
  du diagramme 3 h contrôlé. Clic direct sur un jour lointain : position verticale
  avant/après identique et courbe juste au-dessus de la rangée.
- L’aperçu utilise toujours les JSON locaux préparés ; il ne suit pas les nouvelles
  publications publiques (limite expliquée à l’utilisateur). Aucun push/déploiement.
- Même URL et commande de reconstruction. Captures terre-rouge-3h-indicateurs.png
  et terre-rouge-indicateurs-tendance.png dans les visualisations du chat.

# Cartes des Tatins pour Terre Rouge — 23 octobre 2026, v3.286 non publiée

Nouvelle demande : abandonner les lignes quotidiennes horizontales de l’essai
précédent et reprendre la présentation des Tatins pour aujourd’hui et les jours
suivants, en gardant les données et la courbe propres à Terre Rouge.

- Même grille et mêmes styles de cartes que les Tatins : trois colonnes au-delà
  de 1100 px, deux jusqu’à 720 px, une en dessous. Matin, Après-midi, Soir et Nuit
  verticalement dans chaque carte ; détail météo intégré au créneau au clic.
  Aujourd’hui et Demain nommés comme aux Tatins ; un seul détail ouvert à la fois.
- Seize jours conservés ; mention « Tendance » à partir de J+8. Données Terre Rouge
  inchangées : priorités AROME, ARPEGE puis Open-Meteo, cumuls natifs, estimations
  et inconnues conservés. Aucune synthèse des modèles copiée des Tatins.
- Le pictogramme à côté du jour ouvre la courbe Terre Rouge au-dessus des cartes,
  sur toute leur largeur. Un seul graphique ouvert ; bouton de fermeture, contrôles
  des couches et option heure par heure conservés. Marges symétriques conservées.
- La pastille de confiance des Tatins devient un bouton d’actualisation : flèche
  circulaire verte/orange/rouge. Elle indique l’ancienneté des acquisitions des
  sources réellement utilisées pour ce jour : vert jusqu’à 90 min, orange jusqu’à
  3 h, rouge ensuite ou si date absente. Dates par source au survol et au focus.
- Au clic, relecture sans cache navigateur de dashboard.json et week.json publiés,
  donc renouvellement des données déjà collectées, sans collecte API privée côté
  navigateur. Boutons occupés pendant la requête ; échec signalé en rouge sans
  effacer les dernières données. Créneau, courbe et réglages conservés ; focus rendu
  au bouton. Les événements de cartes retirées pendant un rendu sont ignorés.
- Frise 3 h et fond des courbes quotidiennes inchangés depuis v3.285.
- Même URL http://127.0.0.1:4177/terre-rouge-test/ ; reconstruction avec l’option
  historique --presentation=tatins-rows. Aucun push ni déploiement.
- Validation : 79 tests check:sites et 4 tests d’interface passent. Navigateur :
  seize cartes, huit mentions Tendance ; trois colonnes à 1280 px, deux à la largeur
  habituelle et une à 320 px ; aucun débordement. Détails, courbe pleine largeur,
  commandes du vent, fermeture et exclusion des autres courbes contrôlés.
  Actualisation réussie, détail et courbe conservés, focus rendu au bouton.
  Capture : terre-rouge-cartes-tatins.png dans les visualisations du chat.

# Frise 3 h simplifiée — 23 octobre 2026, v3.285 non publiée

- Un cumul PIAF exactement nul affiche « Pas de pluie » sur la frise 3 h.
  La mention « (partiel) » reste présente si la couverture est incomplète ;
  les données absentes ne deviennent pas une annonce sèche.
- Fond blanc uniforme de la frise 3 h, sans colorisation jour/nuit.
- Changement limité à cet aperçu local ; les courbes quotidiennes gardent
  leur fond existant. Même URL, aucun push ni déploiement.
- Validation : 78 tests `check:sites` passent ; vérification visuelle du résumé
  et du fond blanc dans le navigateur.

# Nouvelle frise 3 h de l’essai local — 23 octobre 2026, v3.284 non publiée

- Marges de la courbe quotidienne égales en haut, sur les côtés et en bas :
  12 px sur grand écran, 7 px sur mobile.
- Sur les 3 h : résumé température min/max et cumul PIAF, puis pictogrammes
  et diagramme de précipitations seul. Courbe et points de température supprimés
  uniquement de cet essai. Frise de 160 px ; températures résumées sur la fenêtre
  exacte, avec la priorité de sources existante et les extrema aux heures natives.
- Cumul nul acquis, cumul partiel et absence PIAF distincts. Le cumul PIAF reste
  en mm équivalent eau ; aucune substitution par un cumul de modèle météo.
- Segments de précipitations colorés selon leur nature acquise (pluie, neige,
  mélange, verglaçant ou inconnue), avec modèle de phase indiqué au survol.
  Coupure aux frontières natives sans changer le cumul PIAF. La neige fraîche
  en cm, lorsqu’elle existe, reste une estimation de modèle séparée et sourcée.
- Validation : 78 tests `check:sites` passent, dont extrema/priorités, cumul
  conservé au changement de phase, neige et distinction sec/partiel/indisponible.
  Navigateur contrôlé à 1280 et 320 px : pas de débordement, aucune courbe de
  température sur la frise 3 h, marges vérifiées et ouverture quotidienne conservée.
- Même aperçu local et même reconstruction. Aucun push ni déploiement.
  Capture : `terre-rouge-3h-resume.png` dans les visualisations du chat.

# Ajustements de l’essai local le 23 octobre 2026 — v3.283, non publiée

- Indicateurs du créneau disposés horizontalement : ciel, précipitations,
  vent/rafales groupés et orage, chacun avec son vrai résumé météo.
  Quatre colonnes sur grand écran ; deux sur écran étroit, sans débordement.
- Frise « Les 3 prochaines heures » réduite de 260 à 190 px pour cet essai.
  Le rendu compact est une option du prototype ; le rendu public reste inchangé.
- Le clic sur Matin, Après-midi, Soir ou Nuit ouvre uniquement ses indicateurs.
  Un bouton avec le pictogramme de courbe des Tatins, près du titre du jour,
  affiche ou masque séparément la courbe quotidienne Terre Rouge.
  La courbe peut être ouverte sans créneau sélectionné ; son état est conservé
  pendant les rafraîchissements, comme les réglages et le créneau ouvert.
- URL et reconstruction inchangées (voir ci-dessous). Aucun push ni déploiement.
- Validation : 76 tests `check:sites` passent et syntaxe de l’application vérifiée.
  Navigateur : quatre indicateurs alignés à 1280 px ; quatre créneaux alignés et
  aucun débordement à 320 px ; détail et courbe ouverts/fermés indépendamment ;
  aucune erreur console. Capture `terre-rouge-details-horizontaux.png`.

# Correction de l’essai local le 23 octobre 2026 — v3.282, non publiée

Correction explicite de l’utilisateur : reprendre les créneaux des Tatins et
les vrais résumés météo par caractéristique. La première interprétation avec
un seul résumé journalier et des descriptions génériques a été refusée.

- URL inchangée : `http://127.0.0.1:4177/terre-rouge-test/` ; option locale
  `--presentation=tatins-rows`, profil public et dépôt dédié non modifiés.
- Chaque ligne quotidienne affiche Matin, Après-midi, Soir et Nuit côte à côte,
  y compris à 320 px (présentation compacte). Nuit = 00–06 h du lendemain,
  comme aux Tatins ; date de la nuit précisée au survol. Créneaux passés grisés.
- Un clic sur un créneau ouvre son détail dans un panneau commun sous la ligne,
  puis la courbe quotidienne Terre Rouge. Un seul créneau ouvert à la fois,
  conservé pendant les rafraîchissements. La courbe reste celle du jour civil.
- Détail vertical des Tatins : nuages ; précipitations ; vent et rafales groupés ;
  orage. Même pictogramme à cinq niveaux et valeurs entre parenthèses.
  Résumés avec les fonctions textuelles des Tatins, par exemple « Ciel couvert. »,
  « Pluie en faible quantité en fin d’après-midi. », « Vent très léger d’O et
  rafales faibles. », « Pas d’orage. ». Timing pluie issu des intervalles acquis.
- Supprimés : « Cumul de la journée », « Maximum du vent moyen sur la journée »,
  « Rafale maximale de la journée » et « Aucun signal dans les créneaux acquis ».
- Calcul par créneau sur les données déjà priorisées de Terre Rouge : cumuls et
  proratas natifs conservés ; nuit suivante et nuit de sept heures au changement
  d’heure testées ; inconnues non assimilées à zéro. Probabilité Open-Meteo
  seulement si toutes les précipitations du créneau appartiennent à Open-Meteo.
- Données de l’aperçu renouvelées depuis les JSON publics en lecture seule,
  sans collecte API privée ni publication. Même fichier local de données et
  même commande de reconstruction que l’essai v3.281 ci-dessous.
- Validation : 387 tests passent ; 76 tests `check:sites`, 4 tests d’interface,
  `check:pages` passent. Navigateur : créneaux alignés à 320 px, aucun débordement,
  ouverture au clavier, un seul créneau sélectionné, détail et graphique présents.
  DOM vérifié à 1280 px ; largeur habituelle restaurée. Aucune erreur navigateur.
  Capture : `terre-rouge-creneaux-tatins.png` dans les visualisations du chat.
- Aucun push ni déploiement. Point de restauration et version publique v3.280
  conservés ; les sections suivantes décrivent l’historique de l’essai refusé.

# Essai local du 23 octobre 2026 — v3.281, non publié

Demande : reprendre la présentation des prévisions des Tatins avec une ligne par
jour ; au clic, les indicateurs détaillés des Tatins et la courbe de Terre Rouge.

- Aperçu distinct : `http://127.0.0.1:4177/terre-rouge-test/`, onglet ouvert.
  Serveur local : `PREVIEW_PORT=4177 node scripts/preview-sites.mjs`.
- Option volontairement locale : `--presentation=tatins-rows` ajoute uniquement
  `dailyPresentation: tatins-rows` dans la configuration générée de cet aperçu.
  Le profil Terre Rouge par défaut n’active pas cette expérience.
- Résumé compact date/pictogramme/min/max/pluie/neige ; seize lignes quotidiennes.
  Un seul jour ouvert à la fois. Détail avec indicateurs communs aux Tatins :
  nébulosité, précipitations, vent, rafales et signal d’orage. Les cinq niveaux
  et les symboles viennent du même composant de présentation extrait des Tatins.
- Courbe quotidienne Terre Rouge conservée dans le détail : mêmes données,
  sources, quantités, axe comprimé, pas natifs, contrôles et option horaire.
  Les données restent priorisées selon Terre Rouge ; aucune moyenne entre modèles
  ajoutée pour imiter les synthèses des Tatins. Le jour ouvert et les réglages
  sont conservés lors des rafraîchissements ; tracé mesuré seulement à l’ouverture.
- Données de test : copie de la publication du point de restauration,
  `.cache/weather/terre-rouge-rows-preview.json` ; collecte non modifiée.
- Reconstruire : `node scripts/prepare-site.mjs --site=terre-rouge --presentation=tatins-rows --output=.cache/sites/terre-rouge-test --state=.cache/weather/terre-rouge-rows-preview.json`.
- Validation : 385 tests passent ; `check:pages` passe. Navigateur contrôlé en
  largeur normale, à 390 et 320 px : pas de débordement ; ouverture au clavier,
  fermeture de l’autre jour, commande du vent, détail horaire et retour ajusté
  fonctionnels. Aucune erreur navigateur. Capture `terre-rouge-tatins-rows.png`
  dans le dossier des visualisations de cette conversation.
- Aucun push, aucun déploiement, aucune modification du dépôt dédié Terre Rouge.
  Le point de restauration v3.280 ci-dessous reste la référence publiée.

# Point de restauration créé le 23 octobre 2026 à 16 h 53 — v3.280

Demandé par l’utilisateur avant un nouveau test. Code figé au commit `b82f3190849f461f56076d8c8a9207901fc65f5f`.
Repère distant : `restauration/terre-rouge-20261023-1653-v3.280` dans le dépôt Terre Rouge, poussé et vérifié.
Sauvegarde autonome : `.cache/restore-points/terre-rouge-20261023-1653-v3.280.zip` ; dossier de détail
`.cache/restore-points/terre-rouge-20261023-1653-v3.280/` avec manifeste SHA-256 et instructions.
Contient sources ZIP, dépôt Git complet vérifié et archive exacte du site publié
(Actions 39972250505, déploiement 7281143631). Sept fichiers centraux, dont les
JSON météo, comparés au site public : identiques. La copie complète du site
contient 132 fichiers. Aucun déploiement ni changement de collecte pour ce point.
Les déclenchements automatiques schedule ont désormais été observés avec succès
(13:25, 13:55, 14:07 et 14:44 UTC environ), contrairement au constat historique
initial ci-dessous. Les horaires réels peuvent être retardés par GitHub.
Avant toute expérimentation, préserver ce repère ; pour un retour en service,
restaurer le code puis collecter des données fraîches, plutôt que prolonger le PIAF archivé.

# Collecte automatique active le 23 octobre 2026 — v3.280 publiée

L’utilisateur a explicitement autorisé « Oui, active la collecte et la publication
automatiques », par exception à la règle générale sans déploiement, pour Terre Rouge.
Cette autorisation couvre la collecte et la publication récurrentes configurées ici.

- Dépôt dédié : `meteo-terrerouge/meteo-terrerouge.github.io`, branche main.
  Commit de mise en place `1753c07`, correction des deux formats d’extraction
  des artefacts `607fca4`, collecte limitée aux sources affichées `7453836`.
- Workflow `refresh-terre-rouge.yml`, id `394028127`, état GitHub actif.
  PIAF programmé toutes les 5 min (minutes 3, 8, etc.) ; autres prévisions
  à la minute 17 de chaque heure UTC. Les lancements GitHub peuvent être retardés.
- Collectes indépendantes PIAF/prévisions, caches distincts, récupération de
  l’ancien cache manuel et restauration durable depuis les JSON publics.
  Fusion par source et cycle sous un verrou couvrant génération et déploiement :
  un traitement long ne peut pas republier un PIAF plus ancien.
- Panne partielle : conserver et publier les acquisitions réussies, puis signaler
  l’échec dans Actions. Les créneaux PIAF absents restent explicitement inconnus.
- Terre Rouge n’affiche aucun ensemble PEAROME. Leur collecte a donc été désactivée
  dans ce seul profil : évite des appels inutilisés et le HTTP 404 d’un membre
  sur l’ancien essai complet. PEAROME reste activé aux Tatins.
- Validation finale : 384 tests passent hors restriction Windows des fichiers
  temporaires ; 73 tests `check:sites` ; `check:pages` et `actionlint` passent.
  Les tests du profil sont maintenant inclus dans l’import du dépôt dédié.
- Vérifications réelles : cycle court PIAF `39956086398` réussi, collecte et
  déploiement ; cycle prévisions `39956407323` réussi, collecte et déploiement.
  L’ancien essai `39955649262` a été annulé pour libérer le traitement corrigé.
  Ces premiers contrôles sont des lancements manuels du workflow automatique ;
  aucun événement schedule encore observé au contrôle de 14 h 55. La définition
  des deux horaires est bien présente sur main et le workflow GitHub est actif.
- Contrôle HTTP public : v3.280 ; PIAF collecté à 14:45:32 Paris, cycle 14:35,
  valide jusqu’à 17:35 ; AROME collecté à 14:49:52, run 06:00 UTC ; Open-Meteo
  à 14:45:04 ; ARPEGE collecté à 14:44:41, run 06:00 UTC. AROME prévoit désormais
  0,57 mm entre 16 h et 17 h, au lieu des anciens 1,15 mm. Ce PIAF prévoit zéro
  sur cet intervalle : une divergence de prévisions, distincte de l’ancien PIAF expiré.
- Aucune publication ni cadence Tatins modifiée. Aucun nouveau service local requis.
  Les sources communes restent non commitées dans le dépôt de travail Tatins ;
  le dépôt dédié contient les commits publiés. Les sections suivantes sont historiques.

# Mise à jour locale du 23 octobre 2026 — v3.279, non publiée

- Diagnostic de la capture de 14 h 26 : PIAF expiré, et non prévision sèche.
  Le dashboard public contrôlé contient le cycle PIAF de 02:45 UTC, dont
  la dernière échéance est à 07 h 45 à Paris. AROME annonce 1,15 mm entre
  16 h et 17 h (échéance 15:00 UTC). Aucune comparaison PIAF valide à 17 h.
- Correction locale : libellé visible « Précip. PIAF indisponibles » sans
  atténuation excessive. Au survol des pictogrammes sans échéance PIAF,
  préciser que les précipitations sont inconnues et que le pictogramme
  ne signifie pas un temps sec. Ne pas appliquer une phase neige AROME
  à un créneau PIAF absent. Température, nébulosité et signal orage conservés.
- 67 tests `check:sites` passent, dont une régression PIAF expiré/sec/trou
  de couverture et neige du modèle. `check:pages` passe. Aperçu local
  reconstruit avec le cache existant ; aucune collecte renouvelée.
- Aucun commit ni déploiement. La version publique reste v3.278.

# État enregistré le 23 octobre 2026 — v3.278 locale et publiée

Les fichiers sources sont enregistrés localement dans ce dépôt. Le développement
commun reste non commité ici. Publication Terre Rouge explicitement demandée
et autorisée par l’utilisateur le 23 octobre : sources synchronisées dans le
dépôt dédié, commit `bdcd91d` (v3.278). Ne pas déployer à nouveau sans demande explicite.

## Présentation validée

- Sous-titre exact à conserver : « Prévisions météo Météo-France à l’échelle kilométrique ».
- Un seul titre pour la frise courte : « Les 3 prochaines heures ».
- Ce titre est à l’intérieur d’un cadre identique à celui des journées : mêmes
  bordure, rayon, marges, largeur maximale et fond de section. Pas de double carte.
- Frise courte combinant température, pictogrammes et pluie PIAF (données 5 min).
- Le pas de pluie PIAF reste à 5 min ; seuls les repères horaires et pictogrammes
  sont regroupés selon la largeur. Ne pas confondre espacement des repères et données.
- Une frise par jour, jusqu’à 16 jours : Météo-France en priorité, puis Open-Meteo.
- Aucun titre « Jour par jour » ni compteur de jours : commencer par Aujourd’hui,
  puis les jours suivants. Aucun bouton Réinitialiser.
- Température et pluie seules activées par défaut. Autres commandes : nébulosité,
  vent et rafales. Commandes des courbes partagées avec la frise 48 h.
- Aucune commande ou courbe de risque d’orage : éclair dans le pictogramme météo.
- Nébulosité en surface grisée sans ligne ; fondu jour/nuit continu des Tatins.
- Pictogrammes de 69 px, soit +15 % par rapport aux 60 px précédents, alignés sous
  les horaires. Pictogramme « Ce soir » conservé même si très peu de temps reste.
- Aujourd’hui : journée complète, partie passée fortement grisée jusqu’à l’heure
  actuelle. Le pictogramme de fin de soirée reste coloré au-dessus de ce voile.
- Courbes jusqu’aux bords avec les points acquis des jours voisins, sans extrapoler
  les données absentes ; la pluie des marges ne compte pas dans le total du jour.
- Nuits condensées selon le lever et le coucher du soleil du lieu et de la date.
  Chaque colonne affichée a la même largeur, y compris aux transitions : une heure
  diurne ou un groupe de plusieurs heures nocturnes. Sur écran étroit, les colonnes
  voisines sont regroupées. Les données et cumuls sont conservés ; fond, courbes,
  pictogrammes et repère actuel partagent le même axe réversible.
  L’axe est désormais cubique monotone, à vitesse continue entre les colonnes :
  aucune cassure de pente artificielle lors du changement de compression jour/nuit.
- Pictogramme de résumé dans l’en-tête quotidien : nébulosité moyenne diurne,
  précipitations représentatives de la répartition sur la journée entière, et
  présence d’orage sur la journée entière. Ne plus utiliser le pic de pluie.
  Phase dominante pondérée par la durée réelle des créneaux acquis ; en cas
  d’égalité avec le sec, retenir le sec. Intensité médiane pondérée en durée
  dans cette phase. Heures inconnues exclues, pas considérées comme sèches.
  Une averse ponctuelle reste dans la frise et les cumuls, sans définir à elle
  seule le pictogramme quotidien. Aucun seuil de cumul quotidien inventé : le
  critère proposé « sous 1 mm et pic sous 0,5 mm/h » a été refusé et retiré.
- Résumé chiffré avec libellés Min./Max., minimum bleu, maximum orange et
  goutte pour le cumul de pluie, selon les symboles et couleurs des Tatins.
- Masquer le cumul et sa goutte si la quantité est nulle à la précision affichée
  (0,01 mm), y compris les traces arrondies à zéro. Même règle pour le total 3 h.
- Sources réellement utilisées et dates de collecte dans la légende de chaque
  graphique, y compris les 3 h, en 9 px : âge « il y a Xh, Ymin », ou « à l’instant »
  sous une minute. Date et heure exactes au survol, au fuseau Europe/Paris.
  Ne jamais remplacer une date absente par l’heure actuelle : « date inconnue ».
  Une date future est signalée comme telle, pas artificiellement rajeunie.
  L’âge suit l’horloge du site et le rafraîchissement existant chaque minute.
  Sous une heure : minutes seules (« il y a 12min »), jamais « 0h, 12min ».
  Renvoi à la ligne sur mobile. PIAF n’est indiqué que si ses données sont utilisées.
- Sources à droite sur une seule ligne ; dès qu’elles passent sur une seconde
  ligne, elles s’alignent à gauche sur la légende.
- Hauteur automatique selon la largeur disponible (220 à 300 px), sans réglage
  vertical. L’option « Afficher le détail heure par heure » apparaît seulement si la largeur est
  insuffisante. Elle élargit la frise à la largeur nécessaire aux heures diurnes,
  sans zoom libre ; décochée, la frise tient dans l’écran.
- Le seuil horaire correspond aux 69 px réels des pictogrammes : ne pas imposer
  de marge supplémentaire qui provoquerait inutilement un pas diurne de deux heures.
- Dans ce mode, les créneaux nocturnes restent regroupés et équilibrés (au moins
  trois heures) ; pictogrammes de même taille et sans chevauchement aux transitions.
- Pas d’adaptation du pas d’affichage à la précision native des modèles : annulée.
  Cela concerne les pictogrammes et repères horaires, pas les barres de pluie.
- Pluie quotidienne : conserver les intervalles réellement acquis (notamment 3 h
  ARPEGE) et leur provenance. Ne pas inventer trois acquisitions horaires à partir
  d’un cumul de 3 h. Regrouper les intervalles contigus d’une même source lorsque
  la place manque pour leur étiquette ; ne jamais traverser un trou ni mélanger
  les sources. La largeur indique la durée ; pas de « / X h » dans les étiquettes.
  Infobulle avec la durée et tous les intervalles composants.
- Aucune barre ni trait pour zéro ni pour un cumul représenté inférieur à 0,01 mm.
  De 0,01 à moins de 0,1 mm : mot « gouttes » à la place
  du nombre, pas de pictogramme. À partir de 0,1 mm : cumul chiffré seul. Aucune suppression
  silencieuse d’étiquette au seuil de 36 px. Les traces inférieures à 0,01 mm ne
  sont plus signalées par « gouttes ». Quantités sources et calculs conservés.
  Gouttes : repère fixe de 5 px, hors échelle d’intensité, afin de voir sa largeur.
  Barres chiffrées : progression linéaire AU-DESSUS de ce repère minimal de 5 px,
  pas un plancher qui égalise les barres. Hauteur = 5 px + intensité/échelle × 67 px.
  Les gouttes restent donc toujours plus basses que la pluie chiffrée, même
  0,1 mm sur un long créneau. La v3.276 sans ce socle donnait l’ordre inverse :
  correction refusée par l’utilisateur, ne pas la réintroduire.
  Pas de racine carrée, d’échelle non linéaire ni de nouvelle légende explicative.
- Hauteur des barres = intensité moyenne en mm/h ; échelle commune aux journées,
  indiquée dans la légende, avec 72 px maximum pour la pluie à toute largeur.
  L’échelle couvre au moins 10 mm/h : 1 mm/h reste modeste (11,7 px), puis
  s’étend si les intensités le nécessitent. Aucun écrasement des petites barres.
  Les nombres au-dessus des barres restent des cumuls en mm, sans durée ajoutée.
  Ajouter « mm » à la valeur si la barre est assez large, sans regrouper davantage
  les données pour faire tenir l’unité ; sinon l’unité reste dans la légende.
  Les groupes ne prétendent pas localiser la pluie plus finement que leur durée.
- Open-Meteo : la sélection automatique publie des données horaires interpolées,
  pas la provenance native de chaque heure. Ne pas déduire le pas natif des nombres
  identiques. Agrégation explicite en périodes UTC de 3 h pour l’affichage, puis
  regroupement si la place manque. Les précisions techniques restent uniquement
  en infobulle : pas natif non communiqué. Ce n’est PAS une
  récupération du pas natif ni un nouveau modèle choisi à la place du best_match.
- Priorité AROME > ARPEGE > Open-Meteo pour la pluie, sans double comptage.
  Les intervalles coupés à minuit ou par une source prioritaire sont estimés au
  prorata : astérisque sur le montant et cumul quotidien concernés, explication
  et intervalle/cumul source en infobulle. Les cumuls horaires internes servent
  seulement aux pictogrammes et ne représentent pas une acquisition horaire.
- Aucune classification « Déterministe », « probabiliste » ni « Pluie Open-Meteo
  agrégée » dans la légende. Afficher clairement « Tendance » dans l’en-tête de
  la journée dès J+8 (aujourd’hui = J), soit vendredi 30 octobre pour l’aperçu
  du jeudi 22, date confirmée par l’utilisateur. Repère roulant, pas date figée.
  Ce repère ne constitue pas une bascule scientifique ni une mesure de confiance.
  Aucune courbe d’ensemble n’est actuellement affichée dans ces frises, jusqu’à 16 jours.
  La probabilité de pluie d’Open-Meteo acquise séparément n’est pas une dispersion
  des températures/cumuls et ne transforme pas ces courbes en probabiliste.
- Séparations horaires très discrètes : trait de 0,5 px, opacité 0,16, y compris
  sur le fond nocturne et en affichage sombre.
- Courbes : conserver tous les points horaires, y compris dans les marges des
  jours voisins ; interpoler dans le temps réel avant projection sur l’axe
  comprimé. Ajouter les limites des colonnes et les instants solaires, ne pas
  raccorder uniquement les pictogrammes. Aucune extrapolation des valeurs absentes.
  Les valeurs restent linéaires dans le temps réel ; le tracé est la composition
  exacte avec l’axe cubique, en courbes de Bézier, pas des cordes droites entre
  points projetés. Même projection pour température, vent, rafales et nébulosité.
  Tangentes harmoniques monotones ; inverse par dichotomie ; prolongement linéaire
  de l’axe dans les marges, sans extrapoler les données météo elles-mêmes.
  Fond évalué chaque quart d’heure, aux instants solaires et aux bords visibles,
  projeté sur le même axe, y compris dans les marges.
- Ne pas ajouter de paragraphes explicatifs, instructions de glissement, commentaires
  sur le pas des créneaux, avertissements longs, sous-titre inventé ou titre en double.
  Les unités, valeurs météo, dates et commandes suffisent. Détails en infobulles.

## PIAF et jeton : ne pas reproduire la confusion

Le test ayant renvoyé HTTP 401 utilisait à tort le jeton général de `.env`, pas
celui de Terre Rouge. Le bon jeton a ensuite fonctionné et le cache a été renouvelé.

- Variable dédiée si fournie : `METEO_FRANCE_API_KEY_TERRE_ROUGE`.
- Fichier privé déjà utilisé pour enregistrer le secret Actions Terre Rouge :
  `D:/Desktop/file.txt`. Ne jamais afficher sa valeur ni la copier dans les sources,
  les notes, les fichiers publics ou une sauvegarde de code.
- Le jeton de ce fichier est différent du jeton général `METEO_FRANCE_API_KEY` de
  `.env`. Ne pas utiliser ce dernier pour diagnostiquer Terre Rouge.
- Le secret GitHub existant est `METEO_FRANCE_API_KEY_TERRE_ROUGE` dans le dépôt
  `meteo-terrerouge/meteo-terrerouge.github.io`. Aucun changement distant requis.
- Renouvellement local déjà préparé : `node .cache/refresh-terre-rouge-piaf.mjs`.
  Ce script lit uniquement la variable dédiée ou le fichier privé confirmé.

## Géographie contrôlée

- Coordonnées configurées de Terre Rouge : 44.632186, 5.631626, pas le centre de Boulc.
- Le 22 octobre, Open-Meteo a renvoyé une altitude cible de 1 155 m, confirmée par
  l’utilisateur. Altitude automatique conservée, aucune correction manuelle ajoutée.
- Point de grille renvoyé : 44.640648, 5.6158705, environ 1,56 km du point demandé.
  Requête sans correction (`elevation=nan`) : altitude de maille 1 218 m. Ne pas
  confondre ce point de grille avec le terrain cible ni promettre une météo de parcelle.
- Les nouvelles collectes gardent ces métadonnées dans `openMeteo.location` ;
  un ancien cache sans altitude n’est pas rétroactivement renseigné.

## Neige et pluie/neige

- L’utilisateur a demandé l’implémentation et confirmé : un seul diagramme de
  précipitations, aucune zone neige séparée. Hauteur commune en mm/h d’équivalent
  eau, quantités au-dessus en mm pour la pluie et en cm pour la neige fraîche.
  Barres neige hachurées ; mélange avec les deux quantités sur la même barre.
- Catalogues WCS officiels contrôlés avec le jeton Terre Rouge autorisé le 22/10 :
  `TOTAL_SNOW_PRECIPITATION__GROUND_OR_WATER_SURFACE`, PT1H AROME et PT3H ARPEGE,
  unités kg/m² (= mm d’équivalent eau). Même run et durée que les précipitations.
  Champ optionnel : son absence ou sa panne ne supprime pas les autres prévisions.
- Open-Meteo acquiert `rain`, `showers` et `snowfall` séparément du total
  `precipitation`. Valeur absente conservée comme inconnue, pas zéro.
- Les cm des données MF directes sont une estimation conventionnelle de neige
  fraîche : 0,7 cm par mm d’équivalent eau NEIGE, selon la convention documentée
  d’Open-Meteo. Jamais de conversion du total pluie+neige, ni de seuil de température
  utilisé pour décider de la neige. La méthode reste dans les infobulles.
  Référence : `https://open-meteo.com/en/docs/meteofrance-api`.
- Aucun de ces cm n’est une hauteur de neige restant au sol : infobulles
  explicites. Les données `snow_depth` ne sont pas collectées. Quantités affichées
  au cm entier le plus proche, sans signe environ ; « < 1 cm » plutôt qu’un zéro
  pour une quantité positive arrondie à zéro. Même règle pour les barres, résumés
  et cumul neige des 3 h. Aucune étiquette neige en mm si les cm manquent : « Neige ».
  Pluie liquide en mm, données et calculs de cumuls non arrondis en amont.
- La nature et les quantités restent celles de la source propriétaire du cumul :
  priorité AROME > ARPEGE > Open-Meteo. Aucun mélange silencieux de modèles pour
  compléter une quantité neige manquante. Coupures/proratas conservés.
- Pictogrammes existants neige, pluie/neige et pluie verglaçante, dans la frise,
  le résumé et les 3 h. Des phases successives ne sont pas transformées en mélange :
  le pictogramme regroupé représente le créneau le plus intense. Pour un mélange
  acquis sur un même créneau, l’infobulle ne prétend pas connaître la simultanéité.
- PIAF reste en équivalent eau et n’est jamais converti en cm. Le cumul neige
  des 3 h vient du modèle, nommé explicitement à côté de sa valeur.
- Si seule une indication neige est connue : pictogramme sans quantité cm inventée.
  Si la répartition manque, le total reste nommé précipitations en équivalent eau.
- Filtre d’affichage des traces : sous 0,1 cm de neige sur un créneau natif,
  pas de symbole, hachures ni cumul neige visible, sauf code météo neige explicite.
  Phase pluie si pluie liquide positive, sinon nature non annoncée. Seuil d’affichage, pas
  une règle physique de phase ; aucune correction selon la température. Décision
  avant coupure/regroupement ; quantité brute conservée, trace signalée au survol.
  Les codes neige explicites restent représentés, même sous ce seuil.
  Cas réel corrigé : dimanche 25, ARPEGE à 7,3 °C, 4,98 mm de précipitations
  dont seulement 0,00137 cm de neige : l’ancien test strictement positif annonçait
  à tort un créneau pluie/neige et un cumul « < 1 cm ».
- v3.275 : le filtre couvre aussi les traces neige seules. Cas réel lundi 26 :
  ARPEGE 0,00105 cm, pluie liquide nulle ; ne pas annoncer une journée neigeuse.
- PIAF : classifier chaque épisode positif contigu, sans relier les trous ni
  les créneaux nuls. Sous 0,1 mm pour l’épisode et avec chaque intensité < 1 mm/h,
  afficher « gouttes » et un repère fixe de 5 px, hors échelle, seulement si
  l’épisode atteint 0,01 mm ; sous 0,01 mm, aucune marque. Ne pas appliquer ce
  seuil séparément à chaque pas de 5 min d’une pluie soutenue. Pas d’axe chiffré
  s’il n’y a que des gouttes ; cumul total < 0,1 mm également nommé « gouttes ».
  Les averses intenses brèves et la pluie soutenue gardent la courbe quantitative.
  Échelle PIAF quantitative couvrant au moins 10 mm/h ; valeurs positives
  progressant linéairement au-dessus des 5 px des gouttes : 5 + intensité/échelle
  × 85 px. Zéro reste zéro ; données/cumuls inchangés.
  Vérification réelle du 23 octobre à 03:32 : cumul 0,094177 mm, 4 créneaux
  de 5 min humides, maximum 0,4827 mm/h ; ancienne échelle amplifiait ce maximum.
  Aucun tracé de courbe ni surface PIAF pour les créneaux nuls : terminer le
  segment, ne pas dessiner la ligne zéro ni raccorder deux épisodes à travers
  une période sèche. Les données restent disponibles au survol.

## Reprendre l’aperçu local

État météo : `.cache/weather/terre-rouge-preview.json`.
Sortie générée : `.cache/sites/terre-rouge/`.
URL de travail : `http://127.0.0.1:4177/terre-rouge/`.

```powershell
node scripts/prepare-site.mjs --site=terre-rouge --state=.cache/weather/terre-rouge-preview.json
$env:PREVIEW_PORT = '4177'
node scripts/preview-sites.mjs
```

Le serveur local devra être relancé si l’ordinateur redémarre. Les fichiers
restent enregistrés, mais les prévisions PIAF doivent être renouvelées pour le
nouveau jour. Aucun renouvellement automatique n’a été mis en place ici.

## Validation effectuée

- v3.278 locale : 66 tests `check:sites` passent. Même cumul réparti sur une
  heure ou sur 18 h produit des résumés différents ; inconnues non assimilées
  à du sec. Cache réel : samedi 24, 0,32 mm, résumé sec ; lundi 26, 0,002965 mm,
  sans barre ni gouttes. Tests des seuils 0,0099/0,01 mm, conservation des
  quantités, pluie soutenue en petits pas PIAF, zéro sans ligne et séparation
  des épisodes. URL CSS versionnée avec la release et partagée avec le cache
  du service worker, au lieu de conserver style.css?v=175. Suite complète :
  377 tests passent ; `check:pages` passe et aperçu reconstruit en v3.278.
  Publication explicitement demandée ensuite : compte meteo-terrerouge et origin
  vérifiés via le script multicompte. Dépôt dédié propre et synchronisé.
  Commit `bdcd91df052b41328feb368a1bfd67a303375bcd`, workflow manuel
  `39892506640`, site terre-rouge, group piaf, publish true : collecte PIAF,
  génération et déploiement Pages réussis. Aucune publication Tatins ni nouvelle
  cadence automatique. Vérification HTTP publique : config v3.278 ; app.js,
  daily-rows.js, style.css et service-worker.js identiques aux fichiers locaux.
  index.html et service worker utilisent bien style.css?v=3278.
  URL : `https://meteo-terrerouge.github.io/`.
  Pas de nouveau contrôle visuel navigateur.
- v3.277 locale : 63 tests `check:sites`, suite complète 374 tests et
  `check:pages` passent. Régression réunissant gouttes, 0,22, 0,82 et 0,85 mm
  sur le même graphique, à 280, 800 et 1800 px et sous plusieurs échelles :
  gouttes toujours plus basses, quantités chiffrées distinctes. Les différences
  au-dessus du socle restent proportionnelles aux intensités. Même hiérarchie
  vérifiée pour PIAF ; zéro reste sans précipitation. Aperçu reconstruit.
  Publication ensuite explicitement autorisée par l’utilisateur : compte GitHub
  et origin vérifiés avec le script multicompte, dépôt dédié propre avant et
  après synchronisation. Trois fichiers publiés : CHANGELOG.md, daily-rows.js,
  style.css. Commit `11450735884d52b06f234fc98af8e77ad9ab621f` poussé sur main.
  Workflow manuel `39890879036`, site terre-rouge, group piaf, publish true :
  collecte PIAF, préparation et déploiement Pages réussis. Autres données valides
  du cache conservées ; aucune cadence automatique ni publication Tatins ajoutée.
  Vérification HTTP publique réussie : config v3.277 ; app.js, daily-rows.js,
  style.css et service-worker.js identiques à la génération locale, fins de ligne
  normalisées. URL : `https://meteo-terrerouge.github.io/`.
  Aucun nouveau contrôle visuel navigateur.
- v3.276 locale : 62 tests `check:sites` passent. Proportions linéaires vérifiées
  à plusieurs largeurs et échelles, seuil gouttes inchangé, cumul de 3 h distingué
  de l’intensité et extension de l’échelle en cas de pluie forte. PIAF : 1 mm/h
  occupe 9 px sur les 90 px disponibles, sans plancher chiffré. Suite complète :
  373 tests passent hors bac à sable Windows ; `check:pages` passe. Aperçu reconstruit,
  serveur confirmé sur le port 4177. Données réelles du 6 novembre contrôlées à
  800 px : 0,3 mm/3 h = 0,72 px et 0,9 mm/3 h = 2,16 px, au lieu de 10 px
  identiques. Aucun nouveau contrôle visuel navigateur (blocage déjà constaté).
  Pas de déploiement :
  la consigne AGENTS.md la plus récente réserve le déploiement à l’utilisateur.
- v3.275 locale : 60 tests `check:sites`, suite complète 371 tests passent ;
  tests d’âges avec minutes seules de 1 à 59,
  seuil de 1 h et légende PIAF. `check:pages` passe. Contrôles du rendu avec les
  données publiques : lundi sans pictogramme ni cumul neige, deux repères PIAF
  de gouttes et aucun axe d’intensité chiffré. Pas encore publié.
- Publication demandée le 23 octobre : compte et origin vérifiés avec le script
  GitHub multicompte, dépôt `meteo-terrerouge/meteo-terrerouge.github.io`.
  368 tests complets passent avant envoi. Commit dédié `2cd1e4f` poussé sur main ;
  workflow manuel `39882753562`, site Terre Rouge, group all et publish true.
  Aucun déploiement Tatins, aucune cadence automatique ajoutée, aucune donnée
  locale ni note privée copiée dans le dépôt de publication.
  Workflow et déploiement Pages réussis. URL : `https://meteo-terrerouge.github.io/`.
  Vérification HTTP publique : config v3.274 ; app.js, daily-rows.js, style.css
  et service-worker.js identiques à la génération locale (fins de ligne normalisées).
  Collectes publiques du 23 octobre, heures de Paris : Open-Meteo 03:13 (384 h),
  PIAF 03:14 (36 points), AROME 03:18 (48 h), ARPEGE 03:22 (32 créneaux).
  Le dépôt dédié est propre et synchronisé après publication. L’aperçu v3.275
  utilise ensuite une copie de ces données publiques, sans nouvelle collecte MF.
- v3.274 : 57 tests `check:sites` passent, dont reproduction du cas dimanche,
  seuil du mélange, neige seule, code neige explicite, conservation des données,
  pictogrammes et résumés quotidiens et 3 h. `check:pages` passe et aperçu
  reconstruit. Contrôle du rendu généré avec le cache réel : dimanche classé
  pluie, aucun calque neige/mélange ni cumul neige visible, trace brute conservée.
- v3.273 : 56 tests `check:sites` et `check:pages` passent. Arrondis neige
  sous 0,5 cm, à 0,5 cm et autour de 1,5 cm testés dans les barres et résumés,
  sans modifier les quantités sources ; cumul 3 h sans signe environ testé aussi.
  Aperçu principal reconstruit. Pas de nouveau contrôle navigateur : blocage
  de l’outil déjà constaté lors de la reprise v3.272.
- v3.272 terminée le 23 octobre : 55 tests `check:sites`, 366 tests de la suite
  complète et `check:pages` passent. Suite complète exécutée hors bac à sable
  pour les renommages de fichiers temporaires Windows. Aperçu principal reconstruit.
  Collecte réelle du 22 octobre à 22:10–22:19 : neige connue pour 47 h AROME,
  32 créneaux ARPEGE sur 33 et 384 h Open-Meteo ; absence restante conservée
  comme inconnue. PIAF renouvelé à 22:19, désormais expiré : pas d’extrapolation.
  Contrôles visuels avant interruption à 1281, 390 et 320 px, option horaire
  comprise : un seul diagramme, pictogrammes neige/mélange, cm estimés et aucun
  débordement. Capture `terre-rouge-3272-neige-simulation.png` : scénario simulé,
  pas les prévisions réelles. La reprise du 23 a confirmé les tests et la génération,
  mais le contrôle navigateur final a été bloqué par la politique de l’outil.
- v3.271 : âge par source, date exacte au survol, horloge du site, cas absent et
  futur, ainsi que mm conditionnel sans regroupement supplémentaire testés.
  46 tests `check:sites` et `check:pages` passent. Contrôle navigateur à la
  largeur du panneau et à 320 px sans débordement : âges relatifs visibles,
  unités ajoutées seulement si elles tiennent. Capture : `terre-rouge-3271.png`.
- v3.270 : 44 tests `check:sites`, 4 tests d’interface et `check:pages` passent.
  Réversibilité, ordre temporel, vitesse continue et projection Bézier exacte
  testés sans dépassement des températures. Colonnes toujours de largeur égale.
  Contrôle navigateur à 1440, 390 et 320 px sans débordement ; Tendance dans
  l’en-tête du 30, absente le 29 ; anciennes classifications retirées.
  Référence mathématique : `https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html`.
- v3.269 : 42 tests `check:sites` et `check:pages` passent. Contrôle navigateur :
  étiquettes « gouttes », aucun suffixe de durée ni ancien pictogramme de trace,
  petites barres de 5 px visibles. Capture : `terre-rouge-3269.png`.
- v3.268 : tests de gouttes, zéros, cumuls agrégés sans perte, trous, échelle
  commune, intensités et conservation des points aux transitions et aux marges.
  `npm run check:sites` : 42 tests passent ; 4 tests d’interface passent aussi.
  `npm run check:pages` passe. Capture de contrôle : `terre-rouge-3268.png`.
  Contrôle navigateur à 1440, 390 et 320 px : aucun débordement, étiquettes dans
  le graphique, option horaire fonctionnelle ; sources ramenées à gauche dès
  qu’elles passent sur une seconde ligne, y compris avec la nouvelle légende.
- v3.267 : `npm run check:sites`, 37 tests passent ; 4 tests d’interface passent
  aussi. `npm run check:pages` passe, sans publication. Barres natives de 3 h,
  priorité des sources, trous, doublons, coupure à minuit et fragments estimés
  testés. Le repère J+7 ne transforme pas les courbes en prévisions d’ensemble.
- Vérification navigateur v3.267 : une barre de 2,29 mm de 11 h à 14 h vendredi,
  au lieu de trois barres horaires de 0,76 mm. Aucun débordement à 1440, 390 et
  320 px ; option horaire fonctionnelle, sources mobiles alignées à gauche.
  Capture : `terre-rouge-3267.png` dans les visualisations de la session.
- Références sur la nature des données : `https://open-meteo.com/en/docs`
  (sélection automatique, prévisions jusqu’à 16 jours, probabilité de pluie
  issue d’ensembles distincte des cumuls) et
  `https://open-meteo.com/en/docs/ensemble-api` (membres d’ensemble).
- Dernière suite complète avant v3.262 : 337 tests passent (hors bac à sable
  Windows pour les fichiers temporaires).
- v3.266 : `npm run check:sites`, 33 tests passent, dont compression saisonnière,
  changement d’heure, cumuls, résumé, largeur horaire et espacement nocturne ;
  sources datées et correction du seuil horaire ; 4 tests d’interface passent aussi.
- `node --check public/app.js` passe.
- `npm run check:pages` : génération et vérification principale, sandbox et testing.
- Vérification v3.266 : écarts constants entre pictogrammes sur la frise du samedi,
  transitions comprises ; sources alignées à gauche sur leur seconde ligne mobile.
  Cache PIAF local contrôlé : aucune échéance 5 min encore valide au 22 octobre.
- Vérification v3.265 : cadres alignés, titre 3 h unique à l’intérieur, toutes
  les sources dans les légendes. Mesures sans débordement à 320 et 1440 px,
  contrôle visuel à la largeur du panneau navigateur.
- Vérification v3.264 : à 1108 px de graphique, pas horaire diurne automatique
  aujourd’hui et les jours suivants, option masquée. Libellé long sur mobile et
  sources en 9 px sans débordement. Titre général et Réinitialiser retirés.
- Vérification v3.263 : option masquée à 1440 px, mode horaire sur mobile,
  minima/maxima et goutte, pictogrammes nocturnes de 69 px espacés d’au moins
  69 px au seuil horaire. Mesures DOM sans débordement à 390 et 320 px, rendu visuel contrôlé
  à la largeur normale du panneau navigateur.
- L’aperçu utilise maintenant une copie des collectes publiques du 23 octobre
  à 03:13–03:22. Aucun renouvellement automatique ; les échéances PIAF expirent
  normalement sans prolongation artificielle.

Les fichiers publics principaux sont `public/daily-rows.js`, `public/app.js`,
`public/style.css` ; la génération du profil est dans `scripts/prepare-site.mjs`.
