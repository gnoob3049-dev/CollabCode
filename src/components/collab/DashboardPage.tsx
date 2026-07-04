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
import { useStore, type Room } from "@/store/useStore";

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
  const [creating, setCreating] = useState(false);

  // Join room dialog
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

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
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          language: newRoomLang,
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

      setCurrentRoom(data.room);
      setCurrentRoomId(data.room.id);
      setLanguage(data.room.language);
      setCurrentFileName("index.js");
      setCurrentPage("editor");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
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

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const avatarColor = user?.avatarColor || "#238636";

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="border-b border-[#30363d] px-4 sm:px-6 py-3 bg-[#0d1117]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#238636] glow-green">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#e6edf3]">
                CollabCode
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#238636]/50 ring-offset-2 ring-offset-[#0d1117]"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initial}
                </div>
                <span className="hidden sm:block text-sm text-[#e6edf3] font-medium">
                  {user?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d]"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
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
                  className="rounded-lg border border-[#30363d] bg-[#161b22] p-3 sm:p-4 flex items-center gap-3"
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
                  Create or join a room to start coding together
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
                    className="w-full h-9 pl-8 bg-[#161b22] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] text-sm focus:border-[#238636]/50 focus:ring-1 focus:ring-[#238636]/30"
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
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Create New Room</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {/* Room List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#8b949e] animate-spin" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[#21262d] mx-auto mb-6 relative">
                  <FolderOpen className="w-10 h-10 text-[#484f58]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#161b22] border-2 border-[#0d1117] flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-[#8b949e]" />
                  </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const langColor = LANG_COLORS[room.language] || "#8b949e";
                  const recent = isRecent(room.lastActiveAt);
                  return (
                    <Card
                      key={room.id}
                      className="cursor-pointer border-[#30363d] hover:border-[#238636]/40 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
                      style={{ background: "#161b22" }}
                      onClick={() => handleOpenRoom(room)}
                    >
                      {/* Left accent line */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                        style={{ backgroundColor: langColor, opacity: 0.6 }}
                      />
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
                            className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${langColor}15`,
                              color: langColor,
                              border: `1px solid ${langColor}30`,
                            }}
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
                            className={`flex items-center gap-1 ${recent ? "text-[#3fb950]" : "text-[#8b949e]"}`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeAgo(room.lastActiveAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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