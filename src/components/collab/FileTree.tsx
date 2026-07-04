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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
          title="Expand file tree"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <div className="mt-2 flex flex-col gap-1 w-full px-1.5">
          {files.map((file) => {
            const { icon: Icon, color } = getFileIcon(file);
            const isActive = file === currentFile;
            return (
              <ContextMenu key={file}>
                <ContextMenuTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center justify-center w-full rounded p-1.5 transition-colors',
                      isActive
                        ? 'bg-[#161b22] text-[#e6edf3]'
                        : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
                    )}
                    onClick={() => onSelectFile(file)}
                    title={file}
                  >
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
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0d1117] border-r border-[#30363d] w-56 shrink-0 md:w-56 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
          Files
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
            onClick={() => setShowNewFileInput(true)}
            title="New file"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* File list */}
      <ScrollArea className="flex-1">
        <div className="py-1 px-1">
          {/* New file input */}
          {showNewFileInput && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#161b22] mb-1">
              <File className="size-3.5 text-[#8b949e] shrink-0" />
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
          {files.map((file) => {
            const { icon: Icon, color } = getFileIcon(file);
            const isActive = file === currentFile;
            const isRenaming = renamingFile === file;

            return (
              <ContextMenu key={file}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      'group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm',
                      isActive
                        ? 'bg-[#161b22] text-[#e6edf3]'
                        : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
                    )}
                    onClick={() => onSelectFile(file)}
                    onDoubleClick={() => {
                      setRenamingFile(file);
                      setRenameValue(file);
                    }}
                  >
                    <Icon className={cn('size-4 shrink-0', color)} />
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'rename')}
                        onBlur={handleRenameSubmit}
                        className="flex-1 bg-[#0d1117] text-xs text-[#e6edf3] outline-none px-1 py-0.5 rounded border border-[#238636] min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate text-xs font-mono">{file}</span>
                    )}
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
            );
          })}

          {files.length === 0 && !showNewFileInput && (
            <div className="px-2 py-4 text-center text-[#484f58] text-xs">
              No files yet.
              <br />
              Click + to create one.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}