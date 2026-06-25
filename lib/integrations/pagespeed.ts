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
  error?: {
    message?: string;
    status?: string;
  };
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

function emptyResult(fetchedAt: string, error?: string): LighthouseScores {
  return {
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
    lcp: null,
    cls: null,
    tbt: null,
    fetchedAt,
    error,
  };
}

// Runs Lighthouse via the PageSpeed Insights API (mobile strategy).
export async function getLighthouse(
  url: string
): Promise<LighthouseScores | null> {
  const fetchedAt = new Date().toISOString();
  if (!env.pagespeedKey || !url) return null;

  const qs = new URLSearchParams({
    url,
    key: env.pagespeedKey,
    strategy: "mobile",
  });
  ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"].forEach((c) =>
    qs.append("category", c)
  );

  let res: Response;
  let data: PSResponse | null = null;
  try {
    res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`,
      { cache: "no-store" }
    );
    data = (await res.json()) as PSResponse;
  } catch (error) {
    return emptyResult(
      fetchedAt,
      error instanceof Error
        ? `PageSpeed request failed: ${error.message}`
        : "PageSpeed request failed."
    );
  }

  if (!res.ok) {
    return emptyResult(
      fetchedAt,
      data?.error?.message
        ? `PageSpeed API error: ${data.error.message}`
        : `PageSpeed API returned HTTP ${res.status}.`
    );
  }

  const cats = data.lighthouseResult?.categories;
  const audits = data.lighthouseResult?.audits ?? {};
  const scores: LighthouseScores = {
    performance: pct(cats?.performance?.score),
    seo: pct(cats?.seo?.score),
    accessibility: pct(cats?.accessibility?.score),
    bestPractices: pct(cats?.["best-practices"]?.score),
    lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    tbt: audits["total-blocking-time"]?.numericValue ?? null,
    fetchedAt,
  };
  const hasData = [
    scores.performance,
    scores.seo,
    scores.accessibility,
    scores.bestPractices,
    scores.lcp,
    scores.cls,
    scores.tbt,
  ].some((value) => value != null);
  return hasData
    ? scores
    : emptyResult(
        fetchedAt,
        "PageSpeed returned no Lighthouse metrics for this URL."
      );
}
