'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, LogIn, MessageSquare, ArrowDown, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Socket, ChatMessage as ChatMessageType, PresenceUser } from '@/store/useStore';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '💯', '🔥'];

interface ChatPanelProps {
  roomId: string;
  socket: Socket | null;
  user: { id: string; name: string; email: string; avatarColor: string } | null;
  messages: ChatMessageType[];
  onSendMessage: (text: string) => void;
  typingUsers?: string[];
  onlineUsers?: PresenceUser[];
}

// Simple fuzzy match: all chars must appear in order
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function ChatPanel({
  roomId,
  socket,
  user,
  messages,
  onSendMessage,
  typingUsers = [],
  onlineUsers = [],
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // @mention state
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const toggleReaction = useStore((s) => s.toggleReaction);

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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !socket || !user) return;
    onSendMessage(trimmed);
    setInput('');
    setMentionActive(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Filtered online users for @mention
  const filteredMentionUsers = mentionActive
    ? onlineUsers
        .filter((u) => u.id !== user?.id)
        .filter((u) =>
          mentionQuery
            ? fuzzyMatch(mentionQuery, u.name)
            : true
        )
    : [];

  // Insert a mention into the input
  const insertMention = (userName: string) => {
    const before = input.slice(0, mentionStart);
    const after = input.slice(inputRef.current?.selectionEnd ?? input.length);
    const newInput = `${before}@${userName} ${after}`;
    setInput(newInput);
    setMentionActive(false);
    setMentionQuery('');
    setTimeout(() => {
      inputRef.current?.focus();
      const cursorPos = before.length + userName.length + 2;
      inputRef.current?.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  // Handle input changes with @mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Auto-resize textarea
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 96) + 'px';

    // Detect @mention
    const cursorPos = target.selectionEnd ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionActive(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(cursorPos - atMatch[0].length);
      setMentionIndex(0);
    } else {
      setMentionActive(false);
      setMentionQuery('');
    }
  };

  // Handle keydown for @mention navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionActive && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          (prev) =>
            (prev - 1 + filteredMentionUsers.length) %
            filteredMentionUsers.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentionUsers[mentionIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!user) return;
    toggleReaction(messageId, emoji, user.id);
  };

  // Build a map of userId -> name for reaction tooltips
  const userNameMap = (userIds: string[]) => {
    // Try to resolve from online users, fallback to sender names from messages
    const names = userIds.map((uid) => {
      const online = onlineUsers.find((u) => u.id === uid);
      if (online) return online.name;
      const fromMsg = messages.find((m) => m.senderId === uid);
      return fromMsg?.senderName || 'Unknown';
    });
    return names.join(', ');
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
              const hasReactions =
                msg.reactions && Object.keys(msg.reactions).length > 0;

              return (
                <div
                  key={msg.id || i}
                  className={cn(
                    'flex gap-2 max-w-[88%] chat-msg-animate group',
                    isOwn ? 'self-end flex-row-reverse' : 'self-start'
                  )}
                >
                  {/* Avatar with ring pulse on hover */}
                  <div
                    className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 shadow-sm transition-all duration-200 hover:shadow-[0_0_0_2px_rgba(35,134,54,0.5),0_0_8px_rgba(35,134,54,0.2)] hover:scale-110"
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
                      <span className="text-[10px] text-[#30363d] fade-in-up slide-in-right-soft">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap transition-all duration-200',
                        isOwn
                          ? 'bg-[#238636] text-white rounded-2xl rounded-br-md shadow-[0_2px_8px_rgba(35,134,54,0.2)] hover:bg-[#2ea043] hover:shadow-[0_2px_12px_rgba(35,134,54,0.3)]'
                          : 'bg-[#161b22] text-[#e6edf3] rounded-2xl rounded-bl-md border border-[#30363d]/60 shadow-sm hover:border-[#484f58]/60 hover:border-[#238636]/20'
                      )}
                      style={isOwn ? { background: 'linear-gradient(180deg, rgba(35,134,54,0.15) 0%, #238636 30%)' } : undefined}
                    >
                      {msg.text}
                    </div>

                    {/* Reactions row */}
                    {(hasReactions || !msg.system) && (
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-0.5 flex-wrap',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {hasReactions &&
                          Object.entries(msg.reactions!).map(
                            ([emoji, userIds]) => {
                              const isMyReaction = user?.id
                                ? userIds.includes(user.id)
                                : false;
                              return (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleToggleReaction(msg.id, emoji)
                                  }
                                  title={userNameMap(userIds)}
                                  className={cn(
                                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all duration-150',
                                    isMyReaction
                                      ? 'border-[#238636]/50 bg-[#238636]/10 text-[#3fb950]'
                                      : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:bg-[#30363d] hover:border-[#484f58] hover:text-[#e6edf3]'
                                  )}
                                >
                                  <span className="text-[13px] leading-none">
                                    {emoji}
                                  </span>
                                  <span className="text-[11px]">
                                    {userIds.length}
                                  </span>
                                </button>
                              );
                            }
                          )}

                        {/* Add reaction button */}
                        {!msg.system && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  'flex items-center justify-center size-5 rounded-full text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-all duration-150',
                                  'opacity-0 group-hover:opacity-100'
                                )}
                                aria-label="Add reaction"
                              >
                                <SmilePlus className="size-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-2 border-[#30363d]"
                              style={{
                                backgroundColor: '#161b22',
                              }}
                              align={isOwn ? 'end' : 'start'}
                              sideOffset={4}
                            >
                              <div className="grid grid-cols-4 gap-1">
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleToggleReaction(msg.id, emoji)
                                    }
                                    className="flex items-center justify-center size-9 text-lg rounded-md hover:bg-[#21262d] hover:scale-110 transition-all duration-100"
                                    aria-label={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    )}
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
                    {typingUsers.join(', ')}{' '}
                    {typingUsers.length === 1 ? 'is' : 'are'} typing
                  </span>
                  <div className="bg-[#161b22] border border-[#30363d]/60 rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="typing-indicator">
                      <span />
                      <span />
                      <span />
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
            className="absolute bottom-3 left-1/2 scroll-bounce size-7 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] shadow-lg transition-all"
          >
            <ArrowDown className="size-3.5" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#30363d] shrink-0 relative">
        <div className="flex items-end gap-2 bg-[#161b22] rounded-xl border border-[#30363d] p-2 focus-within:border-[#238636]/60 focus-within:shadow-[0_0_12px_rgba(35,134,54,0.2),0_0_24px_rgba(35,134,54,0.08)] transition-all duration-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @ to mention)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] outline-none placeholder-[#484f58] resize-none min-h-[28px] max-h-24 py-0.5 input-glow-focus"
            style={{ lineHeight: '1.5' }}
          />
          <Button
            size="icon"
            className="size-8 shrink-0 bg-[#238636] hover:bg-[#2ea043] text-white hover:shadow-[0_0_12px_rgba(35,134,54,0.3)] hover-glow-green press-effect"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-3.5" />
          </Button>
        </div>

        {/* @Mention Dropdown */}
        {mentionActive && filteredMentionUsers.length > 0 && (
          <div
            ref={mentionDropdownRef}
            className="absolute bottom-full left-3 right-3 mb-1 max-h-40 overflow-y-auto rounded-lg border border-[#30363d] shadow-xl"
            style={{
              backgroundColor: '#161b22',
              scrollbarWidth: 'thin',
              scrollbarColor: '#30363d #161b22',
            }}
          >
            {filteredMentionUsers.map((u, idx) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u.name)}
                onMouseEnter={() => setMentionIndex(idx)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                  idx === mentionIndex
                    ? 'bg-[#0d1117] text-[#e6edf3]'
                    : 'text-[#8b949e] hover:bg-[#0d1117]/60 hover:text-[#e6edf3]'
                )}
                style={
                  idx === mentionIndex
                    ? { borderLeft: '2px solid #238636', paddingLeft: '10px' }
                    : { borderLeft: '2px solid transparent', paddingLeft: '10px' }
                }
              >
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: u.color }}
                />
                <span className="text-sm truncate">{u.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}