# Détails techniques des API

## [Radar v1 Météo-France](https://portail-api.meteofrance.fr/web/api/DonneesPubliquesRadar) {#api-radar}

- Catalogue : `DPRadar/v1/mosaiques/METROPOLE/observations/LAME_D_EAU`.
- Produit demandé : lame d’eau nationale avec une maille de 500 m.
- Format lu : HDF5.
- La projection du fichier est convertie vers la longitude et la latitude avec `proj4`.
- Les valeurs de gain, décalage, absence de donnée et valeur indétectable sont appliquées avant analyse.
- Le serveur extrait uniquement la zone utile autour des Tatins.
- Les pixels significatifs sont regroupés en composantes connexes pour identifier des cellules pluvio-orageuses.
- Pour chaque cellule sont calculés le centre pondéré par l’intensité, la forme pixellisée, la surface, la pluie moyenne et la pluie maximale.
- Deux images successives servent à estimer le déplacement, extrapolé jusqu’à 60 minutes.
- Lorsqu’une cellule devient significative, les volumes multipolarisés PAM des radars de Moucherotte et de Colombis sont également demandés. Les variables ZH, ZDR, ρHV et l’écart-type de réflectivité sont croisées sur plusieurs élévations. Les deux radars sont préférés, mais un seul radar complet permet un calcul dégradé.

Le risque de passage, le potentiel orageux, la pluie intense et la grêle sont des indicateurs locaux dérivés. Ce ne sont pas des bulletins officiels.

## [PIAF Météo-France](https://portail-api.meteofrance.fr/web/fr/api/PrevisionImmediatePrecipitations) {#api-piaf}

- Service Météo-France : WCS 2.0.1.
- Le serveur lit `GetCapabilities` et choisit la couverture `PT5M` la plus récente disponible. Le taux de précipitation PIAF, exprimé sur une heure, est intégré sur cinq minutes (`÷ 12`) avant le calcul des cumuls.
- Une valeur ponctuelle est demandée aux coordonnées des Tatins avec `GetCoverage`.
- Trente-six échéances espacées de cinq minutes sont récupérées, de +5 min à +3 h.
- Les valeurs XML/GML sont converties en cumuls de précipitations en millimètres.
- Les probabilités PE-AROME disponibles sont associées aux intervalles PIAF.

## [AROME Météo-France](https://portail-api.meteofrance.fr/web/fr/api/AROME) {#api-arome}

- Service Météo-France : WCS 2.0.1.
- Le dernier cycle cohérent possédant tous les champs nécessaires est sélectionné.
- Champs utilisés : température à 2 m, précipitations, vent U/V à 10 m, rafales, nébulosité totale et densité moyenne de foudre prévue sur trois heures.
- Température, pluie et signal de foudre sont récupérés à l’heure.
- La densité de foudre est convertie en éclairs pour 100 km² par heure. Un signal orageux est retenu à partir de 0,01 lorsque le cumul de pluie AROME sur la même fenêtre de trois heures atteint également 0,1 mm ; les traces positives inférieures ne suffisent plus à afficher un éclair.
- La nébulosité, le vent et les rafales sont téléchargés à chaque échéance horaire AROME.
- Conversions principales : kelvins vers degrés Celsius, mètres par seconde vers kilomètres par heure et fraction nuageuse vers pourcentage.
- Les composantes U/V sont converties en vitesse et direction du vent.
- Résultat : prévision déterministe normalisée sur 48 heures, avec un signal orageux dérivé des champs de foudre et de précipitations AROME.

## [PE-AROME Météo-France](https://portail-api.meteofrance.fr/web/fr/api/AROME-PI) {#api-pe-arome}

- Ensemble Météo-France comportant jusqu’à 25 membres.
- Chaque membre possède son propre service WCS.
- Les membres permettent d’estimer la probabilité de précipitations et la dispersion des scénarios.
- La probabilité de pluie est échantillonnée toutes les trois heures avec un seuil de 0,1 mm.
- Les intervalles d’incertitude de température, vent, rafales et nuages sont calculés sur des points espacés de six heures.

## [ARPEGE Météo-France](https://portail-api.meteofrance.fr/web/fr/api/ARPEGE) {#api-arpege}

- Service déterministe Météo-France WCS 2.0.1.
- Les échéances disponibles sont déterminées par `GetCapabilities` et `DescribeCoverage`.
- Champs utilisés : température, vent U/V, rafales, nuages, précipitations, énergie convective disponible maximale et précipitations convectives.
- Au-delà de la portée d’AROME, le signal orageux est retenu lorsque l’énergie convective et les précipitations convectives prévues sont simultanément significatives.
- Les échéances déjà acquises au pas de trois heures prolongent les détails des créneaux quotidiens lorsque AROME ou PE-AROME ne couvre plus le créneau entier ; ce relais ne déclenche aucun appel API supplémentaire et ne fabrique aucune probabilité de pluie par créneau.
- Les résultats alimentent les quatre jours suivant la prévision AROME.
- Les mêmes conversions d’unités et contrôles de cohérence qu’AROME sont appliqués

