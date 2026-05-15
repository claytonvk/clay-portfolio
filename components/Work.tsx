"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";

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
    githubUrl: null,
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
    githubUrl: null,
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
    githubUrl: null,
    image: "/images/projects/atlas-equipment.png",
    accentColor: "#d4bc8a",
    role: "Contract · VK Creative Co",
  },
  {
    id: "island-style-surf-school",
    title: "Island Style Surf School",
    subtitle: "Surf Lesson Booking & Operations Platform",
    description:
      "Full-stack site for a North Shore Oahu surf school. Online lesson booking, digital waiver signing, Stripe payments, password-protected client photo galleries with ZIP download, and a content-managed admin dashboard for packages, availability, testimonials, and gallery analytics.",
    tech: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Stripe", "Resend"],
    liveUrl: "https://www.islandstylesurfschool.com",
    githubUrl: null,
    image: "/images/projects/island-style-surf-school.png",
    accentColor: "#4a8a6f",
    role: "Contract · VK Creative Co",
  },
  {
    id: "island-style-surf-stay",
    title: "Island Style Surf Stay",
    subtitle: "Surf Bungalow Booking Site",
    description:
      "Marketing and inquiry site for private surf bungalows in Haleiwa on Oahu's North Shore. Gallery-driven bungalow listings, SEO landing pages for Oahu vacation rentals and surf camps, LodgingBusiness structured data, and contact forms feeding directly into the Island Style admin panel.",
    tech: ["Next.js", "Supabase", "Styled Components", "Resend"],
    liveUrl: "https://www.surfstays.islandstylesurfschool.com",
    githubUrl: null,
    image: "/images/projects/island-style-surf-stays.png",
    accentColor: "#4a7fa8",
    role: "Contract · VK Creative Co",
  },
  {
    id: "covaclean",
    title: "Covaclean",
    subtitle: "Eco-Friendly Cleaning Services",
    description:
      "Marketing site for a coastal San Diego cleaning company specializing in carpet, tile, grout, upholstery, and move-out cleaning. Dynamic service-area pages for local SEO, quote request forms, LocalBusiness structured data, and Vercel Analytics.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
    liveUrl: "https://covaclean.com",
    githubUrl: null,
    image: "/images/projects/covaclean.png",
    accentColor: "#6aab9e",
    role: "Contract · VK Creative Co",
  },
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative flex flex-col overflow-hidden border border-black/8 hover:border-black/16 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 h-full">
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
    </div>
  );
}

export default function Work() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const update = () => setCardsPerView(window.innerWidth >= 768 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pages: Project[][] = [];
  for (let i = 0; i < projects.length; i += cardsPerView) {
    pages.push(projects.slice(i, i + cardsPerView));
  }
  const totalPages = pages.length;

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage((p) => p - 1);
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

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
          <div className="flex flex-col sm:items-end gap-4">
            <p className="text-sm text-muted font-sans max-w-xs text-right leading-relaxed hidden sm:block">
              From production platforms to contract work —
              <br />
              real products, real users.
            </p>
            {/* Arrow controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={goPrev}
                disabled={currentPage === 0}
                className="w-10 h-10 flex items-center justify-center border border-black/10 text-ink/60 hover:text-ink hover:border-black/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                aria-label="Previous projects"
              >
                ←
              </button>
              <span className="text-xs font-sans text-muted tabular-nums w-12 text-center">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={goNext}
                disabled={currentPage === totalPages - 1}
                className="w-10 h-10 flex items-center justify-center border border-black/10 text-ink/60 hover:text-ink hover:border-black/25 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                aria-label="Next projects"
              >
                →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPage}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {pages[currentPage]?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentPage ? 1 : -1);
                setCurrentPage(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentPage ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/40"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
