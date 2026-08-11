-- Master inbox for form submissions and orders coming from every client site.
-- Each site POSTs to /api/submissions/ingest with the shared secret; rows are
-- written with the service role, so no site ever needs database credentials.

create table if not exists public.form_submissions (
  id            uuid primary key default gen_random_uuid(),

  -- site_id is resolved from site_slug at ingest time when a matching row
  -- exists. It stays nullable so a submission is never dropped just because
  -- the sending site has not been registered in the dashboard yet.
  site_id       uuid references public.sites(id) on delete set null,
  site_slug     text not null,
  site_label    text,

  kind          text not null default 'contact'
                  check (kind in ('contact','order','booking','lead','review','other')),

  -- Denormalised contact fields so the inbox is searchable without digging
  -- through the payload. Every one of them is optional: sites differ.
  name          text,
  email         text,
  phone         text,
  subject       text,
  message       text,

  -- Orders / paid bookings only.
  amount_cents  integer,
  currency      text,

  -- The full original submission, whatever shape the site sent.
  payload       jsonb not null default '{}'::jsonb,

  source_url    text,
  status        text not null default 'new'
                  check (status in ('new','read','archived')),

  -- Set by the sending site so retries cannot create duplicates.
  external_id   text,

  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists form_submissions_created_at_idx
  on public.form_submissions (created_at desc);

create index if not exists form_submissions_status_idx
  on public.form_submissions (status, created_at desc);

create index if not exists form_submissions_site_idx
  on public.form_submissions (site_id, created_at desc);

-- A site may resend the same submission (network retry, webhook replay).
-- Dedupe on (site_slug, external_id) when the site supplies an id.
create unique index if not exists form_submissions_external_id_idx
  on public.form_submissions (site_slug, external_id)
  where external_id is not null;

alter table public.form_submissions enable row level security;

-- Same policy shape as sites/audits: signed-in dashboard user sees everything.
-- Ingest goes through the service role, which bypasses RLS.
drop policy if exists "authed full access" on public.form_submissions;
create policy "authed full access" on public.form_submissions
  for all to authenticated using (true) with check (true);
