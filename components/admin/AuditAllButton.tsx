"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

// Audits every site by firing the per-site endpoint with limited concurrency
// from the browser — avoids serverless timeouts and shows live progress.
export default function AuditAllButton({ siteIds }: { siteIds: string[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  async function auditAll() {
    if (siteIds.length === 0 || running) return;
    setRunning(true);
    setDone(0);
    setMsg(null);

    const queue = [...siteIds];
    let completed = 0;
    let failed = 0;

    const worker = async () => {
      while (queue.length) {
        const id = queue.shift()!;
        try {
          const res = await fetch(`/api/admin/sites/${id}/audit`, {
            method: "POST",
          });
          if (!res.ok) failed++;
        } catch {
          failed++;
        }
        completed++;
        setDone(completed);
      }
    };

    const CONCURRENCY = 3;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, siteIds.length) }, worker)
    );

    setRunning(false);
    setMsg(
      failed ? `Done — ${failed} failed` : `Audited ${completed} site${completed > 1 ? "s" : ""}`
    );
    router.refresh();
    setTimeout(() => setMsg(null), 6000);
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-muted">{msg}</span>}
      <button
        onClick={auditAll}
        disabled={running || siteIds.length === 0}
        className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm font-medium hover:bg-ink/[0.04] transition disabled:opacity-60"
      >
        {running ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Zap size={16} />
        )}
        {running ? `Auditing ${done}/${siteIds.length}…` : "Audit all"}
      </button>
    </div>
  );
}
