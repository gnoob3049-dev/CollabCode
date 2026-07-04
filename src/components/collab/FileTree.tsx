'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileCode,
  FileText,
  FileJson2,
  File,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Clipboard,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Files,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  files: string[];
  currentFile: string;
  onSelectFile: (name: string) => void;
  onCreateFile: (name: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDuplicateFile: (name: string) => void;
  onDeleteFile: (name: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isReadOnly?: boolean;
  onReorderFiles?: (files: string[]) => void;
}

// Context menu position & state
interface ContextMenuState {
  x: number;
  y: number;
  fileName: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
      return { icon: FileCode, color: 'text-yellow-400' };
    case 'ts':
    case 'tsx':
      return { icon: FileCode, color: 'text-blue-400' };
    case 'py':
      return { icon: FileCode, color: 'text-green-400' };
    case 'html':
      return { icon: FileCode, color: 'text-orange-400' };
    case 'css':
    case 'scss':
      return { icon: FileCode, color: 'text-purple-400' };
    case 'json':
      return { icon: FileJson2, color: 'text-yellow-300' };
    case 'md':
      return { icon: FileText, color: 'text-gray-400' };
    default:
      return { icon: File, color: 'text-[#8b949e]' };
  }
}

/** Clamp context menu position so it doesn't overflow the viewport */
function clampPosition(x: number, y: number, menuWidth = 180, menuHeight = 160) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampedX = x + menuWidth > vw ? vw - menuWidth - 8 : x;
  const clampedY = y + menuHeight > vh ? vh - menuHeight - 8 : y;
  return { x: Math.max(4, clampedX), y: Math.max(4, clampedY) };
}

