// Backfill the submissions inbox from each client site's own database.
//
// When the dashboard's Supabase project is paused, every notifyHub POST from a
// client site fails and is dropped — there is no retry queue. The client sites
// still store their own copy, so this reads those tables and inserts whatever
// the inbox is missing. Rows are written with `backfill` semantics: no alert
// emails, original submitted_at preserved.
//
// Usage (from clay-portfolio/):
//   node --env-file=.env.local scripts/backfill-submissions.mjs            # dry run, last 30 days
//   node --env-file=.env.local scripts/backfill-submissions.mjs --days 60
//   node --env-file=.env.local scripts/backfill-submissions.mjs --apply    # actually write
//
// Credentials for each source are read from that site's env file in the
// sibling repo. A source without a readable key is skipped with a note. Plain
// fetch against PostgREST, so it runs on Node 20 without extra packages.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx >= 0 ? Number(args[daysIdx + 1]) : 30;
const SINCE = new Date(Date.now() - DAYS * 864e5).toISOString();

// A live notifyHub POST lands within seconds of the source insert. Anything in
// the inbox from the same site + email inside this window is the same row.
const MATCH_WINDOW_MS = 5 * 60 * 1000;

const ROOT = path.resolve(import.meta.dirname, "..", "..");

const HUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const HUB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!HUB_URL || !HUB_KEY) {
  console.error("Run with --env-file=.env.local (needs the dashboard's service role key).");
  process.exit(1);
}

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Each source mirrors the notifyHub call in its site so backfilled rows look
// exactly like live ones. `slug` must match the site's HUB_SITE_SLUG.
const SOURCES = [
  {
    // Surf school and surf stays share one Supabase project and one table;
    // the location column tells them apart.
    envFile: "island-style-surf-stay-web/.env",
    table: "contact_submissions",
    map: (r) => {
      const stays = (r.location ?? "").startsWith("Surf Stays");
      return stays
        ? {
            site_slug: "island-style-surf-stays-web",
            kind: "lead",
            subject: r.location.replace(/^Surf Stays( - )?/, "") || "Surf Stays",
            payload: { location: r.location },
          }
        : {
            site_slug: "island-style-surf-school-web",
            kind: "lead",
            subject: r.location || "Surf camp",
            payload: { lessonName: r.location ?? null },
          };
    },
  },
  {
    envFile: "vk-studios/.env.local",
    table: "contact_submissions",
    map: (r) => ({
      site_slug: "vk-creative-co-web",
      kind: "contact",
      subject: r.event_type || "Contact form",
      payload: {
        eventType: r.event_type ?? null,
        eventDate: r.event_date ?? null,
        location: r.location ?? null,
      },
    }),
  },
  {
    envFile: "college-coffee-co-web/.env.local",
    table: "contact_submissions",
    map: (r) => ({
      site_slug: "college-coffee-co-web",
      kind: "contact",
      subject: r.event_type || "Contact form",
      payload: { eventType: r.event_type ?? null, eventDate: r.event_date ?? null },
    }),
  },
  {
    envFile: "molokai-plumerias-web/.env.local",
    table: "orders",
    filter: "status=eq.paid",
    map: (r) => ({
      site_slug: "molokai-plumerias-web",
      kind: "order",
      name: r.customer_name,
      subject: `Order ${r.order_number}`,
      message: null,
      amount_cents: r.total_cents,
      currency: "usd",
      external_id: String(r.id),
      payload: { orderNumber: r.order_number },
    }),
  },
  {
    // Vite SPA: only the anon key is in the repo, and RLS hides the rows from
    // it. Add SUPABASE_SERVICE_ROLE_KEY to atlas-equipment-web/.env to include.
    envFile: "atlas-equipment-web/.env",
    table: "email_submissions",
    needsServiceKey: true,
    map: (r) => ({
      site_slug: "atlas-equipment-web",
      kind: "lead",
      name: clean(r.name) || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || null,
      subject: "Contact form",
      source_url: r.sms_consent_page ?? null,
      external_id: String(r.id),
      payload: {
        smsConsentMarketing: r.sms_consent_marketing ?? null,
        smsConsentNonMarketing: r.sms_consent_non_marketing ?? null,
      },
    }),
  },
  {
    envFile: "stone-bridge-buyers-web/.env",
    table: "quote_form_submissions",
    needsServiceKey: true,
    map: (r) => {
      const address = [r.address, r.city, r.state, r.zip].filter(Boolean).join(", ");
      return {
        site_slug: "stone-bridge-buyers-web",
        kind: "lead",
        name: clean(r.name) || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || null,
        subject: address ? `Offer request — ${address}` : "Offer request",
        external_id: String(r.id),
        payload: { address: address || null },
      };
    },
  },
];

