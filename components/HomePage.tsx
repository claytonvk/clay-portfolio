"use client";

import { useEffect } from "react";
import Nav from "./Nav";
import Hero from "./Hero";
import Work from "./Work";
import About from "./About";
import Skills from "./Skills";
import Contact from "./Contact";
import Footer from "./Footer";

export default function HomePage({ scrollTo }: { scrollTo?: string }) {
  useEffect(() => {
    if (!scrollTo) return;
    const el = document.getElementById(scrollTo);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "instant" }), 50);
    }
  }, [scrollTo]);

  return (
    <main>
      <Nav />
      <Hero />
      <Work />
      <About />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
}
