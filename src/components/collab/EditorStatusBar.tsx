'use client';

import { cn } from '@/lib/utils';

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
        <span className="text-[#e6edf3] font-medium">{fileName}</span>
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
      <div className="relative flex items-center gap-1.5 pl-3 pr-2.5">
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