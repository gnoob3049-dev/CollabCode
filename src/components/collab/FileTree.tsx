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
}: FileTreeProps) {
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
                      <ContextMenuSeparator className="bg-[#30363d]" />
                      <ContextMenuItem
                        className="text-red-400 focus:bg-[#30363d] focus:text-red-400"
                        onClick={() => onDeleteFile(file)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </ContextMenuItem>
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
            Explorer
          </span>
          {files.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 text-[10px] bg-[#30363d] text-[#8b949e] border-0 rounded-full"
            >
              {files.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                onClick={() => setShowNewFileInput(true)}
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

            return (
              <div key={file}>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-sm relative',
                        isActive
                          ? 'bg-[#161b22] text-[#e6edf3]'
                          : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3] hover:translate-x-0.5'
                      )}
                      onClick={() => onSelectFile(file)}
                      onDoubleClick={() => {
                        setRenamingFile(file);
                        setRenameValue(file);
                      }}
                    >
                      {/* Active file dot indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#238636] rounded-r" />
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
                            <span className="truncate text-xs font-mono">{file}</span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <span className="font-mono">{file}</span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48 bg-[#161b22] border-[#30363d] text-[#e6edf3]">
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
                    <ContextMenuSeparator className="bg-[#30363d]" />
                    <ContextMenuItem
                      className="text-red-400 focus:bg-[#30363d] focus:text-red-400"
                      onClick={() => onDeleteFile(file)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {/* Subtle divider between files */}
                {showDivider && (
                  <div className="mx-3 my-0.5 h-px bg-[#30363d]/50" />
                )}
              </div>
            );
          })}

          {files.length === 0 && !showNewFileInput && (
            <div className="px-2 py-6 text-center">
              <File className="size-6 text-[#30363d] mx-auto mb-2" />
              <p className="text-[#484f58] text-xs">
                No files yet.
              </p>
              <p className="text-[#30363d] text-xs mt-0.5">
                Click + to create one.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}