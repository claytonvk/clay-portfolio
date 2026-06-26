import "server-only";
import { env } from "@/lib/env";
import type {
  AuditRecommendation,
  DepsReport,
  LighthouseScores,
  VercelReport,
  Vulnerability,
} from "@/lib/types";

export function geminiConfigured() {
  return Boolean(env.geminiKey);
}

// Current-gen, available on the free tier. Override with GEMINI_MODEL if a
// model's daily free quota is exhausted (quotas are per-model).
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

export interface NarrativeInput {
  siteName: string;
  productionUrl: string | null;
  healthScore: number;
  lighthouse: LighthouseScores | null;
  deps: DepsReport | null;
  vulnerabilities: Vulnerability[];
  vercel: VercelReport | null;
}

export interface Narrative {
  summary: string;
  recommendations: AuditRecommendation[];
}

function buildPrompt(input: NarrativeInput): string {
  const hasLighthouseScores =
    input.lighthouse != null &&
    [
      input.lighthouse.performance,
      input.lighthouse.seo,
      input.lighthouse.accessibility,
      input.lighthouse.bestPractices,
    ].some((score) => score != null);
  const facts = {
    site: input.siteName,
    url: input.productionUrl,
    healthScore: input.healthScore,
    lighthouseStatus: hasLighthouseScores ? "captured" : "unknown",
    lighthouse: input.lighthouse && {
      performance: input.lighthouse.performance,
      seo: input.lighthouse.seo,
      accessibility: input.lighthouse.accessibility,
      bestPractices: input.lighthouse.bestPractices,
      lcpMs: input.lighthouse.lcp,
      cls: input.lighthouse.cls,
    },
    deployment: input.vercel?.latestDeployment?.state ?? "unknown",
    unresolvedBuildErrorsSinceLatestReadyProduction:
      input.vercel?.recentErrors ?? 0,
    dependencyHealth: input.deps?.health && {
      securityRisk: input.deps.health.securityRisk,
      maintenanceDebt: input.deps.health.maintenanceDebt,
      auditClean: input.deps.health.auditClean,
      productionBuildPassing: input.deps.health.productionBuildPassing,
      frameworkFeatures: input.deps.frameworkFeatures,
    },
    outdatedCount: input.deps?.outdated?.length ?? 0,
    // Keep the prompt small to stay within the free-tier input-token quota:
    // majors matter most, so prioritize them and cap the list.
    outdatedPackages: (input.deps?.outdated ?? [])
      .slice()
      .sort((a, b) => (a.severity === "major" ? -1 : 1))
      .slice(0, 12)
      .map((d) => ({ name: d.name, bump: d.severity })),
    vulnerabilities: input.vulnerabilities.slice(0, 12).map((v) => ({
      package: v.package,
      severity: v.severity,
    })),
  };

  return `You are a senior web-maintenance engineer reviewing a client website for a freelance developer who offers ongoing maintenance. Based ONLY on the data below, write a concise health report.

DATA:
${JSON.stringify(facts, null, 2)}

Respond with JSON matching exactly this shape:
{
  "summary": "2-4 sentences in plain English for the developer: overall health, the single most important thing to address, and anything reassuring. No fluff.",
  "recommendations": [
    { "priority": "high" | "medium" | "low", "title": "short action", "detail": "one sentence on what and why" }
  ]
}

Rules: 3-6 recommendations, ordered most important first. Prioritize unresolved critical/high advisories with available patch and the latest production deployment being broken as high. Do not call the production build failing when deployment is READY and unresolvedBuildErrorsSinceLatestReadyProduction is 0, even if older failed deployments exist in history. Moderate framework advisories tied to unused features should be lower priority. Treat major version bumps without active advisories as maintenance debt, not security risk. If lighthouseStatus is "unknown", treat performance as missing/unknown data, not a poor score or major negative; at most recommend connecting PageSpeed Insights or running Lighthouse as a low-priority measurement task. If dependencyHealth.auditClean and productionBuildPassing are true, explicitly reassure that the security posture has recovered even if non-security major upgrades remain. Be specific (name packages/scores). If everything is healthy, say so and keep recommendations light.`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Reads Google's suggested retry delay from a 429/503 body (e.g. "retryDelay":
// "37s"). Falls back to 45s. Capped so a single audit can't hang too long.
async function retryWaitMs(res: Response): Promise<number> {
  let seconds = 45;
  try {
    const text = await res.text();
    const m = text.match(/"retryDelay":\s*"(\d+)(?:\.\d+)?s"/);
    if (m) seconds = parseInt(m[1], 10);
  } catch {
    /* ignore */
  }
  return Math.min(seconds + 2, 62) * 1000;
}

// Tolerant JSON parse: strips markdown fences and, if needed, extracts the
// outermost { … } so an occasional stray character doesn't drop the summary.
function safeParse(text: string): Narrative | null {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Narrative;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Narrative;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateNarrative(
  input: NarrativeInput
): Promise<Narrative | null> {
  if (!env.geminiKey) return null;

  try {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(input) }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    async function tryModel(model: string): Promise<Narrative | null> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiKey}`;

      // On a free-tier rate-limit / overload, wait the window Google reports
      // (typically ~a minute) and retry once before falling back.
      const MAX_ATTEMPTS = 2;
      let res: Response | null = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body,
        });
        if (res.status !== 429 && res.status !== 503) break;
        if (attempt === MAX_ATTEMPTS) break;
        await sleep(await retryWaitMs(res));
      }
      if (!res || !res.ok) return null;
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      const parsed = safeParse(text);
      if (!parsed) return null;
      return {
        summary: parsed.summary ?? "",
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.slice(0, 8)
          : [],
      };
    }

    const models = Array.from(new Set([MODEL, FALLBACK_MODEL]));
    for (const model of models) {
      const narrative = await tryModel(model);
      if (narrative) return narrative;
    }
    return null;
  } catch {
    return null;
  }
}
