"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FolderGit2, Globe } from "lucide-react";
import { PageHeader, Card } from "@/components/admin/ui";
import SyncButton from "@/components/admin/SyncButton";

interface VercelProject {
  id: string;
  name: string;
  productionUrl: string | null;
}

const input =
  "w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export default function NewSitePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [vercelOn, setVercelOn] = useState(true);
  const [form, setForm] = useState({
    name: "",
    client_name: "",
    vercel_project_id: "",
    production_url: "",
    github_owner: "",
    github_repo: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/vercel/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? []);
        setVercelOn(d.configured !== false);
      })
      .catch(() => setVercelOn(false));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPickProject(id: string) {
    const p = projects.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      vercel_project_id: id,
      name: f.name || (p?.name ?? ""),
      production_url: f.production_url || (p?.productionUrl ?? ""),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save site");
        setSaving(false);
        return;
      }
      router.push(`/admin/sites/${data.site.id}`);
      router.refresh();
    } catch {
      setError("Could not save site");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add a site"
        subtitle="Pick a Vercel project to auto-fill, or enter details manually."
      />

      <Card className="mb-6 flex items-center justify-between gap-4 bg-cream/60">
        <div>
          <p className="text-sm font-medium">Import everything at once</p>
          <p className="text-xs text-muted">
            Pull in every Vercel project you haven&apos;t added yet.
          </p>
        </div>
        <SyncButton />
      </Card>

      <form onSubmit={submit} className="space-y-5">
        <Card className="space-y-4">
          {vercelOn && projects.length > 0 && (
            <div>
              <label className="section-label block mb-1.5">
                Vercel project
              </label>
              <select
                value={form.vercel_project_id}
                onChange={(e) => onPickProject(e.target.value)}
                className={input}
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!vercelOn && (
            <p className="text-xs text-muted">
              Connect Vercel (set <code>VERCEL_API_TOKEN</code>) to pick projects
              automatically.
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-1.5">Site name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={input}
                placeholder="Atlas Equipment"
              />
            </div>
            <div>
              <label className="section-label block mb-1.5">Client</label>
              <input
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                className={input}
                placeholder="Atlas Equipment Hawaii"
              />
            </div>
          </div>

          <div>
            <label className="section-label block mb-1.5 flex items-center gap-1.5">
              <Globe size={13} /> Production URL
            </label>
            <input
              value={form.production_url}
              onChange={(e) => set("production_url", e.target.value)}
              className={input}
              placeholder="https://atlasequipmenthi.com"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-1.5 flex items-center gap-1.5">
                <FolderGit2 size={13} /> GitHub owner
              </label>
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
                placeholder="atlas-equipment-web"
              />
            </div>
          </div>

          <div>
            <label className="section-label block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${input} min-h-20`}
              placeholder="Maintenance plan, contacts, anything to remember…"
            />
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Add site
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm hover:bg-ink/[0.04] transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
