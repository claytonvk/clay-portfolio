import Link from "next/link";
import { X } from "lucide-react";
import SiteFilter from "@/components/admin/SiteFilter";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Stat, EmptyState } from "@/components/admin/ui";
import SubmissionList from "@/components/admin/SubmissionList";
import type { SubmissionWithSite, SubmissionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; status?: SubmissionStatus }[] = [
  { key: "new", label: "New", status: "new" },
  { key: "all", label: "All" },
  { key: "archived", label: "Archived", status: "archived" },
];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; site?: string }>;
}) {
  const { filter = "new", site } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div>
        <PageHeader title="Submissions" subtitle="Every form and order, in one inbox." />
        <EmptyState
          title="Supabase isn't configured"
          description="Add your Supabase keys to start collecting submissions."
        />
      </div>
    );
  }

  let query = supabase
    .from("form_submissions")
    .select("*, site:sites(id, name, slug)")
    .order("submitted_at", { ascending: false })
    .limit(200);

  // "All" still hides archived — archived has its own tab.
  if (active.status) query = query.eq("status", active.status);
  else query = query.neq("status", "archived");
  if (site) query = query.eq("site_slug", site);

  const { data, error } = await query;
  const submissions = (data ?? []) as unknown as SubmissionWithSite[];

  // Counts for the header, independent of the active filter.
  const { count: newCount } = await supabase
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const { count: totalCount } = await supabase
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .neq("status", "archived");

  // Every registered site, plus any slug that has sent submissions without
  // being registered — so the filter always shows the full roster rather than
  // just whatever happens to be on this page.
  const { data: allSites } = await supabase
    .from("sites")
    .select("slug, name")
    .order("name");

  const { data: slugRows } = await supabase
    .from("form_submissions")
    .select("site_slug, site_label")
    .neq("status", "archived");

  const counts = new Map<string, number>();
  for (const r of slugRows ?? []) {
    counts.set(r.site_slug, (counts.get(r.site_slug) ?? 0) + 1);
  }

  const siteMap = new Map<string, string>();
  for (const s2 of allSites ?? []) siteMap.set(s2.slug, s2.name || s2.slug);
  for (const r of slugRows ?? []) {
    if (!siteMap.has(r.site_slug)) siteMap.set(r.site_slug, r.site_label || r.site_slug);
  }

  const sites = Array.from(siteMap.entries()).sort((a, b) => {
    // Sites with submissions first, then alphabetical.
    const ca = counts.get(a[0]) ?? 0;
    const cb = counts.get(b[0]) ?? 0;
    if ((ca > 0) !== (cb > 0)) return cb - ca;
    return a[1].localeCompare(b[1]);
  });

  const activeSiteLabel = site ? siteMap.get(site) ?? site : null;

  return (
    <div>
      <PageHeader
        title="Submissions"
        subtitle="Every contact form and order across all your sites, in one inbox."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Unread" value={newCount ?? 0} />
        <Stat label="Total" value={totalCount ?? 0} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/submissions?filter=${f.key}${site ? `&site=${site}` : ""}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              f.key === active.key
                ? "bg-ink text-cream"
                : "border border-ink/15 hover:bg-ink/[0.04]"
            }`}
          >
            {f.label}
            {f.key === "new" && newCount ? ` (${newCount})` : ""}
          </Link>
        ))}

        <div className="ml-auto">
          <SiteFilter
            sites={sites.map(([slug, label]) => ({
              slug,
              label,
              count: counts.get(slug) ?? 0,
            }))}
            active={site ?? null}
            filter={active.key}
          />
        </div>
      </div>

      {activeSiteLabel && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted">Showing only</span>
          <Link
            href={`/admin/submissions?filter=${active.key}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1 text-xs font-medium hover:bg-ink/85 transition"
            title="Clear site filter"
          >
            {activeSiteLabel}
            <X size={13} />
          </Link>
        </div>
      )}

      {error ? (
        <EmptyState
          title="Could not load submissions"
          description={
            error.message.includes("form_submissions")
              ? "The form_submissions table is missing — run supabase/migrations/0004_form_submissions.sql."
              : error.message
          }
        />
      ) : submissions.length === 0 ? (
        <EmptyState
          title={active.key === "new" ? "Nothing new" : "No submissions yet"}
          description={
            active.key === "new"
              ? "You're all caught up. New submissions land here the moment a site receives one."
              : "Once a client site posts a form or an order, it shows up here."
          }
        />
      ) : (
        <SubmissionList submissions={submissions} filterKey={active.key} />
      )}
    </div>
  );
}
