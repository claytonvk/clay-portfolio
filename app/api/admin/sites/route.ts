import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { createSite, listSites, slugify } from "@/lib/sites";
import type { NewSite } from "@/lib/types";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  try {
    return NextResponse.json({ sites: await listSites() });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Load failed");
  }
}

export async function POST(req: Request) {
  const { response } = await requireUser();
  if (response) return response;

  let body: Partial<NewSite>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body.name?.trim()) return jsonError("Name is required", 400);

  const payload: Partial<NewSite> = {
    name: body.name.trim(),
    slug: body.slug?.trim() || slugify(body.name),
    client_name: body.client_name?.trim() || null,
    vercel_project_id: body.vercel_project_id || null,
    github_owner: body.github_owner?.trim() || null,
    github_repo: body.github_repo?.trim() || null,
    production_url: body.production_url?.trim() || null,
    custom_domains: body.custom_domains ?? [],
    status: body.status || "active",
    notes: body.notes?.trim() || null,
  };

  try {
    const site = await createSite(payload);
    return NextResponse.json({ site });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Create failed");
  }
}
