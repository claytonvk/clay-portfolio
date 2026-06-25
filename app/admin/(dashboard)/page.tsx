import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { listSitesWithLatestAudit } from "@/lib/sites";
import SiteCard from "@/components/admin/SiteCard";
import { PageHeader, Stat, EmptyState } from "@/components/admin/ui";
import SyncButton from "@/components/admin/SyncButton";
import AuditAllButton from "@/components/admin/AuditAllButton";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  let sites = [] as Awaited<ReturnType<typeof listSitesWithLatestAudit>>;
  let loadError: string | null = null;
  try {
    sites = await listSitesWithLatestAudit();
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load sites from Supabase.";
  }

  const audited = sites.filter((s) => s.latest_audit);
  const needsAttention = sites.filter((s) => s.latest_audit?.needs_attention);
  const totalOutdated = audited.reduce(
    (n, s) => n + (s.latest_audit?.deps?.outdated?.length ?? 0),
    0
  );
  const totalVulns = audited.reduce(
    (n, s) => n + (s.latest_audit?.vulnerabilities?.length ?? 0),
    0
  );
  const performanceScores = audited
    .map((s) => s.latest_audit?.lighthouse?.performance)
    .filter((score): score is number => typeof score === "number");
  const avgPerf =
    performanceScores.length > 0
      ? Math.round(
          performanceScores.reduce((sum, score) => sum + score, 0) /
            performanceScores.length
        )
      : null;

  return (
    <div>
      <PageHeader
        title="Site Control"
        subtitle="Health, performance, and maintenance across all your client sites."
      >
        {sites.length > 0 && (
          <AuditAllButton siteIds={sites.map((s) => s.id)} />
        )}
        <SyncButton />
        <Link
          href="/admin/sites/new"
          className="inline-flex items-center gap-2 rounded-lg bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-ink/90 transition"
        >
          <PlusCircle size={16} />
          Add Site
        </Link>
      </PageHeader>

      {loadError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError} — make sure you&apos;ve run the SQL migration in Supabase
          (see <code>ADMIN_SETUP.md</code>).
        </div>
      )}

      {/* Totals strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat label="Sites" value={sites.length} />
        <Stat
          label="Needs attention"
          value={needsAttention.length}
          tone={needsAttention.length ? "warn" : "good"}
        />
        <Stat
          label="Outdated deps"
          value={totalOutdated}
          tone={totalOutdated ? "warn" : "good"}
        />
        <Stat
          label="Vulnerabilities"
          value={totalVulns}
          tone={totalVulns ? "bad" : "good"}
        />
        <Stat label="Avg performance" value={avgPerf ?? "—"} />
      </div>

      {sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="Sync your Vercel projects to import every site at once, or add one manually."
          action={{ href: "/admin/sites/new", label: "Add your first site" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}

      {sites.length > 0 && needsAttention.length === 0 && audited.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted flex items-center justify-center gap-2">
          <RefreshCw size={14} /> All audited sites are healthy.
        </p>
      )}
    </div>
  );
}
