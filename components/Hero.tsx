"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } },
};

const FADE_DURATION = 2500;

interface Stroke {
  points: { x: number; y: number }[];
  endTime: number | null;
}

export default function Hero() {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [isTouch, setIsTouch] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const strokes = useRef<Stroke[]>([]);
  const activeStroke = useRef<Stroke | null>(null);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const now = Date.now();

    // Finalize any strokes past their fade duration
    strokes.current = strokes.current.filter(
      (s) => s.endTime === null || now - s.endTime < FADE_DURATION
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes.current) {
      if (stroke.points.length < 2) continue;

      // Still drawing = full opacity; finished = fade out
      const opacity =
        stroke.endTime === null
          ? 0.75
          : Math.max(0, 1 - (now - stroke.endTime) / FADE_DURATION) * 0.75;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(200,169,110,${opacity})`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Smooth quadratic bezier through midpoints
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
      }
      ctx.lineTo(
        stroke.points[stroke.points.length - 1].x,
        stroke.points[stroke.points.length - 1].y
      );
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    isDrawing.current = true;
    const stroke: Stroke = { points: [getPos(e)], endTime: null };
    activeStroke.current = stroke;
    strokes.current.push(stroke);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if ("clientX" in e) {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (rect) {
        setMouse({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    }
    if (!isDrawing.current || !activeStroke.current) return;
    activeStroke.current.points.push(getPos(e));
  }

  function stopDraw() {
    if (activeStroke.current) {
      activeStroke.current.endTime = Date.now();
      activeStroke.current = null;
    }
    isDrawing.current = false;
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={isTouch ? undefined : draw}
      onMouseDown={isTouch ? undefined : startDraw}
      onMouseUp={isTouch ? undefined : stopDraw}
      onMouseLeave={isTouch ? undefined : stopDraw}
      className="relative w-full min-h-screen bg-ink overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(200,169,110,0.08),transparent)]" />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      />

      {/* Cursor glow — desktop only */}
      {!isTouch && (
        <div
          className="absolute inset-0 pointer-events-none transition-[background] duration-300 ease-out"
          style={{
            background: `radial-gradient(400px circle at ${mouse.x}% ${mouse.y}%, rgba(200,169,110,0.06), transparent 70%)`,
          }}
        />
      )}

      {/* Main content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col justify-end flex-1 px-6 md:px-10 lg:px-16 pb-20 pt-32"
      >
        {/* Small top label */}
        <motion.p
          variants={item}
          className="section-label text-white/30 mb-8"
        >
          Full-Stack Software Engineer
        </motion.p>

        {/* Big name */}
        <div className="overflow-hidden">
          <motion.h1
            variants={item}
            className="font-vanguard font-bold text-white leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}
          >
            CLAY
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            variants={item}
            className="font-vanguard font-bold text-white leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}
          >
            VANDER
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            variants={item}
            className="font-vanguard font-bold text-white leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}
          >
            KOLK
          </motion.h1>
        </div>

        {/* Bottom row */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
        >
          <div>
            <div className="w-10 h-px bg-accent mb-4" />
            <p className="text-white/50 text-sm font-sans max-w-xs leading-relaxed">
              Building software that combines unique design, with high performance and reliability. <br />
              Based in Waialua, Hawaii.
            </p>
          </div>

          {/* Socials + CTA */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/claytonvk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white transition-colors text-sm font-sans tracking-wide"
            >
              GitHub ↗
            </a>
            <a
              href="mailto:clayvanderkolk@gmail.com"
              className="text-white/40 hover:text-white transition-colors text-sm font-sans tracking-wide"
            >
              Email ↗
            </a>
            <a
              href="#work"
              className="text-xs font-sans tracking-widest uppercase text-white/30 hover:text-accent transition-colors flex items-center gap-2"
            >
              View Work
              <span className="inline-block animate-bounce">↓</span>
            </a>
          </div>
        </motion.div>
      </motion.div>

    </section>
  );
}
