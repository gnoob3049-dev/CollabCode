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
  Copy,
  Check,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIPanelProps {
  currentCode: string;
  language: string;
  currentFileName: string;
}

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain Code', icon: Lightbulb, prompt: 'Explain this code:', color: '#d29922' },
  { id: 'fix', label: 'Fix Bug', icon: Bug, prompt: 'Find and fix any bugs in this code:', color: '#f85149' },
  { id: 'optimize', label: 'Optimize', icon: Zap, prompt: 'Optimize this code for better performance:', color: '#58a6ff' },
  { id: 'tests', label: 'Write Tests', icon: TestTube2, prompt: 'Write unit tests for this code:', color: '#238636' },
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
  const [copied, setCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setLoading(false);
  }, []);

  const askAI = useCallback(
    async (q: string) => {
      if (!q.trim() || loading) return;
      setLoading(true);
      setError('');
      setResponse('');

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            code: currentCode,
            question: q,
            language,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get AI response');
        }

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream')) {
          // Streaming mode
          setIsStreaming(true);
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      fullText += parsed.content;
                      setResponse(fullText);
                    }
                  } catch {
                    // Skip
                  }
                }
              }
            }
          }

          // Fallback: if no content was streamed, try non-streaming
          if (!fullText) {
            const fallbackRes = await fetch('/api/ai/assist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                code: currentCode,
                question: q,
                language,
                stream: false,
              }),
            });
            const fallbackData = await fallbackRes.json();
            fullText = fallbackData.response || 'No response received.';
            setResponse(fullText);
          }
        } else {
          // Non-streaming fallback
          const data = await res.json();
          setResponse(data.response || 'No response received.');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          if (!response) {
            setResponse('*(Generation stopped)*');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        setLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [currentCode, language, loading, response]
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

  const handleCopyResponse = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      toast.success('Response copied');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response]);

  const charCount = question.length;
  const maxChars = 500;

  return (
    <div className="flex flex-col h-full">
      {/* Gradient header */}
      <div
        className="px-4 py-3 shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(188, 140, 255, 0.08) 0%, rgba(88, 166, 255, 0.05) 100%)',
          borderBottom: '1px solid #30363d',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #bc8cff, #58a6ff)' }}
              >
                <Sparkles className="size-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-[#e6edf3]">AI Assistant</h3>
              {isStreaming && (
                <span className="flex items-center gap-1 text-[10px] text-purple-400">
                  <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                  streaming
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isStreaming && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={stopStreaming}
                  aria-label="Stop generating"
                >
                  <Square className="size-3" />
                </Button>
              )}
              {response && !loading && !isStreaming && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                  onClick={handleCopyResponse}
                  aria-label="Copy response"
                >
                  {copied ? <Check className="size-3 text-[#238636]" /> : <Copy className="size-3" />}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#484f58]">
            <FileCode2 className="size-3" />
            <span>{currentFileName}</span>
            <span className="text-[#30363d]">•</span>
            <span className="capitalize">{language}</span>
          </div>
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
              className={cn(
                'justify-start gap-1.5 h-7 text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] px-2 group transition-all duration-200',
                'hover:shadow-sm hover:-translate-y-0.5 hover-lift btn-press',
                action.id === 'explain' && 'hover-glow-blue',
                action.id === 'fix' && 'hover-glow-green',
                action.id === 'optimize' && 'hover-glow-purple',
                action.id === 'tests' && 'hover-glow-green',
              )}
              onClick={() => handleQuickAction(action)}
              disabled={loading || isStreaming || !currentCode.trim()}
            >
              <action.icon
                className="size-3 transition-all duration-200 group-hover:scale-110"
                style={{ color: action.color }}
              />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Response Area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-3">
          {(loading || isStreaming) && !response && (
            <div className="space-y-3 py-4">
              {/* Shimmer loading animation */}
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-4 w-full rounded shimmer" />
                <div className="h-4 w-5/6 rounded shimmer" />
                <div className="h-4 w-2/3 rounded shimmer" />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                <Loader2 className="size-3 animate-spin text-purple-400" />
                <span>Analyzing your code...</span>
              </div>
            </div>
          )}

          {isStreaming && response && (
            <div className="flex items-center gap-1.5 mb-3 text-[10px] text-purple-400">
              <span className="typing-indicator">
                <span style={{ backgroundColor: '#a371f7', width: '4px', height: '4px' }} />
                <span style={{ backgroundColor: '#a371f7', width: '4px', height: '4px' }} />
                <span style={{ backgroundColor: '#a371f7', width: '4px', height: '4px' }} />
              </span>
              <span>Generating...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 my-2">
              {error}
            </div>
          )}

          {response && (
            <div className="prose prose-invert prose-sm max-w-none text-[#e6edf3] [&_code]:bg-[#161b22] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:text-purple-300 [&_code]:border [&_code]:border-[#30363d]/50 [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-[#30363d] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_p]:text-sm [&_p]:leading-relaxed [&_ul]:text-sm [&_ol]:text-sm [&_li]:text-sm [&_strong]:text-[#e6edf3] [&_a]:text-[#58a6ff] [&_a]:no-underline pl-3"
              style={{
                borderLeft: '2px solid #238636',
                borderImage: 'linear-gradient(to bottom, #238636, transparent) 1',
              }}
            >
              <ReactMarkdown>{response}</ReactMarkdown>
              {!isStreaming && !loading && (
                <div className="border-t border-[#30363d]/50 mt-4 pt-2 text-[10px] text-[#30363d] text-right">
                  AI-generated • {response.length} chars
                </div>
              )}
            </div>
          )}

          {!response && !loading && !isStreaming && !error && (
            <div className="flex flex-col items-center justify-center h-32 text-[#30363d] gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
                style={{ background: 'linear-gradient(135deg, #bc8cff15, #58a6ff15)' }}
              >
                <Sparkles className="size-5 text-[#30363d]" />
              </div>
              <span className="text-xs">Ask AI about your code</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#30363d] shrink-0">
        <div className="flex items-end gap-2 bg-[#161b22] rounded-xl border border-[#30363d] p-2 focus-within:border-purple-500/40 focus-within:shadow-[0_0_8px_rgba(188,140,255,0.15),0_0_16px_rgba(188,140,255,0.08)] transition-all">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            disabled={loading || isStreaming}
            maxLength={maxChars}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] outline-none placeholder-[#484f58] resize-none min-h-[28px] max-h-24 py-0.5 disabled:opacity-50 input-glow-focus"
            style={{ lineHeight: '1.5' }}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn(
              'text-[10px] tabular-nums',
              charCount > maxChars * 0.9 ? 'text-[#f85149]' : 'text-[#30363d]'
            )}>
              {charCount}
            </span>
            {isStreaming ? (
              <Button
                size="icon"
                className="size-8 shrink-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
                onClick={stopStreaming}
                aria-label="Stop generating"
              >
                <Square className="size-3 text-red-400" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="size-8 shrink-0 hover:shadow-[0_0_12px_rgba(188,140,255,0.3)] disabled:opacity-40 transition-all duration-300"
                style={{ background: question.trim() ? 'linear-gradient(135deg, #7c3aed, #58a6ff)' : '#30363d' }}
                onClick={handleSubmit}
                disabled={!question.trim() || loading}
              >
                <Send className="size-3.5 text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}