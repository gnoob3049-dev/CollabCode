"use client";

import { useEffect, useState, useCallback, useMemo, type FormEvent } from "react";
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

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

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

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem
                            disabled
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#8b949e] cursor-not-allowed opacity-50 hover:bg-[#30363d] focus:bg-[#30363d] outline-none transition-colors duration-100"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
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
                { icon: Hash, label: "Total Rooms", value: rooms.length, color: "#238636" },
                { icon: Users, label: "Collaborators", value: totalCollaborators, color: "#58a6ff" },
                { icon: FileCode2, label: "Languages", value: [...new Set(rooms.map(r => r.language))].length, color: "#d29922" },
                { icon: Clock, label: "Active Now", value: rooms.filter(r => isRecent(r.lastActiveAt)).length, color: "#3fb950" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[#30363d] p-3 sm:p-4 flex items-center gap-3 transition-transform duration-200 hover:scale-[1.03] cursor-default"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}03)`,
                    backgroundColor: '#161b22',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-[#e6edf3]">{stat.value}</div>
                    <div className="text-xs text-[#8b949e]">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-8 bg-[#161b22] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] text-sm focus:border-[#238636]/50 focus:ring-1 focus:ring-[#238636]/30 focus:shadow-[0_0_8px_rgba(35,134,54,0.12)]"
                  />
                </div>
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

            {/* Room List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#8b949e] animate-spin" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-[#21262d] mx-auto mb-6 relative float-bob">
                  <FolderOpen className="w-12 h-12 text-[#484f58]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#161b22] border-2 border-[#0d1117] flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-[#8b949e]" />
                  </div>
                  {/* Pulsing glow ring */}
                  <div className="absolute -inset-2 rounded-2xl border border-[#238636]/20 animate-[breathe-glow_3s_ease-in-out_infinite] pointer-events-none" />
                </div>
                <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">
                  {searchQuery ? "No rooms match your search" : "No rooms yet"}
                </h2>
                <p className="text-[#8b949e] max-w-md mx-auto mb-6">
                  {searchQuery
                    ? "Try adjusting your search query to find what you're looking for."
                    : "Create a new room to start collaborating, or join an existing one with an invite code."}
                </p>
                {!searchQuery && (
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setJoinOpen(true)}
                      className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]"
                    >
                      <ArrowRight className="w-4 h-4 mr-1.5" />
                      Join with Code
                    </Button>
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="bg-[#238636] hover:bg-[#2ea043] text-white"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create Room
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const langColor = LANG_COLORS[room.language] || "#8b949e";
                  const recent = isRecent(room.lastActiveAt);
                  return (
                    <motion.div
                      layout
                      key={room.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                    <Card
                      className="cursor-pointer border-[#30363d] hover:border-[#238636]/40 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden hover-lift"
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
                      {/* Left accent line */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                        style={{ backgroundColor: langColor, opacity: 0.6 }}
                      />
                      {/* Delete button - top right, visible on hover, owner only */}
                      {user?.id === room.ownerId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteRoomId(room.id);
                          }}
                          className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md text-red-400 hover:bg-red-500/10"
                          aria-label="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <CardHeader className="pb-3 pl-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCode2 className="w-4 h-4 text-[#8b949e] shrink-0" />
                            <CardTitle className="text-[#e6edf3] text-base font-semibold line-clamp-1">
                              {room.name}
                            </CardTitle>
                          </div>
                          {/* Language pill */}
                          <div
                            className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-shadow duration-300 hover:shadow-[0_0_8px_var(--glow-color)]"
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
                      </CardHeader>
                      <CardContent className="pl-5">
                        <CardDescription className="text-[#8b949e] text-sm mb-4">
                          Code:{" "}
                          <span
                            className="font-mono text-[#58a6ff] cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(room.inviteCode);
                            }}
                          >
                            {room.inviteCode}
                          </span>
                          <Copy className="inline w-3 h-3 ml-1 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                        </CardDescription>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-[#8b949e]">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {room.collaboratorCount ?? room.collaborators?.length ?? 1} collaborator
                              {(room.collaboratorCount ?? room.collaborators?.length ?? 1) !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div
                            className={`flex items-center gap-1 ${recent ? "text-[#3fb950]" : "text-[#8b949e]"} group/tooltip relative`}
                            title={room.lastActiveAt ? `Last edited: ${new Date(room.lastActiveAt).toLocaleString()}` : undefined}
                          >
                            {/* Last edited by indicator */}
                            <div className="flex items-center gap-1 mr-1.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full ring-1 ring-[#30363d]"
                                style={{ backgroundColor: user?.avatarColor || '#238636' }}
                                title={user?.name || 'You'}
                              />
                              <span className="text-[10px] text-[#484f58]">{room.ownerName === user?.name ? 'You' : (room.ownerName || 'You')}</span>
                            </div>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeAgo(room.lastActiveAt)}</span>
                          </div>
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
                <div className="max-h-[240px] overflow-y-auto rounded-md border border-[#30363d] bg-[#0d1117] p-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 stagger-grid">
                    {ROOM_TEMPLATES.map((template) => {
                      const isSelected = selectedTemplate.id === template.id;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`
                            flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-all duration-200 cursor-pointer
                            ${isSelected
                              ? 'border-2 border-[#238636] shadow-[0_0_12px_rgba(35,134,54,0.3)]'
                              : 'border border-[#30363d] hover:border-[#484f58] hover:scale-[1.02]'
                            }
                          `}
                          style={{ background: '#161b22' }}
                        >
                          <span className="text-2xl leading-none">{template.icon}</span>
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
                className="bg-[#238636] hover:bg-[#2ea043] text-white"
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