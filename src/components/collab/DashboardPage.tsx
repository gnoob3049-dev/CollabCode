"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import {
  Code2,
  Plus,
  LogOut,
  Users,
  Copy,
  Loader2,
  FolderOpen,
  Clock,
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

  // Create room dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLang, setNewRoomLang] = useState("javascript");
  const [creating, setCreating] = useState(false);

  // Join room dialog
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", { credentials: "include" });
      if (res.status === 401) {
        // Not authenticated
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

      // Enter the room
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
      // First try to find the room - we'll join via the invite code
      // The API handles both finding and joining
      const roomsRes = await fetch("/api/rooms", { credentials: "include" });
      const allRooms = await roomsRes.json();
      const room = (Array.isArray(allRooms) ? allRooms : []).find(
        (r: Room) => r.inviteCode === inviteCode.trim()
      );

      if (!room) {
        // Try joining via the join endpoint
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0d1117" }}
    >
      {/* Top Bar */}
      <header className="border-b border-[#30363d] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#238636]">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#e6edf3]">
              CollabCode
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
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
          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3]">
                Your Rooms
              </h1>
              <p className="text-[#8b949e] mt-1">
                Create or join a room to start coding together
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setJoinOpen(true)}
                className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]"
              >
                Join Room
              </Button>
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#238636] hover:bg-[#2ea043] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create New Room
              </Button>
            </div>
          </div>

          {/* Room List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#8b949e] animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#21262d] mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-[#8b949e]" />
              </div>
              <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">
                No rooms yet
              </h2>
              <p className="text-[#8b949e] max-w-md mx-auto mb-6">
                Create a new room to start collaborating, or join an existing
                one with an invite code.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setJoinOpen(true)}
                  className="border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]"
                >
                  Join with Code
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Room
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer border-[#30363d] hover:border-[#484f58] transition-colors group"
                  style={{ background: "#161b22" }}
                  onClick={() => handleOpenRoom(room)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-[#e6edf3] text-base font-semibold line-clamp-1">
                        {room.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs bg-[#21262d] text-[#8b949e] border-[#30363d]"
                      >
                        {room.language}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                      <Copy className="inline w-3 h-3 ml-1 text-[#484f58] group-hover:text-[#8b949e]" />
                    </CardDescription>
                    <div className="flex items-center justify-between text-xs text-[#8b949e]">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {room.collaboratorCount ?? room.collaborators?.length ?? 1} collaborator
                          {(room.collaboratorCount ?? room.collaborators?.length ?? 1) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeAgo(room.lastActiveAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

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
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#58a6ff]"
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
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
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
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#58a6ff] font-mono"
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