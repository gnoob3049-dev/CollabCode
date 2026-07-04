'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileCode,
  FileText,
  FileJson2,
  File,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Files,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  files: string[];
  currentFile: string;
  onSelectFile: (name: string) => void;
  onCreateFile: (name: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
  onDeleteFile: (name: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isReadOnly?: boolean;
  onReorderFiles?: (files: string[]) => void;
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

export default function FileTree({
  files,
  currentFile,
  onSelectFile,
  onCreateFile,
  onRenameFile,
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

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    // Add slight delay so browser captures the element before applying opacity
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
      // Determine if dropping above or below the target
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

    // Brief green flash on drop target
    const targetEl = e.currentTarget as HTMLElement;
    targetEl.style.backgroundColor = 'rgba(35, 134, 54, 0.15)';
    setTimeout(() => {
      targetEl.style.backgroundColor = '';
    }, 400);
  }, [draggedIdx, files, onReorderFiles]);

  // Collapsed mobile view
  if (collapsed) {
    return (
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
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center justify-center w-full rounded p-1.5 transition-all duration-150',
                          isActive
                            ? 'bg-[#161b22] text-[#e6edf3]'
                            : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
                        )}
                        onClick={() => onSelectFile(file)}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#238636] rounded-r" />
                        )}
                        <Icon className={cn('size-4', color)} />
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 bg-[#161b22] border-[#30363d] text-[#e6edf3]">
                      {!isReadOnly && (
                        <ContextMenuItem
                          className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]"
                          onClick={() => {
                            setRenamingFile(file);
                            setRenameValue(file);
                          }}
                        >
                          <Pencil className="size-4 mr-2" />
                          Rename
                        </ContextMenuItem>
                      )}
                      {!isReadOnly && <ContextMenuSeparator className="bg-[#30363d]" />}
                      {!isReadOnly && (
                        <ContextMenuItem
                          className="text-red-400 focus:bg-[#30363d] focus:text-red-400"
                          onClick={() => onDeleteFile(file)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                </TooltipTrigger>
                <TooltipContent side="right">{file}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
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
                <ContextMenu>
                  <ContextMenuTrigger asChild>
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
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48 bg-[#161b22] border-[#30363d] text-[#e6edf3]">
                    {!isReadOnly && (
                      <ContextMenuItem
                        className="text-[#e6edf3] focus:bg-[#30363d] focus:text-[#e6edf3]"
                        onClick={() => {
                          setRenamingFile(file);
                          setRenameValue(file);
                        }}
                      >
                        <Pencil className="size-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                    )}
                    {!isReadOnly && <ContextMenuSeparator className="bg-[#30363d]" />}
                    {!isReadOnly && (
                      <ContextMenuItem
                        className="text-red-400 focus:bg-[#30363d] focus:text-red-400"
                        onClick={() => onDeleteFile(file)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
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
              {/* Breathing glow container with animated FileCode icon */}
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
  );
}