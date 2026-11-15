-- Providence — schéma initial Supabase (remplace providence-server / TypeORM)
-- À exécuter dans Supabase Dashboard → SQL Editor (une seule fois).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Réglages applicatifs (remplace BOOTSTRAP_SUPERUSER_EMAIL / BOOTSTRAP_ADMIN_EMAILS)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key text primary key,
  value text
);

insert into public.app_settings (key, value) values
  ('bootstrap_superuser_email', ''),
  ('bootstrap_admin_emails', '')
on conflict (key) do nothing;

-- Pour configurer, éditez par exemple :
--   update public.app_settings set value = 'moi@providence.academy' where key = 'bootstrap_superuser_email';
--   update public.app_settings set value = 'admin1@ecole.com,admin2@ecole.com' where key = 'bootstrap_admin_emails';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Table profiles (1:1 avec auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('superuser', 'admin', 'user')),
  user_type text not null default 'staff' check (user_type in ('student', 'staff')),
  level text not null default 'Beginner',
  matricule text unique,
  location text,
  course_level text,
  profile_complete int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Helper : l'appelant est-il admin/superuser ?
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'superuser')
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Policies profiles
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "select_own_or_admin" on public.profiles;
create policy "select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "admin_update_any_profile" on public.profiles;
create policy "admin_update_any_profile"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Empêche un utilisateur non-admin de modifier ses propres role / user_type /
-- matricule / email via la policy "update_own_profile" (email/role/matricule
-- ne peuvent être changés que par un admin, via la policy "admin_update_any_profile",
-- ou par les routes serveur admin utilisant service_role).
create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Les requêtes faites avec la clé service_role (routes admin serveur)
  -- contournent déjà RLS, mais pas les triggers : on les laisse passer ici.
  if auth.role() = 'service_role' or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.user_type is distinct from old.user_type
     or new.matricule is distinct from old.matricule
     or new.email is distinct from old.email then
    raise exception 'Modification non autorisée de ce champ';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_privileged_profile_columns on public.profiles;
create trigger trg_protect_privileged_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_privileged_profile_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Trigger de création de profil à l'inscription (remplace AuthService.register)
-- ─────────────────────────────────────────────────────────────────────────
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
  if v_user_type = 'student' then
    if v_location is null or trim(v_location) = ''
       or v_course_level is null or trim(v_course_level) = '' then
      raise exception 'Localisation et niveau de cours requis pour un étudiant';
    end if;
  else
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
    new.id, new.email, v_display_name, v_role, v_user_type, v_level, v_matricule, v_location, v_course_level, 0
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. RPC : prochain matricule étudiant (remplace UsersService.nextMatricule)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.next_matricule(p_location text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_count int;
begin
  v_prefix := 'PA-' || p_location || '-STU-' || to_char(now(), 'YYMM') || '-';

  select count(*) into v_count
  from public.profiles
  where user_type = 'student'
    and location = p_location
    and matricule like v_prefix || '%';

  return v_prefix || lpad((v_count + 1)::text, 4, '0');
end;
$$;

grant execute on function public.next_matricule(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. RPC : résoudre un matricule vers l'email associé (pour login par matricule)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.email_for_matricule(p_matricule text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where matricule = p_matricule;
$$;

grant execute on function public.email_for_matricule(text) to anon, authenticated;
