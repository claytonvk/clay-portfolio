"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createClient, supabaseConfiguredClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const next = params.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream mb-4">
            <Lock size={20} />
          </span>
          <h1 className="font-vanguard text-3xl font-extrabold tracking-tight">
            Site Control
          </h1>
          <p className="text-sm text-muted mt-1">
            Sign in to manage your client sites
          </p>
        </div>

        {!supabaseConfiguredClient ? (
          <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm text-ink/70">
            Supabase isn&apos;t configured yet. Add your keys to{" "}
            <code className="text-accent-dark">.env.local</code> (see{" "}
            <code className="text-accent-dark">ADMIN_SETUP.md</code>) and restart.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <label className="section-label block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="section-label block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink text-cream py-2.5 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
