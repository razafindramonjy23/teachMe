# teachMe — Learn English Online

Plateforme d'apprentissage de l'anglais en ligne — **teachMe**.

## 🎨 Design

- **Mode clair / sombre** (switcher intégré, dark par défaut)
- **Charte couleur teachMe**

  | Rôle | Hex | Token Tailwind / CSS |
  |------|-----|----------------------|
  | Navy (base) | `#1B2A4A` | `navy` / `var(--navy)` |
  | Corail (accent) | `#E8735A` | `coral` / `var(--coral)` |
  | Terracotta (accent appuyé, « Me ») | `#C2553E` | `coral-700` / `var(--coral-deep)` |
  | Crème (fond clair) | `#F7F5F0` | `cream` / `var(--cream)` |
  | Ardoise (texte secondaire) | `#4A5468` | `slate_brand` |

- **Logo** : `public/brand/teachme-logo.svg` (complet), `teachme-mark.svg` (fonds clairs),
  `teachme-mark-inverse.svg` (fonds sombres) — composants React dans `components/brand/Logo.tsx`
- **Typographie** : Playfair Display (display) + DM Sans (corps)
- **Animations** : Framer Motion (staggered reveals, hover, layout)

## 🛠 Stack technique

| Outil | Version |
|-------|---------|
| Next.js | 14.2 |
| Tailwind CSS | 3.4 |
| Framer Motion | 11 |
| next-themes | 0.3 |
| TypeScript | 5 |
| Lucide React | 0.383 |

