import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Server client bound to the request cookies. Use in Server Components,
// Route Handlers, and Server Actions. Returns null if Supabase isn't configured
// yet so callers can render a setup notice instead of crashing.
export async function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnon) return null;
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

// Privileged client that bypasses RLS. Server-only (cron, audit writes).
export function createServiceClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRole) return null;
  return createServerClient(env.supabaseUrl, env.supabaseServiceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

// Convenience: the currently authenticated user, or null.
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
