"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Pencil,
  RefreshCw,
  Rocket,
  Globe,
  Package,
  ShieldAlert,
  Sparkles,
  Activity,
  GitCommit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Download,
} from "lucide-react";
import type { Audit, Site } from "@/lib/types";
import { screenshotUrl } from "@/lib/integrations/screenshot";
import HealthRing from "./HealthRing";
import SiteEditPanel from "./SiteEditPanel";
import { Badge, Card, scoreColor } from "./ui";

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function filenameSafe(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function scoreDrivers(audit: Audit) {
  const items: string[] = [];
  if (audit.vercel?.latestDeployment?.state === "ERROR") {
    items.push("Latest Vercel deployment is failing.");
  }
  if ((audit.vercel?.recentErrors ?? 0) > 0) {
    items.push(
      `${audit.vercel?.recentErrors} unresolved Vercel build error(s) after the latest successful production deploy.`
    );
  }
  if (!audit.lighthouse) {
    items.push("Lighthouse data is unknown; do not treat this as a failed score.");
  } else {
    const hasMetrics = [
      audit.lighthouse.performance,
      audit.lighthouse.seo,
      audit.lighthouse.accessibility,
      audit.lighthouse.bestPractices,
      audit.lighthouse.lcp,
      audit.lighthouse.cls,
      audit.lighthouse.tbt,
    ].some((value) => value != null);
    if (!hasMetrics) {
      items.push(
        audit.lighthouse.error ??
          "Lighthouse data is unknown; PageSpeed returned no metrics."
      );
    }
    if ((audit.lighthouse.performance ?? 100) < 80) {
      items.push(`Performance score is ${audit.lighthouse.performance}.`);
    }
    if ((audit.lighthouse.seo ?? 100) < 90) {
      items.push(`SEO score is ${audit.lighthouse.seo}.`);
    }
    if ((audit.lighthouse.accessibility ?? 100) < 90) {
      items.push(`Accessibility score is ${audit.lighthouse.accessibility}.`);
    }
    if ((audit.lighthouse.bestPractices ?? 100) < 90) {
      items.push(`Best Practices score is ${audit.lighthouse.bestPractices}.`);
    }
  }
  const depHealth = audit.deps?.health;
  if (depHealth) {
    if (depHealth.securityRisk > 0) {
      items.push(
        `Dependency security risk penalty is ${Math.round(
          depHealth.securityRisk
        )}; unresolved advisories: ${depHealth.unresolvedAdvisories.total}.`
      );
    }
    if (depHealth.maintenanceDebt > 0) {
      items.push(
        `Dependency maintenance debt penalty is ${Math.round(
          depHealth.maintenanceDebt
        )}; outdated packages: ${audit.deps?.outdated.length ?? 0}.`
      );
    }
  }
  const vulns = audit.vulnerabilities ?? audit.deps?.vulnerabilities ?? [];
  if (vulns.length > 0) {
    items.push(`${vulns.length} known dependency vulnerability finding(s).`);
  }
  return items.length > 0 ? items : ["No obvious score-lowering signals found in the captured audit data."];
}

function formatAuditForAgent(site: Site, audit: Audit, index: number) {
  const vulns = audit.vulnerabilities ?? audit.deps?.vulnerabilities ?? [];
  const outdated = audit.deps?.outdated ?? [];
  const recommendations = audit.recommendations ?? [];
  const lines = [
    `# Website Audit Fix Brief`,
    ``,
    `Site: ${site.name}`,
    `Client: ${site.client_name ?? "Unknown"}`,
    `Production URL: ${site.production_url ?? "Unknown"}`,
    `Audit ID: ${audit.id}`,
    `Audit Date: ${audit.run_at}`,
    `Audit Number In Export: ${index + 1}`,
    `Health Score: ${audit.health_score}/100`,
    `Needs Attention: ${audit.needs_attention ? "yes" : "no"}`,
    ``,
    `## Agent Instructions`,
    `You are fixing the codebase for this website. Prioritize changes that raise the health score without introducing risky rewrites. Treat missing Lighthouse data as unknown measurement data, not a defect. Prioritize unresolved security advisories, failing production builds, low Lighthouse scores, and concrete recommendations. Treat major dependency updates without active advisories as maintenance debt unless they are security-relevant or unsupported.`,
    ``,
    `## Score-Lowering Signals`,
    ...scoreDrivers(audit).map((item) => `- ${item}`),
    ``,
    `## AI Summary`,
    audit.summary ?? "No AI summary was generated for this audit.",
    ``,
    `## Recommendations`,
    ...(recommendations.length
      ? recommendations.map(
          (r, i) => `${i + 1}. [${r.priority}] ${r.title}: ${r.detail}`
        )
      : ["No AI recommendations were generated for this audit."]),
    ``,
    `## Lighthouse`,
    audit.lighthouse
      ? JSON.stringify(audit.lighthouse, null, 2)
      : "Unknown: no Lighthouse/PageSpeed data captured.",
    ``,
    `## Dependency Health`,
    audit.deps?.health
      ? JSON.stringify(audit.deps.health, null, 2)
      : "No dependency health summary captured.",
    ``,
    `## Vulnerabilities`,
    ...(vulns.length
      ? vulns.map(
          (v) =>
            `- [${v.severity}] ${v.package}@${v.version} ${v.id}: ${v.summary} (${v.url})`
        )
      : ["No known unresolved vulnerabilities captured."]),
    ``,
    `## Outdated Packages`,
    ...(outdated.length
      ? outdated.map(
          (d) =>
            `- [${d.severity}] ${d.name} (${d.type}): ${d.current} -> ${d.latest}`
        )
      : ["No outdated packages captured."]),
    ``,
    `## Deployment`,
    audit.vercel ? JSON.stringify(audit.vercel, null, 2) : "No deployment data captured.",
    ``,
    `## Infrastructure`,
    audit.infra ? JSON.stringify(audit.infra, null, 2) : "No infrastructure data captured.",
    ``,
    `## Raw Audit JSON`,
    JSON.stringify(audit, null, 2),
    ``,
  ];
  return lines.join("\n");
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "performance", label: "Performance & SEO", icon: Sparkles },
  { key: "dependencies", label: "Dependencies", icon: Package },
  { key: "deployments", label: "Deployments", icon: Rocket },
  { key: "domains", label: "Domains", icon: Globe },
  { key: "audit", label: "AI Audit", icon: Sparkles },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function Gauge({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <HealthRing score={score} size={72} stroke={6} />
      <span className="text-xs text-ink/70 text-center">{label}</span>
    </div>
  );
}

export default function SiteDetail({
  site,
  audits,
  geminiReady,
}: {
  site: Site;
  audits: Audit[];
  geminiReady: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [running, setRunning] = useState<"reload" | "full" | null>(null);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const latest = audits[0] ?? null;
  // Most recent audit that actually produced an AI summary (for fallback when
  // the latest run was rate-limited).
  const lastSummaryAudit = audits.find((x) => x.summary) ?? null;

  async function runAudit(includeAi: boolean) {
    const mode = includeAi ? "full" : "reload";
    setRunning(mode);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/sites/${site.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeAi }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Audit failed");
      else router.refresh();
    } catch {
      setErr("Audit failed");
    } finally {
      setRunning(null);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${site.name} from the dashboard?`)) return;
    await fetch(`/api/admin/sites/${site.id}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4 transition"
      >
        <ArrowLeft size={15} /> All sites
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <HealthRing score={latest?.health_score ?? null} size={72} />
          <div>
            <h1 className="font-vanguard text-3xl font-extrabold tracking-tight leading-none">
              {site.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {site.production_url && (
                <a
                  href={site.production_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted hover:text-ink inline-flex items-center gap-1"
                >
                  {site.production_url.replace(/^https?:\/\//, "")}
                  <ExternalLink size={12} />
                </a>
              )}
              {site.client_name && (
                <Badge tone="neutral">{site.client_name}</Badge>
              )}
              <Badge tone={site.status === "active" ? "good" : "neutral"}>
                {site.status}
              </Badge>
              {(site.cloudflare || latest?.infra?.cloudflare) && (
                <a
                  href="https://dash.cloudflare.com"
                  target="_blank"
                  rel="noreferrer"
                  title="Open Cloudflare dashboard"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium hover:opacity-80 transition"
                  style={{ backgroundColor: "#f6821f1a", color: "#c2670f" }}
                >
                  <Cloud size={12} /> Cloudflare
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium hover:bg-ink/[0.04] transition"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            onClick={() => runAudit(false)}
            disabled={running !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium hover:bg-ink/[0.04] transition disabled:opacity-60"
          >
            {running === "reload" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {running === "reload" ? "Reloading…" : "Reload info"}
          </button>
          <button
            onClick={() => runAudit(true)}
            disabled={running !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-ink text-cream px-4 py-2.5 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-60"
          >
            {running === "full" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {running === "full" ? "Auditing…" : "Run full audit"}
          </button>
        </div>
      </div>

      {editing && (
        <SiteEditPanel site={site} onClose={() => setEditing(false)} />
      )}

      {err && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {err}
        </div>
      )}
      {!latest && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          No audit yet. Click <strong>Reload info</strong> to gather health,
          performance, and dependency data, or <strong>Run full audit</strong>{" "}
          to include AI recommendations.
        </div>
      )}

      {/* Tabs */}
      <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-ink/10 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm border-b-2 -mb-px transition ${
              tab === key
                ? "border-accent text-ink font-medium"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          site={site}
          latest={latest}
          lastSummaryAudit={lastSummaryAudit}
        />
      )}
      {tab === "performance" && <PerformanceTab latest={latest} />}
      {tab === "dependencies" && <DependenciesTab latest={latest} />}
      {tab === "deployments" && <DeploymentsTab latest={latest} />}
      {tab === "domains" && <DomainsTab site={site} latest={latest} />}
      {tab === "audit" && (
        <AuditTab site={site} audits={audits} geminiReady={geminiReady} />
      )}

      {/* Footer / danger */}
      <div className="mt-12 pt-6 border-t border-ink/10 flex items-center justify-between">
        <p className="text-xs text-muted">
          Audited {audits.length} time{audits.length === 1 ? "" : "s"} · last{" "}
          {fmt(latest?.run_at)}
        </p>
        <button
          onClick={remove}
          className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition"
        >
          <Trash2 size={14} /> Remove site
        </button>
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────── */

function OverviewTab({
  site,
  latest,
  lastSummaryAudit,
}: {
  site: Site;
  latest: Audit | null;
  lastSummaryAudit: Audit | null;
}) {
  const preview = screenshotUrl(site.production_url, 800);
  const lh = latest?.lighthouse;
  const vulns = latest?.vulnerabilities?.length ?? 0;
  const outdated = latest?.deps?.outdated?.length ?? 0;
  const summaryAudit = latest?.summary ? latest : lastSummaryAudit;
  const summaryStale = summaryAudit != null && summaryAudit !== latest;
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {preview && (
          <Card className="!p-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`${site.name} preview`}
              className="w-full object-cover"
            />
          </Card>
        )}
        {summaryAudit?.summary && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-accent-dark" />
              <h3 className="font-vanguard text-lg font-bold">AI summary</h3>
              {summaryStale && (
                <span className="text-xs text-muted">
                  from {fmt(summaryAudit.run_at)}
                </span>
              )}
            </div>
            <p className="text-sm text-ink/80 leading-relaxed">
              {summaryAudit.summary}
            </p>
          </Card>
        )}
        {site.notes && (
          <Card>
            <div className="section-label mb-2">Notes</div>
            <p className="text-sm text-ink/80 whitespace-pre-wrap">
              {site.notes}
            </p>
          </Card>
        )}
      </div>
      <div className="space-y-3">
        <QuickStat label="Performance" value={lh?.performance} suffix="" />
        <QuickStat label="SEO" value={lh?.seo} suffix="" />
        <QuickStat label="Accessibility" value={lh?.accessibility} suffix="" />
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <div className="section-label">Outdated</div>
            <div
              className={`mt-1 font-vanguard text-2xl font-extrabold ${
                outdated ? "text-[#d8852f]" : "text-[#2f9e6f]"
              }`}
            >
              {latest ? outdated : "—"}
            </div>
          </Card>
          <Card className="!p-4">
            <div className="section-label">Vulns</div>
            <div
              className={`mt-1 font-vanguard text-2xl font-extrabold ${
                vulns ? "text-[#d24a3d]" : "text-[#2f9e6f]"
              }`}
            >
              {latest ? vulns : "—"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
}: {
  label: string;
  value?: number | null;
  suffix?: string;
}) {
  return (
    <Card className="!p-4 flex items-center justify-between">
      <span className="text-sm text-ink/70">{label}</span>
      <span
        className="font-vanguard text-2xl font-extrabold"
        style={{ color: scoreColor(value ?? null) }}
      >
        {value ?? "—"}
      </span>
    </Card>
  );
}

function PerformanceTab({ latest }: { latest: Audit | null }) {
  const lh = latest?.lighthouse;
  if (!lh)
    return (
      <Empty text="Performance is unknown because no Lighthouse data has been captured yet. Add a PageSpeed key or run Lighthouse externally; this is not scored as a failure." />
    );
  const hasMetrics = [
    lh.performance,
    lh.seo,
    lh.accessibility,
    lh.bestPractices,
    lh.lcp,
    lh.cls,
    lh.tbt,
  ].some((value) => value != null);
  if (!hasMetrics) {
    return (
      <Empty
        text={
          lh.error ??
          "Performance is unknown because PageSpeed did not return Lighthouse metrics for this audit."
        }
      />
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap justify-around gap-6">
          <Gauge label="Performance" score={lh.performance} />
          <Gauge label="SEO" score={lh.seo} />
          <Gauge label="Accessibility" score={lh.accessibility} />
          <Gauge label="Best Practices" score={lh.bestPractices} />
        </div>
      </Card>
      <div className="grid sm:grid-cols-3 gap-4">
        <CwvCard label="LCP" value={lh.lcp} unit="ms" good={2500} poor={4000} />
        <CwvCard label="CLS" value={lh.cls} unit="" good={0.1} poor={0.25} />
        <CwvCard label="TBT" value={lh.tbt} unit="ms" good={200} poor={600} />
      </div>
      <p className="text-xs text-muted">Lab data via PageSpeed Insights (mobile). Captured {fmt(lh.fetchedAt)}.</p>
    </div>
  );
}

function CwvCard({
  label,
  value,
  unit,
  good,
  poor,
}: {
  label: string;
  value: number | null;
  unit: string;
  good: number;
  poor: number;
}) {
  const color =
    value == null
      ? "#888"
      : value <= good
      ? "#2f9e6f"
      : value <= poor
      ? "#d8852f"
      : "#d24a3d";
  const display =
    value == null
      ? "—"
      : unit === "ms"
      ? `${(value / 1000).toFixed(2)}s`
      : value.toFixed(3);
  return (
    <Card className="!p-4">
      <div className="section-label">{label}</div>
      <div
        className="mt-1 font-vanguard text-2xl font-extrabold"
        style={{ color }}
      >
        {display}
      </div>
    </Card>
  );
}

function DependenciesTab({ latest }: { latest: Audit | null }) {
  const deps = latest?.deps;
  if (!deps)
    return (
      <Empty text="No dependency data yet. Add a GitHub owner/repo and run an audit." />
    );
  const vulns = latest?.vulnerabilities ?? deps.vulnerabilities ?? [];
  return (
    <div className="space-y-6">
      {deps.error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {deps.error}
        </div>
      )}
      {deps.lastCommit && (
        <Card className="!p-4 flex items-center gap-3 text-sm">
          <GitCommit size={16} className="text-muted" />
          <span className="font-mono text-xs text-accent-dark">
            {deps.lastCommit.sha}
          </span>
          <span className="truncate flex-1">{deps.lastCommit.message}</span>
          <span className="text-muted text-xs whitespace-nowrap">
            {fmt(deps.lastCommit.date)}
          </span>
        </Card>
      )}
      {deps.health && (
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="!p-4">
            <div className="section-label">Security Risk</div>
            <div
              className="mt-1 font-vanguard text-2xl font-extrabold"
              style={{
                color:
                  deps.health.securityRisk >= 18
                    ? "#b42318"
                    : deps.health.securityRisk >= 8
                    ? "#d8852f"
                    : "#2f9e6f",
              }}
            >
              {Math.round(deps.health.securityRisk)}
            </div>
            <p className="mt-1 text-xs text-muted">
              {deps.health.unresolvedAdvisories.total} unresolved advisories
            </p>
          </Card>
          <Card className="!p-4">
            <div className="section-label">Maintenance Debt</div>
            <div
              className="mt-1 font-vanguard text-2xl font-extrabold"
              style={{
                color:
                  deps.health.maintenanceDebt >= 10
                    ? "#d8852f"
                    : deps.health.maintenanceDebt >= 4
                    ? "#c8a96e"
                    : "#2f9e6f",
              }}
            >
              {Math.round(deps.health.maintenanceDebt)}
            </div>
            <p className="mt-1 text-xs text-muted">
              {deps.health.outdated.major} major, {deps.health.outdated.minor}{" "}
              minor, {deps.health.outdated.patch} patch
            </p>
          </Card>
          <Card className="!p-4">
            <div className="section-label">Signals</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={deps.health.auditClean ? "good" : "bad"}>
                {deps.health.auditClean ? "audit clean" : "audit findings"}
              </Badge>
              <Badge
                tone={deps.health.productionBuildPassing ? "good" : "neutral"}
              >
                {deps.health.productionBuildPassing ? "build passing" : "build unknown"}
              </Badge>
            </div>
            {deps.frameworkFeatures?.evidence.length ? (
              <p className="mt-2 text-xs text-muted">
                {deps.frameworkFeatures.evidence.join(", ")}
              </p>
            ) : null}
          </Card>
        </div>
      )}

      {/* Vulnerabilities */}
      <div>
        <h3 className="font-vanguard text-lg font-bold mb-2 flex items-center gap-2">
          <ShieldAlert size={16} /> Vulnerabilities ({vulns.length})
        </h3>
        {vulns.length === 0 ? (
          <Card className="!p-4 text-sm text-[#247a55] flex items-center gap-2">
            <CheckCircle2 size={16} /> No known vulnerabilities.
          </Card>
        ) : (
          <Card className="!p-0 divide-y divide-ink/10">
            {vulns.map((v) => (
              <a
                key={v.id + v.package}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3.5 hover:bg-ink/[0.02] transition"
              >
                <Badge
                  tone={
                    v.severity === "critical" || v.severity === "high"
                      ? "bad"
                      : v.severity === "moderate"
                      ? "warn"
                      : "neutral"
                  }
                >
                  {v.severity}
                </Badge>
                <span className="font-mono text-xs">{v.package}</span>
                <span className="text-sm text-ink/70 truncate flex-1">
                  {v.summary}
                </span>
                <ExternalLink size={13} className="text-muted shrink-0" />
              </a>
            ))}
          </Card>
        )}
      </div>

      {/* Outdated */}
      <div>
        <h3 className="font-vanguard text-lg font-bold mb-2 flex items-center gap-2">
          <Package size={16} /> Outdated packages ({deps.outdated.length} of{" "}
          {deps.totalDeps})
        </h3>
        {deps.outdated.length === 0 ? (
          <Card className="!p-4 text-sm text-[#247a55] flex items-center gap-2">
            <CheckCircle2 size={16} /> Everything is up to date.
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-ink/10">
                  <th className="px-4 py-2.5 font-medium">Package</th>
                  <th className="px-4 py-2.5 font-medium">Current</th>
                  <th className="px-4 py-2.5 font-medium">Latest</th>
                  <th className="px-4 py-2.5 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {deps.outdated.map((d) => (
                  <tr key={d.name}>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {d.name}
                      {d.type === "devDependencies" && (
                        <span className="text-muted ml-1.5">(dev)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{d.current}</td>
                    <td className="px-4 py-2.5">{d.latest}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        tone={
                          d.severity === "major"
                            ? "bad"
                            : d.severity === "minor"
                            ? "warn"
                            : "neutral"
                        }
                      >
                        {d.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function DeploymentsTab({ latest }: { latest: Audit | null }) {
  const deps = latest?.vercel;
  if (!deps?.deployments?.length)
    return <Empty text="No deployment data. Link a Vercel project and run an audit." />;
  return (
    <Card className="!p-0 divide-y divide-ink/10">
      {deps.deployments.map((d) => (
        <div key={d.uid} className="flex items-center gap-3 p-3.5">
          <Badge
            tone={
              d.state === "READY"
                ? "good"
                : d.state === "ERROR"
                ? "bad"
                : "warn"
            }
          >
            {d.state}
          </Badge>
          <span className="text-sm truncate flex-1">
            {d.commitMessage || d.url.replace(/^https?:\/\//, "")}
          </span>
          {d.target === "production" && <Badge tone="accent">prod</Badge>}
          <span className="text-xs text-muted whitespace-nowrap">
            {fmt(new Date(d.createdAt).toISOString())}
          </span>
          <a href={d.url} target="_blank" rel="noreferrer">
            <ExternalLink size={13} className="text-muted" />
          </a>
        </div>
      ))}
    </Card>
  );
}

function DomainsTab({ site, latest }: { site: Site; latest: Audit | null }) {
  const domains = latest?.vercel?.domains ?? [];
  const extras = site.custom_domains ?? [];
  return (
    <div className="space-y-4">
      {site.production_url && (
        <Card className="!p-4 flex items-center gap-3">
          <Globe size={16} className="text-accent-dark" />
          <a
            href={site.production_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm flex-1 hover:underline"
          >
            {site.production_url.replace(/^https?:\/\//, "")}
          </a>
          <Badge tone="accent">primary</Badge>
        </Card>
      )}
      {domains.map((d) => (
        <Card key={d.name} className="!p-4 flex items-center gap-3">
          <Globe size={16} className="text-muted" />
          <span className="text-sm flex-1">{d.name}</span>
          {d.redirect && (
            <span className="text-xs text-muted">→ {d.redirect}</span>
          )}
          <Badge tone={d.verified ? "good" : "warn"}>
            {d.verified ? "verified" : "pending"}
          </Badge>
        </Card>
      ))}
      {extras.map((d) => (
        <Card key={d} className="!p-4 flex items-center gap-3">
          <Globe size={16} className="text-muted" />
          <span className="text-sm flex-1">{d}</span>
          <Badge tone="neutral">manual</Badge>
        </Card>
      ))}
      {domains.length === 0 && extras.length === 0 && !site.production_url && (
        <Empty text="No domains found. Link a Vercel project to list domains." />
      )}
    </div>
  );
}

function AuditTab({
  site,
  audits,
  geminiReady,
}: {
  site: Site;
  audits: Audit[];
  geminiReady: boolean;
}) {
  const [selected, setSelected] = useState(0);
  if (audits.length === 0)
    return <Empty text="No audits yet. Run your first audit above." />;
  const a = audits[selected];
  // Fall back to the most recent prior summary if this run was rate-limited.
  const summaryAudit = a.summary
    ? a
    : audits.slice(selected).find((x) => x.summary) ?? null;
  const stale = summaryAudit != null && summaryAudit !== a;
  const baseName = filenameSafe(site.slug || site.name || "site");
  const selectedDate = a.run_at.slice(0, 10);
  const downloadSelected = () => {
    downloadTextFile(
      `${baseName}-audit-${selectedDate}.txt`,
      formatAuditForAgent(site, a, selected)
    );
  };
  const downloadAll = () => {
    downloadTextFile(
      `${baseName}-all-audits.txt`,
      audits
        .map((audit, index) => formatAuditForAgent(site, audit, index))
        .join("\n\n---\n\n")
    );
  };
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-dark" />
              <h3 className="font-vanguard text-lg font-bold">Health report</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadSelected}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.03] transition"
              >
                <Download size={13} />
                Download audit
              </button>
              <button
                onClick={downloadAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.03] transition"
              >
                <Download size={13} />
                All audits
              </button>
              <Badge tone={a.needs_attention ? "warn" : "good"}>
                {a.needs_attention ? "Needs attention" : "Healthy"}
              </Badge>
            </div>
          </div>
          {summaryAudit?.summary ? (
            <>
              {stale && (
                <p className="mb-2 text-xs text-muted">
                  This run didn&apos;t generate a summary (rate-limited) —
                  showing the last one, from {fmt(summaryAudit.run_at)}.
                </p>
              )}
              <p className="text-sm text-ink/80 leading-relaxed">
                {summaryAudit.summary}
              </p>
            </>
          ) : geminiReady ? (
            <p className="text-sm text-muted">
              No AI summary yet — Gemini was likely rate-limited (free tier).
              Re-run the audit in a minute; all findings are in the data tabs
              regardless.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Add a Gemini key to get AI-written summaries. The data tabs still
              show all findings.
            </p>
          )}
        </Card>

        {summaryAudit?.recommendations &&
          summaryAudit.recommendations.length > 0 && (
          <Card>
            <h3 className="font-vanguard text-lg font-bold mb-3">
              Recommendations
            </h3>
            <ul className="space-y-3">
              {summaryAudit.recommendations.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5">
                    {r.priority === "high" ? (
                      <AlertTriangle size={16} className="text-[#d24a3d]" />
                    ) : r.priority === "medium" ? (
                      <AlertTriangle size={16} className="text-[#d8852f]" />
                    ) : (
                      <CheckCircle2 size={16} className="text-muted" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-ink/60">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* History */}
      <div>
        <div className="section-label mb-2">History</div>
        <div className="space-y-1.5">
          {audits.map((au, i) => (
            <button
              key={au.id}
              onClick={() => setSelected(i)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                i === selected ? "bg-white border border-ink/15" : "hover:bg-ink/[0.04]"
              }`}
            >
              <span
                className="font-vanguard font-extrabold text-lg w-8"
                style={{ color: scoreColor(au.health_score) }}
              >
                {au.health_score}
              </span>
              <span className="text-xs text-ink/70 flex-1">
                {fmt(au.run_at)}
              </span>
              <Badge tone="neutral">{au.source}</Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center text-sm text-muted">
      {text}
    </div>
  );
}
