import { notFound } from "next/navigation";
import { getSite, getAuditsForSite } from "@/lib/sites";
import { integrationStatus } from "@/lib/env";
import SiteDetail from "@/components/admin/SiteDetail";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await getSite(id);
  if (!site) notFound();
  const audits = await getAuditsForSite(id, 20);

  return (
    <SiteDetail
      site={site}
      audits={audits}
      geminiReady={integrationStatus().gemini}
    />
  );
}
