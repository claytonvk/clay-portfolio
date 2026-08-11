import Link from "next/link";
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

  const sites = Array.from(
    new Map(
      submissions.map((s) => [s.site_slug, s.site_label || s.site_slug])
    ).entries()
  );

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

        {sites.length > 1 && (
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href={`/admin/submissions?filter=${active.key}`}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                !site ? "bg-ink/10" : "border border-ink/15 hover:bg-ink/[0.04]"
              }`}
            >
              All sites
            </Link>
            {sites.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/admin/submissions?filter=${active.key}&site=${slug}`}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  site === slug
                    ? "bg-ink/10"
                    : "border border-ink/15 hover:bg-ink/[0.04]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

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
        <SubmissionList submissions={submissions} />
      )}
    </div>
  );
}
