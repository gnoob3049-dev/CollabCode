'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  isHtml?: boolean;
  isCss?: boolean;
}

export default function OutputPanel({
  output,
  isRunning,
  onClear,
  onClose,
  onToggle,
  isHtml = false,
  isCss = false,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'problems'>('output');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

          {/* Clear output (Trash2) */}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10"
            onClick={onClear}
            disabled={!output}
          >
            <Trash2 className="size-3" />
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
                        {line || '\u00A0'}
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