## [PE-ARPEGE Météo-France](https://portail-api.meteofrance.fr/web/fr/api/ARPEGE) {#api-pe-arpege}

- Ensemble Météo-France comportant jusqu’à 35 membres.
- Les précipitations sont téléchargées sous forme de GeoTIFF.
- Le serveur repère dans chaque grille le pixel contenant les coordonnées des Tatins.
- Une date n’est retenue que si au moins 20 membres sont disponibles.
- Les membres servent à calculer les probabilités et intervalles de confiance sur quatre jours.

## [Vigilance Météo-France](https://vigilance.meteofrance.fr/) {#api-vigilance}

- API `DPVigilance/v1/cartevigilance/encours` au format JSON.
- Les phénomènes, périodes et couleurs du département configuré sont extraits pour l’alerte affichée sur le site.

## [EUMETSAT MTG Lightning Imager](https://data.eumetsat.int/product/EO%3AEUM%3ADAT%3A0691) {#api-eumetsat-li}

- Collection utilisée : `EO:EUM:DAT:0691`.
- Authentification OAuth 2.0 par `client_credentials`.
- Le catalogue fournit le produit récent et son lien NetCDF4.
- NetCDF4 reposant sur HDF5, le fichier est lu avec `h5wasm`.
- Les éclairs sont filtrés dans un rayon local, puis convertis en distance et position par rapport aux Tatins.
- Ces observations corroborent l’activité électrique des cellules suivies par le radar.

## [Open-Meteo · ECMWF IFS HRES](https://open-meteo.com/en/docs/ecmwf-api) {#api-open-meteo}

- API JSON sans clé.
- Pour la prévision quotidienne et la frise 48 h, le modèle demandé est **ECMWF IFS HRES**, sur sa maille native d’environ **9 × 9 km**, afin de conserver un même scénario homogène.
- Le modèle est actualisé toutes les 6 heures. Sa résolution temporelle native est horaire jusqu’à 90 heures, puis de 3 heures jusqu’à 144 heures et de 6 heures ensuite ; Open-Meteo interpole ces échéances pour fournir la série horaire utilisée par l’interface.
- Données demandées : température, précipitations, probabilité de pluie, code météo, nébulosité, vent, rafales, lever et coucher du soleil.
- **Frises et comparaison des modèles — risques sans cumul quantifié** : les badges « Pluie X % » ou « Pluie possible » sont affichés à partir de **20 % inclus**. Sous 20 %, le badge est masqué. Les cumuls quantifiés et les pictogrammes météo de ces frises conservent leurs règles d’affichage. Le seuil de 20 % est un choix de lisibilité du site, pas une règle de Météo-France ; masquer un badge ne signifie pas que le risque est nul.
- **Libellé « gouttes » dans la frise** : une quantité positive affichable jusqu’à **0,2 mm inclus** porte le libellé « gouttes » ; au-delà, la quantité est affichée en millimètres. Le cumul exact et sa période restent accessibles au survol. Pour une case horaire, il s’agit du cumul sur une heure. Ce seuil est une convention de présentation du site, pas une catégorie météorologique officielle ; il ne modifie pas la probabilité de précipitations.
- Le libellé « Pluie » remplace « Averse » lorsqu’aucune quantité n’est affichable : une probabilité seule ne permet pas de qualifier des averses. Les codes météo continuent de distinguer pluie, averses, bruine, neige et orages. Chez Open-Meteo, la probabilité porte sur plus de **0,1 mm de précipitations pendant l’heure précédente** ; ce seuil en millimètres est distinct du seuil d’affichage de 20 %.
- Les codes météo 95 à 99 fournissent le signal orageux Open-Meteo utilisé dans les frises et la synthèse.
- Les quatre premiers jours sont corroborés avec la prévision Météo-France ARPEGE ; IFS HRES reste la source homogène jusqu’au huitième jour.
- Le repère saisonnier des températures est une table locale générée à partir de la réanalyse ERA5-Land 1991–2020 : chaque heure prévue est comparée à la médiane de la même heure dans une fenêtre climatologique de 15 jours.
- Fuseau demandé : `Europe/Paris`.
- Le choix IFS HRES concerne la prévision quotidienne et la frise 48 h.

## Cache et fréquence d’actualisation

