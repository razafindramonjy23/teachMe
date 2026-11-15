# Guide de Connexion — teachMe

## 📱 Nouveaux Flux de Connexion

### Pour les Étudiants (STU)

**Première connexion:**
- URL: `http://localhost:3000/auth`
- Accédez via l'onglet "Matricule"
- Entrez votre **matricule**: `PA-010-STU-2603-045`
- Entrez votre **mot de passe**
- Cliquez "Se connecter"

**Après première connexion:**
- Vous serez redirigé vers `/dashboard/onboarding`
- Complétez votre profil:
  - Sélectionnez votre **Localisation** (Alarobia, Ambohibao, Andoharanofotsy)
  - Sélectionnez votre **Niveau de cours** (BEPC, BAC)
  - Cliquez "Compléter mon profil"
- Vous accédez maintenant au dashboard complet

---

### Pour le Personnel (Mpiasa)

**Inscription (une seule fois):**
- URL: `http://localhost:3000/register`
- Sélectionnez "Personnel"
- Remplissez le formulaire:
  - Nom complet
  - Email
  - Mot de passe
  - Confirmez le mot de passe
- Cliquez "S'inscrire"

**Connexion:**
- URL: `http://localhost:3000/auth`
- Sélectionnez "Email"
- Entrez votre **email**
- Entrez votre **mot de passe**
- Cliquez "Se connecter"

---

### Pour les Parents (Ray aman-dreny)

**Inscription (une seule fois):**
- URL: `http://localhost:3000/register`
- Sélectionnez "Parent"
- Remplissez le formulaire:
  - Nom complet
  - Email
  - Mot de passe
  - Confirmez le mot de passe
- Cliquez "S'inscrire"

**Connexion:**
- URL: `http://localhost:3000/auth`
- Sélectionnez "Email"
- Entrez votre **email**
- Entrez votre **mot de passe**
- Cliquez "Se connecter"

---

## 📋 Format du Matricule

Format: **PA-XXX-STU-MMYY-###**

- **PA** = Préfixe historique (matricules existants)
- **XXX** = Localisation
  - `010` = Alarobia
  - `020` = Ambohibao
  - `030` = Andoharanofotsy
- **STU** = Type (Étudiant)
- **MMYY** = Mois et année d'intégration (ex: 0326 = mars 2026)
- **###** = Numéro séquentiel (ex: 045)

**Exemple complet:** `PA-010-STU-2603-045`

---

## 🔐 Comptes de Test

### Admin
- **Email:** `admin@providence.academy`
- **Mot de passe:** `admin123`

### Super Admin
- **Email:** `superuser@providence.academy`
- **Mot de passe:** `super123`

### Utilisateur Démo
- **Email:** `demo@providence.academy`
- **Mot de passe:** `demo123`

---

## 🚀 Créer un Nouveau Compte Étudiant (Admin)

⚠️ **LES ÉTUDIANTS NE S'INSCRIVENT PAS!**

Les étudiants sont créés par les administrateurs. Interface à venir dans le dashboard admin.
