import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/sites";
import { runAudit } from "@/lib/audit/run-audit";

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) return jsonError("Supabase not configured", 500);

  try {
    const site = await getSite(id);
    if (!site) return jsonError("Site not found", 404);
    const result = await runAudit(supabase, site, "manual");
    return NextResponse.json({ audit: result.audit });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Audit failed");
  }
}
