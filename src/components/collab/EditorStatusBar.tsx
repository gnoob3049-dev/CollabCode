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
      className="flex items-center justify-between px-3 shrink-0 select-none"
      style={{
        height: '24px',
        background: '#161b22',
        borderTop: '1px solid #30363d',
        fontSize: '11px',
        color: '#8b949e',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span className="text-[#e6edf3]">{fileName}</span>
        <span>{displayLanguage}</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span>Spaces: {tabSize}</span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full"
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: connected ? '#238636' : '#f85149',
            }}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}