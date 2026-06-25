import { AlertTriangle } from "lucide-react";

// Rendered when Supabase (the dashboard's backbone) isn't configured yet.
export default function SetupNotice() {
  return (
    <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-6">
      <div className="max-w-lg w-full border border-ink/10 rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
            <AlertTriangle size={20} />
          </span>
          <h1 className="font-vanguard text-2xl font-extrabold tracking-tight">
            Finish setup
          </h1>
        </div>
        <p className="text-sm text-ink/70 leading-relaxed">
          The admin dashboard needs Supabase configured before it can run. Add
          your keys to <code className="text-accent-dark">.env.local</code> and
          restart the dev server:
        </p>
        <pre className="mt-4 rounded-lg bg-ink/[0.04] border border-ink/10 p-4 text-xs overflow-x-auto">
          {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...`}
        </pre>
        <p className="mt-4 text-sm text-ink/60">
          Full instructions are in{" "}
          <code className="text-accent-dark">ADMIN_SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
