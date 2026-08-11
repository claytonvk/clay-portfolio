# Admin Dashboard — Setup Guide

A private, login-gated dashboard at **`/admin`** to manage and maintain all your
client sites: deploys, domains, SEO/performance, dependencies, vulnerabilities,
and an automated **weekly AI health audit** that emails you a summary.

Everything below uses a **free tier**. The dashboard works incrementally — any
integration you skip just shows "Not connected" on the Settings page until you
add its key.

---

## 1. Supabase (required — database + login)

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
3. **SQL Editor → New query** → run each file in `supabase/migrations/` **in
   order**: `0001_init.sql`, then `0002_infra.sql` (Cloudflare detection), then
   `0003_site_cloudflare.sql` (manual Cloudflare flag), then
   `0004_form_submissions.sql` (master submission inbox). Paste each → **Run**.
4. **Authentication → Users → Add user** → create one user with your email +
   a password. This is your login.
5. **Authentication → Providers/Sign In** → turn **off** "Allow new users to
   sign up" (so only you can log in).

## 2. Vercel (deploys, domains, errors)

- [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens) →
  create a token → `VERCEL_API_TOKEN`.
- `VERCEL_TEAM_ID` is already set to your team in `.env.example`.

## 3. Google PageSpeed Insights (performance + SEO scores)

- [Google Cloud Console](https://console.cloud.google.com/) → create/select a
  project → **APIs & Services** → enable **PageSpeed Insights API** →
  **Credentials → Create API key** → `PAGESPEED_API_KEY`.

## 4. GitHub (dependencies + code health)

- [GitHub → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/tokens?type=beta).
- Repository access: the repos you want monitored. Permissions:
  **Contents = Read-only**, **Metadata = Read-only**.
- `GITHUB_TOKEN`.
- For each site, set its **GitHub owner + repo** in the Add-Site form so the
  audit can read its `package.json`.

## 5. Google Gemini (AI audit summaries — free)

- [Google AI Studio → Get API key](https://aistudio.google.com/app/apikey) →
  `GEMINI_API_KEY`. The free tier easily covers a weekly audit of ~11 sites.

## 6. Resend (weekly audit email — free)

- [Resend → API Keys](https://resend.com/api-keys) → `RESEND_API_KEY`.
- `AUDIT_EMAIL_TO` = where the digest is sent (defaults to clay@kdk.dev).
- `AUDIT_EMAIL_FROM` = leave as `onboarding@resend.dev` until you verify your own
  domain in Resend (recommended later for deliverability).

## 7. Cron secret

- Generate a long random string → `CRON_SECRET`. Example:
  ```bash
  openssl rand -hex 32
  ```

---

## Local development

```bash
cp .env.example .env.local   # then fill in the values above
npm run dev
```

Open **http://localhost:3000/admin** → log in → **Sync from Vercel** to import
every project at once → open a site → **Run audit now**.

## Production (Vercel)

1. Add every variable from `.env.local` to the **clay-portfolio** project under
   **Settings → Environment Variables** (Production).
2. Redeploy. The weekly cron (`vercel.json`) runs **Mondays 14:00 UTC**, audits
   all active sites, and emails you the digest. Vercel automatically sends the
   `CRON_SECRET` to authorize it.
3. To trigger it manually:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://clayvanderkolk.site/api/cron/audit
   ```

---

## How adding sites works

- **Sync from Vercel** (Overview or Add-Site page) imports any Vercel project you
  haven't added yet — so new sites appear automatically as you build them.
- **Add Site** lets you create one manually, pick a Vercel project to auto-fill,
  and attach a GitHub repo for dependency scanning.
- Each site's audit pulls only from the integrations you've connected; the rest
  show an empty state until you add their keys.

## What's safe

- The whole `/admin` area is `noindex` and gated by Supabase Auth via
  `middleware.ts`. The public portfolio is untouched.
- All API keys are server-only environment variables; none reach the browser.

---

## Master submission inbox

Every client site mirrors its contact forms and orders into this dashboard, so
there is one place to watch instead of a dozen inboxes. Submissions land under
**Submissions**, and each new one emails `SUBMISSIONS_EMAIL_TO`.

**1. On this dashboard** set:

| Variable | Value |
| --- | --- |
| `SUBMISSIONS_INGEST_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUBMISSIONS_EMAIL_TO` | where alerts go (falls back to `AUDIT_EMAIL_TO`) |

**2. On each client site** set these three (four with the optional label):

| Variable | Value |
| --- | --- |
| `HUB_INGEST_URL` | `https://clayvanderkolk.site/api/submissions/ingest` |
| `HUB_INGEST_SECRET` | the *same* secret as above |
| `HUB_SITE_SLUG` | the site's slug in this dashboard, so submissions link to the site row |
| `HUB_SITE_LABEL` | optional friendly name shown in the inbox |

A site with these unset simply does nothing — forms keep working exactly as
before, so you can roll them out one at a time.

**Sites that submit from the browser** (Vite SPAs: atlas-equipment,
stone-bridge-buyers) have no server-side step to hold the secret, so they
forward from a Supabase **Edge Function** instead. For those, set the same
`HUB_*` values as *function secrets* (Edge Functions → Secrets) rather than as
Vercel env vars, deploy the function, and point a **Database Webhook** at it:

| Site | Function | Webhook on |
| --- | --- | --- |
| atlas-equipment | `notify-submission` (already deployed; now also forwards) | `email_submissions` insert |
| stone-bridge-buyers | `notify-hub` (new — `supabase functions deploy notify-hub`) | `quote_form_submissions` insert |

Both expect an `x-hook-secret` header matching the function's `HOOK_SECRET`.

**Failure behaviour:** mirroring is best-effort and never blocks a customer. If
this dashboard is down, slow (>4s), or returns an error, the client site still
saves the submission, still emails the client, and still returns success — the
failure is only written to that site's logs.
