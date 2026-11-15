# Guide Technique d'Implémentation - Système de Matricule

## 🎯 Objectif
Implémenter un système d'inscription unifié avec:
- 3 types d'utilisateurs (Étudiant, Staff, Parent)
- Matricule automatique pour les étudiants
- Connexion par email ou matricule
- Onboarding pour compléter le profil étudiant

---

## 📚 Architecture de Base

```
Étapes générales:
1. Créer les utilitaires (constantes, fonctions)
2. Modifier la base de données (schéma)
3. Créer les fonctions de requête DB
4. Créer les routes API
5. Mettre à jour le contexte d'authentification
6. Créer les pages UI
7. Tester et corriger les erreurs
```

---

## 🔧 Détail des Étapes

### ✅ ÉTAPE 1: Créer les Utilitaires de Matricule

**Fichier à créer:** `lib/utils/matricule.ts`

**Contenu:**
- Énumérations des localisations (010, 020, 030)
- Énumérations des types d'utilisateurs
- Énumérations des niveaux de cours (BEPC, BAC)
- Fonction `generateMatricule(location, sequence)` → génère PA-010-STU-2603-045
- Fonction `parseMatricule(matricule)` → extrait les composants
- Fonction `isValidMatricule(matricule)` → valide le format
- Fonction `getLocationName(code)` → retourne le nom localisé

**Pourquoi:** Centraliser les constantes et la logique de matricule pour réutilisation partout.

---

### ✅ ÉTAPE 2: Modifier le Schéma de la Base de Données

**Fichier à modifier:** `lib/db/init.ts`

**Changements:**
```typescript
// ANCIEN: email TEXT UNIQUE NOT NULL
// NOUVEAU: email TEXT UNIQUE (optionnel pour étudiants)

// AJOUTER CHAMPS:
userType TEXT CHECK(userType IN ('student', 'staff', 'parent'))
matricule TEXT UNIQUE  // pour les étudiants
location TEXT  // localisation de l'étudiant
courseLevel TEXT  // BEPC ou BAC
profileComplete INTEGER DEFAULT 0  // booléen: profil complété?
registeredBy TEXT  // qui a créé l'étudiant (admin)
```

**Pourquoi:** La DB doit supporter les nouveaux types d'utilisateurs.

---

### ✅ ÉTAPE 3: Mettre à Jour les Queries de Base de Données

**Fichier à modifier:** `lib/db/queries.ts`

**Changements:**

1. **Types:**
   ```typescript
   export type UserType = 'student' | 'staff' | 'parent'
   
   export interface StoredUser {
     // ... avant
     email?: string | null  // NOUVEAU: optionnel
     userType?: UserType
     matricule?: string
     location?: string
     courseLevel?: string
     profileComplete?: number
     registeredBy?: string
   }
   ```

2. **Nouvelles Fonctions:**
   ```typescript
   // Trouver étudiant par matricule
   findUserByMatricule(matricule: string): StoredUser | undefined
   
   // Obtenir le prochain numéro séquentiel pour un matricule
   getNextStudentSequence(location: string): number
   
   // Créer un étudiant (sans email)
   createStudent(id, name, password, matricule, location, courseLevel, registeredBy): { ok, error? }
   
   // Compléter profil étudiant après première connexion
   completeStudentProfile(id, location, courseLevel): { ok, error? }
   ```

3. **Modifier fonction existante:**
   ```typescript
   // createUser: ajouter paramètre optionnel userType
   createUser(..., userType?: UserType)
   ```

**Pourquoi:** Adapter les requêtes pour supporter les nouveaux champs et types d'utilisateurs.

---

### ✅ ÉTAPE 4: Créer/Modifier les Routes API

#### 4A. Modifier `/api/users/register`

**Fichier:** `app/api/users/register/route.ts`

**Logique:**
```
POST /api/users/register
{
  userType: 'student' | 'staff' | 'parent'
  
  Si ÉTUDIANT:
    - Valider: name, password, location, courseLevel
    - Générer ID unique
    - Récupérer sequence = getNextStudentSequence(location)
    - Générer matricule = generateMatricule(location, sequence)
    - Appeler createStudent()
    - Retourner: { ok, user avec matricule }
  
  Si STAFF/PARENT:
    - Valider: name, email, password
    - Générer ID unique
    - Appeler createUser(userType)
    - Retourner: { ok, user }
}
```

**Pourquoi:** Point d'entrée pour créer tous les types d'utilisateurs.

---

#### 4B. Modifier `/api/users/login`

