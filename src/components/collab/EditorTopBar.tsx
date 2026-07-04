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
  Download,
  Inbox,
  Paintbrush,
  MoreHorizontal,
  FolderTree,
  ClipboardList,
  WrapText,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onFormat: () => void;
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
  onToggleNotifications: () => void;
  notificationsOpen: boolean;
  unreadNotificationCount: number;
  isReadOnly?: boolean;
  isOwner?: boolean;
  onExport?: () => void;
  onToggleMobileFileTree?: () => void;
  onToggleActivityLog?: () => void;
  activityLogOpen?: boolean;
  onToggleWordWrap?: () => void;
  wordWrap?: 'on' | 'off';
  collaborators?: PresenceUser[];
}

export default function EditorTopBar({
  room,
  user,
  onlineUsers,
  language,
  onLanguageChange,
  onRun,
  onSave,
  onFormat,
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
  onToggleNotifications,
  notificationsOpen,
  unreadNotificationCount,
  isReadOnly = false,
  isOwner = false,
  onExport,
  onToggleMobileFileTree,
  onToggleActivityLog,
  activityLogOpen = false,
  onToggleWordWrap,
  wordWrap = 'on',
  collaborators,
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

  // Buttons to show in the "More" dropdown on very small screens
  const moreButtons = [
    { label: 'Audio', icon: audioEnabled ? Bell : BellOff, action: onToggleAudio || (() => {}) },
    { label: 'History', icon: History, action: onToggleHistory, active: historyOpen },
    { label: 'Activity Log', icon: ClipboardList, action: onToggleActivityLog || (() => {}), active: activityLogOpen },
    { label: 'Settings', icon: Settings, action: onOpenSettings },
    { label: 'Shortcuts', icon: HelpCircle, action: onOpenShortcuts },
    ...(onExport ? [{ label: 'Export', icon: Download, action: onExport }] : []),
  ];

  return (
    <div className="relative flex flex-col shrink-0">
      {/* Gradient background top bar */}
      <div
        className="flex items-center justify-between h-11 md:h-12 px-2 md:px-3 shrink-0 gap-1 md:gap-2 overflow-hidden"
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
                className="size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] shrink-0 press-effect"
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
              <div className="relative group/name">
                <button
                  className="text-sm font-semibold text-[#e6edf3] truncate hover:text-white transition-colors"
                  onDoubleClick={startEditing}
                  title="Double-click to rename"
                >
                  {room?.name || 'Untitled'}
                </button>
                {/* Gradient underline animation */}
                <div
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full opacity-60 group-hover/name:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #238636, #58a6ff, #a371f7, #238636)',
                    backgroundSize: '300% 100%',
                    animation: 'name-underline-shift 4s ease infinite',
                  }}
                />
              </div>
            )}
          </div>

          {/* Collaborator avatar stack */}
          {collaborators && collaborators.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="group flex items-center ml-1 cursor-default">
                  <div className="flex -space-x-1.5 transition-transform duration-200 group-hover:scale-105">
                    {collaborators.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        className="relative size-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#13171e] transition-transform duration-200 hover:-translate-y-0.5"
                        style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}30` }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-px -right-px size-[6px] rounded-full bg-[#238636] ring-1 ring-[#13171e]" />
                      </div>
                    ))}
                    {collaborators.length > 4 && (
                      <div className="relative size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#8b949e] ring-2 ring-[#13171e] bg-[#30363d] transition-transform duration-200 hover:-translate-y-0.5">
                        +{collaborators.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#8b949e] font-medium mb-0.5">
                    {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
                  </span>
                  {collaborators.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-[#e6edf3]">{c.name}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Center - Language selector (hidden on mobile) */}
        <div className="hidden md:flex items-center shrink-0">
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
                  className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3] text-xs hover:scale-[1.02] transition-transform duration-150"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                    {lang.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Word Wrap Toggle */}
          <div className="hidden sm:flex items-center ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleWordWrap}
                  className={cn(
                    'flex items-center justify-center size-7 rounded-md transition-all duration-150 press-effect',
                    wordWrap === 'on'
                      ? 'text-[#3fb950] word-wrap-active hover:bg-[#238636]/10'
                      : 'text-[#484f58] hover:text-[#8b949e] hover:bg-[#30363d]/60'
                  )}
                  aria-label="Toggle word wrap"
                >
                  <WrapText className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Word Wrap (Alt+Z)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          {/* Connection status indicator with enhanced pulse */}
          <div className="hidden sm:flex items-center mr-1">
            {isConnected ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#238636]/10">
                    <Wifi className="size-3 text-[#238636]" />
                    <span className="text-[10px] text-[#238636] font-medium">Live</span>
                    <span className="relative flex items-center justify-center">
                      <span className="absolute size-3 rounded-full bg-[#238636]/40 animate-ping" style={{ animationDuration: '2s' }} />
                      <span className="relative size-1.5 rounded-full bg-[#238636]" style={{ boxShadow: '0 0 6px #23863680' }} />
                    </span>
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
                    <span className="relative flex items-center justify-center">
                      <span className="absolute size-3 rounded-full bg-[#f85149]/50 animate-ping" style={{ animationDuration: '1.2s' }} />
                      <span className="relative size-1.5 rounded-full bg-[#f85149]" style={{ boxShadow: '0 0 6px #f8514980' }} />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Disconnected from room</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Divider: navigation | actions */}
          <div className="w-px h-5 bg-[#30363d]/50 mx-1 hidden sm:block" />

          {/* Mobile file tree toggle */}
          {onToggleMobileFileTree && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                  onClick={onToggleMobileFileTree}
                  aria-label="Toggle file tree"
                >
                  <FolderTree className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">File Tree</TooltipContent>
            </Tooltip>
          )}

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 md:size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                onClick={onShare}
                aria-label="Share invite link"
              >
                <Share2 className="size-3.5 md:size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy invite link</TooltipContent>
          </Tooltip>

          {/* Run */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 md:size-8 text-[#238636] hover:text-[#3fb950] hover:bg-[#238636]/10 hover:shadow-[0_0_12px_rgba(35,134,54,0.2)] press-effect"
                onClick={onRun}
                disabled={isRunning || isLockedForUser}
                aria-label="Run code"
              >
                {isRunning ? (
                  <Loader2 className="size-3.5 md:size-4 animate-spin" />
                ) : (
                  <Play className="size-3.5 md:size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Run (Ctrl+Enter)</TooltipContent>
          </Tooltip>

          {/* Save */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 md:size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                onClick={onSave}
                disabled={isSaving || isLockedForUser}
                aria-label="Save room"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 md:size-4 animate-spin" />
                ) : (
                  <Save className="size-3.5 md:size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          {/* Divider: actions | panels */}
          <div className="w-px h-4 md:h-5 bg-[#30363d]/50 mx-0.5 md:mx-1" />

          {/* HTML Preview toggle — desktop only */}
          {showPreview && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'hidden md:flex size-8 hover:bg-[#30363d]',
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
              <TooltipContent side="bottom">Preview</TooltipContent>
            </Tooltip>
          )}

          {/* Terminal toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-7 md:size-8 hover:bg-[#30363d] relative',
                  outputPanelOpen
                    ? 'text-[#e6edf3] bg-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
                onClick={onToggleOutput}
                aria-label="Toggle output panel"
              >
                <Terminal className="size-3.5 md:size-4" />
                {outputPanelOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#238636', boxShadow: '0 0 6px #23863680' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Terminal</TooltipContent>
          </Tooltip>

          {/* AI Assist */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-7 md:size-8 hover:bg-[#30363d] relative',
                  rightPanelOpen
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-[#8b949e] hover:text-purple-400'
                )}
                onClick={onToggleAI}
                aria-label="Toggle AI assistant"
              >
                <Sparkles className="size-3.5 md:size-4" />
                {rightPanelOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#a371f7', boxShadow: '0 0 6px #a371f780' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">AI</TooltipContent>
          </Tooltip>

          {/* Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-7 md:size-8 hover:bg-[#30363d]"
                onClick={onToggleChat}
                aria-label={unreadChatCount > 0 ? `Chat (${unreadChatCount})` : 'Chat'}
              >
                {unreadChatCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px] bg-[#238636] border-none glow-green animate-pulse">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </Badge>
                )}
                <MessageSquare
                  className={cn(
                    'size-3.5 md:size-4',
                    rightPanelOpen
                      ? 'text-[#e6edf3]'
                      : 'text-[#8b949e]'
                  )}
                />
                {rightPanelOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#58a6ff', boxShadow: '0 0 6px #58a6ff80' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Chat</TooltipContent>
          </Tooltip>

          {/* Audio — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'hidden sm:flex size-8 hover:bg-[#30363d]',
                  audioEnabled
                    ? 'text-[#e6edf3]'
                    : 'text-[#484f58] hover:text-[#8b949e]'
                )}
                onClick={onToggleAudio}
                aria-label={audioEnabled ? 'Disable audio' : 'Enable audio'}
              >
                {audioEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Audio {audioEnabled ? 'on' : 'off'}
            </TooltipContent>
          </Tooltip>

          {/* History — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'hidden sm:flex size-8 hover:bg-[#30363d] relative',
                  historyOpen
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
                onClick={onToggleHistory}
                aria-label="Version History"
              >
                <History className="size-4" />
                {historyOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#d29922', boxShadow: '0 0 6px #d2992280' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">History (Ctrl+Shift+H)</TooltipContent>
          </Tooltip>

          {/* Activity Log — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'hidden sm:flex size-8 hover:bg-[#30363d] press-effect relative',
                  activityLogOpen
                    ? 'text-[#f0883e] bg-[#f0883e]/10'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
                onClick={onToggleActivityLog}
                aria-label="Activity Log"
              >
                <ClipboardList className="size-4" />
                {activityLogOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#f78166', boxShadow: '0 0 6px #f7816680' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Activity Log</TooltipContent>
          </Tooltip>

          {/* Export — desktop only */}
          {onExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                  onClick={onExport}
                  aria-label="Download as ZIP"
                >
                  <Download className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download ZIP</TooltipContent>
            </Tooltip>
          )}

          {/* Notifications — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'hidden sm:flex relative size-8 hover:bg-[#30363d]',
                  notificationsOpen
                    ? 'text-[#e6edf3] bg-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#e6edf3]'
                )}
                onClick={onToggleNotifications}
                aria-label={unreadNotificationCount > 0 ? `Notifications (${unreadNotificationCount})` : 'Notifications'}
              >
                {unreadNotificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px] bg-[#58a6ff] border-none badge-pop">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Badge>
                )}
                <Inbox className="size-4" />
                {notificationsOpen && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full" style={{ backgroundColor: '#58a6ff', boxShadow: '0 0 6px #58a6ff80' }} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>

          {/* Divider: panels | tools */}
          <div className="w-px h-4 md:h-5 bg-[#30363d]/50 mx-0.5 md:mx-1 hidden sm:block" />

          {/* Settings — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                onClick={onOpenSettings}
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>

          {/* Shortcuts — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] press-effect"
                onClick={onOpenShortcuts}
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Shortcuts (Ctrl+/)</TooltipContent>
          </Tooltip>

          {/* Mobile "More" dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden size-8 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[#161b22] border-[#30363d] text-[#e6edf3]"
            >
              {moreButtons.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  className={cn(
                    'text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3] gap-2',
                    'active' in item && item.active && 'text-[#58a6ff]'
                  )}
                  onClick={item.action}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[#30363d]" />
              <DropdownMenuItem
                className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3] gap-2"
                onClick={onToggleNotifications}
              >
                <Inbox className="size-4" />
                Notifications
                {unreadNotificationCount > 0 && (
                  <Badge className="ml-auto size-4 p-0 flex items-center justify-center text-[10px] bg-[#58a6ff] border-none">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Name underline animation keyframes */}
      <style>{`
        @keyframes name-underline-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}