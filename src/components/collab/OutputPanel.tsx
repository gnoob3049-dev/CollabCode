'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Terminal,
  AlertTriangle,
  Copy,
  Check,
  X,
  Loader2,
  Circle,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'output' | 'problems'>('output');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get viewport ref
  useEffect(() => {
    if (scrollRef.current) {
      viewportRef.current = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLDivElement;
    }
  }, []);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [output]);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Resize handle drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = panelRef.current?.offsetHeight || 200;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = startYRef.current - e.clientY;
        const newHeight = Math.max(100, Math.min(500, startHeightRef.current + delta));
        if (panelRef.current) {
          panelRef.current.style.height = `${newHeight}px`;
          // Notify parent about height change
          const motionParent = panelRef.current.closest('[data-framer-motion]');
          if (motionParent) {
            motionParent.style.height = `${newHeight}px`;
          }
        }
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  // Parse output lines for coloring
  const lines = output.split('\n');

  return (
    <div
      ref={panelRef}
      className="flex flex-col border-t border-[#30363d] h-full min-h-0 relative"
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 bg-transparent hover:bg-[#238636]/30 active:bg-[#238636]/50 cursor-ns-resize z-10 transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* Header with tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d] shrink-0 bg-[#161b22]">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTab('output')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'output'
                ? 'bg-[#0d1117] text-[#e6edf3] shadow-sm shadow-[#238636]/10'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#0d1117]/50'
            )}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="size-3" />
              Output
            </span>
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'problems'
                ? 'bg-[#0d1117] text-[#e6edf3] shadow-sm shadow-[#d29922]/10'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#0d1117]/50'
            )}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="size-3" />
              Problems
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 mr-2">
            {isRunning ? (
              <span className="flex items-center gap-1.5 text-[10px] text-[#d29922]">
                <Loader2 className="size-3 animate-spin" />
                Running...
              </span>
            ) : output ? (
              <span className="flex items-center gap-1.5 text-[10px] text-[#238636]">
                <Circle className="size-1.5 fill-[#238636]" />
                Ready
              </span>
            ) : (
              <span className="text-[10px] text-[#484f58]">No output</span>
            )}
          </div>

          {/* Copy */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={handleCopy}
            disabled={!output}
          >
            {copied ? (
              <Check className="size-3 text-[#238636]" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>

          {/* Clear */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={onClear}
            disabled={!output}
          >
            <X className="size-3" />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
            onClick={onClose}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'output' ? (
        <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
          <div className="p-3 font-mono text-xs leading-relaxed">
            {isRunning && !output ? (
              <div className="flex items-center gap-2 text-[#8b949e] py-2">
                <Loader2 className="size-3.5 animate-spin text-[#d29922]" />
                <span>Executing code...</span>
              </div>
            ) : output ? (
              <div className="space-y-0">
                {lines.map((line, i) => {
                  const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('exception');
                  const isWarning = line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn');
                  return (
                    <div
                      key={i}
                      className={cn(
                        'px-1 -mx-1 rounded-sm fade-in-up',
                        isError && 'bg-[#f85149]/10 text-[#f85149]',
                        isWarning && !isError && 'text-[#d29922]',
                        !isError && !isWarning && 'text-[#e6edf3]'
                      )}
                      style={{ animationDelay: `${Math.min(i * 20, 500)}ms` }}
                    >
                      <span className="inline-block w-6 text-right mr-3 text-[#30363d] select-none shrink-0">
                        {i + 1}
                      </span>
                      {line || '\u00A0'}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-[#30363d]">
                <span className="flex items-center gap-2 text-xs terminal-cursor">
                  <Terminal className="size-4" />
                  Run your code to see output here
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#484f58] text-xs">
          <div className="text-center">
            <AlertTriangle className="size-5 mx-auto mb-2 text-[#30363d]" />
            <p>No problems detected</p>
          </div>
        </div>
      )}
    </div>
  );
}