'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, type LucideIcon } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string[];
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export default function CommandPalette({
  open,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when open changes (adjusting state during render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  // Filter commands by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    );
  }, [query, commands]);

  // Reset selected index when query changes (adjusting state during render)
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Focus input when opened (DOM side effect, OK in effect)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Keyboard navigation — capture phase to intercept before Monaco
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          break;
      }

      switch (e.key) {
        case 'ArrowDown':
          if (filtered.length > 0) {
            setSelectedIndex((prev) => (prev + 1) % filtered.length);
          }
          break;
        case 'ArrowUp':
          if (filtered.length > 0) {
            setSelectedIndex(
              (prev) => (prev - 1 + filtered.length) % filtered.length
            );
          }
          break;
        case 'Enter':
          if (filtered[selectedIndex]) {
            filtered[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, filtered, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      cmd.action();
      onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg mx-4 rounded-lg border border-[#30363d] shadow-2xl shadow-black/40 overflow-hidden"
            style={{ backgroundColor: '#161b22' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[#30363d]">
              <Search className="size-4 text-[#8b949e] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-transparent py-3.5 text-sm text-[#e6edf3] outline-none placeholder-[#484f58]"
              />
              <kbd
                className="hidden sm:inline-flex items-center text-[10px] text-[#484f58] border border-[#30363d] rounded px-1.5 py-0.5"
                style={{ fontFamily: "'Geist Mono', monospace" }}
              >
                ESC
              </kbd>
            </div>

            {/* Command list */}
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto py-1.5 px-1.5"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#30363d #161b22',
              }}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#484f58]">
                  <Search className="size-5 mb-2" />
                  <span className="text-sm">No commands found</span>
                </div>
              ) : (
                filtered.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors duration-75 ${
                        isSelected
                          ? 'bg-[#0d1117] text-[#e6edf3]'
                          : 'text-[#8b949e] hover:bg-[#0d1117]/60 hover:text-[#e6edf3]'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderLeft: '2px solid #238636',
                              paddingLeft: '10px',
                            }
                          : {
                              borderLeft: '2px solid transparent',
                              paddingLeft: '10px',
                            }
                      }
                    >
                      <Icon
                        className={`size-4 shrink-0 ${
                          isSelected ? 'text-[#238636]' : 'text-[#8b949e]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">
                          {cmd.label}
                        </span>
                        <span className="text-[10px] text-[#484f58]">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.shortcut && cmd.shortcut.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {cmd.shortcut.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <span className="text-[#484f58] text-[10px]">
                                  +
                                </span>
                              )}
                              <kbd
                                className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-medium text-[#8b949e] rounded"
                                style={{
                                  background: '#0d1117',
                                  border: '1px solid #30363d',
                                  boxShadow:
                                    '0 1px 1px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(230,237,243,0.05)',
                                  fontFamily: "'Geist Mono', monospace",
                                  lineHeight: '1',
                                }}
                              >
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}