'use client';

import { useState, useRef, useCallback, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface GoToLineDialogProps {
  open: boolean;
  onClose: () => void;
  onGo: (line: number) => void;
  totalLines: number;
}

function GoToLineDialogInner({
  onClose,
  onGo,
  totalLines,
}: Omit<GoToLineDialogProps, 'open'>) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Auto-focus input on mount
  const handleRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
        el.select();
      });
    }
  }, []);

  const validateAndGo = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter a line number');
      return;
    }
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 1 || num > totalLines) {
      setError(`Line number must be between 1 and ${totalLines}`);
      return;
    }
    setError('');
    onGo(num);
    onClose();
  }, [input, totalLines, onGo, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        validateAndGo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [validateAndGo, onClose]
  );

  return (
    <DialogContent
      className="sm:max-w-sm p-0 overflow-hidden"
      style={{
        backgroundColor: '#161b22',
        borderColor: '#30363d',
      }}
    >
      {/* Gradient top accent line */}
      <div className="h-1 bg-gradient-to-r from-[#238636] via-[#3fb950] to-[#238636]" />

      <DialogHeader className="p-5 pb-0">
        <DialogTitle className="text-sm font-semibold text-[#e6edf3]">
          Go to Line
        </DialogTitle>
        <DialogDescription className="text-xs text-[#8b949e]">
          Navigate to a specific line in the editor
        </DialogDescription>
      </DialogHeader>

      <div className="px-5 py-4 space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#8b949e]"
          >
            Line number
          </label>
          <input
            id={inputId}
            ref={handleRef}
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Enter a line number (1 – ${totalLines})`}
            className="w-full h-9 px-3 text-sm rounded-md outline-none transition-colors duration-150 placeholder:text-[#484f58]"
            style={{
              backgroundColor: '#0d1117',
              border: error ? '1px solid #f85149' : '1px solid #30363d',
              color: '#e6edf3',
            }}
          />
          {error && (
            <p className="text-[11px] text-[#f85149] mt-1">{error}</p>
          )}
          <p className="text-[11px] text-[#484f58]">
            Range: 1 — {totalLines}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="h-8 px-3 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: '#21262d',
              color: '#e6edf3',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#30363d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#21262d';
            }}
          >
            Cancel
          </button>
          <button
            onClick={validateAndGo}
            className="h-8 px-4 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: '#238636',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2ea043';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#238636';
            }}
          >
            Go
          </button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function GoToLineDialog({
  open,
  onClose,
  onGo,
  totalLines,
}: GoToLineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {open && <GoToLineDialogInner onClose={onClose} onGo={onGo} totalLines={totalLines} />}
    </Dialog>
  );
}