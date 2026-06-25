import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { runAudit } from "@/lib/audit/run-audit";
import { isExcludedSite } from "@/lib/sites";
import { sendAuditDigest, type DigestItem } from "@/lib/email";
import type { Site } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Weekly audit of every active site, then an email digest.
// Triggered by Vercel Cron (sends `Authorization: Bearer <CRON_SECRET>`).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 500 }
    );
  }

  const { data: sites, error } = await supabase
    .from("sites")
    .select("*")
    .eq("status", "active");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: DigestItem[] = [];
  const targets = ((sites as Site[]) ?? []).filter((s) => !isExcludedSite(s));
  for (const site of targets) {
    try {
      const result = await runAudit(supabase, site, "cron");
      items.push({ site, audit: result.audit });
    } catch (e) {
      items.push({
        site,
        audit: null,
        error: e instanceof Error ? e.message : "Audit failed",
      });
    }
  }

  const emailed = await sendAuditDigest(items);

  return NextResponse.json({
    audited: items.length,
    needsAttention: items.filter((i) => i.audit?.needs_attention || i.error)
      .length,
    emailed,
  });
}
