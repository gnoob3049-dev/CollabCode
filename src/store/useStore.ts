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

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  isPublic: boolean;
  language: string;
  files: RoomFile[];
  collaborators: string[];
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
  unreadChatCount: number;
  incrementUnreadChatCount: () => void;
  resetUnreadChatCount: () => void;
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
  unreadChatCount: 0,
  incrementUnreadChatCount: () =>
    set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  resetUnreadChatCount: () => set({ unreadChatCount: 0 }),
}));