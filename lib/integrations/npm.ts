import "server-only";
import semver from "semver";
import type { OutdatedDep } from "@/lib/types";
import type { PackageManifest } from "./github";

const REGISTRY = "https://registry.npmjs.org";

async function latestVersion(pkg: string): Promise<string | null> {
  try {
    const res = await fetch(`${REGISTRY}/${encodeURIComponent(pkg)}/latest`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

// Run an array of async thunks with a concurrency cap.
async function pooled<T>(
  items: (() => Promise<T>)[],
  concurrency = 8
): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await items[idx]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

function classify(current: string, latest: string): OutdatedDep["severity"] {
  const c = semver.coerce(current);
  const l = semver.coerce(latest);
  if (!c || !l) return "unknown";
  const diff = semver.diff(c, l);
  if (diff === "major" || diff === "premajor") return "major";
  if (diff === "minor" || diff === "preminor") return "minor";
  if (diff === "patch" || diff === "prepatch") return "patch";
  return "unknown";
}

// Compares each dependency against the npm registry's latest release.
export async function findOutdated(
  manifest: PackageManifest
): Promise<OutdatedDep[]> {
  const entries: {
    name: string;
    range: string;
    type: OutdatedDep["type"];
  }[] = [
    ...Object.entries(manifest.dependencies).map(([name, range]) => ({
      name,
      range,
      type: "dependencies" as const,
    })),
    ...Object.entries(manifest.devDependencies).map(([name, range]) => ({
      name,
      range,
      type: "devDependencies" as const,
    })),
  ].filter((e) => !e.range.startsWith("workspace:") && !e.range.includes("://"));

  const checks = entries.map((e) => async (): Promise<OutdatedDep | null> => {
    const latest = await latestVersion(e.name);
    const current = semver.coerce(e.range)?.version ?? e.range;
    if (!latest) return null;
    const c = semver.coerce(current);
    const l = semver.coerce(latest);
    if (c && l && semver.gte(c, l)) return null; // up to date
    return {
      name: e.name,
      current,
      latest,
      type: e.type,
      severity: classify(current, latest),
    };
  });

  const results = await pooled(checks);
  return results
    .filter((r): r is OutdatedDep => r !== null)
    .sort((a, b) => {
      const rank = { major: 0, minor: 1, patch: 2, unknown: 3 };
      return rank[a.severity] - rank[b.severity];
    });
}

// Flat "name@version" list for the OSV vulnerability query.
export function manifestVersions(
  manifest: PackageManifest
): { name: string; version: string }[] {
  return [
    ...Object.entries(manifest.dependencies),
    ...Object.entries(manifest.devDependencies),
  ]
    .map(([name, range]) => ({
      name,
      version: semver.coerce(range)?.version ?? "",
    }))
    .filter((e) => e.version);
}
