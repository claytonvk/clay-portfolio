import { createBrowserClient } from "@supabase/ssr";

// Browser client for client components (login form, sign-out, optimistic UI).
// Reads the public env vars, which Next inlines at build time.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabaseConfiguredClient = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
