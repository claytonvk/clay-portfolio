import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Audit,
  DependencyHealth,
  DepsReport,
  FrameworkFeatureUsage,
  Infra,
  LighthouseScores,
  Site,
  VercelReport,
  Vulnerability,
} from "@/lib/types";
import { getProjectReport, vercelConfigured } from "@/lib/integrations/vercel";
import { getLighthouse, pagespeedConfigured } from "@/lib/integrations/pagespeed";
import { getRepoInfo, githubConfigured } from "@/lib/integrations/github";
import { findOutdated, manifestVersions } from "@/lib/integrations/npm";
import { findVulnerabilities } from "@/lib/integrations/osv";
import { generateNarrative } from "@/lib/integrations/gemini";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function countBySeverity<T extends string>(
  items: T[],
  values: readonly T[]
): Record<T, number> {
  return values.reduce((acc, value) => {
    acc[value] = items.filter((item) => item === value).length;
    return acc;
  }, {} as Record<T, number>);
}

function vulnerabilityFeatureMultiplier(
  vulnerability: Vulnerability,
  features: FrameworkFeatureUsage | null | undefined
) {
  if (vulnerability.package !== "next" || !features) return 1;

  const text = `${vulnerability.summary} ${vulnerability.id}`.toLowerCase();
  const checks: [RegExp, boolean][] = [
    [/i18n/, features.i18nRouting],
    [/middleware|proxy/, features.middlewareOrProxy],
    [/image optim|image optimizer|next\/image/, features.imageOptimization],
    [/csp|nonce/, features.cspNonces],
    [/beforeinteractive/, features.beforeInteractiveScripts],
    [/websocket|upgrade/, features.websocketUpgrades],
    [/cache components|experimental cache/, features.experimentalCache],
  ];
  const matched = checks.find(([pattern]) => pattern.test(text));
  if (!matched) return 0.8;
  return matched[1] ? 1 : 0.4;
}

function dependencyHealth(
  deps: DepsReport | null,
  vercel: VercelReport | null
): DependencyHealth | null {
  if (!deps) return null;

  const vulnerabilities = deps.vulnerabilities ?? [];
  const outdated = deps.outdated ?? [];
  const outdatedByPackage = new Map(outdated.map((dep) => [dep.name, dep]));
  const advisoryCounts = countBySeverity(
    vulnerabilities.map((v) => v.severity),
    ["critical", "high", "moderate", "low", "unknown"] as const
  );
  const outdatedCounts = countBySeverity(
    outdated.map((dep) => dep.severity),
    ["major", "minor", "patch", "unknown"] as const
  );

  const securityRisk = vulnerabilities.reduce((risk, vulnerability) => {
    const matchingUpdate = outdatedByPackage.get(vulnerability.package);
    const safePatch =
      !matchingUpdate ||
      matchingUpdate.severity === "patch" ||
      matchingUpdate.severity === "minor";
    const majorMigrationRequired = matchingUpdate?.severity === "major";
    const featureMultiplier = vulnerabilityFeatureMultiplier(
      vulnerability,
      deps.frameworkFeatures
    );

    const base =
      vulnerability.severity === "critical"
        ? 18
        : vulnerability.severity === "high"
        ? 12
        : vulnerability.severity === "moderate"
        ? 5
        : vulnerability.severity === "low"
        ? 2
        : 3;
    const patchMultiplier = safePatch ? 1.15 : majorMigrationRequired ? 0.8 : 1;

    return risk + base * patchMultiplier * featureMultiplier;
  }, 0);

  const majorOutdated = outdated.filter((dep) => dep.severity === "major");
  const securityRelevant = new Set([
    "next",
    "react",
    "react-dom",
    "@supabase/supabase-js",
    "@supabase/ssr",
    "postcss",
    "typescript",
    "eslint",
  ]);
  const widelyBehind =
    deps.totalDeps > 0 && majorOutdated.length / deps.totalDeps >= 0.25;
  const securityRelevantMajors = majorOutdated.filter((dep) =>
    securityRelevant.has(dep.name)
  ).length;
  const majorDebt =
    widelyBehind || securityRelevantMajors > 0
      ? Math.min(12, majorOutdated.length * 1.5 + securityRelevantMajors)
      : Math.min(6, majorOutdated.length * 0.5);
  const maintenanceDebt =
    Math.min(3, outdatedCounts.patch * 0.25) +
    Math.min(6, outdatedCounts.minor * 0.75) +
    majorDebt +
    Math.min(2, outdatedCounts.unknown * 0.5);

  const productionBuildPassing =
    vercel?.latestDeployment?.state === "READY" && (vercel.recentErrors ?? 0) === 0;
  const auditClean = vulnerabilities.length === 0;
  const notes: string[] = [];
  if (auditClean) {
    notes.push("No unresolved advisories were found by the dependency scan.");
  }
  if (productionBuildPassing) {
    notes.push("The latest production deployment is passing.");
  }
  if (majorOutdated.length > 0 && vulnerabilities.length === 0) {
    notes.push("Major updates are counted as maintenance debt, not active security risk.");
  }
  if (deps.frameworkFeatures?.evidence.length) {
    notes.push(`Framework feature evidence: ${deps.frameworkFeatures.evidence.join(", ")}.`);
  }

  return {
    securityRisk: Math.min(45, securityRisk),
    maintenanceDebt: Math.min(18, maintenanceDebt),
    unresolvedAdvisories: {
      ...advisoryCounts,
      total: vulnerabilities.length,
    },
    outdated: outdatedCounts,
    auditClean,
    productionBuildPassing,
    notes,
  };
}

