import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Only runs on the admin area — the public portfolio is completely untouched.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
