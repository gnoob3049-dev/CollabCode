"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Code2,
  RefreshCw,
  MousePointer,
  Code,
  MessageSquare,
  Play,
  Sparkles,
  ArrowRight,
  Github,
  Twitter,
  Globe,
  Zap,
  Shield,
  Users,
  Eye,
  MessageCircle,
  ChevronRight,
  BookOpen,
  Codepen,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { ROOM_TEMPLATES } from "@/lib/templates";

/* ------------------------------------------------------------------ */
/*  Star Field Data (pre-computed positions)                            */
/* ------------------------------------------------------------------ */

const stars = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  top: `${(i * 37 + 13) % 100}%`,
  left: `${(i * 53 + 7) % 100}%`,
  size: (i % 3 === 0) ? 2 : 1,
  duration: 3 + (i % 6),
  delay: (i * 0.4) % 5,
}));

/* ------------------------------------------------------------------ */
/*  Ripple helper                                                       */
/* ------------------------------------------------------------------ */

function createRipple(e: React.MouseEvent<HTMLElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const size = Math.max(rect.width, rect.height);

  const circle = document.createElement("span");
  circle.className = "ripple-circle";
  circle.style.width = circle.style.height = `${size * 2}px`;
  circle.style.left = `${x - size}px`;
  circle.style.top = `${y - size}px`;
  btn.appendChild(circle);

  setTimeout(() => circle.remove(), 350);
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const codeSnippets = [
  'const result = await fetch("/api/data");',
  'function merge(left, right) {',
  "  return [...left, ...right];",
  "}",
  'export default async function Page() {',
  "  const data = await getData();",
  "  return <Dashboard data={data} />;",
  "}",
  "class EventEmitter {",
  "  #listeners = new Map();",
  "  on(event, fn) {",
  "    this.#listeners.set(event, fn);",
  "  }",
  "}",
  "const ws = new WebSocket(url);",
  "ws.onmessage = (e) => {",
  "  applyPatch(JSON.parse(e.data));",
  "};",
  "for (const [key, value] of map) {",
  "  if (predicate(value)) {",
  "    yield { key, value };",
  "  }",
  "}",
];

type ColorTheme = "green" | "blue" | "purple" | "orange";

const colorMap: Record<ColorTheme, { bg: string; text: string; iconHover: string; glow: string }> = {
  green: {
    bg: "bg-[#238636]/20",
    text: "text-[#238636]",
    iconHover: "text-[#3fb950]",
    glow: "hover:shadow-[0_0_24px_rgba(35,134,54,0.15)] hover:border-[#238636]/50",
  },
  blue: {
    bg: "bg-[#58a6ff]/15",
    text: "text-[#58a6ff]",
    iconHover: "text-[#79c0ff]",
    glow: "hover:shadow-[0_0_24px_rgba(88,166,255,0.15)] hover:border-[#58a6ff]/50",
  },
  purple: {
    bg: "bg-[#a371f7]/15",
    text: "text-[#a371f7]",
    iconHover: "text-[#bc8cff]",
    glow: "hover:shadow-[0_0_24px_rgba(163,113,247,0.15)] hover:border-[#a371f7]/50",
  },
  orange: {
    bg: "bg-[#f0883e]/15",
    text: "text-[#f0883e]",
    iconHover: "text-[#f4a261]",
    glow: "hover:shadow-[0_0_24px_rgba(240,136,62,0.15)] hover:border-[#f0883e]/50",
  },
};

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: ColorTheme;
  animation?: "pulse" | "sparkle";
}

const features: Feature[] = [
  {
    icon: RefreshCw,
    title: "Real-time Sync",
    description: "Every keystroke synced instantly using CRDT technology. No conflicts, no lag.",
    color: "green",
    animation: "pulse",
  },
  {
    icon: MousePointer,
    title: "Live Cursors",
    description: "See exactly where your collaborators are editing in real time.",
    color: "blue",
  },
  {
    icon: Code,
    title: "Multi-Language",
    description: "JavaScript, Python, TypeScript, and 7 more languages supported out of the box.",
    color: "purple",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Communicate with your team without leaving the editor.",
    color: "orange",
  },
  {
    icon: Play,
    title: "Code Execution",
    description: "Run your code directly in the browser with instant output.",
    color: "green",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Get AI-powered code explanations and suggestions as you code.",
    color: "purple",
    animation: "sparkle",
  },
];

