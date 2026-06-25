"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  PlusCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/sites/new", label: "Add Site", icon: PlusCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({
  email,
  children,
}: {
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
            isActive(href, exact)
              ? "bg-ink text-cream"
              : "text-ink/70 hover:bg-ink/[0.05] hover:text-ink"
          }`}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white px-4 py-6">
        <Link href="/admin" className="px-3 mb-8 block">
          <div className="font-vanguard text-xl font-extrabold leading-none tracking-tight">
            Site Control
          </div>
          <div className="text-[11px] uppercase tracking-widest2 text-muted mt-1">
            Clay VanderKolk
          </div>
        </Link>
        {nav}
        <div className="mt-auto pt-6 border-t border-ink/10">
          <p className="px-3 text-xs text-muted truncate mb-2">{email}</p>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-ink/[0.05] transition"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3">
        <span className="font-vanguard text-lg font-extrabold">Site Control</span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 top-[49px] z-30 bg-cream p-4">
          {nav}
          <div className="mt-6 pt-6 border-t border-ink/10">
            <p className="px-3 text-xs text-muted truncate mb-2">{email}</p>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-ink/[0.05]"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 px-5 py-6 md:px-10 md:py-10 mt-[49px] md:mt-0">
        {children}
      </main>
    </div>
  );
}
