import Link from "next/link";
import type { ReactNode } from "react";

// ── Score helpers ─────────────────────────────────────────────
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "#888888";
  if (score >= 90) return "#2f9e6f"; // green
  if (score >= 70) return "#c8a96e"; // accent gold
  if (score >= 50) return "#d8852f"; // orange
  return "#d24a3d"; // red
}

export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return "—";
  if (score >= 90) return "Healthy";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "At risk";
}

// ── Layout ────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-vanguard text-3xl md:text-4xl font-extrabold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  tone?: "ink" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-[#2f9e6f]"
      : tone === "warn"
      ? "text-[#d8852f]"
      : tone === "bad"
      ? "text-[#d24a3d]"
      : "text-ink";
  return (
    <Card className="!p-4">
      <div className="section-label">{label}</div>
      <div className={`mt-2 font-vanguard text-3xl font-extrabold ${color}`}>
        {value}
      </div>
    </Card>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink/[0.06] text-ink/70",
    good: "bg-[#2f9e6f]/12 text-[#247a55]",
    warn: "bg-[#d8852f]/15 text-[#a9631f]",
    bad: "bg-[#d24a3d]/12 text-[#a8392e]",
    accent: "bg-accent/15 text-accent-dark",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
      <h3 className="font-vanguard text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted mt-1 max-w-md mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-block rounded-lg bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-ink/90 transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