export default function FileTree({
  files,
  currentFile,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDuplicateFile,
  onDeleteFile,
  collapsed,
  onToggleCollapse,
  isReadOnly = false,
  onReorderFiles,
}: FileTreeProps) {
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Custom context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropIndicatorIdx, setDropIndicatorIdx] = useState<number | null>(null);

  useEffect(() => {
    if (showNewFileInput && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [showNewFileInput]);

  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFile]);

  const handleCreateFile = useCallback(() => {
    const trimmed = newFileName.trim();
    if (trimmed && !files.includes(trimmed)) {
      onCreateFile(trimmed);
      setNewFileName('');
      setShowNewFileInput(false);
    }
  }, [newFileName, files, onCreateFile]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingFile) {
      const trimmed = renameValue.trim();
      if (trimmed && trimmed !== renamingFile && !files.includes(trimmed)) {
        onRenameFile(renamingFile, trimmed);
      }
      setRenamingFile(null);
      setRenameValue('');
    }
  }, [renamingFile, renameValue, files, onRenameFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: 'create' | 'rename') => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (action === 'create') handleCreateFile();
        else handleRenameSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (action === 'create') {
          setNewFileName('');
          setShowNewFileInput(false);
        } else {
          setRenamingFile(null);
          setRenameValue('');
        }
      }
    },
    [handleCreateFile, handleRenameSubmit]
  );

  // --- Context menu handlers ---
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, fileName: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (isReadOnly) return;
      const { x, y } = clampPosition(e.clientX, e.clientY);
      setContextMenu({ x, y, fileName });
    },
    [isReadOnly]
  );

  // Click outside to close context menu
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu();
      }
    };
    // Use a small timeout so the right-click itself doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [contextMenu, closeContextMenu]);

  // Escape to close context menu
  useEffect(() => {
    if (!contextMenu) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [contextMenu, closeContextMenu]);

  const handleContextRename = useCallback(() => {
    if (!contextMenu) return;
    setRenamingFile(contextMenu.fileName);
    setRenameValue(contextMenu.fileName);
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleContextDuplicate = useCallback(() => {
    if (!contextMenu) return;
    onDuplicateFile(contextMenu.fileName);
    closeContextMenu();
  }, [contextMenu, onDuplicateFile, closeContextMenu]);

  const handleContextDelete = useCallback(() => {
    if (!contextMenu) return;
    const fileName = contextMenu.fileName;
    closeContextMenu();

    // Cannot delete the last file
    if (files.length <= 1) {
      toast.error('Cannot delete the last file');
      return;
    }

    // Show confirmation toast with undo action
    toast('Delete file?', {
      description: `"${fileName}" will be permanently removed.`,
      action: {
        label: 'Delete',
        onClick: () => onDeleteFile(fileName),
      },
      duration: 6000,
    });
  }, [contextMenu, files.length, onDeleteFile, closeContextMenu]);

  const handleContextCopyPath = useCallback(() => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(contextMenu.fileName).then(() => {
      toast.success('Copied!', { description: contextMenu.fileName });
    });
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    requestAnimationFrame(() => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
        e.currentTarget.style.transform = 'scale(0.95)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedIdx(null);
    setDropIndicatorIdx(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIdx !== null && draggedIdx !== idx) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      setDropIndicatorIdx(e.clientY < midY ? idx : idx + 1);
    }
  }, [draggedIdx]);

  const handleDragLeave = useCallback(() => {
    setDropIndicatorIdx(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDropIndicatorIdx(null);
      return;
    }

    const newFiles = [...files];
    const [moved] = newFiles.splice(draggedIdx, 1);
    const actualTarget = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
    newFiles.splice(actualTarget, 0, moved);

    onReorderFiles?.(newFiles);
    setDraggedIdx(null);
    setDropIndicatorIdx(null);

    const targetEl = e.currentTarget as HTMLElement;
    targetEl.style.backgroundColor = 'rgba(35, 134, 54, 0.15)';
    setTimeout(() => {
      targetEl.style.backgroundColor = '';
    }, 400);
  }, [draggedIdx, files, onReorderFiles]);

  // Context menu component
  const renderContextMenu = () => {
    if (!contextMenu) return null;
    return (
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[9999] min-w-[180px] py-1 rounded-lg border border-[#30363d] bg-[#161b22] shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {/* Rename */}
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#e6edf3] hover:bg-[#238636]/15 cursor-pointer transition-colors"
              onClick={handleContextRename}
            >
              <Pencil className="size-4 shrink-0" />
              <span>Rename</span>
            </button>
            {/* Duplicate */}
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#e6edf3] hover:bg-[#238636]/15 cursor-pointer transition-colors"
              onClick={handleContextDuplicate}
            >
              <Copy className="size-4 shrink-0" />
              <span>Duplicate</span>
            </button>
            {/* Copy Path */}
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#e6edf3] hover:bg-[#238636]/15 cursor-pointer transition-colors"
              onClick={handleContextCopyPath}
            >
              <Clipboard className="size-4 shrink-0" />
              <span>Copy Path</span>
            </button>
            {/* Separator */}
            <div className="border-t border-[#30363d] my-1" />
            {/* Delete */}
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
              onClick={handleContextDelete}
            >
              <Trash2 className="size-4 shrink-0" />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Collapsed mobile view
  if (collapsed) {
    return (
      <>
        <div className="flex flex-col items-center py-2 bg-[#0d1117] border-r border-[#30363d] w-10 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
            onClick={onToggleCollapse}
          >
            <PanelLeftOpen className="size-4" />
          </Button>
          <div className="mt-2 flex flex-col gap-1 w-full px-1.5">
            {files.map((file) => {
              const { icon: Icon, color } = getFileIcon(file);
              const isActive = file === currentFile;
              return (
                <Tooltip key={file}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center justify-center w-full rounded p-1.5 transition-all duration-150 relative',
                        isActive
                          ? 'bg-[#161b22] text-[#e6edf3]'
                          : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
                      )}
                      onClick={() => onSelectFile(file)}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#238636] rounded-r" />
                      )}
                      <Icon className={cn('size-4', color)} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{file}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        {renderContextMenu()}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col bg-[#0d1117] border-r border-[#30363d] w-56 shrink-0 md:w-56 h-full">
        {/* Header with EXPLORER and file count */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2">
            <Files className="size-3.5 text-[#8b949e]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
              Files{files.length > 0 && ` (${files.length})`}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                  onClick={() => setShowNewFileInput(true)}
                  disabled={isReadOnly}
                >
                  <Plus className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                  onClick={onToggleCollapse}
                >
                  <PanelLeftClose className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* File list */}
        <ScrollArea className="flex-1">
          <div className="py-1 px-1">
            {/* New file input */}
            {showNewFileInput && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[#161b22] mb-1 border border-[#238636]/50 shadow-[0_0_8px_rgba(35,134,54,0.15)]">
                <File className="size-3.5 text-[#238636] shrink-0" />
                <input
                  ref={newFileInputRef}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'create')}
                  onBlur={() => {
                    if (newFileName.trim()) handleCreateFile();
                    else {
                      setNewFileName('');
                      setShowNewFileInput(false);
                    }
                  }}
                  placeholder="filename.js"
                  className="flex-1 bg-transparent text-xs text-[#e6edf3] outline-none placeholder-[#484f58] min-w-0"
                />
                <button
                  onClick={() => {
                    setNewFileName('');
                    setShowNewFileInput(false);
                  }}
                  className="shrink-0 text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="size-3" />
                </button>
                <button
                  onClick={handleCreateFile}
                  className="shrink-0 text-[#8b949e] hover:text-[#238636]"
                >
                  <Check className="size-3" />
                </button>
              </div>
            )}

            {/* Files */}
            {files.map((file, idx) => {
              const { icon: Icon, color } = getFileIcon(file);
              const isActive = file === currentFile;
              const isRenaming = renamingFile === file;
              const showDivider = idx < files.length - 1;
              const isDragging = draggedIdx === idx;

              return (
                <div key={file}>
                  {/* Drop indicator line */}
                  {dropIndicatorIdx === idx && (
                    <div className="mx-2 h-0.5 rounded-full bg-[#238636]" style={{ boxShadow: '0 0 6px rgba(35, 134, 54, 0.5)' }} />
                  )}
                  <div
                    className={cn(
                      'group file-tree-item flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-sm relative press-effect',
                      isActive
                        ? 'active bg-[#161b22] text-[#e6edf3] shadow-[inset_0_0_0_1px_rgba(35,134,54,0.15)]'
                        : 'text-[#8b949e] hover:bg-[#161b22]/80 hover:text-[#e6edf3]',
                      isDragging && 'opacity-50 scale-95'
                    )}
                    style={isActive ? { boxShadow: '8px 0 12px -4px rgba(35,134,54,0.15), inset 0 0 0 1px rgba(35,134,54,0.15)' } : undefined}
                    draggable={!isReadOnly && !isRenaming}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onClick={() => onSelectFile(file)}
                    onDoubleClick={() => {
                      if (isReadOnly) return;
                      setRenamingFile(file);
                      setRenameValue(file);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    {/* Active file - enhanced glow left border */}
                    {isActive && (
                      <span
                        className="shrink-0 w-2 h-2 rounded-full bg-[#238636] animate-[status-breathe_2.5s_ease-in-out_infinite]"
                        style={{ boxShadow: '0 0 8px rgba(35, 134, 54, 0.6), 0 0 16px rgba(35, 134, 54, 0.2)' }}
                      />
                    )}
                    {!isActive && (
                      <span className="shrink-0 w-2" />
                    )}
                    <Icon className={cn('size-4 shrink-0', color)} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'rename')}
                            onBlur={handleRenameSubmit}
                            className="flex-1 bg-[#0d1117] text-xs text-[#e6edf3] outline-none px-1 py-0.5 rounded border border-[#238636] min-w-0 shadow-[0_0_8px_rgba(35,134,54,0.15)]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate text-xs font-mono flex-1">{file}</span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span className="font-mono">{file}</span>
                      </TooltipContent>
                    </Tooltip>
                    {/* Hover arrow indicator */}
                    <ChevronRight className="size-3 shrink-0 text-[#30363d] opacity-0 group-hover:opacity-100 group-hover:text-[#8b949e] transition-all duration-150" />
                  </div>
                  {/* Subtle divider between files */}
                  {showDivider && (
                    <div className="mx-3 my-0.5 h-px bg-[#30363d]/50" />
                  )}
                  {/* Drop indicator after last item */}
                  {!showDivider && dropIndicatorIdx === files.length && (
                    <div className="mx-2 h-0.5 rounded-full bg-[#238636]" style={{ boxShadow: '0 0 6px rgba(35, 134, 54, 0.5)' }} />
                  )}
                </div>
              );
            })}

            {/* Drop indicator at very end when dragging past all files */}
            {dropIndicatorIdx === files.length && files.length > 0 && (
              <div className="mx-2 h-0.5 rounded-full bg-[#238636]" style={{ boxShadow: '0 0 6px rgba(35, 134, 54, 0.5)' }} />
            )}

            {/* NEW FILE button at bottom of list */}
            {files.length > 0 && !showNewFileInput && !isReadOnly && (
              <button
                onClick={() => setShowNewFileInput(true)}
                className="flex items-center gap-2 px-3 py-2 mx-1 mt-1 rounded-md text-xs text-[#238636] hover:bg-[#238636]/10 hover:glow-btn-green transition-all duration-200 w-full hover-glow-green"
              >
                <Plus className="size-3" />
                <span className="font-medium">New File</span>
              </button>
            )}

            {files.length === 0 && !showNewFileInput && (
              <div className="px-2 py-8 text-center">
                <div
                  className="w-14 h-14 mx-auto mb-3 rounded-xl border border-[#30363d] flex items-center justify-center breathe-glow bg-[#0d1117]"
                >
                  <FileCode className="size-7 text-[#484f58] float-subtle" />
                </div>
                <p className="text-[#8b949e] text-xs font-medium">
                  No files yet
                </p>
                <p className="text-[#484f58] text-xs mt-1">
                  Create your first file to start coding
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      {renderContextMenu()}
    </>
  );
}