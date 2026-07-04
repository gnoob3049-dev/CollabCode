'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Trash2, Terminal, ChevronUp, ChevronDown, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OutputPanelProps {
  output: string;
  isRunning: boolean;
  onClear: () => void;
  onClose: () => void;
  onToggle: () => void;
}

type OutputTab = 'output' | 'problems';

export default function OutputPanel({
  output,
  isRunning,
  onClear,
  onClose,
  onToggle,
}: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>('output');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [output]);

  const outputLines = output.split('\n');

  const handleCopy = useCallback(() => {
    if (output.trim()) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Output copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  return (
    <div className="flex flex-col border-t border-[#30363d]" style={{ height: '100%' }}>
      {/* Resize handle */}
      <div className="resize-handle h-1 bg-transparent hover:bg-[#238636]/30 transition-colors cursor-ns-resize" />

      {/* Compact header with tabs */}
      <div className="flex items-center justify-between px-2 border-b border-[#30363d] bg-[#0d1117] shrink-0 h-8">
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onToggle}
              >
                <ChevronDown className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle panel</TooltipContent>
          </Tooltip>

          {/* Tab bar */}
          <div className="flex items-center ml-1">
            {(['output', 'problems'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors relative',
                  activeTab === tab
                    ? 'text-[#e6edf3]'
                    : 'text-[#484f58] hover:text-[#8b949e]'
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#238636] rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            {isRunning ? (
              <>
                <div className="flex gap-0.5">
                  <span className="inline-block size-1 rounded-full bg-[#238636] animate-pulse" />
                  <span className="inline-block size-1 rounded-full bg-[#238636] animate-pulse [animation-delay:150ms]" />
                  <span className="inline-block size-1 rounded-full bg-[#238636] animate-pulse [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-[#238636] font-medium">Running...</span>
              </>
            ) : output.trim() ? (
              <span className="text-[10px] text-[#3fb950] font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#3fb950]" />
                Ready
              </span>
            ) : (
              <span className="text-[10px] text-[#484f58]">Ready</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Copy button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={handleCopy}
                disabled={!output.trim()}
              >
                {copied ? <Check className="size-3 text-[#238636]" /> : <Copy className="size-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy output</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onClear}
                disabled={!output.trim()}
              >
                <Trash2 className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear output</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onClose}
              >
                <X className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 bg-[#0d1117]">
        {activeTab === 'output' ? (
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-3">
              {output.trim() === '' && !isRunning ? (
                <div className="flex flex-col items-center justify-center h-20 text-[#30363d] gap-2">
                  <Terminal className="size-5" />
                  <span className="text-xs">No output yet</span>
                </div>
              ) : (
                <pre className="font-mono text-xs leading-5 whitespace-pre-wrap break-all">
                  {outputLines.map((line, i) => {
                    const isError = isErrorLine(line);
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex',
                          isError && '-mx-3 px-3'
                        )}
                        style={isError ? { backgroundColor: 'rgba(248, 81, 73, 0.06)' } : undefined}
                      >
                        <span className="select-none text-[#30363d] w-7 shrink-0 text-right mr-3 text-[10px]">
                          {i + 1}
                        </span>
                        <span
                          className={cn(
                            isError
                              ? 'text-[#f85149]'
                              : 'text-[#e6edf3]'
                          )}
                        >
                          {line || '\u00A0'}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#30363d] gap-2">
            <AlertTriangle className="size-5" />
            <span className="text-xs">No problems detected</span>
          </div>
        )}
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