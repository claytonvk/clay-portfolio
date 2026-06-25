import "server-only";
import { env } from "@/lib/env";
import type {
  VercelDeployment,
  VercelDomain,
  VercelReport,
} from "@/lib/types";

const API = "https://api.vercel.com";

export function vercelConfigured() {
  return Boolean(env.vercelToken);
}

function team(qs: URLSearchParams) {
  if (env.vercelTeamId) qs.set("teamId", env.vercelTeamId);
  return qs;
}

async function vfetch<T>(path: string, qs?: URLSearchParams): Promise<T> {
  if (!env.vercelToken) throw new Error("Vercel not configured");
  const query = team(qs ?? new URLSearchParams());
  const url = `${API}${path}${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.vercelToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface VercelProjectSummary {
  id: string;
  name: string;
  framework: string | null;
  productionUrl: string | null;
  githubOwner: string | null;
  githubRepo: string | null;
  updatedAt: number | null;
}

interface RawProject {
  id: string;
  name: string;
  framework?: string | null;
  updatedAt?: number;
  targets?: {
    production?: { alias?: string[]; url?: string } | null;
  };
  latestDeployments?: { url?: string }[];
  link?: {
    type?: string;
    org?: string;
    owner?: string;
    repo?: string;
  } | null;
}

// Extract a GitHub owner/repo from a Vercel project's connected Git repo.
function githubFromLink(
  link: RawProject["link"]
): { owner: string; repo: string } | null {
  if (!link || link.type !== "github" || !link.repo) return null;
  const owner = link.org || link.owner;
  if (!owner) return null;
  return { owner, repo: link.repo };
}

function productionUrlFromProject(p: RawProject): string | null {
  const alias = p.targets?.production?.alias;
  if (alias && alias.length) {
    // Prefer a custom (non-vercel.app) domain when one exists.
    const custom = alias.find((a) => !a.endsWith(".vercel.app"));
    return `https://${custom ?? alias[0]}`;
  }
  const url = p.targets?.production?.url || p.latestDeployments?.[0]?.url;
  return url ? `https://${url}` : null;
}

export async function listProjects(): Promise<VercelProjectSummary[]> {
  const data = await vfetch<{ projects: RawProject[] }>("/v9/projects");
  return data.projects.map((p) => {
    const gh = githubFromLink(p.link);
    return {
      id: p.id,
      name: p.name,
      framework: p.framework ?? null,
      productionUrl: productionUrlFromProject(p),
      githubOwner: gh?.owner ?? null,
      githubRepo: gh?.repo ?? null,
      updatedAt: p.updatedAt ?? null,
    };
  });
}

interface RawDeployment {
  uid: string;
  state?: string;
  readyState?: string;
  url: string;
  created: number;
  target?: string | null;
  meta?: {
    githubCommitMessage?: string;
    githubCommitSha?: string;
  };
}

function mapDeployment(d: RawDeployment): VercelDeployment {
  return {
    uid: d.uid,
    state: d.state || d.readyState || "UNKNOWN",
    url: `https://${d.url}`,
    createdAt: d.created,
    target: d.target ?? null,
    commitMessage: d.meta?.githubCommitMessage ?? null,
    commitSha: d.meta?.githubCommitSha ?? null,
  };
}

export async function getDeployments(
  projectId: string,
  limit = 10
): Promise<VercelDeployment[]> {
  const qs = new URLSearchParams({ projectId, limit: String(limit) });
  const data = await vfetch<{ deployments: RawDeployment[] }>(
    "/v6/deployments",
    qs
  );
  return (data.deployments ?? []).map(mapDeployment);
}

export async function getProjectDomains(
  projectId: string
): Promise<VercelDomain[]> {
  try {
    const data = await vfetch<{
      domains: { name: string; verified: boolean; redirect?: string | null }[];
    }>(`/v9/projects/${projectId}/domains`);
    return (data.domains ?? []).map((d) => ({
      name: d.name,
      verified: d.verified,
      redirect: d.redirect ?? null,
    }));
  } catch {
    return [];
  }
}

// Full per-project report used by the dashboard + audit engine.
export async function getProjectReport(
  projectId: string
): Promise<VercelReport> {
  try {
    const [deployments, domains] = await Promise.all([
      getDeployments(projectId, 10),
      getProjectDomains(projectId),
    ]);
    const production = deployments.filter((d) => d.target === "production");
    const latestDeployment = production[0] ?? deployments[0] ?? null;
    const recentErrors = deployments
      .slice(0, 10)
      .filter((d) => d.state === "ERROR").length;
    return { latestDeployment, deployments, domains, recentErrors };
  } catch (e) {
    return {
      latestDeployment: null,
      deployments: [],
      domains: [],
      recentErrors: 0,
      error: e instanceof Error ? e.message : "Vercel fetch failed",
    };
  }
}
