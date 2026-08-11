import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { sendSubmissionAlert } from "@/lib/email";
import type { SubmissionKind } from "@/lib/types";

export const runtime = "nodejs";

const KINDS: SubmissionKind[] = [
  "contact",
  "order",
  "booking",
  "lead",
  "review",
  "other",
];

// Client sites are untrusted input even though they are mine: cap the sizes so
// a runaway payload cannot bloat the table.
function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  if (!env.ingestSecret) {
    return NextResponse.json(
      { error: "Ingest is not configured" },
      { status: 503 }
    );
  }

  const presented =
    request.headers.get("x-ingest-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!presented || !timingSafeEqual(presented, env.ingestSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const siteSlug = str(body.site_slug, 120);
  if (!siteSlug) {
    return NextResponse.json({ error: "site_slug is required" }, { status: 400 });
  }

  const kindRaw = str(body.kind, 20) as SubmissionKind | null;
  const kind: SubmissionKind =
    kindRaw && KINDS.includes(kindRaw) ? kindRaw : "contact";

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Match the sending site to a dashboard site row so the inbox can link to it.
  // A miss is fine — the submission is still recorded against its slug.
  const { data: site } = await supabase
    .from("sites")
    .select("id, name, slug")
    .eq("slug", siteSlug)
    .maybeSingle();

  const amountRaw = body.amount_cents;
  const amountCents =
    typeof amountRaw === "number" && Number.isFinite(amountRaw)
      ? Math.round(amountRaw)
      : null;

  const submittedAt = str(body.submitted_at, 40);

  const row = {
    site_id: site?.id ?? null,
    site_slug: siteSlug,
    site_label: str(body.site_label, 160) ?? site?.name ?? null,
    kind,
    name: str(body.name, 200),
    email: str(body.email, 320),
    phone: str(body.phone, 60),
    subject: str(body.subject, 300),
    message: str(body.message, 10000),
    amount_cents: amountCents,
    currency: str(body.currency, 10),
    payload:
      body.payload && typeof body.payload === "object" ? body.payload : {},
    source_url: str(body.source_url, 500),
    external_id: str(body.external_id, 200),
    submitted_at:
      submittedAt && !Number.isNaN(Date.parse(submittedAt))
        ? submittedAt
        : new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from("form_submissions")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    // 23505 = unique violation on (site_slug, external_id): the site retried a
    // submission we already stored. That is a success from the caller's view.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("submission ingest failed:", error.message);
    return NextResponse.json({ error: "Could not store submission" }, { status: 500 });
  }

  // The submission is already safely stored — never fail the request because
  // the alert email did not go out.
  try {
    await sendSubmissionAlert({ ...row, id: inserted.id });
  } catch (err) {
    console.error("submission alert email failed:", err);
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
