'use client';

import { useMemo } from 'react';
import { X, FileText } from 'lucide-react';

interface MarkdownPreviewProps {
  code: string;
  visible: boolean;
  onClose: () => void;
}

// Simple regex-based markdown to HTML parser
function parseMarkdown(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let inTable = false;
  let tableRows: string[] = [];
  let tableAlign: string[] = [];

  const closeList = () => {
    if (inList) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      result.push('</tbody></table></div>');
      inTable = false;
      tableRows = [];
      tableAlign = [];
    }
  };

  const parseInline = (text: string): string => {
    // Images (must be before links)
    let html = text.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />'
    );
    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[#58a6ff] hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-[#30363d]/50 px-1.5 py-0.5 rounded text-[#79c0ff] font-mono text-sm">$1</code>'
    );
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
        continue;
      } else {
        closeList();
        closeTable();
        inCodeBlock = true;
        const lang = line.trim().slice(3).trim();
        result.push(`<pre class="relative group bg-[#0d1117] rounded-lg p-4 font-mono text-sm overflow-x-auto my-3 border border-[#30363d]"><div class="flex items-center justify-between mb-2"><span class="text-[10px] text-[#8b949e] uppercase tracking-wider font-medium">${lang || 'code'}</span><button onclick="(function(btn){var pre=btn.closest('pre');var code=pre.querySelector('code');navigator.clipboard.writeText(code.textContent);btn.innerHTML='<span class=\\'text-[#3fb950]\\'>Copied!</span>';setTimeout(function(){btn.innerHTML='<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' class=\\'text-[#8b949e]\\'><rect width=\\'14\\' height=\\'14\\' x=\\'8\\' y=\\'8\\' rx=\\'2\\' ry=\\'2\\'/><path d=\\'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\\'/></svg>';},2000)})(this)" class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] px-1.5 py-0.5 rounded hover:bg-[#30363d]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#8b949e]"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copy</button></div><code class="text-[#e6edf3]">`);
        continue;
      }
    }

    if (inCodeBlock) {
      result.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n');
      continue;
    }

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        closeList();
        inTable = true;
        tableRows = [];
        tableAlign = [];
      }

      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if this is a separator row
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        tableAlign = cells.map((c) => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });
        continue;
      }

      tableRows.push(cells);
      continue;
    }

    if (inTable) {
      closeTable();
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      result.push('');
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList();
      result.push('<hr class="border-t border-[#30363d] my-4" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      const sizeClasses = [
        '',
        'text-2xl',
        'text-xl',
        'text-lg',
        'text-base',
        'text-sm',
        'text-sm',
      ];
      result.push(
        `<h${level} class="text-[#e6edf3] font-semibold ${sizeClasses[level]} mt-6 mb-3 first:mt-0 pb-1 border-b border-[#21262d]">${text}</h${level}>`
      );
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      closeList();
      const quoteText = parseInline(line.trim().replace(/^>\s?/, ''));
      result.push(
        `<blockquote class="border-l-2 border-[#238636] pl-4 text-[#8b949e] italic my-3">${quoteText}</blockquote>`
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        result.push('<ol class="list-decimal pl-6 text-[#e6edf3] space-y-1 my-2">');
      }
      result.push(`<li class="leading-relaxed">${parseInline(olMatch[2])}</li>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        result.push('<ul class="list-disc pl-6 text-[#e6edf3] space-y-1 my-2">');
      }
      result.push(`<li class="leading-relaxed">${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Paragraph
    closeList();
    result.push(`<p class="text-[#e6edf3] leading-relaxed mb-3">${parseInline(line)}</p>`);
  }

  // Close any remaining open blocks
  if (inCodeBlock) result.push('</code></pre>');
  if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
  if (inTable) {
    // Build table HTML
    let tableHtml =
      '<div class="overflow-x-auto my-3"><table class="border-collapse w-full text-sm text-[#e6edf3]"><thead><tr>';
    if (tableRows.length > 0) {
      tableRows[0].forEach((cell, idx) => {
        const align = tableAlign[idx] || 'left';
        tableHtml += `<th class="border border-[#30363d] bg-[#161b22] px-3 py-2 font-semibold text-left text-[#e6edf3]" style="text-align:${align}">${parseInline(cell)}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      for (let r = 1; r < tableRows.length; r++) {
        const isEven = r % 2 === 0;
        tableHtml += `<tr class="${isEven ? 'bg-[#161b22]/50' : ''}">`;
        tableRows[r].forEach((cell, idx) => {
          const align = tableAlign[idx] || 'left';
          tableHtml += `<td class="border border-[#30363d] px-3 py-2" style="text-align:${align}">${parseInline(cell)}</td>`;
        });
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table></div>';
      result.push(tableHtml);
    }
  }

  return result.join('\n');
}

export default function MarkdownPreview({ code, visible, onClose }: MarkdownPreviewProps) {
  const htmlContent = useMemo(() => {
    if (!code.trim()) return '';
    return parseMarkdown(code);
  }, [code]);

  if (!visible) return null;

  const isEmpty = !code.trim();

  return (
    <div
      className="flex flex-col h-full overflow-hidden border-l border-[#30363d]"
      style={{ background: '#0d1117' }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between h-10 px-3 shrink-0 border-b border-[#30363d]"
        style={{ background: 'linear-gradient(180deg, #161b22 0%, #13171e 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#238636] shrink-0" />
          <span className="text-xs font-medium text-[#e6edf3]">Markdown Preview</span>
        </div>

        <button
          onClick={onClose}
          className="size-7 flex items-center justify-center rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
          aria-label="Close preview"
          title="Close preview"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-[#484f58]">
            <FileText className="size-10 mb-3 opacity-50" />
            <span className="text-sm">No content to preview</span>
          </div>
        ) : (
          <div
            className="markdown-preview max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}