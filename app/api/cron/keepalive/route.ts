import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Free-tier Supabase pauses a project after ~7 days without activity, and the
// weekly audit alone was not enough to prevent it. While paused, every client
// site's notifyHub POST is dropped, so submissions silently go missing. One
// tiny query a day keeps the project awake.
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

  const { error } = await supabase.from("sites").select("id").limit(1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
