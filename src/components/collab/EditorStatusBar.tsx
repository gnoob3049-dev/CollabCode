'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AVATAR_COLORS = [
  '#238636', '#58a6ff', '#a371f7', '#f85149', '#d29922',
  '#3fb950', '#79c0ff', '#d2a8ff', '#ffa657', '#ff7b72',
];

interface EditorStatusBarProps {
  fileName: string;
  language: string;
  cursorPosition: { line: number; column: number };
  connected: boolean;
  tabSize: number;
}

export default function EditorStatusBar({
  fileName,
  language,
  cursorPosition,
  connected,
  tabSize,
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
        className="absolute left-0 top-0 bottom-0 transition-colors duration-300"
        style={{ width: '2px', backgroundColor: connected ? '#238636' : '#f85149' }}
      />

      {/* Left side */}
      <div className="relative flex items-center gap-1 pl-2.5 pr-3">
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
          <TooltipContent side="top" className="text-xs">
            Click to copy file name
          </TooltipContent>
        </Tooltip>
        <span className="text-[#30363d]">│</span>
        <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">{displayLanguage}</span>
        <span className="text-[#30363d]">│</span>
        <span className="tabular-nums">
          Ln <span className="text-[#e6edf3]">{cursorPosition.line}</span>, Col <span className="text-[#e6edf3]">{cursorPosition.column}</span>
        </span>
        <span className="text-[#30363d]">│</span>
        <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">Spaces: {tabSize}</span>
        <span className="text-[#30363d]">│</span>
        <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">UTF-8</span>
        <span className="text-[#30363d]">│</span>
        <span className="transition-colors duration-200 hover:text-[#e6edf3] cursor-default">LF</span>
      </div>

      {/* Right side */}
      <div className="relative flex items-center gap-2 pl-3 pr-2.5">
        {/* Problems indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm transition-colors duration-200 hover:text-[#e6edf3] hover:bg-[#21262d] cursor-default">
              <span style={{ color: '#238636' }}>✓</span>
              <span>0 errors, 0 warnings</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
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
            <TooltipContent side="top" className="text-xs">
              {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''} online
            </TooltipContent>
          </Tooltip>
        )}

        <span className="text-[#30363d]">│</span>

        <span
          className={cn(
            'flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm transition-colors duration-300',
            connected ? 'text-[#238636] hover:bg-[#238636]/10' : 'text-[#f85149] hover:bg-[#f85149]/10'
          )}
        >
          <span
            className={cn(
              'inline-block rounded-full transition-colors duration-300',
              connected && 'pulse-dot'
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