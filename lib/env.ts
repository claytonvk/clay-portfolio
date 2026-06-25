// Central, server-side accessor for all dashboard environment variables.
// Never import this into a client component — it reads secret keys.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  vercelToken: process.env.VERCEL_API_TOKEN,
  vercelTeamId: process.env.VERCEL_TEAM_ID,
  pagespeedKey: process.env.PAGESPEED_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  geminiKey: process.env.GEMINI_API_KEY,
  resendKey: process.env.RESEND_API_KEY,
  auditEmailTo: process.env.AUDIT_EMAIL_TO,
  auditEmailFrom: process.env.AUDIT_EMAIL_FROM || "onboarding@resend.dev",
  cronSecret: process.env.CRON_SECRET,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://clayvanderkolk.site",
  // Vercel project names/slugs to exclude from the dashboard (e.g. this very
  // portfolio). Comma-separated; matched case-insensitively against name + slug.
  excludedProjects: (process.env.EXCLUDED_PROJECTS || "clay-portfolio")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
} as const;

export type IntegrationKey =
  | "supabase"
  | "vercel"
  | "pagespeed"
  | "github"
  | "gemini"
  | "resend";

export function integrationStatus(): Record<IntegrationKey, boolean> {
  return {
    supabase: Boolean(env.supabaseUrl && env.supabaseAnon),
    vercel: Boolean(env.vercelToken),
    pagespeed: Boolean(env.pagespeedKey),
    github: Boolean(env.githubToken),
    gemini: Boolean(env.geminiKey),
    resend: Boolean(env.resendKey),
  };
}

export function supabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnon);
}
