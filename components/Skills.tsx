"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const skillCategories = [
  {
    label: "Frontend",
    skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Framer Motion", "React Native", "Expo"],
  },
  {
    label: "Backend & Data",
    skills: ["Node.js", "Supabase", "PostgreSQL", "REST APIs", "WebSockets", "Deno", "Edge Functions"],
  },
  {
    label: "Cloud & DevOps",
    skills: ["AWS", "Docker", "Git", "CI/CD", "Vercel"],
  },
  {
    label: "Design & Tools",
    skills: ["UI/UX Design", "Responsive Design", "Figma", "Graphic Design", "Videography"],
  },
];

export default function Skills() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-ink py-32 px-6 md:px-10 lg:px-16 relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label text-white/30 mb-4">Capabilities</p>
          <h2
            className="font-vanguard font-bold text-white leading-tight mb-16"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Skills & Tools
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {skillCategories.map((cat, catIndex) => {
            return (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: catIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <p className="text-xs font-sans tracking-widest uppercase text-white/30">
                    {cat.label}
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {cat.skills.map((skill, i) => (
                    <motion.li
                      key={skill}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{
                        duration: 0.4,
                        delay: catIndex * 0.1 + i * 0.05,
                      }}
                      className="text-sm font-sans text-white/60 hover:text-white transition-colors cursor-default"
                    >
                      {skill}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* AWS badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-10 border-t border-white/5 flex items-center gap-3"
        >
          <div className="px-3 py-1.5 border border-accent/40 bg-accent/5">
            <span className="text-xs font-sans text-accent tracking-widest uppercase">
              AWS Certified Cloud Practitioner
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