| Donnée | Durée cible du cache serveur |
|---|---:|
| PIAF | 4 min |
| Radar | 4 min |
| Radar polarimétrique PAM | cycle de 5 min, uniquement lors d’une activité significative |
| Foudre EUMETSAT | 5 min |
| AROME | 60 min |
| PE-AROME, probabilités | 3 h |
| PE-AROME, ensemble | 6 h |
| Vigilance | 30 min |
| Open-Meteo | 30 min |
| ARPEGE et PE-ARPEGE | 6 h

Lorsqu’une actualisation échoue ou reste trop incomplète, la dernière acquisition complète est conservée et continue d’être servie, même après l’expiration de sa durée cible, jusqu’à ce qu’un remplacement exploitable soit disponible.

# [Nowcasting](index.html#radar-nowcast)

Le **[nowcasting](index.html#radar-nowcast)** décrit le temps présent et son évolution probable à très courte échéance. Il est ici designé pour les 3h suivantes environ pour la pluie et la prochaine heure pour le déplacement des cellules pluvio-orageuses.

## Données réunies

Le schéma combine cinq sources complémentaires :

- **Radar v1** indique où il pleut réellement et avec quelle intensité au moment de l’observation.
- **PIAF** fournit les cumuls de pluie prévus toutes les cinq minutes jusqu’à trois heures.
- **EUMETSAT LI** indique les éclairs observés autour des cellules et confirme leur activité électrique.
- **PAM Météo-France**, lorsque l’analyse est déclenchée, aide à distinguer un signal compatible avec la grêle d’une pluie forte observée par les radars voisins ; un radar complet suffit en mode dégradé.
- **AROME et Open-Meteo** apportent les signaux d’orage prévus dans les trois prochaines heures, indépendamment de la détection immédiate des cellules radar.

PE-AROME peut ajouter une probabilité de précipitations aux créneaux PIAF. AROME apporte le contexte météorologique général, mais ne pilote pas directement la trajectoire dessinée des cellules.

## Détection des cellules

1. La mosaïque radar est découpée autour des Tatins.
2. Les pixels dépassant le seuil de pluie significative sont retenus.
3. Les pixels voisins sont réunis en ensembles continus.
4. Chaque ensemble suffisamment cohérent devient une cellule identifiée par une lettre.
5. Son centre est pondéré par l’intensité de la pluie : les zones les plus actives comptent davantage.
6. Sa forme pixellisée, sa surface, sa pluie moyenne et sa pluie maximale sont calculées.

La forme radar réellement détectée est conservée dans tous les calculs actifs, y compris ses creux et ses éventuelles parties discontinues. Le bord, le contact avec Les Tatins, le passage, l’ETA, la foudre associée et l’échantillonnage polarimétrique utilisent directement ces pixels plutôt qu’un cercle plein. Cette forme demeure une interprétation de pixels radar, pas une frontière météorologique exacte.

## Suivi et trajectoire

À chaque nouvelle mosaïque, environ toutes les cinq minutes, la forme de chaque cellule est entièrement redétectée : elle peut donc s’étendre, se contracter, se déformer, se scinder ou fusionner. Les cellules de deux images successives sont rapprochées en déplaçant leur forme précédente selon la trajectoire estimée, puis en mesurant le recouvrement des pixels, la distance entre les bords et la cohérence des surfaces. La meilleure continuité conserve la même lettre ; lors d’une scission, les autres parties reçoivent une nouvelle lettre, et lors d’une fusion une seule identité est poursuivie.

Le déplacement global est obtenu par corrélation entre deux images espacées d’au moins quatre minutes. Pour chaque cellule reconnue, ce vecteur est comparé à la régression de ses positions conservées pendant la dernière heure. Lorsque les deux directions sont cohérentes, le calcul retient 65 % du mouvement global et 35 % de l’historique, puis augmente légèrement la confiance.

L’horizon dépend de la qualité du rapprochement, de la vitesse et de la régularité passée : il est nul si aucun mouvement n’est exploitable, puis vaut 45, 60, 90, 120 ou au maximum **180 minutes**. Entre deux images, la dernière forme réellement observée est déplacée sans lui inventer une déformation déterministe ; une marge d’incertitude croissante l’entoure. Dès que la mosaïque suivante arrive, sa nouvelle forme observée remplace cette projection. L’incertitude spatiale augmente avec l’échéance et diminue avec la confiance.

## Intensité générale

Les cinq points orange combinent :

- l’intensité de pluie mesurée par le radar et le risque de pluie intense ;
- l’indice polarimétrique de grêle, uniquement lorsqu’il est calculable ;
- le nombre d’éclairs EUMETSAT LI situés à moins de huit kilomètres du bord réel de la cellule.

Ces composantes sont ramenées sur une échelle de 0 à 5 puis combinées en **« et/ou »** : le phénomène le plus significatif prévaut, sans moyenne pondérée susceptible de le diluer. La pluie seule est plafonnée à **4/5**, même lorsque son niveau propre atteint 5/5. Le niveau général **5/5** exige en plus un signal de grêle ou des éclairs. Les détails séparés pluie, grêle et foudre restent disponibles dans la fiche de la cellule.

L’intensité pluvieuse représentative d’une cellule est sa moyenne spatiale, plafonnée par son maximum. Si son contour recouvre Les Tatins, la mesure du pixel local peut relever cette valeur sans dépasser le maximum observé dans la cellule. Le maximum brut reste utilisé séparément pour repérer un noyau intense et calculer le risque de pluie forte ; il ne produit jamais de score de grêle.

## Risque orageux à trois heures

Le premier indicateur de la synthèse à trois heures assemble des informations de nature différente sur une même échelle de prudence :

Une **ETA décrit uniquement la trajectoire probable d’une cellule** : elle ne signifie pas que cette cellule est orageuse. La cellule n’alimente l’avertissement orage que si elle présente au moins une signature convective explicite, horodatée et sourcée, un éclair EUMETSAT LI frais à moins de 8 km de sa forme, une signature polarimétrique classée grêle d’au moins 20 % ou un noyau de pluie forte observé à au moins 30 mm/h. Les preuves doivent être cohérentes avec une image radar elle-même récente. Une pluie moins intense, son simple renforcement, une classification PAM mixte et la confiance de trajectoire ne suffisent jamais. Une ETA de cœur ou une ETA possible issue de l’enveloppe d’incertitude peut donc rester associée à une cellule seulement pluvieuse, sans avertissement orage.

- une vigilance Météo-France **Orages** orange ou rouge active impose un minimum de **1/5** ;
- une seule source parmi Open-Meteo et Météo-France prévoyant un orage dans les trois prochaines heures donne **1/5** ;
- les deux sources prévoyant un orage dans les trois prochaines heures donnent **2/5** ;
- toute probabilité de passage nowcasting d’une cellule ainsi qualifiée d’orageuse peut également produire **1/5** sous 20 % et **2/5** entre 20 et 39 %, indépendamment de son intensité ;
- la composante de passage nowcasting atteint **3/5, 4/5 et 5/5** pour des probabilités maximales respectivement comprises entre 40–59 %, 60–79 % et 80–100 %.

La proximité géométrique d’une cellule ne suffit plus à imposer le niveau 2. Le niveau final croise la probabilité de passage avec l’intensité projetée localement aux Tatins : le profil de pluie qui traverse le point est privilégié par rapport à l’intensité moyenne de toute la cellule. Une forte probabilité de passage d’un orage faible reste ainsi à **3/5 jaune**. Le niveau **4/5 orange** exige à la fois une probabilité d’au moins 60 % et une intensité d’au moins 4/5 ; le niveau **5/5 rouge** exige simultanément au moins 80 % et une intensité 5/5 comportant de la grêle ou des éclairs. Une cellule très intense mais peu susceptible de toucher les Tatins reste elle aussi jaune. Dans les messages, « orage violent » dépend de l’**intensité détaillée** : il est réservé à ses niveaux 4/5 et 5/5, jamais à 3/5 ni au seul fait que la probabilité de passage soit élevée.

Une durée n’est annoncée que lorsque la fin du passage est réellement connue : pas sec suivant dans PIAF, ou profil pluvieux projeté, frais et confirmé. L’encadré emploie **« Encore »** pour un passage actif et **« Durée »** pour un passage futur. Si la pluie atteint la fin de la frise, si la trajectoire reste incertaine ou si le point se trouve sur une bordure radar mêlant pixels humides et secs, aucune durée n’est affichée. Dans ce dernier cas, le message peut devenir **« Bordure d’orage »** ou **« Bordure de cellule pluvieuse »** lorsque le phénomène est actif et que sa présence locale reste incertaine.

Dans la synthèse **« Dans les 3 h »**, un signal de **0,01 mm provenant d’une seule source, sans corroboration, est ignoré**. Si aucun autre signal ne subsiste, la synthèse affiche **« Pas de pluie »**, sans durée ni flèche. Un cumul supérieur à 0,01 mm reste pris en compte ; 0,01 mm est également conservé si une prévision et le radar se corroborent sur le même créneau. La mosaïque et les cellules suivies sont une même source radar et ne se corroborent pas entre elles. Les valeurs brutes restent consultables. PIAF et l’extrapolation radar ne fournissent pas de probabilité de passage : aucune valeur de 100 % n’est déduite de leur cumul. Une extrapolation sans confirmation explicite ne permet pas d’annoncer une durée certaine.

## Lecture commune des couleurs météo

Les fonds colorés de la synthèse orage-nowcasting et des créneaux de prévision semaine partagent la même signification :

| Affichage | Signification |
| --- | --- |
| Sans couleur | Situation ordinaire ou signal encore insuffisant pour demander une attention particulière. |
| **Jaune — Attention** | Météo compliquée : rester attentif et adapter ses activités. |
| **Orange — Sérieux** | Phénomène sérieux : forte prudence, suivre son évolution et éviter de s’exposer inutilement. |
| **Rouge — Alerte** | Danger grave : prendre immédiatement ses dispositions pour se protéger et limiter les conséquences. |

Dans l’encadré Orage, cette lecture correspond à **0–2/5 sans couleur**, **3/5 jaune**, **4/5 orange** et **5/5 rouge**. Dans la prévision semaine, les mêmes couleurs sont calculées à partir de scénarios Open-Meteo et Météo-France conservés séparément, en tenant compte de la pluie, du vent moyen, des rafales et de leur concomitance avec un orage.

Cette échelle interne ne concerne ni le rond de confiance, dont la couleur décrit la qualité de la prévision, ni la vigilance officielle Météo-France, dont le niveau externe reste présenté séparément.

## Risques de pluie intense et de grêle

Le risque de pluie intense et l’indice de grêle sont calculés par le site à partir du radar ; ce ne sont pas des probabilités fournies directement par Météo-France.

- **Pluie intense :** le score dépend à 90 % de l’intensité maximale relevée dans la cellule, avec une progression rapide autour de 12 mm/h, et à 10 % de sa probabilité de passage aux Tatins. Il décrit donc surtout la puissance de la cellule ; une cellule très pluvieuse qui passe à côté peut conserver un score élevé.
- **Grêle :** sans donnée polarimétrique exploitable, **aucun score de grêle n’est produit**. La lame d’eau et l’indice de pluie radar ne servent jamais de remplacement. Dès qu’au moins un des radars fournit deux élévations suffisamment échantillonnées, chaque cellule analysée reçoit un indice, même faible ou nul ; le fonctionnement est signalé comme dégradé avec un seul radar et la présence des deux radars apporte la vue croisée normale. Une signature positive exige une forte réflectivité (ZH ≥ 55 dBZ), une corrélation abaissée (ρHV entre 0,90 et 0,95) et une réflectivité différentielle faible (ZDR entre −2 et 1 dB). L’indice affiché est simplement la proportion mesurée de pixels forts qui respectent ces trois critères ; aucune formule ne le rehausse artificiellement.

Ce résultat reste un indice expérimental, pas une probabilité ni une observation certaine de grêle au sol. Une analyse suffisamment couverte mais classée pluie ou mixte conserve son indice polarimétrique ; seule une couverture insuffisante reste explicitement « non évaluée ». La température en altitude, la hauteur de l’isotherme 0 °C, l’énergie convective et le cisaillement restent nécessaires pour améliorer la prévision à trois heures et la distinction entre neige, grésil et grêle.

Lorsqu’une signature PAM compatible avec la grêle est reconnue dans une cellule suivie, sa trajectoire radar et sa probabilité de passage servent à prévoir son arrivée possible aux Tatins jusqu’à trois heures à l’avance. L’interface qualifie séparément le passage orageux et la grêle dans un même message, par exemple « Orage probable avec grêle possible dans X min ». Ce nowcasting prévoit le déplacement d’une cellule déjà grêligène ; il ne prévoit pas encore la formation ultérieure de grêle dans une cellule qui ne présente pas de signature polarimétrique.

## Risque de passage

Le risque de passage estime la possibilité que la trajectoire et sa zone d’incertitude atteignent Les Tatins. À chaque minute de l’horizon exploitable, la forme réelle est déplacée selon le vecteur calculé. Le score combine la distance minimale du bord réel, l’intersection du cœur ou de l’enveloppe incertaine, la confiance du mouvement et la vitesse.

Une ETA dite **cœur** correspond au contact de la forme prévue avec la zone locale. Une ETA dite **possible** correspond seulement au contact de l’enveloppe d’incertitude. Les probabilités sans ETA, les cellules lointaines et les trajectoires qui s’éloignent sont plafonnées. À l’inverse, un contact actuel, une ETA de cœur ou une très faible distance imposent un plancher progressif. En présence de plusieurs cellules proches, un faible plancher contextuel évite de présenter chacune comme totalement sans conséquence.

Une cellule intense peut présenter un faible risque local si elle s’éloigne ou passe à côté. Une cellule plus faible peut au contraire avoir un risque de passage élevé si elle se dirige vers Les Tatins.

## Profil de pluie projeté et cumul

Chaque pixel radar de 500 m appartenant à une cellule conserve son intensité en mm/h. Le calcul déplace ces pixels selon la trajectoire et détermine les intervalles exacts pendant lesquels chacun traverse Les Tatins. Si la trajectoire longe une frontière commune, les pixels simultanément actifs sont moyennés pour éviter un double comptage.

Le cumul conditionnel d’un passage est l’intégrale de ce profil : **intensité × durée / 60**. Des lobes séparés de la même cellule produisent plusieurs passages distincts au lieu d’un seul bloc artificiel. En l’absence d’un profil exploitable, le repli utilise l’intensité moyenne représentative et une durée issue de la largeur traversée et de la vitesse ; les dix derniers pour cent sont atténués lorsqu’une cellule déjà présente termine son passage.

La tendance de pluie analyse uniquement les douze pas PIAF des soixante prochaines minutes. Une régression mesure l’évolution générale, mais un pic supérieur au premier pas et prévu prochainement impose une tendance croissante afin qu’une fin de période sèche n’efface pas l’arrivée imminente.

## Association entre le radar et PIAF

Le radar mesure un taux instantané en millimètres par heure. Pour le comparer à PIAF, ce taux est converti en cumul équivalent sur cinq minutes, puis rapproché des mêmes échéances.

Le radar complète PIAF : le premier décrit l’observation et le déplacement récent ; le second fournit une prévision de précipitations jusqu’à trois heures. Lorsqu’une cellule recouvre réellement Les Tatins (passage calculé à 100 %), le radar devient prioritaire pendant les quinze premières minutes, puis son poids diminue jusqu’à une heure. Cet amendement ne réduit jamais le cumul prévu par PIAF et alimente à l’identique la synthèse 3 h et les périodes correspondantes de la frise 48 h.

Sur chaque intervalle de cinq minutes, l’amendement radar est comparé au cumul PIAF correspondant. La fusion conserve le plus fort signal utile au lieu d’additionner deux estimations du même épisode. Elle ne diminue donc jamais PIAF et évite le double comptage. Les passages discontinus et les épisodes de cellules différentes restent des intervalles séparés dans le calcul sur trois heures, puis sont reportés aux mêmes échéances de la série 48 h.

## Actualisation et limites

- Le radar est normalement réactualisé toutes les quatre minutes environ.
- Une cellule qui n’est plus retrouvée peut être conservée brièvement comme « fin de détection ».
- Une cellule peut se renforcer, faiblir, fusionner ou se diviser entre deux images.
- Le relief peut influencer la mesure radar et l’évolution réelle des précipitations.
- L’extrapolation suppose que le mouvement récent reste assez stable pendant l’heure suivante.
- Les signaux AROME et ARPEGE restent des prévisions : ils ne constituent ni une observation ni une localisation précise d’une cellule.
- La forme, la trajectoire, l’heure d’arrivée et les risques sont des calculs locaux à valider et éventuellement affiner.

# Prévision semaine

Dans la carte du jour J, **Nuit** correspond aux heures de **0 h à 6 h le lendemain (J+1)**. Le créneau Soir couvre 18h minuit.

## Sources et calculs

- **ECMWF IFS HRES**, obtenu par Open-Meteo, fournit le scénario horaire de référence sur sept jours. Les premières heures du huitième jour sont aussi demandées afin de calculer la dernière nuit.
- **ARPEGE Météo-France** sert de comparaison sur les quatre premiers jours.
- La dispersion de **DWD ICON-EPS** complète l’estimation de l’incertitude lorsque la comparaison avec ARPEGE n’est pas disponible.

### Pondération des sources : 70 % / 30 %

Pour les créneaux de la semaine, les cumuls de pluie, probabilités de précipitations, températures, nébulosités, vents et rafales combinés utilisent **70 % Météo-France et 30 % Open-Meteo** lorsque les deux valeurs sont disponibles sur le même créneau. Ce choix privilégie la spécificité locale : la maille d’Open-Meteo ECMWF utilisée ici, d’environ **9 × 9 km**, couvre une zone plus étendue et fournit des prévisions moins spécifiques au secteur des Tatins.

La disponibilité est vérifiée pour chaque variable et chaque créneau : sans donnée Météo-France correspondante, **Open-Meteo conserve 100 % du poids**, notamment en fin de semaine. Une donnée absente n’est jamais assimilée à zéro. Les valeurs propres à chaque source et leurs tendances restent accessibles dans les infobulles. Les températures et la nébulosité restent issues d’Open-Meteo lorsque le créneau n’a pas de valeur Météo-France correspondante ; les signaux d’orage et les vigilances restent traités séparément.

### Agrégation des données horaires

| Variable | Valeur retenue dans le créneau |
| --- | --- |
| Température | Minimum et maximum horaires |
| Pluie | Cumul des quantités horaires |
| Probabilité de précipitations | Maximum horaire |
| Nébulosité | Moyenne horaire |
| Vent moyen et rafales | Maximum horaire |
| Direction du vent | Moyenne circulaire des directions horaires |

Pour **Aujourd’hui**, la synthèse générale Open-Meteo et le calcul de confiance écartent les heures antérieures à l’heure en cours. Les créneaux conservent en revanche leurs plages horaires propres.

### Affichage de la pluie : seuil de 20 %

- **Sous 20 % pour la probabilité pondérée** : pictogramme météo sec, sans mention de pluie dans le texte, sans cumul en tête de carte. **La ligne pluie reste toujours visible**, avec ses valeurs chiffrées et les probabilités de chaque source au survol ; seule sa phrase descriptive est masquée sous ce seuil.
- **Dès 20 % pour la probabilité pondérée** : les informations de pluie peuvent apparaître selon les données prévues. Le seuil ne crée pas de pluie ni de cumul.
- **Au survol ou au focus de la ligne pluie ou du pictogramme météo** : les probabilités et les cumuls de chaque source restent consultables, y compris sous 20 %.
- Le seuil porte sur la probabilité pondérée, ou celle de la seule source disponible. Une probabilité indisponible n’est pas remplacée par zéro ; sans aucune probabilité connue, ce filtre ne s’applique pas.
- Les signaux orageux conservent leur affichage spécifique : ils sont exemptés de ce filtre.

### Tendance de fond par source

Pour chaque source et chaque créneau, les valeurs horaires sont conservées dans l’ordre chronologique. **m₁** désigne la médiane de la première moitié de la série, **m₂** celle de la seconde moitié, et **Δ = m₂ − m₁** leur différence.

- **↗ Hausse** si **Δ > S**
- **→ Quasi stable** si **−S ≤ Δ ≤ S**
- **↘ Baisse** si **Δ < −S**

Le seuil de stabilité **S** dépend de la variable :

| Variable | Seuil S |
| --- | ---: |
| Nébulosité | 15 points de pourcentage |
| Pluie horaire | 0,2 mm |
| Vent moyen | 5 km/h |
| Rafales | 8 km/h |
| Signal orageux | 34 points de pourcentage d’heures signalées |

L’emploi des médianes atténue l’effet des pointes isolées ; le seuil évite qu’une oscillation mineure soit interprétée comme une tendance. La flèche décrit l’évolution **à l’intérieur du créneau affiché**. Elle ne compare pas deux actualisations successives du modèle.

## Confiance générale

Le rond placé dans le bandeau de chaque journée résume la confiance générale par une couleur verte, jaune, orange ou rouge. Au survol ou au clavier, trois lignes sur cinq détaillent séparément la **convergence des modèles**, l’**évolution des prévisions** et la **confiance**.

Lorsque les données ARPEGE sont disponibles, le score privilégie l’accord ECMWF–ARPEGE et tient aussi compte de la stabilité des ensembles et de l’évolution récente. Un désaccord important sur la pluie ou l’orage limite volontairement le niveau affiché. Sinon, la dispersion ICON-EPS sert d’indication d’incertitude.

## Risque orageux semaine

La graduation repose sur les deux signaux orageux prévisionnels disponibles, **Open-Meteo ECMWF IFS HRES** et Météo-France. La ligne Orage croise les codes 95 à 99 d’ECMWF IFS HRES avec le signal convectif Météo-France. Sans signal, elle reste à 0/5. Avec un signal, le niveau dépend de la proximité de l’échéance, de l’accord entre les sources et des apparitions ou disparitions observées dans les prévisions récentes. Les détails précisent toujours la ou les sources à l’origine du signal ; un code 96 à 99 est qualifié de phénomène violent possible.

# Pictogrammes météo {#pictogrammes-meteo}

Les pictogrammes combinent l’état du ciel, les précipitations et les phénomènes associés. Le soleil et la lune distinguent le jour de la nuit ; le nombre de gouttes ou de flocons indique l’intensité. La voiture en dérapage signale la pluie verglaçante.

## Nébulosité — 6 niveaux

|  | Pas de nuages | Très peu nuageux | Peu nuageux | Nuageux | Très nuageux | Couvert |
| --- | --- | --- | --- | --- | --- | --- |
| Jour | ![Pas de nuages, jour](pictogrammes/ciel-jour-1.svg) | ![Très peu nuageux, jour](pictogrammes/ciel-jour-tres-peu-nuageux.svg) | ![Peu nuageux, jour](pictogrammes/ciel-jour-2.svg) | ![Nuageux, jour](pictogrammes/ciel-jour-3.svg) | ![Très nuageux, jour](pictogrammes/ciel-jour-4.svg) | ![Couvert, jour](pictogrammes/ciel-jour-5.svg) |
| Nuit | ![Pas de nuages, nuit](pictogrammes/ciel-nuit-1.svg) | ![Très peu nuageux, nuit](pictogrammes/ciel-nuit-tres-peu-nuageux.svg) | ![Peu nuageux, nuit](pictogrammes/ciel-nuit-2.svg) | ![Nuageux, nuit](pictogrammes/ciel-nuit-3.svg) | ![Très nuageux, nuit](pictogrammes/ciel-nuit-4.svg) | ![Couvert, nuit](pictogrammes/ciel-nuit-5.svg) |

## Pluie — 5 intensités

| Très faible | Faible | Modérée | Forte | Très forte |
| --- | --- | --- | --- | --- |
| ![1 goutte](pictogrammes/pluie-1.svg) | ![2 gouttes](pictogrammes/pluie-2.svg) | ![3 gouttes](pictogrammes/pluie-3.svg) | ![4 gouttes](pictogrammes/pluie-4.svg) | ![5 gouttes](pictogrammes/pluie-5.svg) |

## Neige — 3 intensités

| Neige faible | Neige modérée | Neige forte |
| --- | --- | --- |
| ![1 flocon](pictogrammes/neige-1.svg) | ![2 flocons](pictogrammes/neige-2.svg) | ![3 flocons](pictogrammes/neige-3.svg) |

## Autres phénomènes

| Pluie et neige mêlées | Brouillard | Pluie verglaçante |
| --- | --- | --- |
| ![Gouttes et flocons](pictogrammes/pluie-neige.svg) | ![Brouillard](pictogrammes/brouillard.svg) | ![Pluie et symbole de dérapage](pictogrammes/pluie-verglacante.svg) |

## Phénomènes associés

| Orage | Grêle | Vent |
| --- | --- | --- |
| ![Éclair](pictogrammes/orage.svg) | ![Trois billes de grêle et G à droite](pictogrammes/grele.svg?v=4) | ![Vent](pictogrammes/vent.svg) |

## Exemples combinés

Chaque exemple ci-dessous est réellement composé à partir du pictogramme de ciel et des calques de phénomènes correspondants.

| Jour · pluie faible · vent | Jour · orage · pluie forte | Nuit · orage · grêle · vent |
| --- | --- | --- |
| ![Jour, pluie faible et vent](pictogrammes/ciel-jour-3.svg)![](pictogrammes/calque-pluie-2.svg)![](pictogrammes/calque-vent.svg) | ![Jour, orage et pluie forte](pictogrammes/ciel-jour-5.svg)![](pictogrammes/calque-pluie-4.svg)![](pictogrammes/calque-orage.svg) | ![Nuit, orage, grêle et vent](pictogrammes/ciel-nuit-3.svg)![](pictogrammes/calque-vent.svg)![](pictogrammes/calque-orage.svg)![](pictogrammes/calque-grele.svg) |

| Nuit · pluie modérée | Nuit · neige modérée | Jour · brouillard |
| --- | --- | --- |
| ![Nuit et pluie modérée](pictogrammes/ciel-nuit-3.svg)![](pictogrammes/calque-pluie-3.svg) | ![Nuit et neige modérée](pictogrammes/ciel-nuit-3.svg)![](pictogrammes/calque-neige-2.svg) | ![Jour et brouillard](pictogrammes/ciel-jour-1.svg)![](pictogrammes/calque-brouillard.svg) |

# Techniques / Sécurité / Confidentialité

## Architecture

![Architecture des échanges entre le site, le serveur et les API météorologiques](architecture.svg?v=3219-approved)

Pour des raisons techniques, de sécurité et de confidentialité, meteo-lestatins.github.io demande les données protégées à un serveur personnel 1&1. C’est ce serveur qui contacte Météo-France et EUMETSAT avec les clés privées, contrôle et met en cache leurs données, puis renvoie au site un JSON prêt à afficher. Les prévisions publiques sont récupérées sans clé privée. Les clés des fournisseurs ne sont jamais incluses dans la page publique.

## Langages et bibliothèques

- **Serveur :** JavaScript moderne sous Node.js, en modules ESM.
- **meteo-lestatins.github.io :** HTML, CSS et JavaScript natifs, sans framework frontal.
- **Cartographie :** Leaflet, distribué localement avec le site.
- **GeoTIFF :** bibliothèque `geotiff` pour lire certaines grilles météorologiques.
- **HDF5 / NetCDF4 :** `h5wasm` pour les mosaïques radar et les produits foudre.
- **Projections cartographiques :** `proj4` pour convertir les coordonnées radar vers WGS84.
- **Radar polarimétrique :** décodeur OPERA `decbufr` et tables BUFR pour convertir les volumes PAM, puis analyse dans un worker JavaScript séparé.
