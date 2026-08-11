// Shared types for the admin dashboard. These mirror the Supabase schema
// in supabase/migrations/0001_init.sql.

export type SiteStatus = "active" | "paused" | "archived";

export interface Site {
  id: string;
  name: string;
  slug: string;
  client_name: string | null;
  vercel_project_id: string | null;
  github_owner: string | null;
  github_repo: string | null;
  production_url: string | null;
  custom_domains: string[];
  status: SiteStatus;
  cloudflare: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewSite = Omit<Site, "id" | "created_at" | "updated_at">;

export interface LighthouseScores {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  // Core Web Vitals (lab)
  lcp: number | null; // ms
  cls: number | null;
  tbt: number | null; // ms
  fetchedAt: string;
  error?: string;
}

export interface OutdatedDep {
  name: string;
  current: string;
  latest: string;
  type: "dependencies" | "devDependencies";
  severity: "major" | "minor" | "patch" | "unknown";
}

export interface Vulnerability {
  package: string;
  version: string;
  id: string; // OSV / GHSA id
  summary: string;
  severity: "critical" | "high" | "moderate" | "low" | "unknown";
  url: string;
}

export interface FrameworkFeatureUsage {
  middlewareOrProxy: boolean;
  i18nRouting: boolean;
  cspNonces: boolean;
  beforeInteractiveScripts: boolean;
  imageOptimization: boolean;
  websocketUpgrades: boolean;
  experimentalCache: boolean;
  evidence: string[];
}

export interface DependencyHealth {
  securityRisk: number;
  maintenanceDebt: number;
  unresolvedAdvisories: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    unknown: number;
    total: number;
  };
  outdated: {
    major: number;
    minor: number;
    patch: number;
    unknown: number;
  };
  auditClean: boolean;
  productionBuildPassing: boolean;
  notes: string[];
}

export interface DepsReport {
  outdated: OutdatedDep[];
  vulnerabilities: Vulnerability[];
  health?: DependencyHealth;
  frameworkFeatures?: FrameworkFeatureUsage;
  totalDeps: number;
  lastCommit: {
    sha: string;
    message: string;
    date: string;
    author: string;
  } | null;
  error?: string;
}

export interface VercelDeployment {
  uid: string;
  state: string; // READY | ERROR | BUILDING | QUEUED | CANCELED
  url: string;
  createdAt: number;
  target: string | null;
  commitMessage?: string | null;
  commitSha?: string | null;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  redirect?: string | null;
}

export interface VercelReport {
  latestDeployment: VercelDeployment | null;
  deployments: VercelDeployment[];
  domains: VercelDomain[];
  recentErrors: number;
  error?: string;
}

export interface Infra {
  cloudflare: boolean;
  server: string | null;
}

export interface AuditRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface Audit {
  id: string;
  site_id: string;
  run_at: string;
  source: "cron" | "manual";
  health_score: number;
  needs_attention: boolean;
  lighthouse: LighthouseScores | null;
  deps: DepsReport | null;
  vulnerabilities: Vulnerability[] | null;
  vercel: VercelReport | null;
  infra: Infra | null;
  summary: string | null;
  recommendations: AuditRecommendation[] | null;
}

// A site joined with its most recent audit — what the overview grid renders.
export interface SiteWithAudit extends Site {
  latest_audit: Audit | null;
}

// --- Master form submission inbox ------------------------------------------
// Every client site POSTs its contact forms and orders to this dashboard, so
// there is one place to watch instead of a dozen inboxes.

export type SubmissionKind =
  | "contact"
  | "order"
  | "booking"
  | "lead"
  | "review"
  | "other";

export type SubmissionStatus = "new" | "read" | "archived";

export interface FormSubmission {
  id: string;
  site_id: string | null;
  site_slug: string;
  site_label: string | null;
  kind: SubmissionKind;
  name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string | null;
  amount_cents: number | null;
  currency: string | null;
  payload: Record<string, unknown>;
  source_url: string | null;
  status: SubmissionStatus;
  external_id: string | null;
  submitted_at: string;
  created_at: string;
}

// A submission joined with the site it came from (when the slug matched).
export interface SubmissionWithSite extends FormSubmission {
  site: Pick<Site, "id" | "name" | "slug"> | null;
}
