"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";

export interface SiteOption {
  slug: string;
  label: string;
  count: number;
}

// A dropdown rather than a row of chips: the roster is every site, which is
// far too many to lay out inline, and it keeps "All sites" one click away.
export default function SiteFilter({
  sites,
  active,
  filter,
  type,
}: {
  sites: SiteOption[];
  active: string | null;
  filter: string;
  type?: string;
}) {
  const suffix = type && type !== "all" ? `&type=${type}` : "";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const activeLabel = active
    ? sites.find((s) => s.slug === active)?.label ?? active
    : "All sites";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/[0.04] transition"
      >
        <span className="max-w-[14rem] truncate">{activeLabel}</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-ink/12 bg-white py-1 shadow-lg">
          <Link
            href={`/admin/submissions?filter=${filter}${suffix}`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-ink/[0.04]"
          >
            <span className="font-medium">All sites</span>
            {!active && <Check size={14} />}
          </Link>

          <div className="my-1 border-t border-ink/8" />

          {sites.map((s) => (
            <Link
              key={s.slug}
              href={`/admin/submissions?filter=${filter}${suffix}&site=${encodeURIComponent(s.slug)}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-ink/[0.04]"
            >
              <span className={`truncate ${s.count ? "" : "text-muted"}`}>{s.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted">{s.count || "—"}</span>
                {active === s.slug && <Check size={14} />}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
