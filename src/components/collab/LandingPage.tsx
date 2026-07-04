"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  RefreshCw,
  MousePointer,
  Code,
  MessageSquare,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";

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
            // Finished typing - pause, then switch to deleting
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
          // Finished deleting - move to next snippet
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
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 sm:p-6 font-mono text-sm sm:text-base">
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
  const { setCurrentPage, isAuthenticated } = useStore();
  const [visibleFeatures, setVisibleFeatures] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d1117" }}>
      {/* Hero Section */}
      <header className="pt-16 sm:pt-24 pb-8 sm:pb-16 px-4 sm:px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636]">
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
            <span className="text-[#238636]">In Real Time</span>
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
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={handleCreateRoom}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-lg border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] transition-colors"
            >
              Create a Room
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
                className="group rounded-xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6 hover:border-[#484f58] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#21262d] group-hover:bg-[#238636]/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-[#238636]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#e6edf3]">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-[#8b949e]">
            Built with ❤️ using Next.js, Y.js &amp; Monaco Editor
          </p>
        </div>
      </footer>
    </div>
  );
}