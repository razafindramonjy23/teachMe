-- teachMe — profils étudiants complets dès leur création par un admin
-- À exécuter dans Supabase Dashboard → SQL Editor (une seule fois).
-- Script idempotent : relançable sans dommage.
--
-- Contexte : l'inscription publique est désactivée, tous les comptes sont créés
-- par un admin via POST /api/users/manage, qui exige localisation et niveau de
-- cours pour un étudiant. Mais le trigger handle_new_user écrit toujours
-- profile_complete = 0, ce qui renvoyait chaque étudiant vers
-- /dashboard/onboarding ressaisir ces deux champs.
--
-- La route API marque désormais le profil complet à la création. Ce script
-- rattrape les étudiants créés AVANT ce correctif : ceux dont la localisation
-- et le niveau sont déjà renseignés n'ont plus rien à compléter.
--
-- En pratique, cela concerne TOUS les étudiants existants : le trigger
-- handle_new_user (0001) refuse déjà de créer un étudiant sans localisation ou
-- sans niveau de cours (vérifié : « Localisation et niveau de cours requis
-- pour un étudiant »). Les filtres ci-dessous sont une simple précaution.
--
-- Conséquence : après ce script et le correctif de la route API, la page
-- /dashboard/onboarding n'est plus atteinte par aucun étudiant. Elle reste en
-- place sans risque ; sa suppression est une décision à part.

update public.profiles
set profile_complete = 100
where user_type = 'student'
  and profile_complete < 100
  and nullif(trim(location), '') is not null
  and nullif(trim(course_level), '') is not null;
