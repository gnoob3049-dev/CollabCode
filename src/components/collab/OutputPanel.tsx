'use client';

import { useState, useRef, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  Terminal,
  AlertTriangle,
  Copy,
  Check,
  X,
  Loader2,
  Circle,
  ExternalLink,
  Info,
  Trash2,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ANSI color code parser — returns React nodes
function parseAnsi(text: string): ReactNode[] {
  const ANSI_RE = /\x1b\[([0-9;]*)m/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Color map for basic ANSI codes
  const colorMap: Record<number, string> = {
    0: '',     // reset
    1: '',     // bold
    31: '#f85149', // red
    32: '#3fb950', // green
    33: '#d29922', // yellow
    36: '#58a6ff', // cyan
  };

  let currentBold = false;
  let currentColor = '';

  while ((match = ANSI_RE.exec(text)) !== null) {
    // Push text before this code
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      nodes.push(
        <span
          key={`t-${lastIndex}`}
          style={{
            color: currentColor || undefined,
            fontWeight: currentBold ? 'bold' : undefined,
          }}
        >
          {segment}
        </span>
      );
    }

    // Parse the code
    const code = match[1];
    if (code === '0') {
      currentBold = false;
      currentColor = '';
    } else if (code === '1') {
      currentBold = true;
    } else {
      const num = parseInt(code, 10);
      if (colorMap[num]) {
        currentColor = colorMap[num];
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex);
    nodes.push(
      <span
        key={`t-${lastIndex}`}
        style={{
          color: currentColor || undefined,
          fontWeight: currentBold ? 'bold' : undefined,
        }}
      >
        {segment}
      </span>
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

interface OutputPanelProps {
  output: string;
  isRunning: boolean;
  onClear: () => void;
  onClose: () => void;
  onToggle: () => void;
  isHtml?: boolean;
  isCss?: boolean;
  executionTime?: number;
}

export default function OutputPanel({
  output,
  isRunning,
  onClear,
  onClose,
  onToggle,
  isHtml = false,
  isCss = false,
  executionTime,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'problems'>('output');
  const [copied, setCopied] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate a blob URL for the HTML iframe
  const htmlBlobUrl = useMemo(() => {
    if (!isHtml || !output) return null;
    const blob = new Blob([output], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [isHtml, output]);

  // Cleanup blob URL on unmount or change
  useEffect(() => {
    return () => {
      if (htmlBlobUrl) URL.revokeObjectURL(htmlBlobUrl);
    };
  }, [htmlBlobUrl]);

  // Cleanup clear timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

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
      // Copy with line numbers
      const lines = output.split('\n');
      const numbered = lines.map((line, i) => `${String(i + 1).padStart(4, ' ')}  ${line}`).join('\n');
      navigator.clipboard.writeText(numbered);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleClear = useCallback(() => {
    if (!clearConfirm) {
      // First click — enter confirmation state
      setClearConfirm(true);
      clearTimerRef.current = setTimeout(() => {
        setClearConfirm(false);
        clearTimerRef.current = null;
      }, 2000);
    } else {
      // Second click — actually clear
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setClearConfirm(false);
      onClear();
    }
  }, [clearConfirm, onClear]);

  // Preview in browser: open HTML in a new tab
  const handlePreviewInBrowser = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
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

  // Execution time display
  const executionTimeDisplay = useMemo(() => {
    if (executionTime === undefined || executionTime === null || isRunning) return null;
    const ms = Math.round(executionTime);
    let color = '#3fb950'; // green
    if (ms >= 2000) color = '#f85149'; // red
    else if (ms >= 500) color = '#d29922'; // yellow
    return { ms, color };
  }, [executionTime, isRunning]);

  return (
    <div
      ref={panelRef}
      className="flex flex-col border-t border-[#30363d] h-full min-h-0 relative panel-glow"
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
                ? 'bg-[#0d1117] text-[#e6edf3] shadow-[0_2px_8px_rgba(35,134,54,0.2)]'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#0d1117]/50'
            )}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="size-3" />
              Output
              {output && !isHtml && (
                <span className="text-[9px] text-[#484f58] font-normal ml-1">
                  {lines.length} lines
                </span>
              )}
              {isHtml && (
                <span className="text-[9px] text-[#e34c26] font-semibold ml-1">HTML</span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'problems'
                ? 'bg-[#0d1117] text-[#e6edf3] shadow-[0_2px_8px_rgba(88,166,255,0.2)]'
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

          {/* Execution time */}
          {executionTimeDisplay && output && (
            <TooltipWrapper label="Execution time">
              <span
                className="flex items-center gap-1 text-[10px] font-medium mr-1.5 px-1.5 py-0.5 rounded"
                style={{ color: executionTimeDisplay.color }}
              >
                <Timer className="size-3" />
                {executionTimeDisplay.ms}ms
              </span>
            </TooltipWrapper>
          )}

          {/* Preview in browser (HTML only) */}
          {isHtml && htmlBlobUrl && (
            <TooltipWrapper label="Preview in browser">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={handlePreviewInBrowser}
              >
                <ExternalLink className="size-3" />
              </Button>
            </TooltipWrapper>
          )}

          {/* Copy */}
          <TooltipWrapper label={copied ? 'Copied with line numbers!' : 'Copy with line numbers'}>
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
          </TooltipWrapper>

          {/* Clear with confirmation state */}
          <TooltipWrapper label={clearConfirm ? 'Click again to confirm' : 'Clear output'}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'size-6 transition-colors duration-200',
                clearConfirm
                  ? 'text-[#f85149] hover:text-[#f85149] hover:bg-[#f85149]/10'
                  : 'text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10'
              )}
              onClick={handleClear}
              disabled={!output}
            >
              {clearConfirm ? (
                <span className="text-[9px] font-bold leading-none">✓</span>
              ) : (
                <Trash2 className="size-3" />
              )}
            </Button>
          </TooltipWrapper>

          {/* Close */}
          <TooltipWrapper label="Close panel">
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              onClick={onClose}
            >
              <X className="size-3.5" />
            </Button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'output' ? (
        isHtml && htmlBlobUrl ? (
          /* HTML iframe preview */
          <div className="flex-1 min-h-0 bg-white">
            <iframe
              ref={iframeRef}
              src={htmlBlobUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-modals"
              title="HTML Preview"
            />
          </div>
        ) : isCss ? (
          /* CSS message */
          <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center flex flex-col items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#563d7c]/10">
                <Info className="size-5 text-[#563d7c]" />
              </div>
              <div>
                <p className="text-sm text-[#e6edf3] font-medium mb-1">CSS Preview</p>
                <p className="text-xs text-[#8b949e] max-w-xs">
                  CSS preview is available in the Preview panel. Use the eye icon in the toolbar or press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-[#30363d] text-[#e6edf3] text-[10px] font-mono">Ctrl+Shift+V</kbd>{' '}
                  to toggle it.
                </p>
              </div>
            </div>
          </div>
        ) : (
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
                    // Check if line contains ANSI codes
                    const hasAnsi = /\x1b\[[0-9;]*m/.test(line);
                    return (
                      <div
                        key={i}
                        className={cn(
                          'px-1 -mx-1 rounded-sm fade-in-up slide-in-right-soft',
                          isError && 'bg-[#f85149]/10 text-[#f85149]',
                          isWarning && !isError && 'text-[#d29922]',
                          !isError && !isWarning && 'text-[#e6edf3]'
                        )}
                        style={{ animationDelay: `${Math.min(i * 20, 500)}ms` }}
                      >
                        <span className="inline-block w-6 text-right mr-3 text-[#30363d] select-none shrink-0">
                          {i + 1}
                        </span>
                        {hasAnsi && !isError && !isWarning ? (
                          <span>{parseAnsi(line)}</span>
                        ) : (
                          <span>{line || '\u00A0'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-[#30363d]">
                  <span className="flex items-center gap-2 text-xs">
                    <Terminal className="size-4" />
                    Run your code to see output here
                    <span className="terminal-cursor" />
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        )
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

/* Simple inline tooltip component to avoid importing the full Tooltip set */
function TooltipWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-[#1f2937] text-[#e6edf3] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {label}
      </div>
    </div>
  );
}