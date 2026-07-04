'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, LogIn } from 'lucide-react';
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
}

export default function ChatPanel({
  roomId,
  socket,
  user,
  messages,
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !socket || !user) return;
    onSendMessage(trimmed);
    setInput('');
    // Refocus input
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

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#30363d] shrink-0">
        <h3 className="text-sm font-semibold text-[#e6edf3]">Chat</h3>
        <p className="text-xs text-[#484f58] mt-0.5">
          {socket?.connected ? (
            <span className="flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-[#238636]" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-red-500" />
              Disconnected
            </span>
          )}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-3 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[#484f58] text-xs">
              No messages yet. Say hi!
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.system) {
              return (
                <div
                  key={msg.id || i}
                  className="flex items-center justify-center gap-1.5 py-1"
                >
                  <LogIn className="size-3 text-[#484f58]" />
                  <span className="text-xs text-[#484f58]">{msg.text}</span>
                </div>
              );
            }

            const isOwn = user && msg.senderId === user.id;

            return (
              <div
                key={msg.id || i}
                className={cn(
                  'flex gap-2 max-w-[85%]',
                  isOwn ? 'self-end flex-row-reverse' : 'self-start'
                )}
              >
                {/* Avatar */}
                <div
                  className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
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
                      <span className="text-xs font-medium text-[#8b949e]">
                        {msg.senderName}
                      </span>
                    )}
                    <span className="text-[10px] text-[#484f58]">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm leading-relaxed break-words whitespace-pre-wrap',
                      isOwn
                        ? 'bg-[#238636] text-white rounded-br-sm'
                        : 'bg-[#161b22] text-[#e6edf3] rounded-bl-sm border border-[#30363d]'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#30363d] shrink-0">
        <div className="flex items-end gap-2 bg-[#161b22] rounded-lg border border-[#30363d] p-1.5 focus-within:border-[#238636] transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] outline-none placeholder-[#484f58] resize-none min-h-[28px] max-h-24 py-0.5"
            style={{ lineHeight: '1.4' }}
          />
          <Button
            size="icon"
            className="size-7 shrink-0 bg-[#238636] hover:bg-[#2ea043] text-white"
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

