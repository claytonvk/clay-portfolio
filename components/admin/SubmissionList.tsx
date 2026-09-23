"use client";

import { useState, useEffect, useTransition } from "react";
import { Archive, ArchiveRestore, Mail, MailOpen, ChevronDown } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { formatPhone, telHref } from "@/lib/format";
import { setSubmissionStatus } from "@/app/admin/(dashboard)/submissions/actions";
import type { SubmissionWithSite, SubmissionStatus } from "@/lib/types";

const KIND_TONE: Record<string, "neutral" | "good" | "warn" | "accent"> = {
  order: "good",
  booking: "good",
  contact: "accent",
  lead: "accent",
  review: "neutral",
  other: "neutral",
};

function money(cents: number, currency: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(cents / 100);
}

function absolute(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relative(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return absolute(iso);
}

// Server and client must agree on the first render, so start from the absolute
// date (stable everywhere) and upgrade to "5m ago" once mounted.
function When({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => absolute(iso));
  useEffect(() => setLabel(relative(iso)), [iso]);
  return <span className="text-xs text-muted">{label}</span>;
}

function Row({
  submission,
  filterKey,
  onRead,
}: {
  submission: SubmissionWithSite;
  filterKey: string;
  onRead: (submission: SubmissionWithSite) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  function update(next: SubmissionStatus) {
    setStatus(next); // optimistic — the row is a local read model
    // Archiving from an inbox view (or restoring from the archive) means the
    // row no longer belongs here, so drop it instead of leaving it sitting there.
    const leavesView =
      filterKey === "archived" ? next !== "archived" : next === "archived";
    if (leavesView) setDismissed(true);
    startTransition(() => {
      setSubmissionStatus(submission.id, next);
    });
  }

  if (dismissed) return null;

  function toggleOpen() {
    setOpen((v) => !v);
    if (!open && status === "new") {
      // Marking it read revalidates the page, and a read row no longer matches
      // the New tab's query — so ask the list to hold onto it first. Otherwise
      // the row disappears out from under you the instant you open it.
      onRead(submission);
      update("read");
    }
  }

  const isNew = status === "new";
  const extras = Object.entries(submission.payload || {}).filter(
    ([, v]) => v !== null && v !== "" && typeof v !== "object"
  );

  return (
    <div
      className={`rounded-xl border transition ${
        isNew ? "border-accent/40 bg-white" : "border-ink/10 bg-white/60"
      } ${status === "archived" ? "opacity-55" : ""}`}
    >
      <div className="flex items-start gap-1 px-4 py-3">
        <div
          role="button"
          tabIndex={0}
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
        <span className="mt-1 shrink-0">
          {isNew ? (
            <Mail size={16} className="text-accent" />
          ) : (
            <MailOpen size={16} className="text-ink/35" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`text-sm ${isNew ? "font-semibold" : "font-medium"}`}>
              {submission.name || submission.email || "Anonymous"}
            </span>
            <Badge tone={KIND_TONE[submission.kind] ?? "neutral"}>
              {submission.kind}
            </Badge>
            {submission.amount_cents != null && (
              <Badge tone="good">
                {money(submission.amount_cents, submission.currency)}
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {submission.site_label || submission.site_slug}
            {submission.subject ? ` · ${submission.subject}` : ""}
          </span>
          {!open && submission.message && (
            <span className="mt-1 block truncate text-xs text-ink/55">
              {submission.message}
            </span>
          )}
        </span>

          <span className="ml-2 flex shrink-0 items-center gap-2">
            <When iso={submission.submitted_at} />
            <ChevronDown
              size={15}
              className={`text-ink/35 transition ${open ? "rotate-180" : ""}`}
            />
          </span>
        </div>

        <button
          onClick={() => update(status === "archived" ? "read" : "archived")}
          title={status === "archived" ? "Unarchive" : "Archive"}
          aria-label={status === "archived" ? "Unarchive submission" : "Archive submission"}
          className="ml-1 shrink-0 rounded-lg p-2 text-ink/35 hover:bg-ink/[0.06] hover:text-ink transition"
        >
          {status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/10 px-4 py-3 text-sm">
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
            {submission.email && (
              <>
                <dt className="text-xs text-muted">Email</dt>
                <dd>
                  <a className="underline" href={`mailto:${submission.email}`}>
                    {submission.email}
                  </a>
                </dd>
              </>
            )}
            {submission.phone && (
              <>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>
                  <a className="underline" href={`tel:${telHref(submission.phone)}`}>
                    {formatPhone(submission.phone)}
                  </a>
                </dd>
              </>
            )}
            {submission.source_url && (
              <>
                <dt className="text-xs text-muted">Page</dt>
                <dd className="truncate">
                  <a
                    className="underline"
                    href={submission.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {submission.source_url}
                  </a>
                </dd>
              </>
            )}
            {extras.map(([k, v]) => (
              <span key={k} className="contents">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="break-words">{String(v)}</dd>
              </span>
            ))}
          </dl>

          {submission.message && (
            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink/[0.04] p-3 text-sm leading-relaxed">
              {submission.message}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {submission.email && (
              <a
                href={`mailto:${submission.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-cream hover:bg-ink/90"
              >
                <Mail size={13} /> Reply
              </a>
            )}
            <button
              onClick={() => update(status === "archived" ? "read" : "archived")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-ink/[0.04]"
            >
              <Archive size={13} />
              {status === "archived" ? "Unarchive" : "Archive"}
            </button>
            {status !== "new" && (
              <button
                onClick={() => update("new")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-ink/[0.04]"
              >
                <Mail size={13} /> Mark unread
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionList({
  submissions,
  filterKey,
}: {
  submissions: SubmissionWithSite[];
  filterKey: string;
}) {
  // Rows you open get marked read, which drops them out of the server list for
  // this view. Pin them here so they stay where they are while you read; they
  // clear on the next load of the tab, once you've actually read them.
  const [pinned, setPinned] = useState<Map<string, SubmissionWithSite>>(new Map());

  // A different tab is a different inbox — nothing carries over.
  const [seenFilter, setSeenFilter] = useState(filterKey);
  if (seenFilter !== filterKey) {
    setSeenFilter(filterKey);
    setPinned(new Map());
  }

  function pin(submission: SubmissionWithSite) {
    setPinned((prev) => {
      if (prev.has(submission.id)) return prev;
      const next = new Map(prev);
      next.set(submission.id, submission);
      return next;
    });
  }

  const present = new Set(submissions.map((s) => s.id));
  const rows = [...submissions];
  for (const [id, s] of pinned) if (!present.has(id)) rows.push(s);
  rows.sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  return (
    <div className="space-y-2">
      {rows.map((s) => (
        <Row key={s.id} submission={s} filterKey={filterKey} onRead={pin} />
      ))}
    </div>
  );
}
