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

Le système d'authentification est basé sur `localStorage` (demo).

**Compte démo :**
- Email : `demo@providence.academy`
- Mot de passe : `demo123`

**Compte admin :**
- Email : `admin@providence.academy`
- Mot de passe : `admin123`

> Pour une vraie production, remplacez `lib/auth.tsx` par un appel API (Next.js API Routes + base de données).

## 📁 Structure

```
app/
  auth/          → Page de connexion / inscription
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
| `/auth` | Connexion / Inscription |
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
- **Comptes par défaut** (créés automatiquement au premier lancement) :
  | Email | Mot de passe | Rôle |
  |-------|-------------|------|
  | superuser@providence.academy | super123 | Super Admin |
  | admin@providence.academy | admin123 | Admin |
  | demo@providence.academy | demo123 | Utilisateur |

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
4. Connectez-vous avec `superuser@providence.academy` / `super123`
5. Allez sur `/dashboard/admin` pour gérer les utilisateurs