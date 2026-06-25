import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { listProjects, vercelConfigured } from "@/lib/integrations/vercel";

// Used by the Add-Site form dropdown.
export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  if (!vercelConfigured()) {
    return NextResponse.json({ projects: [], configured: false });
  }
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects, configured: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Vercel error");
  }
}