function readEnv(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return null;
  return Object.fromEntries(
    fs
      .readFileSync(full, "utf8")
      .split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

async function rest(url, key, pathAndQuery, init = {}) {
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

const hubSites = await rest(HUB_URL, HUB_KEY, "sites?select=id,name,slug");
const siteBySlug = new Map(hubSites.map((s) => [s.slug, s]));

const existing = await rest(
  HUB_URL,
  HUB_KEY,
  `form_submissions?select=site_slug,email,submitted_at,external_id&submitted_at=gte.${SINCE}`
);

function alreadyInInbox(row) {
  const t = Date.parse(row.submitted_at);
  return existing.some(
    (e) =>
      e.site_slug === row.site_slug &&
      ((row.external_id && e.external_id === row.external_id) ||
        ((e.email ?? null) === (row.email ?? null) &&
          Math.abs(Date.parse(e.submitted_at) - t) < MATCH_WINDOW_MS))
  );
}

const toInsert = [];

for (const src of SOURCES) {
  const label = `${src.envFile.split("/")[0]} · ${src.table}`;
  const env = readEnv(src.envFile);
  const url = env && (env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL);
  const key = env && (env.SUPABASE_SERVICE_ROLE_KEY || (!src.needsServiceKey && env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

  if (!url || url.includes("YOUR-PROJECT") || !key) {
    console.log(`– skip  ${label}: no ${src.needsServiceKey ? "service role key" : "credentials"} in ${src.envFile}`);
    continue;
  }

  let rows;
  try {
    const filter = src.filter ? `&${src.filter}` : "";
    rows = await rest(url, key, `${src.table}?select=*&created_at=gte.${SINCE}${filter}&order=created_at.asc`);
  } catch (err) {
    const reason = err.cause?.code === "ENOTFOUND" ? "project unreachable (paused or deleted?)" : err.message;
    console.log(`✗ error ${label}: ${reason}`);
    continue;
  }

  let missing = 0;
  for (const r of rows) {
    const mapped = src.map(r);
    const row = {
      name: clean(r.name),
      email: clean(r.email),
      phone: clean(r.phone),
      message: clean(r.message),
      ...mapped,
      submitted_at: r.created_at,
    };
    const site = siteBySlug.get(row.site_slug);
    row.site_id = site?.id ?? null;
    row.site_label = site?.name ?? null;
    row.payload = { ...(row.payload ?? {}), backfilled: true };
    if (alreadyInInbox(row)) continue;
    missing++;
    toInsert.push(row);
    console.log(`  + ${row.submitted_at.slice(0, 16)}  ${row.site_slug}  ${row.name ?? "(no name)"} <${row.email ?? "-"}>`);
  }
  console.log(`✓ read  ${label}: ${rows.length} in window, ${missing} missing from inbox`);
}

console.log(`\n${toInsert.length} submission(s) to backfill since ${SINCE.slice(0, 10)}.`);

if (!APPLY) {
  if (toInsert.length) console.log("Dry run — re-run with --apply to write them.");
  process.exit(0);
}

if (toInsert.length) {
  // Inserted one at a time so a unique-index hit on one Stripe order does not
  // throw away the rest of the batch.
  let ok = 0;
  for (const row of toInsert) {
    try {
      await rest(HUB_URL, HUB_KEY, "form_submissions", {
        method: "POST",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify(row),
      });
      ok++;
    } catch (err) {
      if (err.message.includes("23505")) continue;
      console.error(`  failed ${row.site_slug} ${row.submitted_at}: ${err.message}`);
    }
  }
  console.log(`Wrote ${ok} row(s).`);
}
