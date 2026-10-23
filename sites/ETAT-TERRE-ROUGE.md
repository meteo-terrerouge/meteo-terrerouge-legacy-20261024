# Collecte automatique autorisée le 23 octobre 2026 — v3.280

L’utilisateur a explicitement autorisé « Oui, active la collecte et la publication
automatiques », par exception à la règle générale sans déploiement.
Le workflow `refresh-terre-rouge.yml` est préparé : PIAF toutes les 5 min,
prévisions chaque heure, publications sérialisées avec fusion par source,
restauration des caches et des JSON publics. Compte/dépôt :
`meteo-terrerouge/meteo-terrerouge.github.io`, exclusivement Terre Rouge.
Validation : 382 tests passent hors restriction Windows des fichiers temporaires,
71 tests `check:sites`, `check:pages` et `actionlint` passent.
Activation et vérification publiques en cours ; compléter ce paragraphe avec
le commit, les exécutions Actions et les dates réellement publiées.

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
