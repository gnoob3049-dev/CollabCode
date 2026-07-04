'use client';

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
      className="flex items-center justify-between shrink-0 select-none relative"
      style={{
        height: '24px',
        background: '#161b22',
        borderTop: '1px solid #30363d',
        fontSize: '11px',
        color: '#8b949e',
      }}
    >
      {/* Left green accent line */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: '2px', backgroundColor: '#238636' }}
      />

      {/* Left side */}
      <div className="flex items-center gap-1 pl-2.5 pr-3">
        <span className="text-[#e6edf3] font-medium">{fileName}</span>
        <span className="text-[#484f58]">|</span>
        <span>{displayLanguage}</span>
        <span className="text-[#484f58]">|</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="text-[#484f58]">|</span>
        <span>Spaces: {tabSize}</span>
        <span className="text-[#484f58]">|</span>
        <span>UTF-8</span>
        <span className="text-[#484f58]">|</span>
        <span>LF</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 pl-3 pr-2.5">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full"
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