-- teachMe — suivi de progression des apprenants
-- À exécuter dans Supabase Dashboard → SQL Editor (une seule fois),
-- comme 0001_init.sql. Script idempotent : relançable sans dommage.
--
-- Modèle : une ligne par (apprenant, ressource).
--   opened_at : horodatage de la première ouverture de la ressource (automatique)
--   done_at   : horodatage du marquage « terminé » par l'apprenant (volontaire)
--
-- `resource_id` provient de lib/resources.ts → resourceId(slug, catégorie, titre).
-- Le catalogue reste versionné dans le code ; seule la progression vit ici.

create table if not exists public.resource_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  resource_id text not null check (char_length(resource_id) between 1 and 200),
  level_slug  text not null check (char_length(level_slug) between 1 and 60),
  opened_at   timestamptz,
  done_at     timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, resource_id)
);

-- Lecture rapide de la progression d'un apprenant sur un niveau
create index if not exists resource_progress_user_level_idx
  on public.resource_progress (user_id, level_slug);

-- Reprise de la dernière ressource ouverte
create index if not exists resource_progress_user_opened_idx
  on public.resource_progress (user_id, opened_at desc nulls last);

alter table public.resource_progress enable row level security;

-- ── Policies ────────────────────────────────────────────────────────────────
-- L'apprenant lit et écrit uniquement ses propres lignes.
-- Les admins et superusers lisent tout, mais n'écrivent jamais à la place d'un
-- apprenant : la progression reste déclarée par la personne concernée.

drop policy if exists "progress_select_own_or_admin" on public.resource_progress;
create policy "progress_select_own_or_admin"
  on public.resource_progress for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'superuser')
    )
  );

drop policy if exists "progress_insert_own" on public.resource_progress;
create policy "progress_insert_own"
  on public.resource_progress for insert
  with check (user_id = auth.uid());

drop policy if exists "progress_update_own" on public.resource_progress;
create policy "progress_update_own"
  on public.resource_progress for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "progress_delete_own" on public.resource_progress;
create policy "progress_delete_own"
  on public.resource_progress for delete
  using (user_id = auth.uid());

-- ── Horodatage automatique ──────────────────────────────────────────────────
create or replace function public.touch_resource_progress()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists resource_progress_touch on public.resource_progress;
create trigger resource_progress_touch
  before update on public.resource_progress
  for each row execute function public.touch_resource_progress();

-- ── Purge des données d'activité ────────────────────────────────────────────
-- Les horodatages d'ouverture sont des données personnelles : ne les gardez pas
-- indéfiniment. À appeler depuis un cron Supabase (Database → Cron) ou à la main.
-- Par défaut : efface les lignes seulement ouvertes (jamais terminées) de plus
-- de 12 mois. Les ressources marquées « terminé » sont conservées.
create or replace function public.purge_stale_progress(p_months int default 12)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from public.resource_progress
  where done_at is null
    and opened_at is not null
    and opened_at < now() - make_interval(months => p_months);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_stale_progress(int) from public, anon, authenticated;
