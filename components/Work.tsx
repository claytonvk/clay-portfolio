"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  image: string;
  accentColor: string;
  role: string;
}

const projects: Project[] = [
  {
    id: "mylo",
    title: "MYLO",
    subtitle: "Logistics Marketplace Platform",
    description:
      "Three-sided marketplace connecting customers, service providers, and operations teams. Optimized front-end performance through efficient component architecture, dynamic imports, and thoughtful data management — improving load times by ~30%. Built and integrated full-stack features connecting front-end with APIs, databases, and cloud infrastructure.",
    tech: ["React", "Next.js", "TypeScript", "Node.js", "AWS", "REST APIs", "WebSockets"],
    liveUrl: "https://getmylo.com",
    githubUrl: null,
    image: "/images/projects/mylo.png",
    accentColor: "#c8a96e",
    role: "Full-Stack Engineer · Nov 2023 – Present",
  },
  {
    id: "vk-studios",
    title: "VK Creative Co",
    subtitle: "Photography & Videography Platform",
    description:
      "Full-stack web platform for a creative studio built from the ground up. Admin CMS for content management, password-protected client galleries with three visual themes, download analytics, automated email workflows via Resend, and a responsive public portfolio site.",
    tech: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Resend"],
    liveUrl: "https://vkcreativecompany.com",
    githubUrl: "https://github.com/claytonvk/vk-studios",
    image: "/images/projects/vk-creative.png",
    accentColor: "#c87d46",
    role: "Contract · VK Creative Co",
  },
  {
    id: "stone-bridge",
    title: "Stone Bridge Buyers",
    subtitle: "Real Estate Lead Management",
    description:
      "Marketing site and full CRM for a real estate investment company. Multi-step SMS automation campaigns built with Twilio, bulk DealMachine lead imports, real-time KPI analytics, lead status tracking with full activity history, and a separate protected admin portal.",
    tech: ["React", "Supabase", "Deno", "Twilio", "Framer Motion", "PostgreSQL"],
    liveUrl: "https://stonebridgebuyers.com",
    githubUrl: "https://github.com/claytonvk/stone-bridge-buyers-web",
    image: "/images/projects/stone-bridge.png",
    accentColor: "#b09870",
    role: "Contract · VK Creative Co",
  },
  {
    id: "atlas-equipment",
    title: "Atlas Equipment Hawaii",
    subtitle: "Equipment Sales Platform",
    description:
      "Marketing site and admin dashboard for a Hawaii-based heavy equipment company. Dynamic location pages for SEO, contact tracking with SMS consent management, LocalBusiness structured data, and an admin portal for viewing and managing all form submissions.",
    tech: ["React", "Supabase", "Framer Motion", "TypeScript", "Vite"],
    liveUrl: "https://atlasequipmenthi.com",
    githubUrl: "https://github.com/claytonvk/atlas-equipment-web",
    image: "/images/projects/atlas-equipment.png",
    accentColor: "#d4bc8a",
    role: "Contract · VK Creative Co",
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative flex flex-col overflow-hidden border border-black/8 hover:border-black/16 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Screenshot header */}
      <div className="relative h-52 overflow-hidden bg-[#111]">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover object-top scale-105 grayscale blur-[2px] opacity-50 transition-all duration-700 group-hover:opacity-60 group-hover:blur-[1px]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Content over image */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
          {/* Accent dot */}
          <div
            className="w-2 h-2 rounded-full mb-4"
            style={{ backgroundColor: project.accentColor }}
          />

          <p className="text-white/50 text-xs font-sans tracking-widest uppercase mb-2">
            {project.subtitle}
          </p>

          <h3
            className="font-vanguard font-bold text-white"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", lineHeight: 1 }}
          >
            {project.title}
          </h3>

          <div className="mt-3">
            <span className="text-xs font-sans text-white/30 tracking-wide">
              {project.role}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-8 bg-white">
        <p className="text-sm text-ink/60 font-sans leading-relaxed flex-1">
          {project.description}
        </p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {project.tech.map((t) => (
            <span
              key={t}
              className="text-xs font-sans px-2.5 py-1 bg-cream text-ink/60 border border-black/5"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-5 mt-6 pt-6 border-t border-black/5">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans font-medium text-ink hover:text-accent transition-colors flex items-center gap-1.5"
            >
              Live Site ↗
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans font-medium text-ink/40 hover:text-accent transition-colors flex items-center gap-1.5"
            >
              GitHub ↗
            </a>
          )}
          {!project.liveUrl && !project.githubUrl && (
            <span className="text-xs font-sans text-muted/50">
              Private / Unreleased
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Work() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="work" className="bg-cream py-32 px-6 md:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16"
        >
          <div>
            <p className="section-label mb-4">Selected Work</p>
            <h2
              className="font-vanguard font-bold text-ink leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Things I&apos;ve Built
            </h2>
          </div>
          <p className="text-sm text-muted font-sans max-w-xs text-right leading-relaxed hidden sm:block">
            From production platforms to contract work —
            <br />
            real products, real users.
          </p>
        </motion.div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
