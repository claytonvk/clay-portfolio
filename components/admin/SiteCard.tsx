import Link from "next/link";
import {
  ExternalLink,
  Package,
  ShieldAlert,
  Rocket,
  Clock,
  Cloud,
} from "lucide-react";
import type { SiteWithAudit } from "@/lib/types";
import { screenshotUrl } from "@/lib/integrations/screenshot";
import HealthRing from "./HealthRing";
import { Badge } from "./ui";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function deployTone(state?: string) {
  switch (state) {
    case "READY":
      return { tone: "good" as const, label: "Live" };
    case "ERROR":
      return { tone: "bad" as const, label: "Build failed" };
    case "BUILDING":
    case "QUEUED":
      return { tone: "warn" as const, label: "Building" };
    case "CANCELED":
      return { tone: "neutral" as const, label: "Canceled" };
    default:
      return { tone: "neutral" as const, label: "Unknown" };
  }
}

export default function SiteCard({ site }: { site: SiteWithAudit }) {
  const audit = site.latest_audit;
  const preview = screenshotUrl(site.production_url);
  const deploy = deployTone(audit?.vercel?.latestDeployment?.state);
  const outdated = audit?.deps?.outdated?.length ?? 0;
  const vulns = audit?.vulnerabilities?.length ?? 0;
  const cloudflare = site.cloudflare || (audit?.infra?.cloudflare ?? false);

  return (
    <Link
      href={`/admin/sites/${site.id}`}
      className="group block rounded-2xl border border-ink/10 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-ink/20 transition"
    >
      {/* Preview */}
      <div className="relative aspect-[16/10] bg-cream-dark overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={`${site.name} preview`}
            loading="lazy"
            className="h-full w-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted text-sm">
            No preview
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge tone={deploy.tone}>
            <Rocket size={11} />
            {deploy.label}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {cloudflare && (
            <span
              title="Behind Cloudflare"
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium shadow-sm"
              style={{ color: "#f6821f" }}
            >
              <Cloud size={12} /> Cloudflare
            </span>
          )}
          {site.status !== "active" && (
            <Badge tone="neutral">{site.status}</Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-vanguard text-lg font-bold leading-tight truncate">
            {site.name}
          </h3>
          {site.production_url && (
            <p className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
              {site.production_url.replace(/^https?:\/\//, "")}
              <ExternalLink size={11} className="shrink-0" />
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vulns > 0 && (
              <Badge tone="bad">
                <ShieldAlert size={11} />
                {vulns} vuln{vulns > 1 ? "s" : ""}
              </Badge>
            )}
            {outdated > 0 && (
              <Badge tone={outdated > 5 ? "warn" : "neutral"}>
                <Package size={11} />
                {outdated} outdated
              </Badge>
            )}
            {audit?.needs_attention && vulns === 0 && outdated === 0 && (
              <Badge tone="warn">Needs attention</Badge>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted flex items-center gap-1">
            <Clock size={11} />
            Audited {timeAgo(audit?.run_at)}
          </p>
        </div>
        <HealthRing score={audit?.health_score ?? null} size={56} stroke={5} />
      </div>
    </Link>
  );
}
