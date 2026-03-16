import type { Metadata } from "next";
import { Inter, Big_Shoulders_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bigShoulders = Big_Shoulders_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clay VanderKolk — Full-Stack Software Engineer",
  description:
    "Full-stack engineer building fast, beautiful software. Specializing in React, Next.js, TypeScript, and Supabase.",
  keywords: [
    "Clay VanderKolk",
    "Full-Stack Engineer",
    "React",
    "Next.js",
    "TypeScript",
    "Software Engineer",
    "Hawaii",
  ],
  openGraph: {
    title: "Clay VanderKolk — Full-Stack Software Engineer",
    description:
      "Full-stack engineer building fast, beautiful software. Specializing in React, Next.js, TypeScript, and Supabase.",
    type: "website",
    url: "https://clayvanderkolk.site",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clay VanderKolk — Full-Stack Software Engineer",
    description:
      "Full-stack engineer building fast, beautiful software. Specializing in React, Next.js, TypeScript, and Supabase.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${bigShoulders.variable}`}>{children}</body>
    </html>
  );
}
