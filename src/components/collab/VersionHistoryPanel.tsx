'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  X,
  Clock,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  content: string;
  type: 'edit' | 'add' | 'delete';
  lineCount: number;
  charCount: number;
  fileName: string;
  prevContent?: string;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: VersionSnapshot[];
  onRestore: (snapshot: VersionSnapshot) => void;
  currentFileName: string;
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function computeDiff(prevContent: string, newContent: string): { added: string[]; removed: string[] } {
  const prevLines = prevContent.split('\n');
  const newLines = newContent.split('\n');
  const added: string[] = [];
  const removed: string[] = [];

  // Simple line-based diff
  const maxLen = Math.max(prevLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const prev = prevLines[i];
    const next = newLines[i];
    if (prev === undefined) {
      added.push(next);
    } else if (next === undefined) {
      removed.push(prev);
    } else if (prev !== next) {
      removed.push(prev);
      added.push(next);
    }
  }

  return { added: added.slice(0, 5), removed: removed.slice(0, 5) };
}

export default function VersionHistoryPanel({
  isOpen,
  onClose,
  snapshots,
  onRestore,
  currentFileName,
}: VersionHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingSnapshot, setPreviewingSnapshot] = useState<VersionSnapshot | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen) {
      // Delay focus slightly for animation
      const timer = setTimeout(() => searchInputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter snapshots for current file and search query
  const filteredSnapshots = useMemo(() => {
    return snapshots
      .filter((s) => s.fileName === currentFileName)
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.content.toLowerCase().includes(q) ||
          s.type.toLowerCase().includes(q) ||
          s.fileName.toLowerCase().includes(q)
        );
      });
  }, [snapshots, currentFileName, searchQuery]);

  const accentColor = (type: VersionSnapshot['type']) => {
    switch (type) {
      case 'add': return 'bg-[#238636]';
      case 'delete': return 'bg-[#f85149]';
      case 'edit': return 'bg-[#58a6ff]';
    }
  };

  const typeIcon = (type: VersionSnapshot['type']) => {
    switch (type) {
      case 'add': return <Plus className="size-3 text-[#238636]" />;
      case 'delete': return <Trash2 className="size-3 text-[#f85149]" />;
      case 'edit': return <Pencil className="size-3 text-[#58a6ff]" />;
    }
  };

  const typeLabel = (type: VersionSnapshot['type']) => {
    switch (type) {
      case 'add': return 'Added';
      case 'delete': return 'Deleted';
      case 'edit': return 'Edited';
    }
  };

  const handleRestore = (snapshot: VersionSnapshot) => {
    onRestore(snapshot);
    toast.success('Restored to this version');
  };

  const handlePreview = (snapshot: VersionSnapshot) => {
    setPreviewingSnapshot(previewingSnapshot?.id === snapshot.id ? null : snapshot);
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="version-history"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="border-l border-[#30363d] overflow-hidden shrink-0 bg-[#0d1117]"
        >
          <div className="w-[380px] h-full flex flex-col bg-[#0d1117]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <History className="size-4 text-[#58a6ff]" />
                <h2 className="text-sm font-semibold text-[#e6edf3]">Version History</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#30363d] text-[#8b949e]">
                  {filteredSnapshots.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onClose}
                aria-label="Close version history"
              >
                <X className="size-3.5" />
              </Button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 shrink-0 border-b border-[#30363d]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#484f58]" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search versions..."
                  className="h-7 pl-8 pr-3 text-xs bg-[#161b22] border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus-visible:ring-1 focus-visible:ring-[#58a6ff] focus-visible:border-[#58a6ff]"
                />
              </div>
            </div>

            {/* Snapshot List */}
            <div
              ref={listRef}
              className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
            >
              {filteredSnapshots.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                  <div className="size-12 rounded-full bg-[#161b22] flex items-center justify-center">
                    <Clock className="size-5 text-[#484f58]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[#8b949e]">No history yet.</p>
                    <p className="text-xs text-[#484f58] mt-1">
                      Start editing to see changes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2 flex flex-col gap-2">
                  {filteredSnapshots.map((snapshot, index) => {
                    const diff = snapshot.prevContent
                      ? computeDiff(snapshot.prevContent, snapshot.content)
                      : null;
                    const isPreviewing = previewingSnapshot?.id === snapshot.id;

                    return (
                      <motion.div
                        key={snapshot.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.15 }}
                      >
                        <div
                          className={cn(
                            'rounded-md border border-[#30363d] bg-[#161b22] overflow-hidden transition-colors',
                            'hover:bg-[#161b22]/80 hover:border-[#484f58]'
                          )}
                        >
                          {/* Accent line + header */}
                          <div className="flex">
                            <div className={cn('w-1 shrink-0', accentColor(snapshot.type))} />
                            <div className="flex-1 min-w-0 p-3">
                              {/* Top row: type + time */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  {typeIcon(snapshot.type)}
                                  <span className="text-xs font-medium text-[#e6edf3]">
                                    {typeLabel(snapshot.type)}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#484f58]">
                                  {getRelativeTime(snapshot.timestamp)}
                                </span>
                              </div>

                              {/* Stats row */}
                              <div className="flex items-center gap-3 mb-2 text-[10px] text-[#8b949e]">
                                <span>{snapshot.lineCount} lines</span>
                                <span>·</span>
                                <span>{snapshot.charCount} chars</span>
                                {diff && (
                                  <>
                                    {diff.added.length > 0 && (
                                      <span className="text-[#238636]">+{diff.added.length}</span>
                                    )}
                                    {diff.removed.length > 0 && (
                                      <span className="text-[#f85149]">-{diff.removed.length}</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Diff preview */}
                              {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
                                <div className="rounded bg-[#0d1117] p-2 mb-2 overflow-hidden max-h-28 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed">
                                  {diff.removed.map((line, i) => (
                                    <div key={`rm-${i}`} className="flex">
                                      <span className="w-5 shrink-0 text-right text-[#484f58] select-none pr-2">
                                        {i + 1}
                                      </span>
                                      <span className="text-[#f85149] whitespace-pre-wrap break-all">-{line || ' '}</span>
                                    </div>
                                  ))}
                                  {diff.added.map((line, i) => (
                                    <div key={`add-${i}`} className="flex">
                                      <span className="w-5 shrink-0 text-right text-[#484f58] select-none pr-2">
                                        {i + 1}
                                      </span>
                                      <span className="text-[#238636] whitespace-pre-wrap break-all">+{line || ' '}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Full preview content */}
                              <AnimatePresence>
                                {isPreviewing && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="rounded bg-[#0d1117] p-2 mb-2 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed">
                                      {snapshot.content.split('\n').map((line, i) => (
                                        <div key={i} className="flex">
                                          <span className="w-6 shrink-0 text-right text-[#484f58] select-none pr-2">
                                            {i + 1}
                                          </span>
                                          <span className="text-[#e6edf3] whitespace-pre-wrap break-all">{line || ' '}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] gap-1"
                                  onClick={() => handleRestore(snapshot)}
                                >
                                  <RotateCcw className="size-3" />
                                  Restore
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    'h-6 px-2 text-[10px] gap-1',
                                    isPreviewing
                                      ? 'text-[#58a6ff] bg-[#58a6ff]/10'
                                      : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]'
                                  )}
                                  onClick={() => handlePreview(snapshot)}
                                >
                                  <Eye className="size-3" />
                                  {isPreviewing ? 'Hide' : 'Preview'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}