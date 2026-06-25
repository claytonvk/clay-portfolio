"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

// Imports any Vercel projects not yet tracked.
export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/sites/sync", { method: "POST" });
      const data = await res.json();
      let lingering = false;
      if (!res.ok) {
        setMsg(data.error || "Sync failed");
      } else if (data.hint) {
        setMsg(data.hint);
        lingering = true;
      } else {
        const parts = [];
        if (data.added > 0) parts.push(`imported ${data.added}`);
        if (data.updated > 0) parts.push(`updated ${data.updated}`);
        setMsg(
          parts.length
            ? parts.join(", ").replace(/^./, (c: string) => c.toUpperCase())
            : "Already up to date"
        );
        router.refresh();
      }
      setLoading(false);
      setTimeout(() => setMsg(null), lingering ? 12000 : 4000);
    } catch {
      setMsg("Sync failed");
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-muted">{msg}</span>}
      <button
        onClick={sync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm font-medium hover:bg-ink/[0.04] transition disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <RefreshCw size={16} />
        )}
        Sync from Vercel
      </button>
    </div>
  );
}
