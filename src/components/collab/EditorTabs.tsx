'use client';

import { useCallback } from 'react';
import {
  FileCode,
  FileText,
  FileJson2,
  File,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorTabsProps {
  files: string[];
  activeFile: string;
  onSelectFile: (name: string) => void;
  onCloseFile?: (name: string) => void;
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

function getBasename(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

export default function EditorTabs({
  files,
  activeFile,
  onSelectFile,
  onCloseFile,
}: EditorTabsProps) {
  const handleClose = useCallback(
    (e: React.MouseEvent, name: string) => {
      e.stopPropagation();
      onCloseFile?.(name);
    },
    [onCloseFile]
  );

  if (files.length === 0) return null;

  return (
    <div
      className="flex items-center h-9 bg-[#161b22] border-b border-[#30363d] shrink-0"
      style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex items-center h-full">
        {files.map((file) => {
          const isActive = file === activeFile;
          const { icon: Icon, color } = getFileIcon(file);
          const basename = getBasename(file);

          return (
            <button
              key={file}
              onClick={() => onSelectFile(file)}
              className={cn(
                'group relative flex items-center gap-1.5 h-full px-3 text-xs font-mono transition-all duration-150 shrink-0 border-t-2',
                isActive
                  ? 'bg-[#0d1117] border-t-[#238636] text-[#e6edf3]'
                  : 'bg-transparent border-t-[#30363d] text-[#8b949e] hover:bg-[#161b22]/60 hover:text-[#e6edf3]'
              )}
            >
              <Icon className={cn('size-3.5 shrink-0', isActive ? color : 'text-[#8b949e] group-hover:' + color)} />
              <span className="truncate max-w-[120px]">{basename}</span>

              {/* Modified indicator dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-[#238636] shrink-0" />

              {/* Close button — visible on hover */}
              {onCloseFile && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleClose(e, file)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClose(e, file);
                    }
                  }}
                  className={cn(
                    'flex items-center justify-center size-4 rounded shrink-0 transition-colors duration-150',
                    'opacity-0 group-hover:opacity-100 hover:bg-[#30363d]'
                  )}
                  aria-label={`Close ${basename}`}
                >
                  <X className="size-3 text-[#8b949e]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}