import "server-only";
import { env } from "@/lib/env";
import type { FrameworkFeatureUsage } from "@/lib/types";

export function githubConfigured() {
  return Boolean(env.githubToken);
}

interface GHCommit {
  sha: string;
  commit: { message: string; author: { date: string; name: string } };
}

export interface PackageManifest {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface RepoInfo {
  manifest: PackageManifest | null;
  frameworkFeatures: FrameworkFeatureUsage | null;
  lastCommit: {
    sha: string;
    message: string;
    date: string;
    author: string;
  } | null;
}

async function ghfetch(path: string) {
  if (!env.githubToken) throw new Error("GitHub not configured");
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  return res;
}

async function getPackageJson(
  owner: string,
  repo: string
): Promise<PackageManifest | null> {
  const res = await ghfetch(`/repos/${owner}/${repo}/contents/package.json`);
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  try {
    const json = JSON.parse(
      Buffer.from(data.content, "base64").toString("utf-8")
    );
    return {
      dependencies: json.dependencies ?? {},
      devDependencies: json.devDependencies ?? {},
    };
  } catch {
    return null;
  }
}

async function getDefaultBranch(owner: string, repo: string): Promise<string | null> {
  const res = await ghfetch(`/repos/${owner}/${repo}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { default_branch?: string };
  return data.default_branch ?? null;
}

interface GHTreeItem {
  path: string;
  type: "blob" | "tree" | string;
  size?: number;
}

async function getRepoTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GHTreeItem[]> {
  const res = await ghfetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { tree?: GHTreeItem[] };
  return data.tree ?? [];
}

async function getTextFile(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  const res = await ghfetch(
    `/repos/${owner}/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string };
  if (!data.content) return null;
  try {
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
]);

function textExtension(path: string) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

async function getFrameworkFeatures(
  owner: string,
  repo: string
): Promise<FrameworkFeatureUsage | null> {
  const branch = await getDefaultBranch(owner, repo);
  if (!branch) return null;

  const tree = await getRepoTree(owner, repo, branch);
  const files = tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);
  const textCandidates = tree
    .filter(
      (item) =>
        item.type === "blob" &&
        (item.size ?? 0) <= 120_000 &&
        TEXT_EXTENSIONS.has(textExtension(item.path)) &&
        !item.path.includes("node_modules/") &&
        !item.path.includes(".next/") &&
        !item.path.includes("dist/")
    )
    .map((item) => item.path);

  const likelyFiles = textCandidates
    .filter(
      (path) =>
        path === "middleware.ts" ||
        path === "middleware.js" ||
        path === "proxy.ts" ||
        path === "proxy.js" ||
        path.startsWith("app/") ||
        path.startsWith("pages/") ||
        path.startsWith("src/") ||
        path.startsWith("components/") ||
        path.startsWith("lib/") ||
        path.startsWith("server/") ||
        path.startsWith("api/") ||
        /^next\.config\.(js|mjs|ts)$/.test(path)
    )
    .slice(0, 80);

  const textEntries = await Promise.all(
    likelyFiles.map(async (path) => ({
      path,
      text: (await getTextFile(owner, repo, path)) ?? "",
    }))
  );
  const combined = textEntries.map((entry) => entry.text).join("\n");
  const configText = textEntries
    .filter((entry) => /^next\.config\.(js|mjs|ts)$/.test(entry.path))
    .map((entry) => entry.text)
    .join("\n");

  const evidence: string[] = [];
  const feature = (enabled: boolean, label: string) => {
    if (enabled) evidence.push(label);
    return enabled;
  };

  return {
    middlewareOrProxy: feature(
      files.some((path) =>
        /^(src\/)?(middleware|proxy)\.(js|ts)$/.test(path)
      ),
      "middleware/proxy file"
    ),
    i18nRouting: feature(/\bi18n\s*:/.test(configText), "i18n routing config"),
    cspNonces: feature(
      hasAny(combined, [/\bnonce\b/i, /Content-Security-Policy/i]),
      "CSP nonce/header usage"
    ),
    beforeInteractiveScripts: feature(
      /strategy=["']beforeInteractive["']/.test(combined),
      "beforeInteractive script"
    ),
    imageOptimization: feature(
      hasAny(combined, [
        /from\s+["']next\/image["']/,
        /<Image\b/,
        /\bimages\s*:/,
      ]),
      "Next image optimization"
    ),
    websocketUpgrades: feature(
      hasAny(combined, [
        /\bWebSocket\b/,
        /\bupgrade\b/i,
        /headers?\.(?:get|has)\(["']upgrade["']\)/i,
      ]),
      "WebSocket upgrade handling"
    ),
    experimentalCache: feature(
      hasAny(configText + "\n" + combined, [
        /\bcacheComponents\b/,
        /\bexperimental\s*:\s*{[\s\S]*?cache/i,
        /\bunstable_cache\b/,
      ]),
      "experimental cache feature"
    ),
    evidence,
  };
}

async function getLastCommit(owner: string, repo: string) {
  const res = await ghfetch(`/repos/${owner}/${repo}/commits?per_page=1`);
  if (!res.ok) return null;
  const data = (await res.json()) as GHCommit[];
  const c = data[0];
  if (!c) return null;
  return {
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    date: c.commit.author.date,
    author: c.commit.author.name,
  };
}

export async function getRepoInfo(
  owner: string,
  repo: string
): Promise<RepoInfo> {
  const [manifest, frameworkFeatures, lastCommit] = await Promise.all([
    getPackageJson(owner, repo),
    getFrameworkFeatures(owner, repo),
    getLastCommit(owner, repo),
  ]);
  return { manifest, frameworkFeatures, lastCommit };
}
