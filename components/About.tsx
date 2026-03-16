"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="bg-white py-32 px-6 md:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.15 } },
          }}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start"
        >
          {/* Left column */}
          <div>
            <motion.p variants={fadeUp} className="section-label mb-6">
              About
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="font-vanguard font-bold text-ink leading-tight mb-8"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Code, design,
              <br />
              and everything
              <br />
              in between.
            </motion.h2>

            <motion.div
              variants={fadeUp}
              className="w-10 h-px bg-accent mb-8"
            />

            <motion.div
              variants={fadeUp}
              className="space-y-4 text-ink/60 text-sm leading-relaxed font-sans"
            >
              <p>
                I&apos;m a full-stack engineer with 2.5+ years of production
                experience on a small team where I shared real technical
                ownership — contributing directly to design, architecture, and
                product decisions.
              </p>
              <p>
                My background is a bit unconventional: I studied mathematics,
                taught middle school, and found my way into software through a
                genuine love of building things. That path gave me an eye for
                design from graphic design and videography work, problem-solving
                tools from a math background, and communication skills from
                teaching.
              </p>
              <p>
                Through my contract studio, VK Creative Co, I&apos;ve designed and
                built full-stack platforms for local businesses — from equipment
                marketplaces to real estate lead systems — handling everything
                from database architecture to polished front-end experiences.
              </p>
              <p>
                I&apos;m AWS Certified and strive to build software that not only
                looks compelling but also balances strong performance with
                thoughtful, intuitive design.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: "2.5+", label: "Years Production" },
                { value: "AWS", label: "Certified" },
                { value: "4+", label: "Client Platforms" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-vanguard font-bold text-2xl text-ink mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted font-sans uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column — photo + experience timeline */}
          <div className="space-y-8">
            {/* Photo */}
            <motion.div
              variants={fadeUp}
              className="relative aspect-[4/5] w-full max-w-sm overflow-hidden bg-cream-dark"
            >
              <Image
                src="/images/me.png"
                alt="Clay VanderKolk"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              {/* Corner accent */}
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent opacity-60" />
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent opacity-60" />
            </motion.div>

            {/* Experience timeline */}
            <motion.div variants={fadeUp} className="space-y-6 pt-4">
              {[
                {
                  role: "Full-Stack Software Engineer",
                  company: "My Logistics Solutions, Inc.",
                  period: "Nov 2023 – Present",
                  type: "Full-Time",
                },
                {
                  role: "Contract Software Development",
                  company: "VK Creative Co",
                  period: "Jun 2025 – Present",
                  type: "Contract",
                },
                {
                  role: "Middle School Math Teacher",
                  company: "The Potter's House",
                  period: "Aug 2022 – Aug 2023",
                  type: "Education",
                },
              ].map((exp, i) => (
                <div
                  key={i}
                  className="flex gap-4 pb-6 border-b border-black/5 last:border-0"
                >
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink font-sans">
                      {exp.role}
                    </p>
                    <p className="text-xs text-muted font-sans mt-0.5">
                      {exp.company}
                    </p>
                    <p className="text-xs text-muted/60 font-sans mt-0.5">
                      {exp.period} · {exp.type}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
