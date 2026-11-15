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

**Obtenir un compte :**
- Il n'y a pas d'inscription publique. Un administrateur crée le compte depuis
  `/dashboard/admin` → « Nouvel utilisateur », puis vous transmet l'email et le
  mot de passe initial.

**Connexion:**
- URL: `http://localhost:3000/auth`
- Sélectionnez "Email"
- Entrez votre **email**
- Entrez votre **mot de passe**
- Cliquez "Se connecter"

---

### Pour les Parents (Ray aman-dreny)

**Obtenir un compte :**
- Il n'y a pas d'inscription publique. Un administrateur crée le compte depuis
  `/dashboard/admin` → « Nouvel utilisateur », puis vous transmet l'email et le
  mot de passe initial.

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

| Rôle | Email |
|---|---|
| Super Admin | `superuser@providence.academy` |
| Admin | `admin@providence.academy` |
| Utilisateur démo | `demo@providence.academy` |

Les mots de passe ne figurent pas ici : ce dépôt est public. Ils sont définis au
moment de lancer `scripts/seed-demo-users.mjs` (variables `SEED_*_PASSWORD`) et
communiqués par l'administrateur.

---

## 🚀 Créer un Nouveau Compte Étudiant (Admin)

⚠️ **LES ÉTUDIANTS NE S'INSCRIVENT PAS!**

Les étudiants sont créés par les administrateurs. Interface à venir dans le dashboard admin.
