'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShortcutEntry {
  keys: string[];
  description: string;
  comingSoon?: boolean;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SECTIONS: ShortcutSection[] = [
  {
    title: 'Editor',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save' },
      { keys: ['Ctrl', 'Enter'], description: 'Run Code' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate Line', comingSoon: true },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'F'], description: 'Find' },
      { keys: ['Ctrl', 'H'], description: 'Replace' },
    ],
  },
  {
    title: 'Panels',
    shortcuts: [
      { keys: ['Ctrl', 'B'], description: 'Toggle Side Panel' },
      { keys: ['Ctrl', 'J'], description: 'Toggle Terminal' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Toggle Preview' },
      { keys: ['Ctrl', '`'], description: 'Toggle Terminal (Alt)' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'P'], description: 'Command Palette' },
      { keys: ['Ctrl', 'G'], description: 'Go to Line' },
      { keys: ['Ctrl', 'P'], description: 'Quick Open File' },
      { keys: ['Ctrl', '/'], description: 'Show Shortcuts' },
      { keys: ['Escape'], description: 'Close Panels' },
    ],
  },
];

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-xs font-medium text-[#e6edf3] rounded"
      style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(230, 237, 243, 0.05)',
        fontFamily: "'Geist Mono', 'Fira Code', monospace",
        lineHeight: '1',
      }}
    >
      {label}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutEntry }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-[#30363d]/40 transition-all duration-150 border-l-2 border-transparent hover:border-l-[#238636]/70 -ml-2 pl-3">
      <span className="text-sm text-[#8b949e] flex items-center gap-2">
        {shortcut.description}
        {shortcut.comingSoon && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#21262d] text-[#484f58] border border-[#30363d]">
            soon
          </span>
        )}
      </span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[#484f58] text-xs">+</span>
            )}
            <KeyBadge label={key} />
          </span>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden"
        style={{
          backgroundColor: '#161b22',
          borderColor: '#30363d',
        }}
      >
        {/* Gradient top accent line */}
        <div className="h-1 bg-gradient-to-r from-[#238636] via-[#58a6ff] to-[#a371f7]" />

        <DialogHeader className="p-5 pb-0">
          <DialogTitle
            className="text-base font-semibold text-[#e6edf3]"
          >
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8b949e]">
            Press a key combination to perform an action
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3 pt-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3
                className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5 px-1"
              >
                {section.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                {section.shortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.description} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#30363d]/50 flex items-center justify-between">
          <span className="text-[10px] text-[#30363d]">CollabCode v1.0</span>
          <span className="text-[10px] text-[#30363d]">
            {SECTIONS.reduce((acc, s) => acc + s.shortcuts.length, 0)} shortcuts
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}