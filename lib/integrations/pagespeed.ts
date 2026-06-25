import "server-only";
import { env } from "@/lib/env";
import type { LighthouseScores } from "@/lib/types";

export function pagespeedConfigured() {
  return Boolean(env.pagespeedKey);
}

interface PSCategory {
  score: number | null;
}
interface PSAudit {
  numericValue?: number;
}
interface PSResponse {
  lighthouseResult?: {
    categories?: {
      performance?: PSCategory;
      seo?: PSCategory;
      accessibility?: PSCategory;
      "best-practices"?: PSCategory;
    };
    audits?: Record<string, PSAudit>;
  };
}

const pct = (s: number | null | undefined) =>
  s == null ? null : Math.round(s * 100);

// Runs Lighthouse via the PageSpeed Insights API (mobile strategy).
export async function getLighthouse(
  url: string
): Promise<LighthouseScores> {
  const fetchedAt = new Date().toISOString();
  const empty: LighthouseScores = {
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
    lcp: null,
    cls: null,
    tbt: null,
    fetchedAt,
  };
  if (!env.pagespeedKey || !url) return empty;

  const qs = new URLSearchParams({
    url,
    key: env.pagespeedKey,
    strategy: "mobile",
  });
  ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"].forEach((c) =>
    qs.append("category", c)
  );

  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`,
    { cache: "no-store" }
  );
  if (!res.ok) return empty;

  const data = (await res.json()) as PSResponse;
  const cats = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits ?? {};
  return {
    performance: pct(cats?.performance?.score),
    seo: pct(cats?.seo?.score),
    accessibility: pct(cats?.accessibility?.score),
    bestPractices: pct(cats?.["best-practices"]?.score),
    lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbt: audits["total-blocking-time"]?.numericValue ?? null,
    fetchedAt,
  };
}
