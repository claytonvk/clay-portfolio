"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <section id="contact" className="bg-white py-32 px-6 md:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24"
        >
          {/* Left */}
          <div>
            <motion.p variants={fadeUp} className="section-label mb-6">
              Contact
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-vanguard font-bold text-ink leading-tight"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            >
              Let&apos;s build
              <br />
              something
              <br />
              <span className="text-accent">great.</span>
            </motion.h2>

            <motion.div variants={fadeUp} className="w-10 h-px bg-accent mt-8 mb-8" />

            <motion.p
              variants={fadeUp}
              className="text-sm text-ink/50 font-sans leading-relaxed max-w-sm"
            >
              I&apos;m open to new opportunities — whether that&apos;s a full-time
              role, contract work, or just a conversation about an interesting
              problem. Reach out anytime.
            </motion.p>

            {/* Contact links */}
            <motion.div variants={fadeUp} className="mt-10 space-y-4">
              <a
                href="mailto:clayvanderkolk@gmail.com"
                className="flex items-center gap-4 group"
              >
                <div className="w-8 h-8 border border-black/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/40 group-hover:text-white transition-colors">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-sans text-ink group-hover:text-accent transition-colors">
                    clayvanderkolk@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+16162141806"
                className="flex items-center gap-4 group"
              >
                <div className="w-8 h-8 border border-black/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/40 group-hover:text-white transition-colors">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 5.65 5.65l1.26-1.26a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.04z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="text-sm font-sans text-ink group-hover:text-accent transition-colors">
                    (616) 214-1806
                  </p>
                </div>
              </a>

              <a
                href="https://github.com/claytonvk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
              >
                <div className="w-8 h-8 border border-black/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-ink/40 group-hover:text-white transition-colors">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-0.5">GitHub</p>
                  <p className="text-sm font-sans text-ink group-hover:text-accent transition-colors">
                    github.com/claytonvk
                  </p>
                </div>
              </a>
            </motion.div>
          </div>

          {/* Right — location + availability */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col justify-between"
          >
            <div className="p-8 bg-cream border border-black/5">
              <p className="section-label mb-6">Currently</p>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-sans text-ink">Waialua, Hawaii</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-sm font-sans text-ink">Open to opportunities</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-1">
                    Primary Stack
                  </p>
                  <p className="text-sm font-sans text-ink/70">
                    React · Next.js · TypeScript · Supabase
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted font-sans uppercase tracking-widest mb-1">
                    Education
                  </p>
                  <p className="text-sm font-sans text-ink/70">
                    Taylor University — BSEd, Mathematics (2022)
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-black/5">
                <a
                  href="/ClayVanderKolkResume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-ink text-white text-sm font-sans font-medium hover:bg-accent transition-colors"
                >
                  Download Resume
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
