'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCw, ExternalLink, Loader2, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlPreviewProps {
  code: string;
  visible: boolean;
  onClose: () => void;
}

function isCssCode(code: string): boolean {
  const trimmed = code.trim();
  // If the code contains HTML structure tags, it's HTML, not CSS
  if (/<(!DOCTYPE|html|head|body|div|span|p|h[1-6])/i.test(trimmed)) return false;
  // Check for CSS-like patterns
  const cssPatterns = [
    /[{]/,            // CSS rule block
    /@media/,         // Media query
    /@import/,        // Import
    /@keyframes/,     // Keyframes
    /@font-face/,     // Font face
    /:root/,          // Root selector
    /--[\w-]+\s*:/,   // CSS custom properties
    /^\s*[.#\[:*][\w-]/m, // Selector at start of line
  ];
  const matchCount = cssPatterns.filter(p => p.test(trimmed)).length;
  return matchCount >= 1;
}

function wrapCssInHtml(css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #ffffff;
      color: #1f2937;
    }
    ${css}
  </style>
</head>
<body>
  <h1>CSS Preview</h1>
  <p>This is a preview of your CSS styles.</p>
  <div class="container">
    <h2>Heading 2</h2>
    <p>Paragraph text with <a href="#">a link</a>, <strong>bold text</strong>, and <em>italic text</em>.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
    <button>Button</button>
    <input type="text" placeholder="Input field" />
    <div class="box">.box element</div>
  </div>
</body>
</html>`;
}

export default function HtmlPreview({ code, visible, onClose }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const immediateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [srcdoc, setSrcdoc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const prevVisible = useRef(visible);

  // Compute the HTML to render
  const computeHtml = useCallback((codeStr: string): string => {
    if (!codeStr.trim()) {
      return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:-apple-system,sans-serif;color:#8b949e;background:#f6f8fa;">
<p style="font-size:14px;">No content to preview</p>
</body></html>`;
    }
    if (isCssCode(codeStr)) {
      return wrapCssInHtml(codeStr);
    }
    return codeStr;
  }, []);

  // Debounced update of srcdoc
  useEffect(() => {
    if (!visible) return;

    // Clear any pending timers
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (immediateTimerRef.current) clearTimeout(immediateTimerRef.current);

    // If just became visible, show content immediately (no debounce)
    if (visible && !prevVisible.current) {
      prevVisible.current = true;
      immediateTimerRef.current = setTimeout(() => {
        setSrcdoc(computeHtml(code));
        setIsUpdating(false);
        immediateTimerRef.current = null;
      }, 0);
      return () => {
        if (immediateTimerRef.current) {
          clearTimeout(immediateTimerRef.current);
          immediateTimerRef.current = null;
        }
      };
    }

    // Normal debounced update: show updating indicator, then update after 500ms
    immediateTimerRef.current = setTimeout(() => {
      setIsUpdating(true);
      immediateTimerRef.current = null;
    }, 0);

    debounceRef.current = setTimeout(() => {
      setSrcdoc(computeHtml(code));
      setIsUpdating(false);
      debounceRef.current = null;
    }, 500);

    return () => {
      if (immediateTimerRef.current) {
        clearTimeout(immediateTimerRef.current);
        immediateTimerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [code, visible, computeHtml]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    const html = computeHtml(code);
    setSrcdoc('');
    requestAnimationFrame(() => {
      setSrcdoc(html);
    });
  }, [code, computeHtml]);

  // Open in new tab
  const handleOpenNewTab = useCallback(() => {
    const html = computeHtml(code);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [code, computeHtml]);

  // Bottom-edge resize handler
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragStartY.current = clientY;
      dragStartHeight.current = previewHeight ?? (e.currentTarget.parentElement?.offsetHeight ?? 300);

      const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
        const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        // Dragging up increases height, dragging down decreases
        const delta = dragStartY.current - moveClientY;
        const newHeight = Math.max(150, Math.min(1200, dragStartHeight.current + delta));
        setPreviewHeight(newHeight);
      };

      const handleDragEnd = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    },
    [previewHeight]
  );

  if (!visible) return null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden border-l border-[#30363d]"
      style={{ background: '#0d1117', height: previewHeight ?? '100%' }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between h-10 px-3 shrink-0 border-b border-[#30363d]"
        style={{ background: 'linear-gradient(180deg, #161b22 0%, #13171e 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#238636] shrink-0" />
          <span className="text-xs font-medium text-[#e6edf3]">Preview</span>

          {/* Updating indicator */}
          <AnimatePresence>
            {isUpdating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
              >
                <Loader2 className="size-3 text-[#8b949e] animate-spin" />
                <span className="text-[10px] text-[#8b949e]">Updating...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="size-7 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
            aria-label="Refresh preview"
            title="Refresh preview"
          >
            <RotateCw className="size-3.5" />
          </button>

          {/* Open in new tab */}
          <button
            onClick={handleOpenNewTab}
            className="size-7 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors"
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
            aria-label="Close preview"
            title="Close preview"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe container */}
      <div className="flex-1 min-h-0 relative">
        {/* Subtle loading bar at bottom when updating */}
        <AnimatePresence>
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none flex justify-center pb-1"
            >
              <div className="h-0.5 w-16 rounded-full bg-[#238636]/40 overflow-hidden">
                <motion.div
                  className="h-full bg-[#238636] rounded-full"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {srcdoc ? (
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-white"
            title="HTML Preview"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#161b22]">
            <div className="flex flex-col items-center gap-2 text-[#8b949e]">
              <div className="size-5 border-2 border-[#30363d] border-t-[#238636] rounded-full animate-spin" />
              <span className="text-xs">Loading preview...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-edge resize drag handle */}
      <div
        className={cn(
          'shrink-0 h-3 flex items-center justify-center cursor-ns-resize border-t border-[#30363d] transition-colors',
          isResizing
            ? 'bg-[#238636]/20'
            : 'bg-[#161b22] hover:bg-[#30363d]/50'
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Drag to resize preview"
      >
        <GripHorizontal className="size-3 text-[#484f58]" />
      </div>
    </div>
  );
}