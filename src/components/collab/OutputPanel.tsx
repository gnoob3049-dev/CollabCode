'use client';

import { useRef, useEffect } from 'react';
import { X, Trash2, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OutputPanelProps {
  output: string;
  isRunning: boolean;
  onClear: () => void;
  onClose: () => void;
  onToggle: () => void;
}

export default function OutputPanel({
  output,
  isRunning,
  onClear,
  onClose,
  onToggle,
}: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [output]);

  const outputLines = output.split('\n');

  return (
    <div className="flex flex-col border-t border-[#30363d]" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d] bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={onToggle}
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Terminal className="size-3.5 text-[#8b949e]" />
          <span className="text-xs font-medium text-[#8b949e]">OUTPUT</span>
          {isRunning && (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="flex gap-0.5">
                <span className="inline-block size-1.5 rounded-full bg-[#238636] animate-pulse" />
                <span className="inline-block size-1.5 rounded-full bg-[#238636] animate-pulse [animation-delay:150ms]" />
                <span className="inline-block size-1.5 rounded-full bg-[#238636] animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-[#238636]">Running...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={onClear}
            title="Clear output"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={onClose}
            title="Close panel"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Output content */}
      <div className="flex-1 min-h-0 bg-[#0d1117]">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-3">
            {output.trim() === '' && !isRunning ? (
              <div className="flex items-center justify-center h-20 text-[#484f58] text-sm">
                No output yet
              </div>
            ) : (
              <pre className="font-mono text-xs leading-5 whitespace-pre-wrap break-all">
                {outputLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-[#484f58] w-8 shrink-0 text-right mr-3">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        isErrorLine(line) ? 'text-red-400' : 'text-[#e6edf3]'
                      )}
                    >
                      {line || '\u00A0'}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function isErrorLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith('error') ||
    lower.startsWith('err:') ||
    lower.includes('traceback') ||
    lower.includes('exception') ||
    lower.includes('failed') ||
    lower.includes('syntaxerror') ||
    lower.includes('referenceerror') ||
    lower.includes('typeerror') ||
    lower.startsWith('  at ')
  );
}