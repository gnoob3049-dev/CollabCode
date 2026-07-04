"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { ROOM_TEMPLATES } from "@/lib/templates";

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

const features = [
  {
    icon: RefreshCw,
    title: "Real-time Sync",
    description: "Every keystroke synced instantly using CRDT technology",
  },
  {
    icon: MousePointer,
    title: "Live Cursors",
    description: "See exactly where your collaborators are editing",
  },
  {
    icon: Code,
    title: "Multi-Language",
    description: "JavaScript, Python, TypeScript, and 7 more languages",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description:
      "Communicate with your team without leaving the editor",
  },
  {
    icon: Play,
    title: "Code Execution",
    description: "Run your code directly in the browser with instant output",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Get AI-powered code explanations and suggestions",
  },
];

const stats = [
  { value: "10,000+", label: "Lines Synced" },
  { value: "500+", label: "Rooms Created" },
  { value: "99.9%", label: "Uptime" },
  { value: "<50ms", label: "Latency" },
];

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
    <div className="glass glow-green rounded-xl p-5 sm:p-7 font-mono text-sm sm:text-base relative overflow-hidden pulse-border-glow">
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
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function LandingPage() {
  const { setCurrentPage, setCurrentRoomId, isAuthenticated, setUser } = useStore();
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
      const templateFiles = htmlCssTemplate?.files || [{ name: "index.html", content: "" }];

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
        {/* Hero Section */}
        <header ref={heroRef} className="pt-16 sm:pt-24 pb-8 sm:pb-16 px-4 sm:px-6 relative overflow-hidden">
          {/* Animated gradient orb behind hero text */}
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full animate-orb pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(35, 134, 54, 0.15) 0%, rgba(88, 166, 255, 0.08) 40%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <motion.div
            className="max-w-4xl mx-auto text-center relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636] glow-green">
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

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16"
            >
              {/* Get Started - glow green on hover */}
              <div
                className="relative group p-[2px] rounded-lg"
                style={{
                  background: "linear-gradient(90deg, #238636, #58a6ff, #238636, #58a6ff)",
                  backgroundSize: "300% 100%",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              >
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(35,134,54,0.5),0_0_48px_rgba(35,134,54,0.2)]"
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
                className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] transition-shadow duration-300 hover:shadow-[0_0_16px_rgba(88,166,255,0.15)]"
              >
                Create a Room
              </Button>
              {/* View Demo button */}
              <Button
                onClick={handleViewDemo}
                variant="ghost"
                size="lg"
                disabled={creatingDemo}
                className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-all duration-300 hover:shadow-[0_0_16px_rgba(163,113,247,0.15)] border border-transparent hover:border-[#a371f7]/30"
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

            <motion.div
              variants={itemVariants}
              className="max-w-2xl mx-auto"
            >
              <TypingEffect />
            </motion.div>
          </motion.div>
        </header>

        {/* Trusted by / Stats section */}
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
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-[#8b949e] mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          ref={featuresRef}
          className="flex-1 px-4 sm:px-6 pb-16 sm:pb-24"
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={visibleFeatures ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl font-bold text-center text-[#e6edf3] mb-3 sm:mb-4"
            >
              Everything you need to code together
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={visibleFeatures ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
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
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group relative rounded-xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[#238636]/50 hover:shadow-[0_0_20px_rgba(35,134,54,0.15)]"
                >
                  {/* Inner glow effect on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at 50% 0%, rgba(35,134,54,0.06) 0%, transparent 70%)",
                    }}
                  />
                  {/* Animated gradient border on hover */}
                  <div
                    className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(35,134,54,0.4), rgba(88,166,255,0.2), rgba(163,113,247,0.3))",
                      backgroundSize: "200% 200%",
                      animation: "btn-gradient-shift 4s ease infinite",
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                      padding: "1px",
                    }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#21262d] group-hover:bg-[#238636]/20 transition-colors duration-300">
                        <feature.icon className="w-5 h-5 text-[#238636] group-hover:text-[#3fb950] transition-colors duration-300" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-[#e6edf3]">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#30363d] py-8 sm:py-10 px-4 sm:px-6 mt-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#238636]">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-[#e6edf3]">CollabCode</span>
                </div>
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  Real-time collaborative code editor for teams.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">Features</span></li>
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">Pricing</span></li>
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">Changelog</span></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">Resources</h4>
                <ul className="space-y-2">
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">Documentation</span></li>
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">API</span></li>
                  <li><span className="text-sm text-[#8b949e] hover:text-[#58a6ff] cursor-pointer transition-colors">Support</span></li>
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h4 className="text-sm font-semibold text-[#e6edf3] mb-3">Connect</h4>
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-[#8b949e] hover:text-[#e6edf3] cursor-pointer transition-colors" />
                  <Twitter className="w-5 h-5 text-[#8b949e] hover:text-[#e6edf3] cursor-pointer transition-colors" />
                  <Globe className="w-5 h-5 text-[#8b949e] hover:text-[#e6edf3] cursor-pointer transition-colors" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#30363d] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-[#484f58]">
                Built with ❤️ using Next.js, Y.js &amp; Monaco Editor
              </p>
              <div className="flex items-center gap-4 text-xs text-[#484f58]">
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Terms</span>
                <span className="hover:text-[#8b949e] cursor-pointer transition-colors">Security</span>
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
                  className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono text-[#8b949e] border transition-colors duration-200 hover:text-[#e6edf3]"
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