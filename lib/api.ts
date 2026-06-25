import "server-only";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";

// Guard for admin route handlers. Returns the user, or a 401 response to return.
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
