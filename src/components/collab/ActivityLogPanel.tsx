'use client';

import { useMemo } from 'react';
import {
  LogIn,
  LogOut,
  Plus,
  Save,
  Play,
  FilePlus,
  Trash2,
  Settings,
  Code,
  Activity,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActivityLogEntry } from '@/store/useStore';

interface ActivityLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLogEntry[];
}

const EVENT_CONFIG: Record<
  ActivityLogEntry['type'],
  { icon: typeof LogIn; color: string }
> = {
  join: { icon: LogIn, color: '#238636' },
  leave: { icon: LogOut, color: '#f85149' },
  create: { icon: Plus, color: '#58a6ff' },
  save: { icon: Save, color: '#a371f7' },
  run: { icon: Play, color: '#f0883e' },
  file_add: { icon: FilePlus, color: '#238636' },
  file_delete: { icon: Trash2, color: '#f85149' },
  settings_change: { icon: Settings, color: '#8b949e' },
  language_change: { icon: Code, color: '#79c0ff' },
};

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

type TimeGroup = 'Today' | 'Yesterday' | 'Earlier';

function getTimeGroup(timestamp: string): TimeGroup {
  const now = new Date();
  const then = new Date(timestamp);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  if (then >= todayStart) return 'Today';
  if (then >= yesterdayStart) return 'Yesterday';
  return 'Earlier';
}

export default function ActivityLogPanel({
  isOpen,
  onClose,
  activities,
}: ActivityLogPanelProps) {
  const groupedActivities = useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const groups: Record<TimeGroup, ActivityLogEntry[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    for (const entry of sorted) {
      const group = getTimeGroup(entry.timestamp);
      groups[group].push(entry);
    }

    return (['Today', 'Yesterday', 'Earlier'] as TimeGroup[]).filter(
      (g) => groups[g].length > 0
    ).map((g) => ({ label: g, entries: groups[g] }));
  }, [activities]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="activity-panel"
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="fixed right-0 top-0 h-full w-[360px] border-l border-[#30363d] flex flex-col z-50"
          style={{ background: '#161b22' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#e6edf3]">
                Activity
              </span>
              {activities.length > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-[10px] bg-[#30363d] text-[#8b949e] border-none"
                >
                  {activities.length}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]"
              onClick={onClose}
              aria-label="Close activity panel"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Feed */}
          <ScrollArea className="flex-1">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="size-12 rounded-full bg-[#21262d] flex items-center justify-center mb-3">
                  <Activity className="size-5 text-[#484f58]" />
                </div>
                <p className="text-sm text-[#8b949e]">No activity yet</p>
              </div>
            ) : (
              <div className="py-1">
                {groupedActivities.map((group) => (
                  <div key={group.label}>
                    {/* Section header */}
                    <div className="sticky top-0 z-10 px-4 py-2 bg-[#161b22]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#484f58]">
                        {group.label}
                      </span>
                    </div>

                    {/* Entries */}
                    <div className="divide-y divide-[#21262d]">
                      {group.entries.map((entry) => {
                        const config = EVENT_CONFIG[entry.type];
                        const Icon = config.icon;

                        return (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#21262d]/50 transition-colors duration-150"
                          >
                            {/* Avatar */}
                            <div
                              className="size-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                              style={{ backgroundColor: entry.userColor }}
                            >
                              {entry.userName.charAt(0).toUpperCase()}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#e6edf3] truncate">
                                  {entry.userName}
                                </span>
                                <Icon
                                  className="size-3 shrink-0"
                                  style={{ color: config.color }}
                                />
                              </div>
                              <p className="text-xs text-[#8b949e] mt-0.5 truncate">
                                {entry.detail}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <span className="text-[10px] text-[#484f58] shrink-0 mt-0.5">
                              {getRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}