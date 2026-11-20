# Prompt — appliquer la maquette Lullo à teachMe

Prompt prêt à coller dans Claude Code, avec les images de [images/](images/)
jointes. Il est écrit pour être rejoué : chaque session reprend la liste des
« écarts connus » en bas, en traite une partie, et la met à jour avant de
rendre la main.

Lire [README.md](README.md) d'abord si le contexte manque.

---

## Le prompt

> Tu reprends l'interface de **teachMe** (dossier `providence-client`,
> Next.js 14 App Router, TypeScript, Tailwind, Supabase) en t'appuyant sur la
> maquette de référence « Lullo ». Les images sont dans
> `docs/maquette/images/`, décrites dans `docs/maquette/README.md`.
>
> **Commence par lire le code existant avant d'écrire quoi que ce soit.** La
> coquille, les primitives et les écrans existent déjà : il s'agit de les
> rapprocher de la référence, pas de repartir de zéro.
>
> ### Ce que tu reprends de la maquette
>
> La composition, les surfaces, le rythme, les états et les animations, tels
> que décrits dans `README.md` : panneaux flottants à marge de ~16 px et rayon
> ~22 px, tuiles à badge d'icône, pastille pleine pour l'entrée de navigation
> active, trait de surligneur derrière les titres, vue tableau pour les listes,
> recherche locale à la page, tri en segment, pastilles de filtre à compteur,
> courbe d'aire en aplat, cadran horaire.
>
> ### Ce que tu ne reprends pas
>
> 1. **La palette de la maquette.** teachMe garde sa charte : navy `#1B2A4A`,
>    corail `#E8735A`, terracotta `#C2553E`, crème `#F7F5F0`, ardoise
>    `#4A5468`. Toutes les couleurs passent par les tokens de
>    `providence-client/app/globals.css` (`--bg-*`, `--text-*`, `--acc-*`,
>    `--tile-*`, `--radius-*`, `--shadow-*`), déclinés en clair **et** en
>    sombre. N'écris jamais une couleur en dur dans un composant.
> 2. **Son contenu.** Pas de Noor Haddad, pas de « Milk Foam Clouds », pas de
>    917 écoutes. Tout vient de la progression réelle (`resource_progress`, via
>    `lib/progress.tsx`, `lib/use-parcours.ts`, `lib/activity.ts`). Quand il n'y
>    a pas de données, affiche un état vide honnête — jamais une courbe plate
>    qui ressemblerait à une mesure.
> 3. **Sa langue.** L'interface de teachMe est en français.
> 4. **Son responsive.** La vidéo source était un enregistrement de téléphone
>    filmant une maquette desktop : elle ne dit rien du mobile. Les choix
>    responsive du projet tiennent — barre latérale en tiroir sous 1024 px,
>    barre de leçon masquée en dessous.
>
> ### Contraintes du projet
>
> - **Primitives d'abord.** Tout élément réutilisable vit dans
>   `components/ui/`. Si tu répètes un motif deux fois, extrais-le. Ne
>   réintroduis pas de `style={{…}}` ad hoc pour quelque chose qu'une primitive
>   ou une classe de `globals.css` peut porter.
> - **Logique pure et testée.** Tout calcul (dates, séries, agrégats,
>   recherche) va dans un module pur de `lib/`, sans React ni réseau, avec un
>   test dans `tests/`. Les imports relatifs entre modules de `lib/` portent
>   l'extension `.ts` explicite, sinon le lanceur de tests de Node ne les
>   résout pas.
> - **Les jours sont ceux de Madagascar** (`Indian/Antananarivo`) et **les
>   week-ends sont neutres** pour la série. Toute nouvelle statistique doit
>   respecter ces règles, déjà implémentées dans `lib/gamification.ts`.
> - **Accessibilité** : cible de pointage de 44 px, focus visible, `aria-*`
>   corrects (`tablist` pour des onglets qui changent de panneau,
>   `radiogroup` pour un choix d'option), libellés conservés en `sr-only`
>   quand l'interface est réduite aux icônes, et respect de
>   `prefers-reduced-motion` pour chaque animation.
> - **Le garde d'accès de l'administration ne protège rien** : il masque. Les
>   routes `app/api/**` revérifient systématiquement les droits via
>   `lib/supabase/require-admin.ts`. Ne déplace pas cette vérification vers le
>   client.
> - **Ne commite pas et ne pousse pas.** Propose les commits, n'exécute rien.
>
> ### Vérification avant de rendre la main
>
> Lance `npm run check` dans `providence-client` (typecheck, lint, tests,
> contrôles catalogue) puis `npx next build`. Si tu démarres `next dev` pour
> vérifier le rendu, **ne lance pas `next build` pendant que le serveur
> tourne** : le cache `.next` est partagé et le serveur renverra des 500
> trompeurs.
>
> ### Ce que tu rends
>
> Les fichiers touchés, les contrôles interactifs disponibles, les animations
> branchées, et les limites — en particulier ce que tu n'as **pas** pu vérifier
> visuellement. Mets à jour la section « Écarts connus » de ce fichier.

---

## Écarts connus

État au 20 novembre 2026. À tenir à jour à chaque passe.

### Fait

- Coquille : barre latérale contextuelle (apprenant / administration), bandeau
  supérieur avec fil d'Ariane, recherche ⌘K, barre de leçon en cours.
- Rail d'icônes repliable côté apprenant, choix mémorisé.
- Primitives : `Card`, `StatTile`, `Tabs`, `SegmentedTabs`, `Chip`,
  `ProgressRing`, `AreaChart`, `HourDial`, `ActivityHeatmap`, `LevelCover`,
  `PageTransition`, `ThemeToggle`.
- Écrans : accueil (libre et parcours), catalogue, niveau, statistiques.
- Bascule de thème en cercle (View Transitions, repli `clip-path`), entrées de
  page, tracé de courbe animé, indicateur de navigation glissant.

### À faire — P1, le « look » (surtout du CSS)

1. **Panneaux flottants.** La barre latérale (`components/layout/Sidebar.tsx`)
   et la barre de leçon (`components/layout/NowBar.tsx`) sont collées aux bords.
   Leur donner ~16 px de marge et ~22 px de rayon, comme dans
   `03-bibliotheque-albums-survol.jpg`. Penser à décaler `.app-content` en
   conséquence dans `globals.css`.
2. **Badge d'icône sur les tuiles de l'accueil.** `components/ui/StatTile.tsx`
   pose une icône de 15 px à côté du libellé ; la maquette met un carré arrondi
   de ~44 px, dans une teinte plus saturée que la tuile. Prévoir une variante
   sans badge pour la page Statistiques, qui n'en a pas.
3. **Trait de surligneur derrière les titres de page.** Absent. ~10 lignes de
   CSS, à poser comme une classe utilitaire dans `globals.css`.

### À faire — P2, la composition

4. **Vue tableau pour les ressources d'un niveau.**
   `app/dashboard/levels/[slug]/page.tsx` affiche jusqu'à ~30 ressources dans
   une grille de cartes à trois colonnes. La maquette
   (`02-bibliotheque-chansons.jpg`) montre un tableau bien plus lisible :
   `# · titre · catégorie · fait · ouvrir`. Garder la grille sous 1024 px.
5. **Action principale en haut à droite des pages.** Aucune aujourd'hui. Sur un
   niveau : « Reprendre » ou « Ouvrir la suivante ».
6. **Recherche locale à la page**, en complément du ⌘K global, sur les écrans
   qui listent beaucoup d'éléments.
7. **Tri en segment à plus de deux options** et **compteur en pastille** dans
   les filtres. `SegmentedTabs` et `Chip` acceptent déjà n options : c'est du
   réglage, pas du développement.

### À faire — P3, les finitions

8. Courbe d'aire : remplacer le dégradé par un **aplat**, et passer l'axe des
   abscisses de **trois à cinq repères** (`components/ui/AreaChart.tsx`).
9. Chevron sur **toutes** les entrées de navigation dépliables.
10. **Pastille d'état** sur l'avatar et icône de bascule de compte dans la
    ligne du compte.

### Écarts assumés — à ne pas « corriger »

- Le cadran horaire colore ses rayons **par moment de la journée** (nuit,
  matin, après-midi, soir) là où la maquette utilise des pastels décoratifs.
  La couleur y porte une information : on garde.
- Pas de platine vinyle ni d'équivalent animé au centre de l'accueil : décision
  prise, l'objet n'a pas de sens pour une plateforme d'apprentissage.
- Interface en français, données réelles : voir « Ce que tu ne reprends pas ».
