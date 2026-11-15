-- teachMe — administration : organisations, sécurité, désactivation, journal
-- À exécuter dans Supabase Dashboard → SQL Editor (une seule fois), après 0004.
-- Script idempotent : relançable sans dommage.
--
-- teachMe s'adresse à tout le monde, partout (régions de Madagascar,
-- international) : les trois sites codés en dur (Alarobia, Ambohibao,
-- Andoharanofotsy) et la classe BEPC/BAC laissent place à des ORGANISATIONS,
-- créées librement par le superuser. Un apprenant appartient à une
-- organisation ou à aucune.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Organisations
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.organisations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 120),
  -- Lieu libre, pour s'y retrouver : « Toamasina », « Paris, France »…
  place      text check (place is null or char_length(place) <= 120),
  created_at timestamptz not null default now()
);

-- Unicité du nom sans tenir compte de la casse ni des espaces en trop
create unique index if not exists organisations_name_unique
  on public.organisations (lower(trim(name)));

alter table public.profiles
  add column if not exists organisation_id uuid references public.organisations (id) on delete set null;

create index if not exists profiles_organisation_idx on public.profiles (organisation_id);

-- Reprise de l'existant : chaque ancien site devient une organisation, et ses
-- APPRENANTS y sont rattachés. Les comptes du personnel ne sont pas rattachés :
-- un admin rattaché ne verrait plus que son organisation, ce serait lui retirer
-- un accès sans prévenir.
insert into public.organisations (name)
select distinct case location
                  when '010' then 'Alarobia'
                  when '020' then 'Ambohibao'
                  when '030' then 'Andoharanofotsy'
                end
from public.profiles
where user_type = 'student' and location in ('010', '020', '030')
on conflict do nothing;

update public.profiles p
set organisation_id = o.id
from public.organisations o
where p.user_type = 'student'
  and p.organisation_id is null
  and lower(o.name) = case p.location
                        when '010' then 'alarobia'
                        when '020' then 'ambohibao'
                        when '030' then 'andoharanofotsy'
                      end;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Création des comptes : plus de site ni de classe obligatoires
-- ═══════════════════════════════════════════════════════════════════════════
-- Identique à 0001, sauf la vérification « localisation et niveau de cours
-- requis pour un étudiant », retirée. L'organisation est posée ensuite par
-- l'API (clé service_role), comme le rôle.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_user_type text := coalesce(meta->>'userType', 'staff');
  v_display_name text := meta->>'displayName';
  v_level text := coalesce(meta->>'level', 'Beginner');
  v_location text := meta->>'location';
  v_course_level text := meta->>'courseLevel';
  v_matricule text := meta->>'matricule';
  v_role text := 'user';
  v_norm_email text := lower(trim(coalesce(new.email, '')));
  v_super_email text;
  v_admin_emails text[];
  v_super_count int;
