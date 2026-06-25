import "server-only";
import type { Vulnerability } from "@/lib/types";

// OSV.dev — free, no API key. Batch-queries package@version pairs for known
// vulnerabilities, then fetches details for each unique advisory.

interface OSVBatchResult {
  results: { vulns?: { id: string }[] }[];
}

interface OSVDetail {
  id: string;
  summary?: string;
  aliases?: string[];
  database_specific?: { severity?: string };
  severity?: { type: string; score: string }[];
}

function normalizeSeverity(d: OSVDetail): Vulnerability["severity"] {
  const raw = d.database_specific?.severity?.toLowerCase();
  if (raw === "critical") return "critical";
  if (raw === "high") return "high";
  if (raw === "moderate" || raw === "medium") return "moderate";
  if (raw === "low") return "low";
  // Fall back to CVSS score if present.
  const cvss = d.severity?.find((s) => s.type.startsWith("CVSS"));
  if (cvss) {
    const num = parseFloat(cvss.score.split("/")[0]) || 0;
    if (num >= 9) return "critical";
    if (num >= 7) return "high";
    if (num >= 4) return "moderate";
    if (num > 0) return "low";
  }
  return "unknown";
}

export async function findVulnerabilities(
  pkgs: { name: string; version: string }[]
): Promise<Vulnerability[]> {
  if (pkgs.length === 0) return [];

  const queries = pkgs.map((p) => ({
    package: { name: p.name, ecosystem: "npm" },
    version: p.version,
  }));

  let batch: OSVBatchResult;
  try {
    const res = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    batch = (await res.json()) as OSVBatchResult;
  } catch {
    return [];
  }

  // Map advisory id → affected package (first match wins).
  const idToPkg = new Map<string, { name: string; version: string }>();
  batch.results.forEach((r, i) => {
    (r.vulns ?? []).forEach((v) => {
      if (!idToPkg.has(v.id)) idToPkg.set(v.id, pkgs[i]);
    });
  });

  const ids = [...idToPkg.keys()].slice(0, 40); // cap detail fetches
  const details = await Promise.all(
    ids.map(async (id): Promise<Vulnerability | null> => {
      try {
        const res = await fetch(`https://api.osv.dev/v1/vulns/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) return null;
        const d = (await res.json()) as OSVDetail;
        const pkg = idToPkg.get(id)!;
        const ghsa = d.aliases?.find((a) => a.startsWith("GHSA")) ?? d.id;
        return {
          package: pkg.name,
          version: pkg.version,
          id: ghsa,
          summary: d.summary ?? "Known vulnerability",
          severity: normalizeSeverity(d),
          url: `https://osv.dev/vulnerability/${d.id}`,
        };
      } catch {
        return null;
      }
    })
  );

  const sevRank = {
    critical: 0,
    high: 1,
    moderate: 2,
    low: 3,
    unknown: 4,
  };
  return details
    .filter((v): v is Vulnerability => v !== null)
    .sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}
