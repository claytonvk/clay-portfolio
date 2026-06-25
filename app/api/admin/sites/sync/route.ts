import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { listProjects, vercelConfigured } from "@/lib/integrations/vercel";
import {
  createSite,
  isExcludedSite,
  listSites,
  slugify,
  updateSite,
} from "@/lib/sites";
import type { NewSite } from "@/lib/types";

// Bulk-imports any Vercel project not already tracked. This is the
// "expand as I build" mechanism — new Vercel projects appear here.
export async function POST() {
  const { response } = await requireUser();
  if (response) return response;

  if (!vercelConfigured()) {
    return jsonError("Connect Vercel first (set VERCEL_API_TOKEN).", 400);
  }

  try {
    const [projects, existing] = await Promise.all([
      listProjects(),
      listSites(),
    ]);
    if (projects.length === 0) {
      return NextResponse.json({
        added: 0,
        skipped: 0,
        updated: 0,
        total: 0,
        hint: "Vercel returned 0 projects. Your API token is likely scoped to the wrong account — recreate it scoped to the team that owns your sites.",
      });
    }

    const existingByVercelId = new Map(
      existing.filter((s) => s.vercel_project_id).map((s) => [s.vercel_project_id, s])
    );
    const existingSlugs = new Set(existing.map((s) => s.slug));

    const added = [];
    let updated = 0;
    for (const p of projects) {
      // Skip the portfolio itself (and any other excluded project).
      if (isExcludedSite({ name: p.name, slug: slugify(p.name) })) continue;

      const tracked = existingByVercelId.get(p.id);
      if (tracked) {
        // Backfill GitHub repo / production URL we now know about.
        const patch: Partial<NewSite> = {};
        if (!tracked.github_owner && p.githubOwner) {
          patch.github_owner = p.githubOwner;
          patch.github_repo = p.githubRepo;
        }
        if (!tracked.production_url && p.productionUrl) {
          patch.production_url = p.productionUrl;
        }
        if (Object.keys(patch).length) {
          await updateSite(tracked.id, patch);
          updated++;
        }
        continue;
      }

      let slug = slugify(p.name);
      while (existingSlugs.has(slug)) slug = `${slug}-${p.id.slice(0, 4)}`;
      existingSlugs.add(slug);
      const site = await createSite({
        name: p.name,
        slug,
        vercel_project_id: p.id,
        production_url: p.productionUrl,
        github_owner: p.githubOwner,
        github_repo: p.githubRepo,
        custom_domains: [],
        status: "active",
      });
      added.push(site);
    }

    return NextResponse.json({
      added: added.length,
      updated,
      skipped: projects.length - added.length - updated,
      total: projects.length,
      sites: added,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Sync failed");
  }
}
