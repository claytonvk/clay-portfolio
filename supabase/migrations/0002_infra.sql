-- Adds infrastructure detection (e.g. Cloudflare) to audit rows.
-- Run this in the Supabase SQL editor after 0001_init.sql.
alter table public.audits add column if not exists infra jsonb;
