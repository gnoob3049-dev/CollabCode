'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Save,
  Share2,
  MessageSquare,
  Sparkles,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

interface EditorTopBarProps {
  room: Room | null;
  user: User | null;
  onlineUsers: PresenceUser[];
  language: string;
  onLanguageChange: (lang: string) => void;
  onRun: () => void;
  onSave: () => void;
  onShare: () => void;
  onToggleChat: () => void;
  onToggleAI: () => void;
  onToggleOutput: () => void;
  onBack: () => void;
  rightPanelOpen: boolean;
  outputPanelOpen: boolean;
  unreadChatCount: number;
  isRunning: boolean;
  isSaving: boolean;
  onRenameRoom: (name: string) => void;
}

export default function EditorTopBar({
  room,
  user,
  onlineUsers,
  language,
  onLanguageChange,
  onRun,
  onSave,
  onShare,
  onToggleChat,
  onToggleAI,
  onToggleOutput,
  onBack,
  rightPanelOpen,
  outputPanelOpen,
  unreadChatCount,
  isRunning,
  isSaving,
  onRenameRoom,
}: EditorTopBarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const displayName = isEditingName ? editName : (room?.name || 'Untitled');

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== room?.name) {
      onRenameRoom(trimmed);
    }
    setIsEditingName(false);
    setEditName('');
  };

  const startEditing = () => {
    setEditName(room?.name || '');
    setIsEditingName(true);
  };

  return (
    <div className="flex items-center justify-between h-12 px-3 border-b border-[#30363d] bg-[#161b22] shrink-0 gap-2">
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1.5 min-w-0">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNameSubmit();
                }
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditName('');
                }
              }}
              className="bg-[#0d1117] text-sm font-semibold text-[#e6edf3] outline-none px-2 py-0.5 rounded border border-[#238636] max-w-[200px]"
            />
          ) : (
            <button
              className="text-sm font-semibold text-[#e6edf3] truncate hover:text-white transition-colors"
              onDoubleClick={startEditing}
              title="Double-click to rename"
            >
              {room?.name || 'Untitled'}
            </button>
          )}
        </div>
      </div>

      {/* Center - Language selector (hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger
            size="sm"
            className="w-[140px] h-7 text-xs bg-[#0d1117] border-[#30363d] text-[#e6edf3] hover:bg-[#0d1117]/80"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
            {LANGUAGES.map((lang) => (
              <SelectItem
                key={lang.value}
                value={lang.value}
                className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3] text-xs"
              >
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Online users */}
        <div className="hidden sm:flex items-center mr-1">
          <div className="flex -space-x-1.5">
            {onlineUsers.slice(0, 4).map((u) => (
              <Tooltip key={u.id}>
                <TooltipTrigger asChild>
                  <div
                    className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#161b22]"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{u.name}</TooltipContent>
              </Tooltip>
            ))}
            {onlineUsers.length > 4 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-medium text-[#8b949e] border-2 border-[#161b22] bg-[#30363d]">
                    +{onlineUsers.length - 4}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {onlineUsers
                    .slice(4)
                    .map((u) => u.name)
                    .join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-[#30363d] mx-1 hidden sm:block" />

        {/* Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              onClick={onShare}
            >
              <Share2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share</TooltipContent>
        </Tooltip>

        {/* Run */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-[#238636] hover:text-[#2ea043] hover:bg-[#238636]/10"
              onClick={onRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Run Code</TooltipContent>
        </Tooltip>

        {/* Save */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-[#30363d] mx-1" />

        {/* Terminal toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 hover:bg-[#30363d]',
                outputPanelOpen
                  ? 'text-[#e6edf3] bg-[#30363d]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              )}
              onClick={onToggleOutput}
            >
              <Terminal className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Output Panel</TooltipContent>
        </Tooltip>

        {/* AI Assist */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 hover:bg-[#30363d]',
                rightPanelOpen
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-[#8b949e] hover:text-purple-400'
              )}
              onClick={onToggleAI}
            >
              <Sparkles className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">AI Assist</TooltipContent>
        </Tooltip>

        {/* Chat */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 hover:bg-[#30363d]"
              onClick={onToggleChat}
            >
              {unreadChatCount > 0 && (
                <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px] bg-[#238636] border-none">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </Badge>
              )}
              <MessageSquare
                className={cn(
                  'size-4',
                  rightPanelOpen
                    ? 'text-[#e6edf3]'
                    : 'text-[#8b949e] group-hover:text-[#e6edf3]'
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Chat</TooltipContent>
        </Tooltip>

        {/* Panel toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] hidden sm:flex"
              onClick={rightPanelOpen ? onToggleChat : onToggleAI}
            >
              {rightPanelOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {rightPanelOpen ? 'Close Panel' : 'Open Panel'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}