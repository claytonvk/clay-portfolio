import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";
import SetupNotice from "@/components/admin/SetupNotice";
import AdminShell from "@/components/admin/AdminShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabaseConfigured()) return <SetupNotice />;

  // Belt-and-suspenders with middleware.
  const user = await getUser();
  if (!user) redirect("/admin/login");

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
