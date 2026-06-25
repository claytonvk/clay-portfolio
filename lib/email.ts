import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import type { Audit, Site } from "@/lib/types";

export function resendConfigured() {
  return Boolean(env.resendKey && env.auditEmailTo);
}

export interface DigestItem {
  site: Site;
  audit: Audit | null;
  error?: string;
}

function row(item: DigestItem): string {
  const a = item.audit;
  const score = a?.health_score ?? "—";
  const color =
    a == null
      ? "#888"
      : a.health_score >= 90
      ? "#2f9e6f"
      : a.health_score >= 70
      ? "#c8a96e"
      : a.health_score >= 50
      ? "#d8852f"
      : "#d24a3d";
  const vulns = a?.vulnerabilities?.length ?? 0;
  const outdated = a?.deps?.outdated?.length ?? 0;
  const link = `${env.siteUrl}/admin/sites/${item.site.id}`;
  const issues =
    [
      vulns ? `${vulns} vuln${vulns > 1 ? "s" : ""}` : "",
      outdated ? `${outdated} outdated` : "",
      a?.vercel?.latestDeployment?.state === "ERROR" ? "build failed" : "",
    ]
      .filter(Boolean)
      .join(" · ") || (item.error ? item.error : "looks good");

  return `<tr>
    <td style="padding:10px 8px;border-bottom:1px solid #eee;">
      <a href="${link}" style="color:#0a0a0a;font-weight:600;text-decoration:none;">${item.site.name}</a><br/>
      <span style="color:#888;font-size:12px;">${issues}</span>
    </td>
    <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">
      <span style="color:${color};font-weight:700;font-size:18px;">${score}</span>
    </td>
  </tr>`;
}

export async function sendAuditDigest(items: DigestItem[]): Promise<boolean> {
  if (!resendConfigured()) return false;
  const resend = new Resend(env.resendKey);

  const attention = items.filter((i) => i.audit?.needs_attention || i.error);
  const healthy = items.filter((i) => !i.audit?.needs_attention && !i.error);
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const section = (title: string, list: DigestItem[]) =>
    list.length
      ? `<h3 style="font-family:sans-serif;margin:24px 0 8px;">${title}</h3>
         <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
         ${list.map(row).join("")}
         </table>`
      : "";

  const html = `<div style="max-width:560px;margin:0 auto;font-family:sans-serif;color:#0a0a0a;">
    <h2 style="margin-bottom:2px;">Weekly Site Health</h2>
    <p style="color:#888;margin-top:0;font-size:13px;">${date} · ${items.length} sites audited</p>
    ${
      attention.length
        ? `<p style="background:#fdf6ec;border:1px solid #f0e0c0;border-radius:8px;padding:10px 12px;font-size:14px;">
            <strong>${attention.length}</strong> site${attention.length > 1 ? "s need" : " needs"} attention.
           </p>`
        : `<p style="background:#eef7f1;border:1px solid #cfe7da;border-radius:8px;padding:10px 12px;font-size:14px;">All sites are healthy. 🎉</p>`
    }
    ${section("Needs attention", attention)}
    ${section("Healthy", healthy)}
    <p style="margin-top:28px;">
      <a href="${env.siteUrl}/admin" style="background:#0a0a0a;color:#f6f3ee;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;">Open dashboard</a>
    </p>
  </div>`;

  try {
    await resend.emails.send({
      from: env.auditEmailFrom,
      to: env.auditEmailTo!,
      subject: `Weekly Site Health — ${attention.length} need attention`,
      html,
    });
    return true;
  } catch {
    return false;
  }
}
