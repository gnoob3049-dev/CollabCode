"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  FileCode2,
  Users,
  Calendar,
  Code2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";

const AVATAR_COLORS = [
  "#238636",
  "#2ea043",
  "#3fb950",
  "#58a6ff",
  "#388bfd",
  "#a371f7",
  "#bc8cff",
  "#f0883e",
  "#d29922",
  "#f85149",
  "#ff7b72",
  "#8b949e",
  "#db61a2",
  "#e3b341",
  "#79c0ff",
];

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function ProfilePage() {
  const { user, setUser, setCurrentPage } = useStore();

  const [name, setName] = useState(user?.name || "");
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || "#238636");
  const [saving, setSaving] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Stats
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalCollaborators, setTotalCollaborators] = useState(0);
  const [mostUsedLanguage, setMostUsedLanguage] = useState("N/A");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSelectedColor(user.avatarColor);
    }
  }, [user]);

  useEffect(() => {
    // Fetch rooms for stats
    fetch("/api/rooms", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const rooms = Array.isArray(data) ? data : data.rooms || [];
        setTotalRooms(rooms.length);

        // Sum unique collaborators
        const allCollaboratorIds = new Set<string>();
        rooms.forEach((r: { collaborators?: string[]; ownerId?: string; language?: string }) => {
          if (r.collaborators) {
            r.collaborators.forEach((id: string) => allCollaboratorIds.add(id));
          }
        });
        setTotalCollaborators(allCollaboratorIds.size);

        // Most used language
        const langCount: Record<string, number> = {};
        rooms.forEach((r: { language?: string }) => {
          const lang = r.language || "javascript";
          langCount[lang] = (langCount[lang] || 0) + 1;
        });
        const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0];
        setMostUsedLanguage(topLang ? (LANGUAGE_LABELS[topLang[0]] || topLang[0]) : "N/A");
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), avatarColor: selectedColor }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarColor: data.user.avatarColor,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#8b949e]">
          <div className="size-8 border-2 border-[#30363d] border-t-[#238636] rounded-full animate-spin" />
          <span className="text-sm">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back button */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Button
            variant="ghost"
            onClick={() => setCurrentPage("dashboard")}
            className="mb-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] gap-2 press-effect"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8"
        >
          {/* Avatar */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shrink-0"
            style={{ backgroundColor: selectedColor }}
          >
            {getInitials(name)}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3]">
              {user.name}
            </h1>
            <p className="text-[#8b949e] mt-1 text-sm sm:text-base">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-[#8b949e] text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member since {formatDate(user.createdAt || new Date().toISOString())}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          <Card className="glass-card scale-in-soft bg-[#161b22]/70 border-[#30363d]/60">
            <CardContent className="p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-[#238636]/15 flex items-center justify-center mx-auto mb-2">
                <FileCode2 className="w-4.5 h-4.5 text-[#238636]" />
              </div>
              {loadingStats ? (
                <div className="h-7 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#8b949e] animate-spin" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#e6edf3]">{totalRooms}</p>
              )}
              <p className="text-xs text-[#8b949e] mt-1">Rooms Created</p>
            </CardContent>
          </Card>

          <Card className="glass-card scale-in-soft bg-[#161b22]/70 border-[#30363d]/60" style={{ animationDelay: "0.05s" }}>
            <CardContent className="p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-[#58a6ff]/15 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4.5 h-4.5 text-[#58a6ff]" />
              </div>
              {loadingStats ? (
                <div className="h-7 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#8b949e] animate-spin" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#e6edf3]">{totalCollaborators}</p>
              )}
              <p className="text-xs text-[#8b949e] mt-1">Collaborators</p>
            </CardContent>
          </Card>

          <Card className="glass-card scale-in-soft bg-[#161b22]/70 border-[#30363d]/60" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-[#a371f7]/15 flex items-center justify-center mx-auto mb-2">
                <Code2 className="w-4.5 h-4.5 text-[#a371f7]" />
              </div>
              {loadingStats ? (
                <div className="h-7 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#8b949e] animate-spin" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-[#e6edf3] truncate px-1">{mostUsedLanguage}</p>
              )}
              <p className="text-xs text-[#8b949e] mt-1">Top Language</p>
            </CardContent>
          </Card>

          <Card className="glass-card scale-in-soft bg-[#161b22]/70 border-[#30363d]/60" style={{ animationDelay: "0.15s" }}>
            <CardContent className="p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-[#f0883e]/15 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-4.5 h-4.5 text-[#f0883e]" />
              </div>
              <p className="text-2xl font-bold text-[#e6edf3]">
                {new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
              <p className="text-xs text-[#8b949e] mt-1">Joined</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Profile Form */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="glass-card bg-[#161b22]/70 border-[#30363d]/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[#e6edf3] flex items-center gap-2">
                <User className="w-5 h-5 text-[#8b949e]" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-sm text-[#8b949e]">
                  Display Name
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="input-glow-focus bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-transparent h-11"
                />
                <p className="text-xs text-[#484f58]">
                  {name.trim().length}/50 characters
                </p>
              </div>

              {/* Avatar Color Picker */}
              <div className="space-y-2">
                <Label className="text-sm text-[#8b949e]">Avatar Color</Label>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="relative w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none press-effect"
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {selectedColor === color && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-white drop-shadow-md" strokeWidth={3} />
                        </motion.div>
                      )}
                      {selectedColor === color && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-[#e6edf3] ring-offset-2 ring-offset-[#161b22]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-sm text-[#8b949e]">Preview</Label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {getInitials(name || "U")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {name.trim() || "Username"}
                    </p>
                    <p className="text-xs text-[#8b949e]">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !name.trim() || (name.trim() === user.name && selectedColor === user.avatarColor)}
                  className="w-full sm:w-auto h-11 px-6 bg-[#238636] hover:bg-[#2ea043] text-white font-medium hover-glow-green press-effect transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto border-t border-[#30363d]/50 bg-[#0d1117]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
          <p className="text-xs text-[#484f58]">CollabCode v1.0</p>
        </div>
      </footer>
    </div>
  );
}