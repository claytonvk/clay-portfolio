"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubmissionStatus } from "@/lib/types";

// Status changes run through the cookie-bound client, so RLS still applies and
// only a signed-in dashboard user can touch the inbox.
export async function setSubmissionStatus(id: string, status: SubmissionStatus) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const { error } = await supabase
    .from("form_submissions")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/submissions");
  return { ok: true };
}

export async function markAllRead() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const { error } = await supabase
    .from("form_submissions")
    .update({ status: "read" })
    .eq("status", "new");

  if (error) return { error: error.message };

  revalidatePath("/admin/submissions");
  return { ok: true };
}
