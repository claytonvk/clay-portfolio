import { CheckCircle2, XCircle } from "lucide-react";
import { env, integrationStatus } from "@/lib/env";
import { PageHeader, Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const LABELS: Record<string, { name: string; detail: string }> = {
  supabase: { name: "Supabase", detail: "Database + authentication" },
  vercel: { name: "Vercel", detail: "Deployments, domains, errors" },
  pagespeed: { name: "PageSpeed Insights", detail: "Lighthouse performance & SEO" },
  github: { name: "GitHub", detail: "Dependencies & repo activity" },
  gemini: { name: "Google Gemini", detail: "AI-written audit summaries" },
  resend: { name: "Resend", detail: "Weekly audit email" },
};

export default function SettingsPage() {
  const status = integrationStatus();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Integration status and dashboard configuration."
      />

      <h3 className="section-label mb-3">Integrations</h3>
      <div className="space-y-3 mb-10">
        {Object.entries(LABELS).map(([key, { name, detail }]) => {
          const on = status[key as keyof typeof status];
          return (
            <Card
              key={key}
              className="!p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted">{detail}</p>
              </div>
              {on ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-[#247a55]">
                  <CheckCircle2 size={16} /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <XCircle size={16} /> Not connected
                </span>
              )}
            </Card>
          );
        })}
      </div>

      <h3 className="section-label mb-3">Configuration</h3>
      <Card className="space-y-3 text-sm">
        <Row label="Vercel team" value={env.vercelTeamId || "—"} />
        <Row label="Audit recipient" value={env.auditEmailTo || "Not set"} />
        <Row label="Email sender" value={env.auditEmailFrom} />
        <Row
          label="Weekly cron"
          value={env.cronSecret ? "Armed (Mondays 14:00 UTC)" : "Secret not set"}
        />
      </Card>

      <p className="mt-6 text-xs text-muted">
        Keys live in environment variables. To connect an integration, add its
        key to <code>.env.local</code> (local) or the Vercel project&apos;s
        environment variables (production), then redeploy. See{" "}
        <code>ADMIN_SETUP.md</code>.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink/70">{label}</span>
      <span className="font-mono text-xs text-ink/90 truncate">{value}</span>
    </div>
  );
}
