"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Work", href: "/work", sectionId: "work" },
    { label: "About", href: "/about", sectionId: "about" },
    { label: "Contact", href: "/contact", sectionId: "contact" },
  ];

  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    sectionId: string
  ) {
    const el = document.getElementById(sectionId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", href);
    }
    setMenuOpen(false);
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            window.history.pushState(null, "", "/");
          }}
          className={`font-vanguard font-bold text-lg tracking-wider transition-colors duration-300 ${
            scrolled ? "text-ink" : "text-white"
          }`}
        >
          CV
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href, link.sectionId)}
              className={`text-sm font-sans font-medium tracking-wide transition-colors duration-300 hover:text-accent ${
                scrolled ? "text-ink/70" : "text-white/70"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/ClayVanderKolkResume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-sans font-medium px-4 py-1.5 border transition-all duration-300 ${
              scrolled
                ? "border-ink text-ink hover:bg-ink hover:text-white"
                : "border-white/60 text-white hover:bg-white hover:text-ink"
            }`}
          >
            Resume
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden flex flex-col gap-1.5 p-1 transition-colors ${
            scrolled ? "text-ink" : "text-white"
          }`}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            } ${scrolled ? "bg-ink" : "bg-white"}`}
          />
          <span
            className={`block w-5 h-px transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            } ${scrolled ? "bg-ink" : "bg-white"}`}
          />
          <span
            className={`block w-5 h-px transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            } ${scrolled ? "bg-ink" : "bg-white"}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-b border-black/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href, link.sectionId)}
                  className="text-sm font-medium text-ink/70 hover:text-accent transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/ClayVanderKolkResume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-ink border border-ink px-4 py-2 text-center hover:bg-ink hover:text-white transition-all"
              >
                Resume
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