const testimonials = [
  {
    quote:
      "CollabCode transformed how our remote team works. Real-time sync is flawless.",
    name: "Sarah Chen",
    role: "Lead Developer",
    company: "TechFlow",
    initials: "SC",
    color: "#238636",
  },
  {
    quote:
      "The AI assistant alone saved us hours of debugging. Game changer for pair programming.",
    name: "Marcus Rodriguez",
    role: "CTO",
    company: "DevStudio",
    initials: "MR",
    color: "#58a6ff",
  },
  {
    quote:
      "We switched from VS Code Live Share and never looked back. The chat integration is perfect.",
    name: "Aisha Patel",
    role: "Full Stack Dev",
    company: "CodeCraft",
    initials: "AP",
    color: "#a371f7",
  },
];

const stats = [
  { value: 10000, suffix: "+", label: "Developers" },
  { value: 50000, suffix: "+", label: "Sessions" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 50, suffix: "+", label: "Countries" },
];

/* ------------------------------------------------------------------ */
/*  Motion presets                                                     */
/* ------------------------------------------------------------------ */

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

const springTransition = prefersReducedMotion
  ? { duration: 0 }
  : { type: "spring" as const, stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Typing Effect                                                      */
/* ------------------------------------------------------------------ */

function TypingEffect() {
  const [displayText, setDisplayText] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef({ char: 0, snippet: 0, deleting: false });

  useEffect(() => {
    const idx = indexRef.current;

    const startTyping = () => {
      tickRef.current = setInterval(() => {
        const snippet = codeSnippets[idx.snippet];

        if (!idx.deleting) {
          if (idx.char < snippet.length) {
            idx.char++;
            setDisplayText(snippet.slice(0, idx.char));
          } else {
            clearInterval(tickRef.current!);
            tickRef.current = null;
            setTimeout(() => {
              idx.deleting = true;
              startDeleting();
            }, 2000);
          }
        }
      }, 40 + Math.random() * 60);
    };

    const startDeleting = () => {
      tickRef.current = setInterval(() => {
        const snippet = codeSnippets[idx.snippet];

        if (idx.char > 0) {
          idx.char--;
          setDisplayText(snippet.slice(0, idx.char));
        } else {
          clearInterval(tickRef.current!);
          tickRef.current = null;
          idx.deleting = false;
          idx.snippet = (idx.snippet + 1) % codeSnippets.length;
          setTimeout(startTyping, 400);
        }
      }, 20);
    };

    const startTimeout = setTimeout(startTyping, 600);

    return () => {
      clearTimeout(startTimeout);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  return (
    <div className="glass glow-green rounded-xl p-5 sm:p-7 font-mono text-sm sm:text-base relative overflow-hidden pulse-border-glow will-change-transform">
      <div className="absolute inset-0 bg-gradient-to-br from-[#238636]/5 to-[#58a6ff]/5 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-[#f85149]" />
          <div className="h-3 w-3 rounded-full bg-[#d29922]" />
          <div className="h-3 w-3 rounded-full bg-[#238636]" />
          <span className="ml-2 text-xs text-[#8b949e]">
            collabcode — session.ts
          </span>
        </div>
        <div className="min-h-[3rem] sm:min-h-[4rem]">
          <span className="text-[#8b949e] select-none">{">"} </span>
          <span className="text-[#e6edf3]">{displayText}</span>
          <span className="inline-block w-2.5 h-5 bg-[#58a6ff] animate-pulse ml-0.5 align-text-bottom" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  suffix,
  duration = 2,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const isDecimal = value % 1 !== 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * value;
      setDisplay(isDecimal ? Math.round(current * 10) / 10 : Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  const formatted =
    value >= 1000
      ? `${Math.round(display).toLocaleString()}`
      : value % 1 !== 0
        ? display.toFixed(1)
        : `${Math.round(display)}`;

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Card (with parallax tilt)                                  */
/* ------------------------------------------------------------------ */

function FeatureCard({ feature }: { feature: Feature }) {
  const theme = colorMap[feature.color];
  const IconComp = feature.icon;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * 6;  /* max ~3deg */
    const rotateX = -y * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  }, []);

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      className="group relative rounded-xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6 will-change-transform"
      style={{
        transitionProperty: "transform 0.15s ease-out, box-shadow, border-color",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "";
      }}
    >
      {/* Animated shimmer border on hover */}
      <div
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(35,134,54,0.4), rgba(88,166,255,0.2), rgba(163,113,247,0.3), rgba(35,134,54,0.4))",
          backgroundSize: "300% 300%",
          animation: prefersReducedMotion ? "none" : "shimmer 4s ease-in-out infinite",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Inner glow effect on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${
            feature.color === "green"
              ? "rgba(35,134,54,0.06)"
              : feature.color === "blue"
                ? "rgba(88,166,255,0.06)"
                : feature.color === "purple"
                  ? "rgba(163,113,247,0.06)"
                  : "rgba(240,136,62,0.06)"
          } 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Colored icon circle */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-full ${theme.bg} transition-colors duration-300 ${
              feature.animation === "pulse" ? "badge-pulse" : ""
            }`}
          >
            {feature.animation === "sparkle" ? (
              <motion.div
                animate={
                  prefersReducedMotion
                    ? {}
                    : { rotate: [0, 15, -15, 10, -10, 0] }
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              >
                <IconComp
                  className={`w-5 h-5 ${theme.text} group-hover:${theme.iconHover} transition-colors duration-300`}
                />
              </motion.div>
            ) : (
              <IconComp
                className={`w-5 h-5 ${theme.text} group-hover:${theme.iconHover} transition-colors duration-300`}
              />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#e6edf3]">
            {feature.title}
          </h3>
        </div>

        <p
          className={`text-sm sm:text-base text-[#8b949e] leading-relaxed transition-colors duration-300 group-hover:text-[#c9d1d9]`}
        >
          {feature.description}
        </p>

        {/* Learn more link — appears on hover */}
        <div className="mt-4 h-6 overflow-hidden">
          <span
            className={`inline-flex items-center gap-1 text-sm ${theme.text} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 cursor-pointer`}
          >
            Learn more
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gradient Orbs (Hero background)                                    */
/* ------------------------------------------------------------------ */

function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Green orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] rounded-full will-change-transform"
        style={{
          top: "10%",
          left: "10%",
          background:
            "radial-gradient(circle, rgba(35,134,54,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: [0, 30, -20, 15, 0],
                y: [0, -25, 15, -10, 0],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Blue orb */}
      <motion.div
        className="absolute w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] rounded-full will-change-transform"
        style={{
          top: "20%",
          right: "5%",
          background:
            "radial-gradient(circle, rgba(88,166,255,0.14) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: [0, -25, 20, -15, 0],
                y: [0, 20, -15, 25, 0],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Purple orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full will-change-transform"
        style={{
          bottom: "5%",
          left: "30%",
          background:
            "radial-gradient(circle, rgba(163,113,247,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: [0, 20, -30, 10, 0],
                y: [0, -20, 25, -15, 0],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial Card                                                   */
/* ------------------------------------------------------------------ */

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : index * 0.15,
        ease: "easeOut",
      }}
      className="glass-card hover-lift rounded-xl border border-[#30363d] bg-[#161b22] p-6 flex flex-col will-change-transform"
    >
      {/* Quote */}
      <p className="text-[#c9d1d9] text-sm sm:text-base leading-relaxed mb-6 flex-1">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#30363d]">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-semibold shrink-0"
          style={{ backgroundColor: testimonial.color }}
        >
          {testimonial.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#e6edf3] truncate">
            {testimonial.name}
          </p>
          <p className="text-xs text-[#8b949e] truncate">
            {testimonial.role} @ {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Landing Page                                                  */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { setCurrentPage, setCurrentRoomId, isAuthenticated, setUser } =
    useStore();
  const [visibleFeatures, setVisibleFeatures] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleFeatures(true);
        }
      },
      { threshold: 0.15 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("register");
    }
  };

  const handleCreateRoom = () => {
    if (isAuthenticated) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("login");
    }
  };

  const handleViewDemo = async () => {
    if (!isAuthenticated) {
      setCurrentPage("register");
      return;
    }

    setCreatingDemo(true);
    try {
      const htmlCssTemplate = ROOM_TEMPLATES.find((t) => t.id === "html-css");
      const templateFiles =
        htmlCssTemplate?.files || [{ name: "index.html", content: "" }];

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo Room",
          language: "html",
          files: templateFiles,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          setUser(null);
          setCurrentPage("landing");
          return;
        }
        return;
      }

      const data = await res.json();
      setCurrentRoomId(data.room.id);
      setCurrentPage("editor");
    } catch {
      // silently fail
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col noise-bg relative">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ======================== Hero Section ======================== */}
        <header
          ref={heroRef}
          className="pt-16 sm:pt-24 pb-8 sm:pb-16 px-4 sm:px-6 relative overflow-hidden"
        >
          {/* 3 animated gradient orbs */}
          <GradientOrbs />

          {/* Star field — twinkling dots */}
          <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
            {stars.map((star) => (
              <span
                key={star.id}
                className="absolute rounded-full bg-white"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  animation: prefersReducedMotion
                    ? "none"
                    : `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(230,237,243,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(230,237,243,0.3) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          <motion.div
            className="max-w-4xl mx-auto text-center relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ y: heroY, opacity: heroOpacity, willChange: "transform, opacity" }}
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636] glow-green will-change-transform">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-[#e6edf3] tracking-tight">
                CollabCode
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#e6edf3] mb-4 sm:mb-6 tracking-tight"
            >
              Code Together,{" "}
              <span className="gradient-text">In Real Time</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-[#8b949e] max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              A browser-based collaborative code editor. Multiple users, one
              document, zero conflicts.
            </motion.p>

            {/* Main CTA buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              {/* Get Started - glow green on hover */}
              <div
                className="relative group p-[2px] rounded-lg will-change-transform"
                style={{
                  background:
                    "linear-gradient(90deg, #238636, #58a6ff, #238636, #58a6ff)",
                  backgroundSize: "300% 100%",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              >
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(35,134,54,0.5),0_0_48px_rgba(35,134,54,0.2)] glow-btn-green btn-press ripple-effect"
                  onMouseDown={createRipple}
                >
                  <span className="animated-underline">Get Started</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              {/* Create a Room - subtle glow */}
              <Button
                onClick={handleCreateRoom}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] transition-shadow duration-300 hover:shadow-[0_0_16px_rgba(88,166,255,0.15)] ripple-effect"
                onMouseDown={createRipple}
              >
                Create a Room
              </Button>
              {/* View Demo button - purple glow on hover */}
              <Button
                onClick={handleViewDemo}
                variant="ghost"
                size="lg"
                disabled={creatingDemo}
                className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-all duration-300 hover:shadow-[0_0_16px_rgba(163,113,247,0.15)] border border-transparent hover:border-[#a371f7]/30 hover:glow-purple btn-press"
              >
                {creatingDemo ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-[#8b949e]/30 border-t-[#a371f7] rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    <Eye className="mr-2 w-4 h-4" />
                    View Demo
                  </>
                )}
              </Button>
            </motion.div>

            {/* Second CTA row — Watch Demo */}
            <motion.div
              variants={itemVariants}
              className="mb-12 sm:mb-16"
            >
              <button
                onClick={handleViewDemo}
                disabled={creatingDemo}
                className="group inline-flex items-center gap-2 text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors duration-300"
              >
                <span>Watch Demo</span>
                <motion.span
                  className="inline-flex"
                  animate={
                    prefersReducedMotion
                      ? {}
                      : { x: [0, 4, 0] }
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#8b949e]/40 group-hover:border-[#58a6ff]/60 transition-colors duration-300">
                    <svg
                      width="10"
                      height="12"
                      viewBox="0 0 10 12"
                      fill="none"
                      className="ml-0.5"
                    >
                      <path
                        d="M2 1L9 6L2 11V1Z"
                        fill="currentColor"
                        className="text-[#8b949e] group-hover:text-[#58a6ff] transition-colors duration-300"
                      />
                    </svg>
                  </span>
                </motion.span>
              </button>
            </motion.div>

            {/* Typing effect */}
            <motion.div
              variants={itemVariants}
              className="max-w-2xl mx-auto relative"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(35,134,54,0.05) 0%, transparent 70%)",
                }}
              />
              <TypingEffect key="typing" />
            </motion.div>
          </motion.div>
        </header>

        {/* ======================== Stats Section ======================== */}
        <section className="px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs text-[#484f58] uppercase tracking-widest mb-6 font-medium">
              Trusted by developers worldwide
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.6 + i * 0.1,
                    duration: prefersReducedMotion ? 0 : 0.5,
                  }}
                  className="text-center will-change-transform"
                >
                  <div className="text-2xl sm:text-3xl font-bold gradient-text-animated">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={2.5}
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-[#8b949e] mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== Features Section ======================== */}
        <section
          ref={featuresRef}
          className="flex-1 px-4 sm:px-6 pb-16 sm:pb-24"
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={visibleFeatures ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
              className="text-2xl sm:text-3xl font-bold text-center text-[#e6edf3] mb-3 sm:mb-4"
            >
              Everything you need to code together
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={visibleFeatures ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: 0.1,
              }}
              className="text-[#8b949e] text-center mb-10 sm:mb-14 text-base sm:text-lg"
            >
              Powerful features designed for seamless real-time collaboration
            </motion.p>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate={visibleFeatures ? "visible" : "hidden"}
            >
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* ======================== Testimonials Section ======================== */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
              className="text-2xl sm:text-3xl font-bold text-center text-[#e6edf3] mb-3 sm:mb-4"
            >
              Loved by developers everywhere
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: 0.1,
              }}
              className="text-[#8b949e] text-center mb-10 sm:mb-14 text-base sm:text-lg"
            >
              Hear from teams that ship better code together
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.name} testimonial={t} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ======================== Trusted by developers ======================== */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-4xl mx-auto text-center border-glow-cycle rounded-2xl border border-[#30363d]/30 py-6 px-4">
            <p className="text-xs text-[#484f58] uppercase tracking-widest mb-8 font-medium">
              Trusted by developers at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { initials: "AC", name: "AlphaCorp" },
                { initials: "NT", name: "NovaTech" },
                { initials: "QD", name: "QuantumDev" },
                { initials: "SL", name: "SynthLabs" },
                { initials: "PX", name: "PixelForge" },
                { initials: "RV", name: "RiverStack" },
              ].map((company, i) => (
                <motion.div
                  key={company.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : i * 0.1,
                    duration: prefersReducedMotion ? 0 : 0.5,
                  }}
                  className="flex items-center gap-2.5 opacity-[0.35] hover:opacity-[0.6] transition-opacity duration-300 hover-glow-blue rounded-lg p-1 will-change-transform"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#8b949e]">
                      {company.initials}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#8b949e] tracking-wide hidden sm:inline">
                    {company.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== Footer ======================== */}
        <footer className="relative py-10 sm:py-12 px-4 sm:px-6 mt-auto">
          {/* Animated gradient top border — green → blue → purple */}
          <div
            className="absolute top-0 left-0 right-0 h-px will-change-transform"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #238636 20%, #58a6ff 50%, #a371f7 80%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: prefersReducedMotion
                ? "none"
                : "shimmer 4s ease infinite",
            }}
          />

          <div className="max-w-6xl mx-auto pt-2">
            {/* Made with tagline */}
            <p className="text-center text-sm text-[#8b949e] mb-8">
              Made with{" "}
              <span className="text-[#238636]">&#x1f49a;</span> by developers,
              for developers
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#238636]">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-[#e6edf3]">
                    CollabCode
                  </span>
                </div>
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  Real-time collaborative code editor for teams.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">
                  Product
                </h4>
                <ul className="space-y-2">
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <Zap className="w-3.5 h-3.5 opacity-60" />
                      Features
                    </span>
                  </li>
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <Shield className="w-3.5 h-3.5 opacity-60" />
                      Pricing
                    </span>
                  </li>
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <Code2 className="w-3.5 h-3.5 opacity-60" />
                      Changelog
                    </span>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">
                  Resources
                </h4>
                <ul className="space-y-2">
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <BookOpen className="w-3.5 h-3.5 opacity-60" />
                      Documentation
                    </span>
                  </li>
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <Codepen className="w-3.5 h-3.5 opacity-60" />
                      API
                    </span>
                  </li>
                  <li>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors hover-underline-anim">
                      <LifeBuoy className="w-3.5 h-3.5 opacity-60" />
                      Support
                    </span>
                  </li>
                </ul>
              </div>

              {/* Connect — social icons */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">
                  Connect
                </h4>
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    aria-label="GitHub"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e]/40 transition-all duration-300"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Twitter"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e]/40 transition-all duration-300"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    aria-label="Discord"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e]/40 transition-all duration-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-[#30363d] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-[#484f58]">
                Built with &#x2764;&#xfe0f; using Next.js, Y.js &amp; Monaco
                Editor
              </p>
              <div className="flex items-center gap-4 text-xs text-[#484f58]">
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">
                  Privacy
                </span>
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">
                  Terms
                </span>
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">
                  Security
                </span>
              </div>
            </div>

            {/* Built with tech stack icons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {[
                { name: "React", color: "#61dafb" },
                { name: "Y.js", color: "#ff8c42" },
                { name: "Monaco", color: "#007acc" },
                { name: "Socket.io", color: "#8b949e" },
              ].map((tech) => (
                <span
                  key={tech.name}
                  className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono border transition-colors duration-200 hover:text-[#e6edf3]"
                  style={{
                    borderColor: `${tech.color}40`,
                    color: tech.color,
                  }}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}