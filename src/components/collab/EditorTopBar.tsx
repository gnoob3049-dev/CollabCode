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
  FolderCode,
  Settings,
  Wifi,
  WifiOff,
  HelpCircle,
  Eye,
  Bell,
  BellOff,
  History,
  Lock,
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

const LANGUAGES: Record<string, { value: string; label: string; color: string }> = {
  javascript: { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  typescript: { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  python: { value: 'python', label: 'Python', color: '#3572a5' },
  java: { value: 'java', label: 'Java', color: '#b07219' },
  cpp: { value: 'cpp', label: 'C++', color: '#f34b7d' },
  go: { value: 'go', label: 'Go', color: '#00add8' },
  html: { value: 'html', label: 'HTML', color: '#e34c26' },
  css: { value: 'css', label: 'CSS', color: '#563d7c' },
  sql: { value: 'sql', label: 'SQL', color: '#e38c00' },
  rust: { value: 'rust', label: 'Rust', color: '#dea584' },
};

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
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onTogglePreview: () => void;
  previewOpen: boolean;
  showPreview: boolean;
  isConnected?: boolean;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onToggleHistory: () => void;
  historyOpen: boolean;
  isReadOnly?: boolean;
  isOwner?: boolean;
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
  onOpenSettings,
  onOpenShortcuts,
  onTogglePreview,
  previewOpen,
  showPreview,
  isConnected = true,
  audioEnabled = true,
  onToggleAudio,
  onToggleHistory,
  historyOpen,
  isReadOnly = false,
  isOwner = false,
}: EditorTopBarProps) {
  const isLockedForUser = isReadOnly && !isOwner;
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

  const currentLang = LANGUAGES[language];

  return (
    <div className="relative flex flex-col shrink-0">
      {/* Gradient background top bar */}
      <div
        className="flex items-center justify-between h-12 px-3 shrink-0 gap-2"
        style={{
          background: 'linear-gradient(180deg, #161b22 0%, #13171e 100%)',
        }}
      >
        {/* Left section */}
        <div className="flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] shrink-0"
                onClick={onBack}
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5 min-w-0">
            <FolderCode className="size-3.5 text-[#8b949e] shrink-0" />
            {isLockedForUser && (
              <Lock className="size-3.5 text-[#f0883e] shrink-0" />
            )}
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
              {currentLang && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentLang.color }} />
                  <SelectValue />
                </div>
              )}
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
              {Object.values(LANGUAGES).map((lang) => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                  className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3] text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                    {lang.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Connection status indicator */}
          <div className="hidden sm:flex items-center mr-1">
            {isConnected ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#238636]/10">
                    <Wifi className="size-3 text-[#238636]" />
                    <span className="text-[10px] text-[#238636] font-medium">Live</span>
                    <span className="size-1.5 rounded-full bg-[#238636] pulse-dot" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Connected to room</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f85149]/10">
                    <WifiOff className="size-3 text-[#f85149]" />
                    <span className="text-[10px] text-[#f85149] font-medium">Offline</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Disconnected from room</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Online users */}
          <div className="hidden sm:flex items-center mr-1">
            <div className="flex -space-x-1.5">
              {onlineUsers.slice(0, 4).map((u) => (
                <Tooltip key={u.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#13171e]"
                      style={{ backgroundColor: u.color, boxShadow: `0 0 6px ${u.color}40` }}
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
                    <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-medium text-[#8b949e] ring-2 ring-[#13171e] bg-[#30363d]">
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
                aria-label="Share invite link"
              >
                <Share2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy invite link to clipboard</TooltipContent>
          </Tooltip>

          {/* Run */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#238636] hover:text-[#3fb950] hover:bg-[#238636]/10 hover:shadow-[0_0_12px_rgba(35,134,54,0.2)]"
                onClick={onRun}
                disabled={isRunning || isLockedForUser}
                aria-label="Run code"
              >
                {isRunning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Run code (Ctrl+Enter)</TooltipContent>
          </Tooltip>

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onSave}
                disabled={isSaving || isLockedForUser}
                aria-label="Save room"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-[#30363d] mx-1" />

          {/* HTML Preview toggle */}
          {showPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-8 hover:bg-[#30363d]',
                    previewOpen
                      ? 'text-[#e6edf3] bg-[#30363d]'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  )}
                  onClick={onTogglePreview}
                  aria-label="Toggle preview"
                >
                  <Eye className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle Preview (Ctrl+Shift+V)</TooltipContent>
            </Tooltip>
          )}

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
                aria-label="Toggle output panel"
              >
                <Terminal className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle output panel</TooltipContent>
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
                aria-label="Toggle AI assistant"
              >
                <Sparkles className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle AI assistant panel</TooltipContent>
          </Tooltip>

          {/* Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-8 hover:bg-[#30363d]"
                onClick={onToggleChat}
                aria-label={unreadChatCount > 0 ? `Toggle chat (${unreadChatCount} unread)` : 'Toggle chat'}
              >
                {unreadChatCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px] bg-[#238636] border-none glow-green animate-pulse">
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
            <TooltipContent side="bottom">Toggle team chat ({unreadChatCount > 0 ? `${unreadChatCount} unread` : 'no new messages'})</TooltipContent>
          </Tooltip>

          {/* Audio notifications toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-8 hover:bg-[#30363d]',
                  audioEnabled
                    ? 'text-[#e6edf3]'
                    : 'text-[#484f58] hover:text-[#8b949e]'
                )}
                onClick={onToggleAudio}
                aria-label={audioEnabled ? 'Disable audio notifications' : 'Enable audio notifications'}
              >
                {audioEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Audio notifications {audioEnabled ? 'on' : 'off'}
            </TooltipContent>
          </Tooltip>

          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-8 hover:bg-[#30363d]',
                  historyOpen
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
                onClick={onToggleHistory}
                aria-label="Version History"
              >
                <History className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Version History (Ctrl+Shift+H)</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onOpenSettings}
                aria-label="Room settings"
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Room Settings</TooltipContent>
          </Tooltip>

          {/* Shortcuts help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onOpenShortcuts}
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Keyboard Shortcuts (Ctrl+/)</TooltipContent>
          </Tooltip>

          {/* Panel toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] hidden sm:flex"
                onClick={rightPanelOpen ? onToggleChat : onToggleAI}
                aria-label={rightPanelOpen ? 'Close side panel' : 'Open side panel'}
              >
                {rightPanelOpen ? (
                  <PanelRightClose className="size-4" />
                ) : (
                  <PanelRightOpen className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {rightPanelOpen ? 'Close side panel (Ctrl+B)' : 'Open side panel (Ctrl+B)'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Thin green accent line at the bottom */}
      <div
        className="h-[2px] shrink-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #238636 20%, #58a6ff 50%, #238636 80%, transparent 100%)',
          opacity: 0.5,
        }}
      />
    </div>
  );
}