begin
  if v_user_type <> 'student' then
    -- staff : rôle calculé via bootstrap superuser / admin
    select value into v_super_email from public.app_settings where key = 'bootstrap_superuser_email';
    v_super_email := lower(trim(coalesce(v_super_email, '')));

    select count(*) into v_super_count from public.profiles where role = 'superuser';

    if v_super_email <> '' and v_norm_email = v_super_email and v_super_count = 0 then
      v_role := 'superuser';
    else
      select string_to_array(coalesce(value, ''), ',') into v_admin_emails
      from public.app_settings where key = 'bootstrap_admin_emails';

      if v_super_count > 0 and v_norm_email = any (
        select lower(trim(e)) from unnest(coalesce(v_admin_emails, array[]::text[])) as e
      ) then
        v_role := 'admin';
      end if;
    end if;
  end if;

  insert into public.profiles (
    id, email, display_name, role, user_type, level, matricule, location, course_level, profile_complete
  ) values (
    new.id, new.email, v_display_name, v_role, v_user_type, v_level, v_matricule,
    nullif(trim(v_location), ''), nullif(trim(v_course_level), ''), 0
  );

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Matricules : un format général, et un numéro garanti unique
-- ═══════════════════════════════════════════════════════════════════════════
-- Ancien format : PA-010-STU-2611-0001 (site dans le matricule), calculé en
-- « compter puis +1 » : deux créations simultanées (un import) tiraient le même
-- numéro et l'une échouait.
-- Nouveau format : TM-000001, tiré d'une séquence Postgres — atomique, sans
-- collision, sans site. Les anciens matricules restent valables pour se
-- connecter (email_for_matricule cherche le matricule exact, quel qu'il soit).

create sequence if not exists public.learner_matricule_seq;

create or replace function public.next_learner_matricule()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select 'TM-' || lpad(nextval('public.learner_matricule_seq')::text, 6, '0');
$$;

-- Réservé à l'API (service_role) : ni un visiteur ni un connecté ne génère de matricule.
revoke all on function public.next_learner_matricule() from public, anon, authenticated;
grant execute on function public.next_learner_matricule() to service_role;
-- L'ancien générateur était appelable par n'importe quel visiteur : on retire ce droit.
revoke all on function public.next_matricule(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Désactivation des comptes (au lieu de la suppression)
-- ═══════════════════════════════════════════════════════════════════════════
-- Supprimer un compte efface en cascade toute sa progression. Désactiver
-- bloque la connexion (bannissement Supabase Auth, posé par l'API) et conserve
-- tout. deactivated_at sert à l'affichage et au filtrage.

alter table public.profiles
  add column if not exists deactivated_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. CORRECTIF DE SÉCURITÉ — escalade de privilèges
-- ═══════════════════════════════════════════════════════════════════════════
-- Avec 0001, un admin pouvait, depuis son navigateur (clé anon + sa session),
-- modifier n'importe quel profil, y compris se donner le rôle « superuser » :
-- la policy « admin_update_any_profile » l'autorisait et le trigger de
-- protection laissait passer tout admin. Les garde-fous de l'API étaient donc
-- contournables.
--
-- Désormais les colonnes sensibles (rôle, type, matricule, email,
-- organisation, niveau, désactivation — et les anciennes colonnes site/classe)
-- ne changent QUE par la clé service_role, c'est-à-dire par les routes
-- /api/** qui appliquent les règles de rôle et d'organisation. Chacun peut
-- toujours modifier les colonnes anodines de son propre profil (ex. home_mode).

create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.user_type is distinct from old.user_type
     or new.matricule is distinct from old.matricule
     or new.email is distinct from old.email
     or new.organisation_id is distinct from old.organisation_id
     or new.level is distinct from old.level
     or new.location is distinct from old.location
     or new.course_level is distinct from old.course_level
     or new.deactivated_at is distinct from old.deactivated_at then
    raise exception 'Modification non autorisée de ce champ';
  end if;

  return new;
end;
$$;

drop policy if exists "admin_update_any_profile" on public.profiles;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Admins rattachés à une organisation (facultatif)
-- ═══════════════════════════════════════════════════════════════════════════
-- Règle de visibilité :
--   - superuser                          : voit tout le monde ;
--   - admin SANS organisation            : voit tout le monde (comportement
--     d'avant — personne ne perd d'accès tant qu'aucune n'est assignée) ;
--   - admin rattaché à une organisation  : ne voit que ses membres.
-- Les routes API appliquent la même règle pour les modifications.

drop function if exists public.can_oversee(uuid, text);

create or replace function public.can_oversee(viewer uuid, target_organisation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles v
    where v.id = viewer
      and v.deactivated_at is null
      and (
        v.role = 'superuser'
        or (v.role = 'admin' and (v.organisation_id is null or v.organisation_id = target_organisation))
      )
  );
$$;

drop policy if exists "select_own_or_admin" on public.profiles;
drop policy if exists "select_own_or_overseen" on public.profiles;
create policy "select_own_or_overseen"
  on public.profiles for select
  using (id = auth.uid() or public.can_oversee(auth.uid(), organisation_id));

drop policy if exists "progress_select_own_or_admin" on public.resource_progress;
drop policy if exists "progress_select_own_or_overseen" on public.resource_progress;
create policy "progress_select_own_or_overseen"
  on public.resource_progress for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles t
      where t.id = resource_progress.user_id
        and public.can_oversee(auth.uid(), t.organisation_id)
    )
  );

-- Organisations : lisibles par les admins (listes déroulantes), modifiées
-- uniquement par l'API (superuser, journalisé). Un admin rattaché ne voit que
-- la sienne.
alter table public.organisations enable row level security;

drop policy if exists "organisations_select_admin" on public.organisations;
create policy "organisations_select_admin"
  on public.organisations for select
  using (public.can_oversee(auth.uid(), id));

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Journal des actions d'administration
-- ═══════════════════════════════════════════════════════════════════════════
-- Écrit uniquement par les routes API (clé service_role) ; lisible uniquement
-- par les superusers. Aucune policy d'écriture : ni un admin ni un apprenant ne
-- peuvent y ajouter, modifier ou effacer une ligne.

create table if not exists public.admin_audit (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references auth.users (id) on delete set null,
  actor_label  text not null,
  action       text not null,
  target_id    uuid,
  target_label text,
  details      jsonb not null default '{}'::jsonb
);

alter table public.admin_audit drop constraint if exists admin_audit_action_check;
alter table public.admin_audit add constraint admin_audit_action_check check (action in (
  'create', 'import', 'update', 'deactivate', 'reactivate', 'reset_password', 'delete',
  'org_create', 'org_update', 'org_delete'));

create index if not exists admin_audit_at_idx on public.admin_audit (at desc);

alter table public.admin_audit enable row level security;

drop policy if exists "audit_select_superuser" on public.admin_audit;
create policy "audit_select_superuser"
  on public.admin_audit for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superuser')
  );