## 📦 Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Ouvrir http://localhost:3000
```

## 🔐 Authentification

Authentification **Supabase Auth** (email + mot de passe, ou matricule pour les étudiants).

- **Pas d'inscription publique** : les comptes sont créés par un administrateur depuis `/dashboard/admin`. Le réglage Supabase « Allow new users to sign up » doit rester désactivé.
- **Aucun mot de passe n'est écrit dans ce dépôt** (il est public). Les comptes de démonstration se créent avec `scripts/seed-demo-users.mjs`, qui lit les mots de passe dans `SEED_SUPERUSER_PASSWORD`, `SEED_ADMIN_PASSWORD` et `SEED_DEMO_PASSWORD`.
- **Compte démo sur la page de connexion** : affiché seulement si `NEXT_PUBLIC_DEMO_PASSWORD` est défini — en développement, ou en production avec `NEXT_PUBLIC_SHOW_DEMO_ACCOUNT=true`.

## 📁 Structure

```
app/
  auth/          → Page de connexion (pas d'inscription publique)
  dashboard/
    page.tsx     → Accueil (niveaux + cours spéciaux)
    rules/       → Règles du Self-Access
    contact/     → Formulaire de contact
    levels/[slug]→ Page dynamique par niveau
components/
  layout/Navbar  → Navigation avec dropdown niveaux
  ui/ThemeToggle → Switcher clair/sombre
lib/
  auth.tsx       → Contexte d'authentification
```

## 🌍 Pages disponibles

| Route | Description |
|-------|-------------|
| `/` | Redirection auto (auth ou dashboard) |
| `/auth` | Connexion (comptes créés par un administrateur) |
| `/dashboard` | Accueil avec niveaux et cours spéciaux |
| `/dashboard/rules` | Règles du Self-Access |
| `/dashboard/contact` | Formulaire de contact |
| `/dashboard/levels/beginner` | Niveau Beginner (A1) |
| `/dashboard/levels/elementary` | Niveau Elementary (A2) |
| `/dashboard/levels/pre-intermediate` | Niveau B1- |
| `/dashboard/levels/intermediate` | Niveau B1 |
| `/dashboard/levels/upper-intermediate` | Niveau B2 |
| `/dashboard/levels/advanced` | Niveau C1 |
| `/dashboard/levels/aviation` | Aviation English |
| `/dashboard/levels/business` | Business English |
| `/dashboard/levels/cae` | C1 Advanced (CAE) |
| `/dashboard/levels/ielts` | IELTS Preparation |

## 🗺 Parcours guidé ou accès libre

À sa première connexion, l'apprenant choisit son mode d'accueil ; il peut en changer à tout moment depuis l'accueil. Les deux modes partagent la même progression, seule la couche de jeu change.

- **Parcours guidé** : chemin A1 → C1 avec une étape recommandée (jamais de verrou), objectif de 2 ressources par jour, série de jours, pages tournées (10 par ressource), carnet de tampons, célébrations à la coche.
- **Accès libre** : l'accueil historique, sans objectif ni série.

Règles de calcul (`lib/gamification.ts`, testées dans `tests/gamification.test.ts`) :
- les jours sont ceux de Madagascar (`Indian/Antananarivo`) ;
- une série compte les jours d'activité consécutifs (au moins une ressource terminée) ; elle ne casse qu'après un **jour de semaine** entier sans rien — les week-ends sont neutres : y travailler compte, ne pas y travailler ne casse rien ;
- les dates de coche sont fixées par la base (migration 0004) : impossible d'antidater une coche.

## ✅ Qualité et vérifications

Prérequis : **Node ≥ 22.18** pour les tests (exécution native du TypeScript, aucune dépendance de test).

| Commande | Rôle |
|---|---|
| `npm run check` | Tout ce qui suit sauf le réseau — à lancer avant chaque commit |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm test` | Tests unitaires (`tests/*.test.ts`) : identité des ressources, règles de rôles, matricules, détection des liens détournés |
| `npm run catalog:check` | Teste chaque lien du catalogue : morts, redirigés vers un autre site, upgradables en https |
| `npm run catalog:check -- --offline` | Contrôles statiques du catalogue uniquement (rapide) |
| `npm run catalog:check -- --write` | Applique les passages http → https sûrs |

La CI GitHub (`.github/workflows/check.yml`) lance `check` à chaque push sur `main` et à chaque pull request, et le test réseau des liens chaque lundi.

**Ajouter une ressource** : l'éditer dans `lib/resources.ts`, puis `npm run check` et `npm run catalog:check`. L'identifiant de progression dérive de l'URL : changer de protocole (http → https) le conserve, changer d'adresse crée une nouvelle ressource.

### Migrations Supabase

À exécuter dans l'ordre, dans Supabase Dashboard → SQL Editor. Toutes sont idempotentes.

| Fichier | Contenu |
|---|---|
| `0001_init.sql` | Profils, rôles, matricules, RLS |
| `0002_progress.sql` | Progression des apprenants (`resource_progress`) |
| `0003_student_profile_complete.sql` | Rattrapage : profils étudiants déjà complets |
| `0004_parcours.sql` | Mode d'accueil (`profiles.home_mode`) et horodatages de progression fixés par le serveur |

## 🚀 Déploiement (Vercel)

```bash
npm install -g vercel
vercel
```
# 📦 Providence — Fichiers mis à jour

## 🗂 Résumé des changements

### 1. `lib/auth.tsx` — REMPLACER
- **Système de rôles** : `superuser` | `admin` | `user`
- **Base de données** locale (localStorage) avec CRUD complet
- Méthodes exposées : `getAllUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
- **Comptes de démonstration** : `superuser@`, `admin@` et `demo@providence.academy`, créés par `scripts/seed-demo-users.mjs`. Mots de passe fournis par variables d'environnement, jamais dans le dépôt.

---

### 2. `app/dashboard/admin/page.tsx` — CRÉER (nouveau fichier)
**Dashboard d'administration** avec :
- Tableau de tous les utilisateurs (nom, email, niveau, rôle, date)
- Recherche en temps réel
- **Créer** un utilisateur (formulaire modal)
- **Modifier** un utilisateur (nom, email, mot de passe optionnel, rôle, niveau)
- **Supprimer** un utilisateur (avec confirmation)
- Statistiques : compteur par rôle
- **Règles d'accès** :
  - `superuser` : peut tout faire, y compris créer d'autres superusers
  - `admin` : peut gérer les `user` seulement
  - `user` : redirigé vers `/dashboard`

---

### 3. `components/layout/Navbar.tsx` — REMPLACER
- Lien **Admin** visible pour `admin` et `superuser` uniquement
- Icône `Shield` (admin) ou `ShieldCheck` (superuser)
- Dropdown niveaux amélioré avec les **codes CEFR** (A1, A2, B1-, etc.)
- Sections séparées "Niveaux généraux" / "Cours spécialisés"

---

### 4. `app/dashboard/levels/[slug]/page.tsx` — REMPLACER
**Liens pédagogiques** (niveaux / ressources externes configurés dans l’app)
- Liens organisés par **catégorie** (Grammaire, Vocabulaire, Écoute, Expression orale, etc.)
- Chaque niveau a ses propres ressources authentiques (BBC, British Council, ESL Gold, etc.)
- Aviation : tous les liens spécialisés (ICAO, LiveATC, Skybrary, etc.)
- IELTS : tous les sites officiels (ielts.org, British Council, IDP, etc.)
- Lien vers la plateforme **Net Languages** d'IH Joburg

---

## 📁 Structure à respecter

```
providence-client/
├── lib/
│   └── auth.tsx                          ← REMPLACER
├── app/
│   └── dashboard/
│       ├── admin/
│       │   └── page.tsx                  ← CRÉER (nouveau dossier)
│       └── levels/
│           └── [slug]/
│               └── page.tsx              ← REMPLACER
└── components/
    └── layout/
        └── Navbar.tsx                    ← REMPLACER
```

## 🚀 Instructions

1. Copiez chaque fichier dans le bon emplacement
2. `npm install` (pas de nouvelles dépendances)
3. `npm run dev`
4. Connectez-vous avec `superuser@providence.academy` et le mot de passe défini via `SEED_SUPERUSER_PASSWORD`
5. Allez sur `/dashboard/admin` pour gérer les utilisateurs