-- Manual "behind Cloudflare" flag per site (covers DNS-only zones that
-- header detection can't see). Run in the Supabase SQL editor after 0002.
alter table public.sites add column if not exists cloudflare boolean not null default false;