// Detects whether a site is fronted by Cloudflare via response headers.
async function detectInfra(url: string): Promise<Infra> {
  const check = (h: Headers): Infra => {
    const server = h.get("server");
    const cloudflare =
      h.has("cf-ray") ||
      h.has("cf-cache-status") ||
      (server ?? "").toLowerCase().includes("cloudflare");
    return { cloudflare, server };
  };
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    let infra = check(res.headers);
    // Some origins reject HEAD — retry with GET if nothing conclusive.
    if (!infra.cloudflare && !infra.server) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
      infra = check(res.headers);
    }
    return infra;
  } catch {
    return { cloudflare: false, server: null };
  }
}

// Transparent, interpretable health score (0–100).
export function computeHealth(
  vercel: VercelReport | null,
  lighthouse: LighthouseScores | null,
  deps: DepsReport | null
): number {
  let tech = 100;

  if (vercel?.latestDeployment?.state === "ERROR") tech -= 25;
  tech -= Math.min(20, (vercel?.recentErrors ?? 0) * 5);

  const depHealth = deps?.health ?? dependencyHealth(deps, vercel);
  if (depHealth) {
    tech -= depHealth.securityRisk;
    tech -= depHealth.maintenanceDebt;
    if (depHealth.auditClean && depHealth.productionBuildPassing) tech += 8;
    else if (depHealth.auditClean) tech += 5;
  }

  tech = clamp(tech);

  const perf = lighthouse?.performance;
  const seo = lighthouse?.seo;
  if (perf != null && seo != null) {
    return clamp(0.45 * tech + 0.35 * perf + 0.2 * seo);
  }
  if (perf != null) {
    return clamp(0.6 * tech + 0.4 * perf);
  }
  return tech;
}

export interface RunAuditResult {
  audit: Audit | null;
  raw: {
    vercel: VercelReport | null;
    lighthouse: LighthouseScores | null;
    deps: DepsReport | null;
    healthScore: number;
  };
}

// Runs every check for one site, computes health, writes an `audits` row.
export async function runAudit(
  supabase: SupabaseClient,
  site: Site,
  source: "manual" | "cron",
  options: { includeAi?: boolean } = {}
): Promise<RunAuditResult> {
  const includeAi = options.includeAi ?? true;
  // 1. Vercel
  let vercel: VercelReport | null = null;
  if (site.vercel_project_id && vercelConfigured()) {
    vercel = await getProjectReport(site.vercel_project_id);
  }

  // 2. Lighthouse / SEO
  let lighthouse: LighthouseScores | null = null;
  if (site.production_url && pagespeedConfigured()) {
    lighthouse = await getLighthouse(site.production_url);
  }

  // 3. Dependencies + vulnerabilities (via GitHub package.json)
  let deps: DepsReport | null = null;
  if (site.github_owner && site.github_repo && githubConfigured()) {
    const info = await getRepoInfo(site.github_owner, site.github_repo);
    if (info.manifest) {
      const [outdated, vulnerabilities] = await Promise.all([
        findOutdated(info.manifest),
        findVulnerabilities(manifestVersions(info.manifest)),
      ]);
      const baseDeps: DepsReport = {
        outdated,
        vulnerabilities,
        frameworkFeatures: info.frameworkFeatures ?? undefined,
        totalDeps:
          Object.keys(info.manifest.dependencies).length +
          Object.keys(info.manifest.devDependencies).length,
        lastCommit: info.lastCommit,
      };
      deps = {
        ...baseDeps,
        health: dependencyHealth(baseDeps, vercel) ?? undefined,
      };
    } else {
      deps = {
        outdated: [],
        vulnerabilities: [],
        totalDeps: 0,
        lastCommit: info.lastCommit,
        error: "Could not read package.json from the repo.",
      };
    }
  }

  // Infrastructure (Cloudflare, etc.)
  const infra: Infra | null = site.production_url
    ? await detectInfra(site.production_url)
    : null;

  const healthScore = computeHealth(vercel, lighthouse, deps);
  const vulnerabilities: Vulnerability[] = deps?.vulnerabilities ?? [];
  const needsAttention =
    healthScore < 70 ||
    vulnerabilities.some(
      (v) => v.severity === "critical" || v.severity === "high"
    ) ||
    vercel?.latestDeployment?.state === "ERROR";

  // 4. AI narrative (optional)
  const narrative = includeAi
    ? await generateNarrative({
        siteName: site.name,
        productionUrl: site.production_url,
        healthScore,
        lighthouse,
        deps,
        vulnerabilities,
        vercel,
      })
    : null;

  // 5. Persist
  const row = {
    site_id: site.id,
    source,
    health_score: healthScore,
    needs_attention: needsAttention,
    lighthouse,
    deps,
    vulnerabilities,
    vercel,
    infra,
    summary: narrative?.summary ?? null,
    recommendations: narrative?.recommendations ?? null,
  };

  const { data, error } = await supabase
    .from("audits")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;

  // 6. Trend snapshot (best-effort)
  await supabase.from("site_metrics").insert({
    site_id: site.id,
    health_score: healthScore,
    performance: lighthouse?.performance ?? null,
    seo: lighthouse?.seo ?? null,
  });

  return {
    audit: data as Audit,
    raw: { vercel, lighthouse, deps, healthScore },
  };
}
