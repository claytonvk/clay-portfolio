import type { Metadata } from "next";

// Keep the whole admin area out of search engines.
export const metadata: Metadata = {
  title: "Admin — Site Management",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-cream min-h-screen text-ink">{children}</div>;
}
