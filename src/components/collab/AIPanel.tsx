'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  Zap,
  TestTube2,
  FileCode2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface AIPanelProps {
  currentCode: string;
  language: string;
  currentFileName: string;
}

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain Code', icon: Lightbulb, prompt: 'Explain this code:' },
  { id: 'fix', label: 'Fix Bug', icon: Bug, prompt: 'Find and fix any bugs in this code:' },
  { id: 'optimize', label: 'Optimize', icon: Zap, prompt: 'Optimize this code for better performance:' },
  { id: 'tests', label: 'Write Tests', icon: TestTube2, prompt: 'Write unit tests for this code:' },
] as const;

export default function AIPanel({
  currentCode,
  language,
  currentFileName,
}: AIPanelProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [response, loading]);

  const askAI = useCallback(
    async (q: string) => {
      if (!q.trim() || loading) return;
      setLoading(true);
      setError('');
      setResponse('');

      try {
        const res = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            code: currentCode,
            question: q,
            language,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get AI response');
        }

        const data = await res.json();
        setResponse(data.response || 'No response received.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [currentCode, language, loading]
  );

  const handleSubmit = useCallback(() => {
    if (question.trim()) {
      askAI(question.trim());
      setQuestion('');
    }
  }, [question, askAI]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleQuickAction = useCallback(
    (action: (typeof QUICK_ACTIONS)[number]) => {
      askAI(`${action.prompt}\n\nFile: ${currentFileName}\n\`\`\`${language}\n${currentCode}\n\`\`\``);
    },
    [askAI, currentFileName, currentCode, language]
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-[#e6edf3]">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#484f58]">
          <FileCode2 className="size-3" />
          <span>{currentFileName}</span>
          <span className="text-[#30363d]">•</span>
          <span className="capitalize">{language}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-b border-[#30363d] shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className="justify-start gap-1.5 h-7 text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] px-2"
              onClick={() => handleQuickAction(action)}
              disabled={loading || !currentCode.trim()}
            >
              <action.icon className="size-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Response Area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#8b949e] py-4 justify-center">
              <Loader2 className="size-4 animate-spin text-purple-400" />
              <span>Thinking...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 my-2">
              {error}
            </div>
          )}

          {response && !loading && (
            <div className="prose prose-invert prose-sm max-w-none text-[#e6edf3] [&_code]:bg-[#161b22] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:text-purple-300 [&_pre]:bg-[#161b22] [&_pre]:border [&_pre]:border-[#30363d] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_p]:text-sm [&_p]:leading-relaxed [&_ul]:text-sm [&_ol]:text-sm [&_li]:text-sm [&_strong]:text-[#e6edf3]">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}

          {!response && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-32 text-[#484f58] text-xs gap-2">
              <Sparkles className="size-6 text-[#30363d]" />
              <span>Ask AI about your code</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#30363d] shrink-0">
        <div className="flex items-end gap-2 bg-[#161b22] rounded-lg border border-[#30363d] p-1.5 focus-within:border-purple-500/50 transition-colors">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] outline-none placeholder-[#484f58] resize-none min-h-[28px] max-h-24 py-0.5 disabled:opacity-50"
            style={{ lineHeight: '1.4' }}
          />
          <Button
            size="icon"
            className="size-7 shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSubmit}
            disabled={!question.trim() || loading}
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}