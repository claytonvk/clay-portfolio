import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const vanguard = localFont({
  src: [
    {
      path: "../public/fonts/Fontspring-DEMO-vanguardcf-bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Fontspring-DEMO-vanguardcf-medium.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-display",
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
      <body className={`${inter.variable} ${vanguard.variable}`}>{children}</body>
    </html>
  );
}
