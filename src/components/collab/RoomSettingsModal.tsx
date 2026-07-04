'use client';

import { useState } from 'react';
import { Copy, Check, Loader2, Eye, EyeOff, Lock, ShieldAlert, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Room, User, PresenceUser } from '@/store/useStore';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'rust', label: 'Rust' },
];

interface RoomSettingsModalProps {
  room: Room | null;
  user: User | null;
  onlineUsers: PresenceUser[];
  open: boolean;
  onClose: () => void;
  onUpdate: (room: Room) => void;
}

export default function RoomSettingsModal({
  room,
  user,
  onlineUsers,
  open,
  onClose,
  onUpdate,
}: RoomSettingsModalProps) {
  const [name, setName] = useState(room?.name || '');
  const [language, setLanguage] = useState(room?.language || 'javascript');
  const [isPublic, setIsPublic] = useState(room?.isPublic ?? true);
  const [isReadOnly, setIsReadOnly] = useState(room?.isReadOnly ?? false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readOnlyDialogOpen, setReadOnlyDialogOpen] = useState(false);
  const [pendingReadOnly, setPendingReadOnly] = useState(false);

  const isOwner = user?.id === room?.ownerId;

  const handleCopyInviteCode = () => {
    if (!room?.inviteCode) return;
    navigator.clipboard.writeText(room.inviteCode).then(() => {
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReadOnlyToggle = (checked: boolean) => {
    if (checked !== isReadOnly) {
      setPendingReadOnly(checked);
      setReadOnlyDialogOpen(true);
    }
  };

  const confirmReadOnly = async () => {
    setReadOnlyDialogOpen(false);
    setIsReadOnly(pendingReadOnly);

    if (!room?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isReadOnly: pendingReadOnly }),
      });
      const data = await res.json();
      if (data.room) {
        onUpdate(data.room);
        toast.success(
          pendingReadOnly
            ? 'Read-only mode enabled'
            : 'Read-only mode disabled'
        );
      } else {
        toast.error(data.error || 'Failed to update');
        setIsReadOnly(!pendingReadOnly);
      }
    } catch {
      toast.error('Failed to update');
      setIsReadOnly(!pendingReadOnly);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!room?.id) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Room name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          language,
          isPublic,
          isReadOnly,
        }),
      });
      const data = await res.json();
      if (data.room) {
        onUpdate(data.room);
        toast.success('Settings saved');
        onClose();
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="sm:max-w-md"
        style={{ background: '#161b22', border: '1px solid #30363d' }}
      >
        {/* Gradient accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#238636] via-[#58a6ff] to-[#a371f7] rounded-t-lg" />
        <DialogHeader className="pt-2">
          <DialogTitle className="text-[#e6edf3] flex items-center gap-2">
            <Settings className="size-4 text-[#8b949e]" />
            Room Settings
          </DialogTitle>
          <DialogDescription className="text-[#8b949e]">
            Configure your collaborative coding room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="settings-name" className="text-[#e6edf3]">
              Room Name
            </Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636]/50 focus:ring-1 focus:ring-[#238636]/30 focus:shadow-[0_0_8px_rgba(35,134,54,0.12)] transition-all duration-200"
              placeholder="Enter room name"
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-[#e6edf3]">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] w-full"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent
                style={{ background: '#161b22', border: '1px solid #30363d' }}
              >
                {LANGUAGES.map((lang) => (
                  <SelectItem
                    key={lang.value}
                    value={lang.value}
                    className="text-[#e6edf3] focus:bg-[#21262d] focus:text-[#e6edf3]"
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[#e6edf3]">Visibility</Label>
              <p className="text-xs text-[#8b949e]">
                {isPublic ? 'Anyone with the invite code can join' : 'Only invited users can join'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye className="size-4 text-[#8b949e]" />
              ) : (
                <EyeOff className="size-4 text-[#8b949e]" />
              )}
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          {/* Read-Only Mode — only visible to owner */}
          {isOwner && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[#e6edf3]">Read-Only Mode</Label>
                <p className="text-xs text-[#8b949e]">
                  Prevent collaborators from editing files
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isReadOnly ? (
                  <Lock className="size-4 text-[#f0883e]" />
                ) : (
                  <Lock className="size-4 text-[#8b949e]" />
                )}
                <Switch
                  checked={isReadOnly}
                  onCheckedChange={handleReadOnlyToggle}
                />
              </div>
            </div>
          )}

          {/* Invite Code */}
          <div className="space-y-2">
            <Label className="text-[#e6edf3]">Invite Code</Label>
            <div className="flex items-center gap-2">
              <Input
                value={room?.inviteCode || ''}
                readOnly
                className="bg-[#0d1117] border-[#30363d] text-[#58a6ff] font-mono text-sm flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] h-9 w-9"
                onClick={handleCopyInviteCode}
              >
                {copied ? (
                  <Check className="size-4 text-[#238636]" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Collaborators */}
          <div className="space-y-2">
            <Label className="text-[#e6edf3]">
              Collaborators ({onlineUsers.length} online)
            </Label>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-md max-h-36 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-[#484f58] p-3">No one is online right now</p>
              ) : (
                <div className="divide-y divide-[#21262d]">
                  {onlineUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5 px-3 py-2">
                      <div
                        className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-[#e6edf3] truncate">{u.name}</span>
                      {u.id === user?.id && (
                        <span className="text-[10px] text-[#484f58] ml-auto shrink-0">(you)</span>
                      )}
                      <span className="size-2 rounded-full bg-[#238636] ml-auto shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Confirmation dialog for read-only toggle */}
      <AlertDialog open={readOnlyDialogOpen} onOpenChange={setReadOnlyDialogOpen}>
        <AlertDialogContent
          style={{ background: '#161b22', border: '1px solid #30363d' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#e6edf3] flex items-center gap-2">
              <ShieldAlert className="size-4 text-[#f0883e]" />
              {pendingReadOnly ? 'Enable Read-Only Mode?' : 'Disable Read-Only Mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#8b949e]">
              {pendingReadOnly
                ? 'Collaborators will no longer be able to edit files, run code, create or delete files in this room. The room owner will still have full access.'
                : 'Collaborators will regain the ability to edit files, run code, and manage files in this room.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="text-[#8b949e] hover:text-[#e6edf3] border-[#30363d] hover:bg-[#21262d]"
              onClick={() => setReadOnlyDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#f0883e] hover:bg-[#d47630] text-white"
              onClick={confirmReadOnly}
            >
              {pendingReadOnly ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}