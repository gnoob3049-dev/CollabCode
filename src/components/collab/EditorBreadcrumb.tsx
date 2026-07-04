'use client';

import {
  FileCode,
  FileText,
  FileJson2,
  File,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  cpp: '#f34b7d',
  go: '#00add8',
  html: '#e34c26',
  css: '#563d7c',
  sql: '#e38c00',
  rust: '#dea584',
  markdown: '#8b949e',
};

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
    case 'mdx':
      return { icon: FileText, color: 'text-gray-400' };
    default:
      return { icon: File, color: 'text-[#8b949e]' };
  }
}

interface EditorBreadcrumbProps {
  roomName: string;
  fileName: string;
  language: string;
  onBack: () => void;
}

export default function EditorBreadcrumb({
  roomName,
  fileName,
  language,
  onBack,
}: EditorBreadcrumbProps) {
  const { icon: FileIcon, color: fileIconColor } = getFileIcon(fileName);
  const langColor = LANG_COLORS[language] || '#8b949e';
  const langLabel = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="flex items-center justify-between h-7 px-3 bg-[#0d1117] border-b border-[#30363d]/50 shrink-0">
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] transition-colors truncate"
          aria-label="Navigate back to dashboard"
        >
          <FolderOpen className="size-3 shrink-0" />
          <span className="hover:underline truncate">{roomName}</span>
        </button>
        <span className="text-[#484f58] shrink-0">&gt;</span>
        <span className="flex items-center gap-1 text-[#e6edf3] truncate">
          <FileIcon className={cn('size-3 shrink-0', fileIconColor)} />
          <span className="truncate">{fileName}</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: langColor }}
        />
        <span className="text-[10px] text-[#8b949e]">{langLabel}</span>
      </div>
    </div>
  );
}