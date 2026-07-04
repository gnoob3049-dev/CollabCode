'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  BellOff,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/store/useStore';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const typeConfig: Record<NotificationItem['type'], {
  icon: typeof Info;
  accentColor: string;
  iconColor: string;
}> = {
  info: { icon: Info, accentColor: '#238636', iconColor: '#3fb950' },
  success: { icon: CheckCircle2, accentColor: '#58a6ff', iconColor: '#58a6ff' },
  warning: { icon: AlertTriangle, accentColor: '#d29922', iconColor: '#d29922' },
  error: { icon: XCircle, accentColor: '#f85149', iconColor: '#f85149' },
};

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}: NotificationsPanelProps) {
  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) onMarkRead(n.id);
    });
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="notifications-panel"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="absolute top-0 right-0 z-50 h-full w-[360px] border-l border-[#30363d] bg-[#0d1117] flex flex-col shadow-2xl shadow-black/40"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#58a6ff]" />
              <h2 className="text-sm font-semibold text-[#e6edf3]">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] gap-1"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-[#f85149]/70 hover:text-[#f85149] hover:bg-[#f85149]/10 gap-1"
                  onClick={onClearAll}
                >
                  <Trash2 className="size-3" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
                onClick={onClose}
                aria-label="Close notifications"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                <div className="size-12 rounded-full bg-[#161b22] flex items-center justify-center">
                  <BellOff className="size-5 text-[#484f58]" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#8b949e]">No notifications</p>
                  <p className="text-xs text-[#484f58] mt-1">
                    Activity notifications will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {notifications.map((notification, index) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.15 }}
                        className={cn(
                          'rounded-md border bg-[#161b22] overflow-hidden cursor-pointer transition-colors hover:bg-[#161b22]/80',
                          notification.read
                            ? 'border-[#21262d] opacity-60'
                            : 'border-[#30363d]'
                        )}
                        onClick={() => {
                          if (!notification.read) onMarkRead(notification.id);
                        }}
                      >
                        <div className="flex">
                          {/* Left accent line for unread */}
                          <div
                            className={cn('w-1 shrink-0 transition-opacity', !notification.read ? 'opacity-100' : 'opacity-0')}
                            style={{ backgroundColor: config.accentColor }}
                          />
                          <div className="flex-1 min-w-0 p-3">
                            <div className="flex items-start gap-2.5">
                              <div
                                className="shrink-0 mt-0.5"
                                style={{ color: config.iconColor }}
                              >
                                <Icon className="size-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className={cn(
                                    'text-xs font-semibold truncate',
                                    notification.read ? 'text-[#8b949e]' : 'text-[#e6edf3]'
                                  )}>
                                    {notification.title}
                                  </span>
                                  <span className="text-[10px] text-[#484f58] shrink-0 ml-2">
                                    {getRelativeTime(notification.timestamp)}
                                  </span>
                                </div>
                                <p className={cn(
                                  'text-[11px] leading-relaxed line-clamp-2',
                                  notification.read ? 'text-[#484f58]' : 'text-[#8b949e]'
                                )}>
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}