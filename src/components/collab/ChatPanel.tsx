'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, LogIn, MessageSquare, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Socket } from 'socket.io-client';
import type { ChatMessage, User } from '@/store/useStore';

interface ChatPanelProps {
  roomId: string;
  socket: Socket | null;
  user: User | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  typingUsers?: string[];
}

export default function ChatPanel({
  roomId,
  socket,
  user,
  messages,
  onSendMessage,
  typingUsers = [],
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get viewport ref
  useEffect(() => {
    if (scrollRef.current) {
      viewportRef.current = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLDivElement;
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }
  }, [messages]);

  // Listen for scroll position changes
  const handleScroll = useCallback(() => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollBtn(false);
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !socket || !user) return;
    onSendMessage(trimmed);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, socket, user, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
  }, []);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="flex flex-col h-full relative"
      style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #0a0e14 100%)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#30363d] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-[#8b949e]" />
            <h3 className="text-sm font-semibold text-[#e6edf3]">Chat</h3>
          </div>
          {socket?.connected ? (
            <span className="flex items-center gap-1.5 text-[10px] text-[#3fb950]">
              <span className="size-1.5 rounded-full bg-[#238636] pulse-dot" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-[#f85149]">
              <span className="size-1.5 rounded-full bg-[#f85149]" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-3 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-[#30363d] text-xs gap-2">
                <MessageSquare className="size-6" />
                <span>No messages yet. Say hi!</span>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.system) {
                return (
                  <div
                    key={msg.id || i}
                    className="flex items-center justify-center gap-1.5 py-1"
                  >
                    <LogIn className="size-3 text-[#30363d]" />
                    <span className="text-[11px] text-[#484f58]">{msg.text}</span>
                  </div>
                );
              }

              const isOwn = user && msg.senderId === user.id;

              return (
                <div
                  key={msg.id || i}
                  className={cn(
                    'flex gap-2 max-w-[88%] chat-msg-animate',
                    isOwn ? 'self-end flex-row-reverse' : 'self-start'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 shadow-sm"
                    style={{ backgroundColor: msg.senderColor || '#484f58' }}
                  >
                    {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      'flex flex-col gap-0.5',
                      isOwn ? 'items-end' : 'items-start'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!isOwn && (
                        <span className="text-[11px] font-medium text-[#8b949e]">
                          {msg.senderName}
                        </span>
                      )}
                      <span className="text-[10px] text-[#30363d]">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap transition-colors duration-150',
                        isOwn
                          ? 'bg-[#238636] text-white rounded-2xl rounded-br-md shadow-[0_2px_8px_rgba(35,134,54,0.2)] hover:bg-[#2ea043]'
                          : 'bg-[#161b22] text-[#e6edf3] rounded-2xl rounded-bl-md border border-[#30363d]/60 shadow-sm hover:border-[#484f58]/60'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-2 self-start max-w-[88%]">
                <div className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#30363d]">
                  ...
                </div>
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="text-[11px] font-medium text-[#8b949e]">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                  </span>
                  <div className="bg-[#161b22] border border-[#30363d]/60 rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="typing-dot inline-block size-1.5 rounded-full bg-[#8b949e]" />
                      <span className="typing-dot inline-block size-1.5 rounded-full bg-[#8b949e]" />
                      <span className="typing-dot inline-block size-1.5 rounded-full bg-[#8b949e]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 size-7 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] shadow-lg transition-all"
          >
            <ArrowDown className="size-3.5" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#30363d] shrink-0">
        <div className="flex items-end gap-2 bg-[#161b22] rounded-xl border border-[#30363d] p-2 focus-within:border-[#238636]/60 focus-within:shadow-[0_0_12px_rgba(35,134,54,0.2)] transition-all duration-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] outline-none placeholder-[#484f58] resize-none min-h-[28px] max-h-24 py-0.5"
            style={{ lineHeight: '1.5' }}
          />
          <Button
            size="icon"
            className="size-8 shrink-0 bg-[#238636] hover:bg-[#2ea043] text-white hover:shadow-[0_0_12px_rgba(35,134,54,0.3)]"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}