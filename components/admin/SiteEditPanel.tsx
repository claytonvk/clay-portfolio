"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Site, SiteStatus } from "@/lib/types";
import { Card } from "./ui";

const input =
  "w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function SiteEditPanel({
  site,
  onClose,
}: {
  site: Site;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: site.name,
    client_name: site.client_name ?? "",
    production_url: site.production_url ?? "",
    github_owner: site.github_owner ?? "",
    github_repo: site.github_repo ?? "",
    status: site.status,
    cloudflare: site.cloudflare ?? false,
    notes: site.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          client_name: form.client_name || null,
          production_url: form.production_url || null,
          github_owner: form.github_owner.trim() || null,
          github_repo: form.github_repo.trim() || null,
          status: form.status,
          cloudflare: form.cloudflare,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        setSaving(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Could not save");
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6 space-y-4 border-accent/40">
      <h3 className="font-vanguard text-lg font-bold">Edit site</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="section-label block mb-1.5">Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className="section-label block mb-1.5">Client</label>
          <input
            value={form.client_name}
            onChange={(e) => set("client_name", e.target.value)}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className="section-label block mb-1.5">Production URL</label>
        <input
          value={form.production_url}
          onChange={(e) => set("production_url", e.target.value)}
          className={input}
          placeholder="https://example.com"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="section-label block mb-1.5">GitHub owner</label>
          <input
            value={form.github_owner}
            onChange={(e) => set("github_owner", e.target.value)}
            className={input}
            placeholder="claytonvk"
          />
        </div>
        <div>
          <label className="section-label block mb-1.5">GitHub repo</label>
          <input
            value={form.github_repo}
            onChange={(e) => set("github_repo", e.target.value)}
            className={input}
            placeholder="island-style-surf-stay-web"
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Set both to enable dependency &amp; vulnerability scanning, then run an
        audit.
      </p>

      <div>
        <label className="section-label block mb-1.5">Status</label>
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as SiteStatus)}
          className={input}
        >
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="archived">archived</option>
        </select>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.cloudflare}
          onChange={(e) =>
            setForm((f) => ({ ...f, cloudflare: e.target.checked }))
          }
          className="h-4 w-4 rounded border-ink/30 accent-accent"
        />
        <span className="text-sm">Behind Cloudflare</span>
        <span className="text-xs text-muted">
          (shows the Cloudflare badge + dashboard link)
        </span>
      </label>

      <div>
        <label className="section-label block mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className={`${input} min-h-20`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm hover:bg-ink/[0.04] transition"
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}
