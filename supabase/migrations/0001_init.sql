-- ─────────────────────────────────────────────────────────────
-- Admin dashboard schema. Run this in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- Single-user model: any authenticated user (i.e. you) has full access.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Sites you build / maintain ----------------------------------------------
create table if not exists public.sites (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  client_name       text,
  vercel_project_id text,
  github_owner      text,
  github_repo       text,
  production_url    text,
  custom_domains    text[] not null default '{}',
  status            text not null default 'active'
                      check (status in ('active','paused','archived')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Audit runs (manual + weekly cron) ---------------------------------------
create table if not exists public.audits (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  run_at          timestamptz not null default now(),
  source          text not null default 'manual'
                    check (source in ('manual','cron')),
  health_score    int not null default 0,
  needs_attention boolean not null default false,
  lighthouse      jsonb,
  deps            jsonb,
  vulnerabilities jsonb,
  vercel          jsonb,
  summary         text,
  recommendations jsonb
);

create index if not exists audits_site_id_run_at_idx
  on public.audits (site_id, run_at desc);

-- Lightweight metric snapshots for trend sparklines -----------------------
create table if not exists public.site_metrics (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  captured_at  timestamptz not null default now(),
  health_score int,
  performance  int,
  seo          int
);

create index if not exists site_metrics_site_id_idx
  on public.site_metrics (site_id, captured_at desc);

-- Keep updated_at fresh ----------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sites_touch_updated_at on public.sites;
create trigger sites_touch_updated_at
  before update on public.sites
  for each row execute function public.touch_updated_at();

-- Row Level Security -------------------------------------------------------
alter table public.sites        enable row level security;
alter table public.audits       enable row level security;
alter table public.site_metrics enable row level security;

-- Single-operator app: any signed-in user has full access.
drop policy if exists "authed full access" on public.sites;
create policy "authed full access" on public.sites
  for all to authenticated using (true) with check (true);

drop policy if exists "authed full access" on public.audits;
create policy "authed full access" on public.audits
  for all to authenticated using (true) with check (true);

drop policy if exists "authed full access" on public.site_metrics;
create policy "authed full access" on public.site_metrics
  for all to authenticated using (true) with check (true);
