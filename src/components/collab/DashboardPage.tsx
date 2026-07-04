"use client";

import { useEffect, useState, useCallback, useMemo, useRef, type FormEvent } from "react";
import {
  Code2,
  Plus,
  LogOut,
  Users,
  Copy,
  Loader2,
  FolderOpen,
  Clock,
  Search,
  FileCode2,
  Hash,
  ArrowRight,
  Trash2,
  ChevronDown,
  Settings,
  Palette,
  Star,
  ArrowUpDown,
  Pencil,
  Share2,
  X,
  TrendingUp,
  Braces,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type Room } from "@/store/useStore";
import { ROOM_TEMPLATES, type RoomTemplate } from "@/lib/templates";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "go",
  "rust",
  "java",
  "csharp",
  "cpp",
  "sql",
];

const LANG_COLORS: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3572a5",
  html: "#e34c26",
  css: "#563d7c",
  go: "#00add8",
  rust: "#dea584",
  java: "#b07219",
  csharp: "#178600",
  cpp: "#f34b7d",
  sql: "#e38c00",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isRecent(dateStr?: string): boolean {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 30 * 60 * 1000; // within 30 minutes
}

/* Animated stat counter with easeOutExpo */
function AnimatedStatValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();
    const duration = 800;
    const animate = (now: number) => {
      const elapsed = (now - startTime) / duration;
      const progress = Math.min(elapsed, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

export default function DashboardPage() {
  const {
    user,
    setUser,
    setCurrentPage,
    setCurrentRoom,
    setCurrentRoomId,
    setLanguage,
    setCurrentFileName,
  } = useStore();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Create room dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLang, setNewRoomLang] = useState("javascript");
  const [selectedTemplate, setSelectedTemplate] = useState<RoomTemplate>(ROOM_TEMPLATES[0]);
  const [creating, setCreating] = useState(false);

  // Join room dialog
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Delete room
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Language filter
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);

  // Sort
  const [sortBy, setSortBy] = useState<string>('last-active');

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('collabcode-favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((roomId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId];
      try {
        localStorage.setItem('collabcode-favorites', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Unique languages from user's rooms
  const uniqueLanguages = useMemo(() => {
    const langs = [...new Set(rooms.map((r) => r.language))];
    return langs.sort();
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let result = rooms;
    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.language.toLowerCase().includes(q)
      );
    }
    // Apply language filter
    if (languageFilter) {
      result = result.filter((r) => r.language === languageFilter);
    }
    // Apply sort
    switch (sortBy) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result = [...result].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        break;
      case 'oldest':
        result = [...result].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        });
        break;
      case 'last-active':
      default:
        result = [...result].sort((a, b) => {
          const da = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const db = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          return db - da;
        });
        break;
    }
    // Favorites first within same sort
    result = [...result].sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
    return result;
  }, [rooms, searchQuery, languageFilter, sortBy, favorites]);

  const totalCollaborators = useMemo(() => {
    return rooms.reduce((acc, r) => {
      const count = r.collaboratorCount ?? r.collaborators?.length ?? 1;
      return acc + count;
    }, 0);
  }, [rooms]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", { credentials: "include" });
      if (res.status === 401) {
        setUser(null);
        setCurrentPage("landing");
        return;
      }
      const data = await res.json();
      const roomsList = Array.isArray(data) ? data : (data.rooms || []);
      setRooms(roomsList);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [setUser, setCurrentPage]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setCurrentPage("landing");
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // ignore
    }
  }, [setUser, setCurrentPage]);

  useEffect(() => {
    checkAuth().then(() => fetchRooms());
  }, [checkAuth, fetchRooms]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setUser(null);
    setCurrentPage("landing");
    toast.success("Logged out");
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setCreating(true);
    try {
      const templateFiles = selectedTemplate.id === "blank"
        ? [{ name: "index.js", content: "" }]
        : selectedTemplate.files;

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          language: newRoomLang,
          files: templateFiles,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create room");
        return;
      }

      toast.success(`Room "${data.room.name}" created!`);
      setCreateOpen(false);
      setNewRoomName("");
      setNewRoomLang("javascript");
      setSelectedTemplate(ROOM_TEMPLATES[0]);

      setCurrentRoom(data.room);
      setCurrentRoomId(data.room.id);
      setLanguage(data.room.language);
      setCurrentFileName(data.room.files?.[0]?.name || "index.js");
      setCurrentPage("editor");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const handleTemplateSelect = (template: RoomTemplate) => {
    setSelectedTemplate(template);
    if (template.language && LANGUAGES.includes(template.language)) {
      setNewRoomLang(template.language);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setJoining(true);
    try {
      const roomsRes = await fetch("/api/rooms", { credentials: "include" });
      const allRooms = await roomsRes.json();
      const room = (Array.isArray(allRooms) ? allRooms : []).find(
        (r: Room) => r.inviteCode === inviteCode.trim()
      );

      if (!room) {
        toast.error("Room not found. Check the invite code.");
        return;
      }

      setCurrentRoom(room);
      setCurrentRoomId(room.id);
      setLanguage(room.language);
      setCurrentFileName("index.js");
      setJoinOpen(false);
      setInviteCode("");
      setCurrentPage("editor");
      toast.success("Joined room!");
    } catch {
      toast.error("Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const quickCreateRoom = async (language: string, templateId: string) => {
    const template = ROOM_TEMPLATES.find(t => t.id === templateId);
    const templateFiles = template?.id === "blank"
      ? [{ name: "index.js", content: "" }]
      : template?.files || [{ name: "index.js", content: "" }];

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${language.charAt(0).toUpperCase() + language.slice(1)} Room`,
          language,
          files: templateFiles,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create room");
        return;
      }
      toast.success(`Room "${data.room.name}" created!`);
      setCurrentRoom(data.room);
      setCurrentRoomId(data.room.id);
      setLanguage(data.room.language);
      setCurrentFileName(data.room.files?.[0]?.name || "index.js");
      setCurrentPage("editor");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleOpenRoom = (room: Room) => {
    setCurrentRoom(room);
    setCurrentRoomId(room.id);
    setLanguage(room.language);
    setCurrentFileName(
      room.files?.[0]?.name || "index.js"
    );
    setCurrentPage("editor");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!");
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${deleteRoomId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete room");
        return;
      }
      setRooms((prev) => prev.filter((r) => r.id !== deleteRoomId));
      toast.success("Room deleted successfully");
      setDeleteRoomId(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const avatarColor = user?.avatarColor || "#238636";

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 border-b-0 px-4 sm:px-6 py-3 bg-[#0d1117]/60 backdrop-blur-xl">
          {/* Gradient bottom border line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#238636]/50 to-transparent" />
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#238636] glow-green transition-transform duration-200 group-hover:scale-110">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#e6edf3] transition-colors duration-200 group-hover:text-[#3fb950]">
                CollabCode
              </span>
            </div>

            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mr-2 hover:bg-[#161b22] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#238636]/50"
                  >
                    <div className="relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#30363d] ring-offset-2 ring-offset-[#0d1117] transition-all duration-300 hover:ring-[#238636] hover:ring-offset-[#0d1117] ${rooms.some(r => isRecent(r.lastActiveAt)) ? 'ring-[#238636] pulse-ring-green' : ''}`}
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                      {/* Online indicator dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3fb950] rounded-full border-2 border-[#0d1117]" />
                    </div>
                    <span className="hidden sm:block text-sm text-[#e6edf3] font-medium">
                      {user?.name}
                    </span>
                    <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#8b949e]" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  sideOffset={8}
                  align="end"
                  className="w-64 bg-[#161b22] border-[#30363d] text-[#e6edf3] rounded-xl p-0 overflow-hidden shadow-2xl shadow-black/40"
                >
                  {/* Profile section header */}
                  <div className="px-3 py-3 flex items-center gap-3 border-b border-[#30363d]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#e6edf3] truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-[#8b949e] truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <DropdownMenuGroup className="p-1.5">
                    <DropdownMenuItem
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#e6edf3] cursor-pointer hover:bg-[#30363d] focus:bg-[#30363d] focus:text-[#e6edf3] outline-none transition-all duration-150 hover:translate-x-0.5"
                    >
                      <Users className="w-4 h-4 text-[#8b949e]" />
                      <span>My Rooms</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setCurrentPage("profile")}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#e6edf3] cursor-pointer hover:bg-[#30363d] focus:bg-[#30363d] focus:text-[#e6edf3] outline-none transition-all duration-150 hover:translate-x-0.5"
                    >
                      <Settings className="w-4 h-4 text-[#8b949e]" />
                      <span>Profile</span>
                    </DropdownMenuItem>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem
                            disabled
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#8b949e] cursor-not-allowed opacity-50 hover:bg-[#30363d] focus:bg-[#30363d] outline-none transition-colors duration-100"
                          >
                            <Palette className="w-4 h-4" />
                            <span>Theme</span>
                            <span className="ml-auto text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-full">
                              Soon
                            </span>
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="bg-[#161b22] border-[#30363d] text-[#e6edf3] text-xs"
                      >
                        Coming soon
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator className="bg-[#30363d] -mx-1" />

                  <div className="p-1.5">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#f85149] cursor-pointer hover:bg-[#f85149]/10 focus:bg-[#f85149]/10 focus:text-[#f85149] outline-none transition-all duration-150 hover:translate-x-0.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                {
                  icon: Hash,
                  label: "Total Rooms",
                  value: rooms.length,
                  color: "#238636",
                  glowClass: "hover-glow-green",
                  tooltip: `Created this month: ${rooms.filter(r => r.createdAt && new Date(r.createdAt).getMonth() === new Date().getMonth()).length}`,
                },
                {
                  icon: Users,
                  label: "Collaborators",
                  value: totalCollaborators,
                  color: "#58a6ff",
                  glowClass: "hover-glow-blue",
                  tooltip: `Across ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`,
                },
                {
                  icon: FileCode2,
                  label: "Languages",
                  value: [...new Set(rooms.map(r => r.language))].length,
                  color: "#d29922",
                  glowClass: "hover-glow-purple",
                  tooltip: [...new Set(rooms.map(r => r.language))].join(', ') || 'None yet',
                },
                {
                  icon: Clock,
                  label: "Active Now",
                  value: rooms.filter(r => isRecent(r.lastActiveAt)).length,
                  color: "#3fb950",
                  glowClass: "hover-glow-green",
                  tooltip: `${rooms.filter(r => isRecent(r.lastActiveAt)).length} room${rooms.filter(r => isRecent(r.lastActiveAt)).length !== 1 ? 's' : ''} active in last 30 min`,
                },
              ].map((stat) => (
                <Tooltip key={stat.label}>
                  <TooltipTrigger asChild>
                <div
                  className={`rounded-lg border border-[#30363d] p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:scale-[1.03] cursor-default glass-card scale-in-soft ${stat.glowClass}`}
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}03)`,
                    backgroundColor: '#161b22',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${stat.color}25, ${stat.color}08)` }}
                  >
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg sm:text-xl font-bold text-[#e6edf3]"><AnimatedStatValue value={stat.value} /></span>
                      {stat.value > 0 && (
                        <TrendingUp className="w-3 h-3 text-[#3fb950] shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-[#8b949e] truncate">{stat.label}</div>
                  </div>
                </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#161b22] border-[#30363d] text-[#e6edf3] text-xs"
                  >
                    {stat.tooltip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3]">
                  Your Rooms
                </h1>
                <p className="text-[#8b949e] mt-1">
                  {rooms.length > 0
                    ? `${rooms.length} room${rooms.length !== 1 ? 's' : ''} · ${new Set(rooms.map(r => r.language)).size} language${new Set(rooms.map(r => r.language)).size !== 1 ? 's' : ''}`
                    : 'Create or join a room to start coding together'}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search input */}
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58] pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-8 pr-[4.5rem] bg-[#161b22] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] text-sm input-glow-green focus:shadow-[0_0_0_3px_rgba(35,134,54,0.15)]"
                  />
                  {/* Keyboard shortcut badge */}
                  {!searchQuery && (
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#484f58] bg-[#0d1117] border border-[#30363d] rounded">
                      <span className="text-[9px]">⌘</span>K
                    </kbd>
                  )}
                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger
                    className="w-auto h-9 px-2 bg-[#161b22] border-[#30363d] text-[#e6edf3] text-xs shrink-0"
                    aria-label="Sort rooms"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-[#8b949e]" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
                    <SelectItem value="last-active" className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]">Last Active</SelectItem>
                    <SelectItem value="name-asc" className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]">Name A-Z</SelectItem>
                    <SelectItem value="name-desc" className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]">Name Z-A</SelectItem>
                    <SelectItem value="newest" className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]">Newest</SelectItem>
                    <SelectItem value="oldest" className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]">Oldest</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setJoinOpen(true)}
                  className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] shrink-0"
                >
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Join Room</span>
                  <span className="sm:hidden">Join</span>
                </Button>
                <div
                  className="relative p-[1.5px] rounded-md shrink-0"
                  style={{
                    background: "linear-gradient(90deg, #238636, #58a6ff, #238636, #58a6ff)",
                    backgroundSize: "300% 100%",
                    animation: "shimmer 3s ease-in-out infinite",
                  }}
                >
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white rounded-[5px]"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Create New Room</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Language filter pills */}
            {uniqueLanguages.length > 1 && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                  onClick={() => setLanguageFilter(null)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-200 ${
                    languageFilter === null
                      ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/30'
                      : 'bg-transparent text-[#8b949e] border-[#30363d] hover:bg-[#21262d]'
                  }`}
                >
                  All
                </button>
                {uniqueLanguages.map((lang) => {
                  const color = LANG_COLORS[lang] || '#8b949e';
                  const isActive = languageFilter === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => setLanguageFilter(isActive ? null : lang)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/30'
                          : 'bg-transparent text-[#8b949e] border-[#30363d] hover:bg-[#21262d]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Room List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#8b949e] animate-spin" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex items-center justify-center gap-4 mx-auto mb-6">
                  {/* Folder icon */}
                  <div className="w-20 h-20 rounded-2xl bg-[#21262d] relative float-bob">
                    <FolderOpen className="w-10 h-10 text-[#484f58] mx-auto mt-5" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#161b22] border-2 border-[#0d1117] flex items-center justify-center">
                      <Plus className="w-3 h-3 text-[#8b949e]" />
                    </div>
                  </div>
                  {/* Code bracket icon */}
                  <div className="w-20 h-20 rounded-2xl bg-[#21262d] relative float-bob" style={{ animationDelay: '0.5s' }}>
                    <Braces className="w-10 h-10 text-[#484f58] mx-auto mt-5" />
                    <div className="absolute -inset-1.5 rounded-2xl border border-[#58a6ff]/15 animate-[breathe-glow_3s_ease-in-out_infinite] pointer-events-none" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">
                  {searchQuery ? "No rooms match your search" : "No rooms yet"}
                </h2>
                <p className="text-[#8b949e] max-w-md mx-auto mb-8">
                  {searchQuery
                    ? "Try adjusting your search query to find what you're looking for."
                    : "Create a new room to start collaborating, or join an existing one with an invite code."}
                </p>
                {!searchQuery && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                    {/* JS quick-start card */}
                    <button
                      onClick={() => quickCreateRoom("javascript", "hello-js")}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#f7df1e]/40 transition-all duration-200 hover-lift glass-card w-full sm:w-auto cursor-pointer text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #f7df1e20, #f7df1e08)' }}>
                        <span className="text-lg leading-none">🟨</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#e6edf3] group-hover:text-[#f7df1e] transition-colors">Create a JavaScript Room</div>
                        <div className="text-xs text-[#8b949e]">Hello World starter</div>
                      </div>
                    </button>
                    {/* Python quick-start card */}
                    <button
                      onClick={() => quickCreateRoom("python", "hello-python")}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#3572a5]/40 transition-all duration-200 hover-lift glass-card w-full sm:w-auto cursor-pointer text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3572a520, #3572a508)' }}>
                        <span className="text-lg leading-none">🐍</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#e6edf3] group-hover:text-[#3572a5] transition-colors">Create a Python Room</div>
                        <div className="text-xs text-[#8b949e]">Print statement starter</div>
                      </div>
                    </button>
                    {/* Join with code card */}
                    <button
                      onClick={() => setJoinOpen(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#30363d] bg-[#161b22] hover:border-[#58a6ff]/40 transition-all duration-200 hover-lift glass-card w-full sm:w-auto cursor-pointer text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #58a6ff20, #58a6ff08)' }}>
                        <ArrowRight className="w-5 h-5 text-[#58a6ff]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">Join with Invite Code</div>
                        <div className="text-xs text-[#8b949e]">Enter a code to join</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room, index) => {
                  const langColor = LANG_COLORS[room.language] || "#8b949e";
                  const recent = isRecent(room.lastActiveAt);
                  const isStarred = favorites.includes(room.id);
                  const collabCount = room.collaboratorCount ?? room.collaborators?.length ?? 1;
                  const fileCount = room.files?.length ?? 1;
                  const firstFileContent = room.files?.[0]?.content || "";
                  const previewText = firstFileContent.replace(/\n/g, ' ').trim();
                  const isTruncated = previewText.length > 60;
                  const contentPreview = previewText.slice(0, 60);
                  /* Color the first word (keyword) differently */
                  const firstWord = contentPreview.split(/\s+/)[0] || "";
                  const restText = contentPreview.slice(firstWord.length);
                  return (
                    <motion.div
                      layout
                      key={room.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                    >
                    <Card
                      className="cursor-pointer border-[#30363d] hover:border-[#238636]/40 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden hover-lift press-effect"
                      style={{ background: "#161b22" }}
                      onClick={() => handleOpenRoom(room)}
                    >
                      {/* Animated gradient border on hover */}
                      <div
                        className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
                        style={{
                          background: `linear-gradient(135deg, ${langColor}40, rgba(88,166,255,0.2), ${langColor}30)`,
                          backgroundSize: '200% 200%',
                          animation: 'btn-gradient-shift 4s ease infinite',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          padding: '1.5px',
                          borderRadius: 'inherit',
                        }}
                      />
                      {/* Gradient overlay at bottom for depth */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(13,17,23,0.4) 0%, transparent 100%)',
                        }}
                      />
                      {/* Left accent line — golden when starred, thicker with glow */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                        style={{
                          backgroundColor: isStarred ? '#d29922' : langColor,
                          opacity: isStarred ? 1 : 0.7,
                          boxShadow: `0 0 8px ${isStarred ? '#d29922' : langColor}40`,
                        }}
                      />
                      {/* Delete button - top right, visible on hover, owner only */}
                      {user?.id === room.ownerId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteRoomId(room.id);
                          }}
                          className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(248,81,73,0.3)]"
                          aria-label="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {/* Star button - visible on hover */}
                      <button
                        onClick={(e) => toggleFavorite(room.id, e)}
                        className="absolute top-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md hover:bg-[#21262d]"
                        style={{ right: user?.id === room.ownerId ? '2.5rem' : '0.625rem' }}
                        aria-label={isStarred ? 'Unfavorite room' : 'Favorite room'}
                      >
                        <Star
                          className={`w-4 h-4 transition-colors duration-200 ${
                            isStarred ? 'text-[#d29922] fill-[#d29922]' : 'text-[#8b949e] hover:text-[#d29922]'
                          }`}
                        />
                      </button>
                      <CardHeader className="pb-3 pl-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCode2 className="w-4 h-4 text-[#8b949e] shrink-0" />
                            <CardTitle className="text-[#e6edf3] text-base font-semibold line-clamp-1">
                              {room.name}
                            </CardTitle>
                          </div>
                          {/* Language pill + file count */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            <div
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] text-[#8b949e] transition-colors group-hover:text-[#e6edf3]"
                            >
                              <FolderOpen className="w-3 h-3" />
                              {fileCount}
                            </div>
                            <div
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-shadow duration-300 hover:shadow-[0_0_8px_var(--glow-color)]"
                              style={{
                                backgroundColor: `${langColor}15`,
                                color: langColor,
                                border: `1px solid ${langColor}30`,
                                '--glow-color': `${langColor}40`,
                              } as React.CSSProperties}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langColor }} />
                              {room.language}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pl-5">
                        <CardDescription className="text-[#8b949e] text-sm mb-2">
                          Code:{" "}
                          <span
                            className="font-mono text-[#58a6ff] cursor-pointer hover:underline hover:shadow-[0_0_8px_rgba(88,166,255,0.2)] transition-shadow duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(room.inviteCode);
                            }}
                          >
                            {room.inviteCode}
                          </span>
                          <Copy className="inline w-3 h-3 ml-1 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                        </CardDescription>
                        {/* Content preview */}
                        {contentPreview && (
                          <p className="font-mono text-xs text-[#484f58] mb-3 pl-1 border-l-2 border-[#30363d] relative overflow-hidden whitespace-nowrap">
                            <span className="text-[#ff7b72]">{firstWord}</span><span className="text-[#8b949e]">{restText}</span>
                            {/* Fade-out gradient overlay */}
                            {isTruncated && (
                              <span className="absolute inset-y-0 right-0 w-16 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, #161b22)' }} />
                            )}
                            {!isTruncated && (
                              <span className="text-[#484f58]">...</span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {/* Mini avatar stack */}
                            <div className="flex -space-x-1.5">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-[#30363d]"
                                style={{ backgroundColor: user?.avatarColor || '#238636' }}
                                title={room.ownerName === user?.name ? 'You' : (room.ownerName || 'You')}
                              >
                                {(room.ownerName === user?.name ? user?.name : (room.ownerName || 'U')).charAt(0).toUpperCase()}
                              </div>
                              {collabCount > 1 && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium text-[#8b949e] ring-1 ring-[#30363d] bg-[#30363d]">
                                  +{collabCount - 1}
                                </div>
                              )}
                            </div>
                            <span className="text-[#8b949e]">
                              {collabCount} collaborator{collabCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${recent ? "text-[#3fb950]" : "text-[#8b949e]"}`}
                            title={room.lastActiveAt ? `Last edited: ${new Date(room.lastActiveAt).toLocaleString()}` : undefined}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeAgo(room.lastActiveAt)}</span>
                          </div>
                        </div>
                        {/* Quick actions row - visible on hover */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#30363d]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRoom(room);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#238636]/15 text-[#3fb950] border border-[#238636]/25 hover:bg-[#238636]/25 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(room.inviteCode);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/25 hover:bg-[#58a6ff]/25 transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className="glass-card"
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#e6edf3]">
              Create New Room
            </DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Set up a new collaborative coding room
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRoom}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="room-name" className="text-[#e6edf3]">
                  Room Name
                </Label>
                <Input
                  id="room-name"
                  placeholder="e.g., Project Alpha"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636] focus:ring-1 focus:ring-[#238636]/30"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#e6edf3]">Language</Label>
                <Select value={newRoomLang} onValueChange={setNewRoomLang}>
                  <SelectTrigger
                    className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] w-full"
                  >
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#161b22",
                      border: "1px solid #30363d",
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <SelectItem
                        key={lang}
                        value={lang}
                        className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[lang] }} />
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#e6edf3]">Template</Label>
                <div className="max-h-[280px] overflow-y-auto rounded-md border border-[#30363d] bg-[#0d1117] p-2 custom-scrollbar">
                  {/* Prominent "Start from Scratch" option */}
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect(ROOM_TEMPLATES[0])}
                    className={`
                      w-full flex items-center gap-4 rounded-lg p-3 text-left transition-all duration-200 cursor-pointer mb-2
                      ${selectedTemplate.id === 'blank'
                        ? 'border-2 border-[#238636] shadow-[0_0_16px_rgba(35,134,54,0.3)] bg-[#238636]/5'
                        : 'border border-dashed border-[#484f58] hover:border-[#238636]/50 hover:bg-[#21262d]'
                      }
                    `}
                    style={{ background: selectedTemplate.id === 'blank' ? 'linear-gradient(135deg, #23863608, #161b22)' : '#161b22' }}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                      ${selectedTemplate.id === 'blank' ? 'bg-[#238636]/20' : 'bg-[#21262d]'}
                    `}>
                      <Plus className={`w-5 h-5 transition-colors ${selectedTemplate.id === 'blank' ? 'text-[#3fb950]' : 'text-[#8b949e]'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold leading-tight transition-colors ${selectedTemplate.id === 'blank' ? 'text-[#3fb950]' : 'text-[#e6edf3]'}`}>Start from Scratch</div>
                      <div className="text-xs text-[#8b949e] leading-tight mt-0.5">Empty files, ready for anything</div>
                    </div>
                    {selectedTemplate.id === 'blank' && (
                      <div className="ml-auto shrink-0">
                        <div className="w-5 h-5 rounded-full bg-[#238636] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                  {/* Separator */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex-1 h-px bg-[#30363d]" />
                    <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-medium">Templates</span>
                    <div className="flex-1 h-px bg-[#30363d]" />
                  </div>
                  {/* Template grid (excluding blank) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 stagger-grid">
                    {ROOM_TEMPLATES.filter(t => t.id !== 'blank').map((template) => {
                      const isSelected = selectedTemplate.id === template.id;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`
                            flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-all duration-200 cursor-pointer scale-in-soft relative
                            ${isSelected
                              ? 'border-2 border-[#238636] shadow-[0_0_12px_rgba(35,134,54,0.3)] hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(35,134,54,0.3)]'
                              : 'border border-[#30363d] hover:border-[#484f58] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                            }
                          `}
                          style={{ background: '#161b22' }}
                        >
                          {/* Checkmark for selected template */}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#238636] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <span className="text-2xl leading-none transition-transform duration-300 hover:animate-[float-subtle_2s_ease-in-out_infinite]">{template.icon}</span>
                          <span className="text-sm font-medium text-[#e6edf3] leading-tight">{template.name}</span>
                          <span className="text-xs text-[#8b949e] leading-tight line-clamp-2">{template.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                className="text-[#8b949e] hover:text-[#e6edf3]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#238636] hover:bg-[#2ea043] text-white hover-glow-green"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => { if (!open) setDeleteRoomId(null); }}>
        <AlertDialogContent style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#e6edf3]">Delete Room</AlertDialogTitle>
            <AlertDialogDescription className="text-[#8b949e]">
              Are you sure you want to delete this room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] hover:text-[#e6edf3]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteRoom();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Room Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#e6edf3]">Join a Room</DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Enter the invite code to join an existing room
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinRoom}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="text-[#e6edf3]">
                  Invite Code
                </Label>
                <Input
                  id="invite-code"
                  placeholder="e.g., ABCD-1234"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636] focus:ring-1 focus:ring-[#238636]/30 font-mono"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setJoinOpen(false)}
                className="text-[#8b949e] hover:text-[#e6edf3]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={joining}
                className="bg-[#238636] hover:bg-[#2ea043] text-white"
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}