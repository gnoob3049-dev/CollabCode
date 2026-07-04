'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bell, BellOff, GitBranch } from 'lucide-react';

const AVATAR_COLORS = [
  '#238636', '#58a6ff', '#a371f7', '#f85149', '#d29922',
  '#3fb950', '#79c0ff', '#d2a8ff', '#ffa657', '#ff7b72',
];

const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  cpp: '#f34b7d',
  go: '#00add8',
  html: '#e34c26',
  css: '#563d7c',
  sql: '#e38c00',
  rust: '#dea584',
};

interface EditorStatusBarProps {
  fileName: string;
  language: string;
  cursorPosition: { line: number; column: number };
  connected: boolean;
  tabSize: number;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onGoToLine?: () => void;
  selectionLength?: number;
}

export default function EditorStatusBar({
  fileName,
  language,
  cursorPosition,
  connected,
  tabSize,
  audioEnabled = true,
  onToggleAudio,
  onGoToLine,
  selectionLength = 0,
}: EditorStatusBarProps) {
  const displayLanguage = language.charAt(0).toUpperCase() + language.slice(1);
  const [copied, setCopied] = useState(false);

  // Simulated collaborator count (in real app, this would come from presence data)
  const collaboratorCount = 3;
  const visibleAvatars = Math.min(collaboratorCount, 5);
  const overflowCount = Math.max(0, collaboratorCount - 5);

  const handleCopyFileName = useCallback(() => {
    navigator.clipboard.writeText(fileName).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // silently fail
    });
  }, [fileName]);

  return (
    <div
      className="flex items-center justify-between shrink-0 select-none relative overflow-hidden"
      style={{
        height: '24px',
        background: 'linear-gradient(90deg, #161b22 0%, #13171e 100%)',
        borderTop: '1px solid #30363d',
        fontSize: '11px',
        color: '#8b949e',
      }}
    >
      {/* Subtle top gradient border - green tinted */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(35,134,54,0.3) 50%, transparent 100%)',
        }}
      />

      {/* Animated gradient shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none status-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(35,134,54,0.03) 30%, rgba(88,166,255,0.02) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'btn-gradient-shift 8s ease infinite',
        }}
      />

      {/* Left green accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 transition-colors duration-300 panel-glow"
        style={{ width: '2px', backgroundColor: connected ? '#238636' : '#f85149' }}
      />

      {/* Left side */}
      <div className="relative flex items-center gap-1 pl-2.5 pr-3">
        {/* Git branch indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-colors duration-200 hover:text-[#e6edf3] hover:bg-[#21262d] cursor-default">
              <GitBranch className="size-3" />
              <span className="font-medium">main</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Current branch: main
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>

        {/* File name with click-to-copy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopyFileName}
              className="text-[#e6edf3] font-medium hover:text-[#3fb950] transition-colors duration-150 cursor-pointer"
            >
              {copied ? (
                <span className="text-[#3fb950]">Copied!</span>
              ) : (
                fileName
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Click to copy file name
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>

        {/* Language with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: LANG_COLORS[language] || '#8b949e', boxShadow: `0 0 4px ${LANG_COLORS[language] || '#8b949e'}60` }}
              />
              {displayLanguage}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Language: {displayLanguage}
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>

        {/* Line/col — clickable to open Go to Line */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onGoToLine}
              className="tabular-nums hover:text-[#e6edf3] transition-colors duration-150 cursor-pointer"
            >
              Ln <span className="text-[#e6edf3]">{cursorPosition.line}</span>, Col <span className="text-[#e6edf3]">{cursorPosition.column}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Go to Line (Ctrl+G)
          </TooltipContent>
        </Tooltip>

        {/* Selection info */}
        {selectionLength > 0 && (
          <>
            <span className="text-[#30363d]">│</span>
            <span className="text-[#d29922]">
              Selected: {selectionLength} character{selectionLength !== 1 ? 's' : ''}
            </span>
          </>
        )}

        <span className="text-[#30363d]">│</span>

        {/* Tab size with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">Spaces: {tabSize}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Tab size: {tabSize} spaces
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>

        {/* Encoding with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">UTF-8</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            File encoding: UTF-8
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>

        {/* Line ending with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">LF</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Line ending: LF (Unix)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right side */}
      <div className="relative flex items-center gap-2 pl-3 pr-2.5">
        {/* Problems indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm transition-colors duration-200 hover:text-[#e6edf3] hover:bg-[#21262d] cursor-default scale-in-soft">
              <span style={{ color: '#238636' }}>✓</span>
              <span>0 errors, 0 warnings</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            No problems detected
          </TooltipContent>
        </Tooltip>

        <span className="text-[#30363d]">│</span>

        {/* Collaborator avatar dots */}
        {collaboratorCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5 cursor-default">
                {Array.from({ length: visibleAvatars }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full -ml-0.5 first:ml-0 transition-transform duration-150 hover:scale-125"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      boxShadow: `0 0 4px ${AVATAR_COLORS[i % AVATAR_COLORS.length]}60`,
                    }}
                  />
                ))}
                {overflowCount > 0 && (
                  <span className="text-[10px] text-[#8b949e] ml-0.5">
                    +{overflowCount}
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
              {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''} online
            </TooltipContent>
          </Tooltip>
        )}

        <span className="text-[#30363d]">│</span>

        {/* Audio notifications toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleAudio}
              className={cn(
                'flex items-center justify-center transition-colors duration-200 hover:bg-[#21262d] cursor-pointer rounded-sm p-0.5',
                audioEnabled ? 'text-[#8b949e] hover:text-[#e6edf3]' : 'text-[#484f58] hover:text-[#8b949e]'
              )}
              aria-label={audioEnabled ? 'Disable audio notifications' : 'Enable audio notifications'}
            >
              {audioEnabled ? <Bell className="size-3" /> : <BellOff className="size-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#161b22]/95 backdrop-blur-sm border-[#30363d]">
            Audio notifications {audioEnabled ? 'on' : 'off'}
          </TooltipContent>
        </Tooltip>

        <span
          className={cn(
            'flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm transition-colors duration-300',
            connected ? 'text-[#238636] hover:bg-[#238636]/10' : 'text-[#f85149] hover:bg-[#f85149]/10'
          )}
        >
          <span
            className={cn(
              'inline-block rounded-full transition-colors duration-300',
              connected && 'status-breathe'
            )}
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: connected ? '#238636' : '#f85149',
            }}
          />
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
}