**Fichier:** `app/api/users/login/route.ts`

**Logique:**
```
POST /api/users/login
{
  email?: string
  matricule?: string
  password: string
  
  Si email:
    - Trouver user par email
  Sinon si matricule:
    - Trouver user par matricule
  
  Valider password
  Retourner user (sans password)
}
```

**Pourquoi:** Support connexion par email OU matricule selon le type d'utilisateur.

---

#### 4C. Créer `/api/users/profile` (NOUVEAU)

**Fichier:** `app/api/users/profile/route.ts`

**Logique:**
```
POST /api/users/profile
{
  userId: string
  location: string
  courseLevel: string
}

- Vérifier user existe et est étudiant
- Appeler completeStudentProfile()
- Retourner user mis à jour
```

**Pourquoi:** Permettre à l'étudiant de compléter son profil après première connexion.

---

### ✅ ÉTAPE 5: Mettre à Jour l'Authentification (Context)

**Fichier à modifier:** `lib/auth.tsx`

**Changements:**

1. **Types:**
   ```typescript
   export type UserType = 'student' | 'staff' | 'parent'
   
   export interface User {
     // ... avant
     email?: string | null  // optionnel
     userType?: UserType
     matricule?: string
     location?: string
     courseLevel?: string
     profileComplete?: number
   }
   ```

2. **Nouvelles Méthodes:**
   ```typescript
   // Connexion par matricule
   loginWithMatricule(matricule: string, password: string): Promise<boolean>
   
   // Inscription étudiant
   registerStudent(name, password, location, courseLevel): Promise<{ ok, matricule?, error? }>
   
   // Compléter profil
   completeStudentProfile(userId, location, courseLevel): Promise<boolean>
   ```

3. **Modifier Méthodes Existantes:**
   ```typescript
   // login: accepter email optionnel
   login(email: string | undefined, password: string, matricule?: string): Promise<boolean>
   
   // register: ajouter userType (par défaut 'staff')
   register(name, email, password, level): Promise<boolean>
   ```

**Pourquoi:** Mettre à disposition au frontend les méthodes d'authentification.

---

### ✅ ÉTAPE 6: Mettre à Jour les Providers

**Fichier à modifier:** `app/providers.tsx`

**Changement:**
```typescript
// AJOUTER AuthProvider en plus du ThemeProvider
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

**Pourquoi:** AuthProvider doit être actif pour toutes les pages.

---

### ✅ ÉTAPE 7: Créer la Page d'Inscription Unifiée

**Fichier à créer:** `app/register/page.tsx`

**Sections:**
1. Sélection type utilisateur (Student/Staff/Parent)
2. Formulaire conditionnels:
   - **Étudiant:** Nom, Localisation, Niveau, Mot de passe
   - **Staff/Parent:** Nom, Email, Mot de passe
3. Affichage du matricule généré (étudiant)
4. Validation et soumission

**Logique:**
```
- État: userType, formData
- userType === 'student' → appel registerStudent()
- userType in ['staff','parent'] → appel register()
- Afficher matricule en cas de succès
- Redirection au dashboard/onboarding
```

**Pourquoi:** Interface centralisée pour tous les types d'inscription.

---

### ✅ ÉTAPE 8: Créer la Page d'Onboarding Étudiant

**Fichier à créer:** `app/dashboard/onboarding/page.tsx`

**Sections:**
1. Afficher infos étudiant (nom, matricule)
2. Formulaire pour compléter profil:
   - Sélectionner localisation
   - Sélectionner niveau cours
3. Soumission

**Logique:**
```
- Vérifier: user existe et userType === 'student' && !profileComplete
- Sinon rediriger à /dashboard
- Appeler completeStudentProfile() à la soumission
- Redirection à /dashboard après succès
```

**Pourquoi:** Force l'étudiant à compléter son profil au premier login.

---

### ✅ ÉTAPE 9: Créer la Page de Connexion Simple (Optionnel)

**Fichier à créer:** `app/auth-simple/page.tsx`

**Sections:**
1. Toggle entre Email et Matricule
2. Formulaire dynamique:
   - **Email:** champs email + mot de passe
   - **Matricule:** champs matricule + mot de passe
3. Validation matricule (format PA-XXX-STU-MMYY-###)

**Logique:**
```
- loginType === 'email' → appel login(email, password)
- loginType === 'matricule' → appel loginWithMatricule(matricule, password)
- Valider format matricule avant envoi
- Vérifier profileComplete pour redirection (onboarding ou dashboard)
```

**Pourquoi:** UX améliorée, les étudiants voient d'emblée l'option matricule.

---

### ✅ ÉTAPE 10: Corriger les Erreurs de Compilation

**Fichiers à corriger:** Selon les erreurs TypeScript

**Erreurs possibles:**
- `email` peut être null/undefined → utiliser `email?.toLowerCase() ?? false`
- Champs optionnels → ajouter `?` ou `!`

---

## 🗺️ Résumé des Fichiers

### Structure Finale Correcte:

```
/auth          → CONNEXION UNIQUEMENT
                  - Email pour Staff/Parents
                  - Matricule pour Étudiants
                  - Garde le beau design existant
                  - ✅ UNE SEULE PAGE

