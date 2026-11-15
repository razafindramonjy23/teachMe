-- teachMe — parcours gamifié
-- À exécuter dans Supabase Dashboard → SQL Editor (une seule fois), après 0002.
-- Script idempotent : relançable sans dommage.

-- ── 1. Mode d'accueil choisi par l'apprenant ───────────────────────────────
-- null       : pas encore choisi → l'écran de choix s'affiche à la connexion
-- 'parcours' : parcours guidé (objectif du jour, série, tampons)
-- 'libre'    : accès libre à tous les niveaux, sans objectifs
--
-- Stocké dans le profil et non dans le navigateur : au labo, les ordinateurs
-- sont partagés entre étudiants.
-- La policy « update_own_profile » (0001) permet déjà à chacun de modifier son
-- propre profil, et le trigger de protection ne verrouille pas cette colonne.

alter table public.profiles
  add column if not exists home_mode text;

alter table public.profiles
  drop constraint if exists profiles_home_mode_check;
alter table public.profiles
  add constraint profiles_home_mode_check
  check (home_mode is null or home_mode in ('parcours', 'libre'));

-- ── 2. Horodatages fixés par le serveur ────────────────────────────────────
-- La série de jours se calcule à partir de done_at. Sans ce trigger, un client
-- pourrait écrire n'importe quelle date (le RLS l'autorise à modifier ses
-- propres lignes) et se fabriquer une série en antidatant ses coches.
-- Ici, la base ignore les dates envoyées : elle n'accepte que « maintenant ».
--
--   opened_at : fixé à la première ouverture, puis immuable
--   done_at   : fixé quand la ressource est cochée ; remis à null si décochée ;
--               une coche déjà posée garde sa date d'origine

create or replace function public.resource_progress_server_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.opened_at is not null then new.opened_at := now(); end if;
    if new.done_at is not null then new.done_at := now(); end if;
    return new;
  end if;

  -- UPDATE
  if old.opened_at is not null then
    new.opened_at := old.opened_at;
  elsif new.opened_at is not null then
    new.opened_at := now();
  end if;

  if new.done_at is null then
    new.done_at := null;               -- décoché
  elsif old.done_at is not null then
    new.done_at := old.done_at;        -- déjà coché : on garde la date d'origine
  else
    new.done_at := now();              -- coché maintenant
  end if;

  return new;
end;
$$;

drop trigger if exists resource_progress_server_timestamps on public.resource_progress;
create trigger resource_progress_server_timestamps
  before insert or update on public.resource_progress
  for each row execute function public.resource_progress_server_timestamps();
