import { create } from "zustand";

export type Page = "landing" | "login" | "register" | "dashboard" | "editor";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface RoomFile {
  name: string;
  content: string;
}

export interface ActivityLogEntry {
  id: string;
  type: 'join' | 'leave' | 'create' | 'save' | 'run' | 'file_add' | 'file_delete' | 'settings_change' | 'language_change';
  userId: string;
  userName: string;
  userColor: string;
  detail: string;
  timestamp: string;
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  isPublic: boolean;
  isReadOnly?: boolean;
  language: string;
  files: RoomFile[];
  collaborators: string[];
  activityLog?: ActivityLogEntry[];
  ownerId?: string;
  ownerName?: string;
  lastActiveAt?: string;
  createdAt?: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  createdAt?: string;
  system?: boolean;
  reactions?: Record<string, string[]>;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AppState {
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;

  // Room
  currentRoom: Room | null;
  currentRoomId: string | null;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentRoomId: (id: string | null) => void;

  // Editor
  currentFileName: string;
  setCurrentFileName: (name: string) => void;
  language: string;
  setLanguage: (lang: string) => void;

  // Presence
  onlineUsers: PresenceUser[];
  setOnlineUsers: (users: PresenceUser[]) => void;

  // Output panel
  output: string;
  setOutput: (output: string) => void;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;

  // Right panel
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  rightPanelTab: "chat" | "ai";
  setRightPanelTab: (tab: "chat" | "ai") => void;

  // Output panel visibility
  outputPanelOpen: boolean;
  setOutputPanelOpen: (v: boolean) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  unreadChatCount: number;
  incrementUnreadChatCount: () => void;
  resetUnreadChatCount: () => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  unreadNotificationCount: number;
}

export const useStore = create<AppState>((set) => ({
  currentPage: "landing",
  setCurrentPage: (page) => set({ currentPage: page }),

  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),

  currentRoom: null,
  currentRoomId: null,
  setCurrentRoom: (room) =>
    set({ currentRoom: room, currentRoomId: room?.id ?? null }),
  setCurrentRoomId: (id) => set({ currentRoomId: id }),

  currentFileName: "index.js",
  setCurrentFileName: (name) => set({ currentFileName: name }),
  language: "javascript",
  setLanguage: (lang) => set({ language: lang }),

  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  output: "",
  setOutput: (output) => set({ output }),
  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),

  rightPanelOpen: false,
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),
  rightPanelTab: "chat",
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  outputPanelOpen: false,
  setOutputPanelOpen: (v) => set({ outputPanelOpen: v }),

  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  toggleReaction: (messageId, emoji, userId) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];
        if (users.includes(userId)) {
          const filtered = users.filter((u) => u !== userId);
          if (filtered.length === 0) {
            delete reactions[emoji];
          } else {
            reactions[emoji] = filtered;
          }
        } else {
          reactions[emoji] = [...users, userId];
        }
        return { ...msg, reactions };
      }),
    })),
  unreadChatCount: 0,
  incrementUnreadChatCount: () =>
    set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  resetUnreadChatCount: () => set({ unreadChatCount: 0 }),

  notifications: [],
  addNotification: (n) =>
    set((state) => ({
      notifications: [
        {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  unreadNotificationCount: 0,
}));