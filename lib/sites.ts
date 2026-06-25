import "server-only";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Audit, Site, SiteWithAudit, NewSite } from "@/lib/types";

// Sites the dashboard should hide (e.g. this portfolio itself).
export function isExcludedSite(s: { name: string; slug: string }): boolean {
  return (
    env.excludedProjects.includes(s.name.toLowerCase()) ||
    env.excludedProjects.includes(s.slug.toLowerCase())
  );
}

// Data-access helpers for the `sites` and `audits` tables.
// All run server-side under the authenticated user's RLS policies.

export async function listSites(): Promise<Site[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Site[]) ?? [];
}

export async function listSitesWithLatestAudit(): Promise<SiteWithAudit[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sites")
    .select("*, audits(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data as (Site & { audits: Audit[] })[]) ?? [])
    .filter((row) => !isExcludedSite(row))
    .map((row) => {
      const { audits, ...site } = row;
      const latest =
        (audits ?? []).sort(
          (a, b) => +new Date(b.run_at) - +new Date(a.run_at)
        )[0] ?? null;
      return { ...site, latest_audit: latest };
    });
}

export async function getSite(id: string): Promise<Site | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Site) ?? null;
}

export async function getAuditsForSite(
  siteId: string,
  limit = 20
): Promise<Audit[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("site_id", siteId)
    .order("run_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Audit[]) ?? [];
}

export async function createSite(site: Partial<NewSite>): Promise<Site> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("sites")
    .insert(site)
    .select("*")
    .single();
  if (error) throw error;
  return data as Site;
}

export async function updateSite(
  id: string,
  patch: Partial<NewSite>
): Promise<Site> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("sites")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Site;
}

export async function deleteSite(id: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) throw error;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
