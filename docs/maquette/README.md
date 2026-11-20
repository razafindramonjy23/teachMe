# Maquette de référence « Lullo »

Référence visuelle utilisée pour refondre l'interface de teachMe en novembre 2026.
Ce dossier contient les images et la lecture qu'on en a faite. Le prompt prêt à
l'emploi est dans [PROMPT.md](PROMPT.md).

## Ce que c'est, et ce que ce n'est pas

La maquette est un **lecteur de musique fictif** appelé Lullo, publié par
`@_code_and_chill_` (le filigrane est visible sur les images tirées de la
vidéo). Elle nous sert de **référence de langage visuel** : composition,
surfaces, rythme, animations.

Deux choses ne sont **pas** reprises, et c'est volontaire :

- **sa palette** — sauge, pêche, crème. teachMe garde sa charte : navy
  `#1B2A4A`, corail `#E8735A`, crème `#F7F5F0`, et l'échelle d'accents validée
  en contraste définie dans `providence-client/app/globals.css` ;
- **son contenu** — Noor Haddad, « Milk Foam Clouds », 917 écoutes. Ce sont des
  données de démonstration d'un lecteur musical. Chez nous tout vient de
  `resource_progress`.

Les images sont des **captures desktop**. La vidéo source était un
enregistrement de téléphone (1180 × 2556) filmant une vidéo desktop : elle ne
dit rien de l'affichage mobile, et ne doit pas servir de référence pour le
responsive.

## Les images

| Fichier | Écran | Ce qu'il faut y regarder |
|---|---|---|
| [01-accueil-clair.jpg](images/01-accueil-clair.jpg) | Accueil, thème clair | Composition générale : salutation, carte « en cours », 4 tuiles, graphique, répartition |
| [02-bibliotheque-chansons.jpg](images/02-bibliotheque-chansons.jpg) | Bibliothèque › Chansons | **Vue tableau** — l'écran le plus instructif, absent des captures initiales |
| [03-bibliotheque-albums-survol.jpg](images/03-bibliotheque-albums-survol.jpg) | Bibliothèque › Albums | La plus nette : panneaux flottants, état de survol de la navigation, barre de lecture en carte |
| [04-bibliotheque-albums.jpg](images/04-bibliotheque-albums.jpg) | Bibliothèque › Albums | Grille de pochettes, filtres à pastilles, tri |
| [05-stats-vue-ensemble.jpg](images/05-stats-vue-ensemble.jpg) | Statistiques › Vue d'ensemble | Tuiles sans badge, courbe d'aire, cadran horaire |
| [06-bascule-theme-cercle.jpg](images/06-bascule-theme-cercle.jpg) | Bascule de thème, à mi-course | Le cercle sombre qui se déploie depuis le bouton |
| [07-stats-theme-sombre.jpg](images/07-stats-theme-sombre.jpg) | Statistiques, thème sombre | Surfaces sombres, accents pastel conservés |

## Le langage visuel, décomposé

### Surfaces

Trois plans, et c'est ce qui fait tout le caractère de la maquette :

1. **le fond de page**, crème, qui reste visible partout ;
2. **les panneaux flottants** — barre latérale et barre de lecture — posés sur
   ce fond avec **une marge d'environ 16 px sur tous les côtés** et un **rayon
   d'environ 22 px**. Ils ne touchent jamais le bord de l'écran ;
3. **les cartes de contenu**, rayon ~18 px, ombre très diffuse, bordure presque
   invisible.

C'est le point le plus souvent manqué : une barre latérale collée au bord de
l'écran donne un tout autre produit, plus administratif.

### Tuiles de statistique

Deux variantes, utilisées à des endroits différents :

- **avec badge** (accueil) : carré arrondi d'environ 44 px en haut à gauche,
  dans une teinte **plus saturée** que le fond de la tuile, puis libellé, grand
  nombre, et la variation (`+13 % on last month`) avec le pourcentage en gras ;
- **sans badge** (statistiques) : libellé et nombre seulement.

### Navigation

- Entrée **active** : pastille claire pleine (presque blanche sur la barre
  teintée), pas un voile coloré.
- Entrée **survolée** : même pastille, plus discrète.
- Toute entrée dépliable porte un chevron `›` à droite, y compris quand elle est
  active.
- En bas : un encart promotionnel, puis la ligne du compte — avatar à initiales
  avec **pastille d'état verte**, nom, identifiant, et une icône de bascule de
  compte.

### Titres de page

Chaque grand titre porte **un trait de surligneur** derrière lui : une forme
arrondie, décalée vers le bas et la droite, dans une teinte douce. C'est la
signature graphique de la maquette.

### Écran de liste (le plus réutilisable)

`Bibliothèque › Chansons` est un tableau :

```
#   Titre (vignette + titre + sous-titre)   Album       Lectures   ♥   Durée   ⋯
```

La ligne en cours de lecture remplace son numéro par une icône d'égaliseur.
Au-dessus du tableau : une **recherche locale à la page**, un **tri en segment à
quatre options**, puis une rangée de **pastilles de filtre** portant chacune un
point de couleur, un libellé et **un compteur dans une pastille**. À droite du
titre, une **action principale** (« Play all ») et une action secondaire
(« Playlists »).

### Graphiques

- **Courbe d'aire** : remplissage en **aplat** (pas de dégradé), trait fin plus
  foncé, grilles pointillées très claires, trois repères en ordonnée
  (haut / milieu / zéro) et **cinq repères en abscisse**.
- **Cadran horaire** : 24 rayons autour d'un disque plein, minuit en haut,
  l'heure de pointe au centre. Dans la maquette les couleurs sont décoratives ;
  **chez nous elles disent le moment de la journée** (nuit, matin, après-midi,
  soir) — c'est un écart assumé, la couleur y porte une information.
- **Répartition** : un bandeau de segments arrondis séparés par un filet, puis
  une liste `point · nom · barre · pourcentage`.

### Mouvement

- Bascule de thème : un **cercle qui se déploie depuis le bouton**, 700–900 ms,
  révélant le nouveau thème. Voir `06-bascule-theme-cercle.jpg`.
- Entrée de page en fondu avec une courte translation verticale.
- Tracé des courbes animé à l'apparition, barres et rayons décalés.
- Soulèvement léger des pochettes au survol.
- L'indicateur de navigation glisse d'une entrée à l'autre.

## État de notre implémentation

Au moment où ce dossier est écrit, l'espace apprenant a été refondu dans ce
langage. Ce qui est en place et ce qui reste à faire est tenu à jour dans
[PROMPT.md](PROMPT.md), section « Écarts connus ».