/register      → INSCRIPTION (Staff/Parents seulement)
                  - ⚠️ LES ÉTUDIANTS NE S'INSCRIVENT PAS
                  - Créés par les admins (future interface)

/dashboard/onboarding → Profil étudiant après 1ère connexion
```

### À Créer (Nouveaux):
```
✨ lib/utils/matricule.ts          (utilitaires)
✨ app/api/users/profile/route.ts  (API profil)
✨ app/register/page.tsx           (inscription Staff/Parents)
✨ app/dashboard/onboarding/page.tsx (onboarding étudiant)
```

### À Modifier (Existants):
```
📝 lib/db/init.ts              (schéma DB)
📝 lib/db/queries.ts           (queries DB)
📝 app/api/users/register/route.ts (inscription API)
📝 app/api/users/login/route.ts (login API avec matricule)
📝 lib/auth.tsx                (context auth)
📝 app/providers.tsx           (ajouter AuthProvider)
📝 app/auth/page.tsx           (fusion auth-simple → auth)
📝 app/register/page.tsx       (clarifier Staff/Parents only)
📝 app/dashboard/admin/page.tsx (fix typage)
```

### À SUPPRIMER:
```
❌ app/auth-simple/page.tsx  (fusionné dans /auth)
```

---

## 📊 Ordre de Progression Recommandé

```
1. Créer matricule.ts → comprendre la logique
2. Modifier init.ts → mise à jour schéma
3. Modifier queries.ts → nouvelles fonctions
4. Modifier register/route.ts → nouvelle logique
5. Modifier login/route.ts → support matricule
6. Créer profile/route.ts → completion profil
7. Modifier auth.tsx → nouvelles méthodes
8. Modifier providers.tsx → ajouter AuthProvider
9. Créer register/page.tsx → UI inscription
10. Créer onboarding/page.tsx → UI onboarding
11. Créer auth-simple/page.tsx → UI login amélioré
12. Corriger erreurs de typage
```

---

## 🧪 Tests Après Implémentation

**Scénario 1 - Créer un Étudiant:**
```
1. Aller à /register
2. Sélectionner "Étudiant"
3. Remplir formulaire
4. Vérifier matricule généré (format PA-010-STU-2603-###)
5. Matricule doit être unique
```

**Scénario 2 - Connexion Étudiant:**
```
1. Aller à /auth-simple
2. Sélectionner "Matricule"
3. Entrer matricule
4. Redirection vers /dashboard/onboarding
5. Compléter profil
6. Redirection vers /dashboard
```

**Scénario 3 - Connexion Staff/Parent:**
```
1. Aller à /register
2. Sélectionner "Personnel" ou "Parent"
3. S'inscrire avec email
4. Aller à /auth-simple
5. Sélectionner "Email"
6. Connexion directe au dashboard
```

---

## 💡 Conseils pour l'Apprentissage

1. **Comprendre la logique avant de coder** - Lisez le guide entier d'abord
2. **Tester chaque étape** - Compilez après chaque modification
3. **Utiliser les types TypeScript** - Aide à trouver les erreurs
4. **Consulter les fichiers existants** - Utilisez comme template
5. **Lire les messages d'erreur** - Ils disent exactement ce qui manque

---

## 🔗 Fichiers Référence

Pour comprendre la structure:
- Voir `app/api/users/login/route.ts` → structure d'une route API
- Voir `lib/auth.tsx` → structure d'un context
- Voir `app/dashboard/page.tsx` → structure d'une page client

Pour les types:
- `lib/db/queries.ts` → types User et StoredUser
- `lib/auth.tsx` → types AuthContext

Pour les patterns:
- Form validation → voir `app/dashboard/admin/page.tsx`
- Redirects → voir `app/auth/page.tsx`
- Error handling → voir n'importe quelle route API
