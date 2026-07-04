'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Editor, { type OnMount, type editor } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { io, type Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageSquare,
  Sparkles,
  FilePlus,
  Pencil,
  Trash2,
  Save,
  Play,
  Terminal,
  PanelRight,
  Paintbrush,
  LayoutDashboard,
  Settings,
  Keyboard,
  WrapText,
  Map,
  Eye,
  Search,
  Replace,
  FileSearch,
  History,
  Download,
  Inbox,
  ClipboardList,
} from 'lucide-react';
import { playSound, isAudioEnabled as checkAudioEnabled, toggleAudio as doToggleAudio } from '@/lib/audio';
import { useStore } from '@/store/useStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EditorTopBar from './EditorTopBar';
import FileTree from './FileTree';
import ChatPanel from './ChatPanel';
import AIPanel from './AIPanel';
import OutputPanel from './OutputPanel';
import RoomSettingsModal from './RoomSettingsModal';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import EditorStatusBar from './EditorStatusBar';
import EditorBreadcrumb from './EditorBreadcrumb';
import CommandPalette, { type CommandItem, type FileItem } from './CommandPalette';
import HtmlPreview from './HtmlPreview';
import MarkdownPreview from './MarkdownPreview';
import EditorTabs from './EditorTabs';
import VersionHistoryPanel, { type VersionSnapshot } from './VersionHistoryPanel';
import ActivityLogPanel from './ActivityLogPanel';
import NotificationsPanel from './NotificationsPanel';
import type { ChatMessage, Room, ActivityLogEntry } from '@/store/useStore';
import { useIsMobile } from '@/hooks/use-mobile';

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  html: 'html',
  css: 'css',
  sql: 'sql',
  rust: 'rust',
};

function getMonacoLanguage(lang: string): string {
  return LANGUAGE_MAP[lang] || 'plaintext';
}

export default function EditorPage() {
  const {
    currentRoomId,
    user,
    currentFileName,
    setCurrentFileName,
    language,
    setLanguage,
    onlineUsers,
    setOnlineUsers,
    output,
    setOutput,
    isRunning,
    setIsRunning,
    rightPanelOpen,
    setRightPanelOpen,
    rightPanelTab,
    setRightPanelTab,
    outputPanelOpen,
    setOutputPanelOpen,
    currentRoom,
    setCurrentRoom,
    setCurrentPage,
    setCurrentRoomId,
    chatMessages,
    addChatMessage,
    unreadChatCount,
    incrementUnreadChatCount,
    resetUnreadChatCount,
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications,
  } = useStore();

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileListRef = useRef<Y.Array<string> | null>(null);
  const initDoneRef = useRef(false);

  const [files, setFiles] = useState<string[]>(['index.js']);
  const [fileTreeCollapsed, setFileTreeCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandFilter, setCommandFilter] = useState<string | null>(null);
  const [fileSearchFiles, setFileSearchFiles] = useState<FileItem[] | undefined>(undefined);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false);
  const [audioEnabled, setAudioEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return checkAudioEnabled();
  });
  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;
  const [runResultIsHtml, setRunResultIsHtml] = useState(false);
  const [runResultIsCss, setRunResultIsCss] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionSnapshots, setVersionSnapshots] = useState<VersionSnapshot[]>([]);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotContentRef = useRef<string>('');

  // Get language from file extension
  const getLanguageFromFilename = useCallback(
    (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const map: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'cpp',
        go: 'go',
        html: 'html',
        css: 'css',
        sql: 'sql',
        rs: 'rust',
        md: 'markdown',
        mdx: 'markdown',
      };
      return map[ext] || language;
    },
    [language]
  );

  // Read-only mode computations
  const isOwner = useMemo(() => currentRoom?.ownerId === user?.id, [currentRoom, user]);
  const isLockedForUser = useMemo(() => (currentRoom?.isReadOnly ?? false) && !isOwner, [currentRoom, isOwner]);

  // Activity logging helper
  const logActivity = useCallback(
    (type: ActivityLogEntry['type'], detail: string) => {
      if (!user || !currentRoomId) return;
      const entry: ActivityLogEntry = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        userId: user.id,
        userName: user.name,
        userColor: user.avatarColor,
        detail,
        timestamp: new Date().toISOString(),
      };
      setActivities((prev) => [...prev, entry]);

      // Persist to room via PATCH
      fetch(`/api/rooms/${currentRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activityLog: [...(currentRoom?.activityLog || []), entry],
        }),
      }).catch(() => {
        // Silently fail — activity log persistence is non-critical
      });
    },
    [user, currentRoomId, currentRoom]
  );

  // Initialize Y.js and Socket.io
  useEffect(() => {
    if (!currentRoomId || !user) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const fileList = ydoc.getArray<string>('fileList');
    fileListRef.current = fileList;

    // Connect to y-websocket provider
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/yjs?XTransformPort=3003`;
    const provider = new WebsocketProvider(wsUrl, currentRoomId, ydoc, {
      connect: true,
    });
    providerRef.current = provider;

    // Fetch room data
    fetch(`/api/rooms/${currentRoomId}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.room) {
          setCurrentRoom(data.room);
          setLanguage(data.room.language || 'javascript');
          if (data.room.activityLog) {
            setActivities(data.room.activityLog);
          }
          const roomFiles: string[] = data.room.files?.map(
            (f: { name: string }) => f.name
          ) || ['index.js'];

          if (fileList.length === 0) {
            ydoc.transact(() => {
              roomFiles.forEach((name: string) => {
                if (!fileList.toArray().includes(name)) {
                  fileList.push([name]);
                }
              });
              data.room.files?.forEach(
                (f: { name: string; content: string }) => {
                  const ytext = ydoc.getText(f.name);
                  if (!ytext.toString()) {
                    ytext.insert(0, f.content);
                  }
                }
              );
            });
          }

          // Set first file as active
          if (roomFiles.length > 0 && !initDoneRef.current) {
            setCurrentFileName(roomFiles[0]);
            initDoneRef.current = true;
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch room:', err);
        toast.error('Failed to load room');
      });

    // Sync file list from Y.js
    const updateFiles = () => {
      const arr = fileList.toArray();
      setFiles(arr);
    };
    fileList.observe(updateFiles);
    updateFiles();

    // Set up UndoManager for version history tracking
    const undoManager = new Y.UndoManager(ydoc.getText(currentFileName), {
      trackedOrigins: new Set(['local']),
    });
    undoManagerRef.current = undoManager;

    const createSnapshot = (type: 'edit' | 'add' | 'delete') => {
      const ytext = ydoc.getText(currentFileName);
      const content = ytext.toString();
      // Skip if content hasn't changed since last snapshot
      if (content === lastSnapshotContentRef.current) return;
      lastSnapshotContentRef.current = content;

      const lines = content.split('\n');
      const snapshot: VersionSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        content,
        type,
        lineCount: lines.length,
        charCount: content.length,
        fileName: currentFileName,
        prevContent: undefined,
      };

      setVersionSnapshots((prev) => {
        // Update prevContent on the new snapshot to point to the last one
        const lastSnap = prev.length > 0 ? prev[prev.length - 1] : null;
        if (lastSnap && lastSnap.fileName === currentFileName) {
          snapshot.prevContent = lastSnap.content;
        }
        const updated = [...prev, snapshot];
        // Limit to 50 snapshots
        if (updated.length > 50) {
          return updated.slice(updated.length - 50);
        }
        return updated;
      });
    };

    // Debounced snapshot capture on undoable changes
    const handleUndoManagerChange = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        createSnapshot('edit');
      }, 3000);
    };

    undoManager.on('stack-item-added', handleUndoManagerChange);

    // Initial snapshot
    setTimeout(() => {
      const ytext = ydoc.getText(currentFileName);
      const content = ytext.toString();
      if (content) {
        lastSnapshotContentRef.current = content;
        setVersionSnapshots([{
          id: `snap-init-${Date.now()}`,
          timestamp: Date.now(),
          content,
          type: 'add',
          lineCount: content.split('\n').length,
          charCount: content.length,
          fileName: currentFileName,
        }]);
      }
    }, 1000);

    // Connect Socket.io
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', {
        roomId: currentRoomId,
        user: { id: user.id, name: user.name, color: user.avatarColor },
      });
      addNotification({ type: 'success', title: 'Room joined', message: `Connected to room ${currentRoomId}` });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('users_update', ({ users }: { users: any[] }) => {
      setOnlineUsers(users.map((u) => ({ id: u.id, name: u.name, color: u.color })));
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      addChatMessage(msg);
      // Only increment unread if panel is closed or on different tab
      if (!rightPanelOpen || rightPanelTab !== 'chat') {
        incrementUnreadChatCount();
        // Play message sound and show toast when chat is not visible
        playSound('message');
        const preview = msg.text.length > 50 ? msg.text.slice(0, 50) + '…' : msg.text;
        toast(`${msg.senderName}: ${preview}`, {
          duration: 4000,
          action: {
            label: 'Open chat',
            onClick: () => {
              setRightPanelTab('chat');
              setRightPanelOpen(true);
              resetUnreadChatCount();
            },
          },
        });
      }
    });

    socket.on('user_joined', ({ text }: { text: string }) => {
      playSound('join');
      addNotification({ type: 'info', title: 'Collaborator joined', message: text });
      addChatMessage({
        id: `sys-${Date.now()}-joined`,
        roomId: currentRoomId,
        senderId: 'system',
        senderName: 'System',
        senderColor: '#484f58',
        text,
        system: true,
      });
    });

    socket.on('user_left', ({ text }: { text: string }) => {
      playSound('leave');
      addNotification({ type: 'warning', title: 'Collaborator left', message: text });
      addChatMessage({
        id: `sys-${Date.now()}-left`,
        roomId: currentRoomId,
        senderId: 'system',
        senderName: 'System',
        senderColor: '#484f58',
        text,
        system: true,
      });
    });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      undoManager.destroy();
      socket.emit('leave_room', {
        roomId: currentRoomId,
        user: { id: user.id, name: user.name, color: user.avatarColor },
      });
      socket.disconnect();
      provider?.destroy();
      ydoc?.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      fileListRef.current = null;
      initDoneRef.current = false;
    };
  }, [currentRoomId]);

  // Bind Monaco to Y.Text when file changes
  const handleEditorMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monaco;

      if (ydocRef.current && providerRef.current) {
        const ytext = ydocRef.current.getText(currentFileName);
        const model = editorInstance.getModel();
        if (model) {
          const content = ytext.toString();
          editorInstance.setValue(content);
          bindingRef.current?.destroy();
          bindingRef.current = new MonacoBinding(
            ytext,
            model,
            new Set([editorInstance]),
            providerRef.current.awareness
          );
        }
      }

      // Set up awareness for cursor color
      if (providerRef.current && user) {
        providerRef.current.awareness.setLocalStateField('user', {
          name: user.name,
          color: user.avatarColor,
        });
      }

      // Track current code — also sync immediately on mount
      const syncCode = () => setCurrentCode(editorInstance.getValue());
      editorInstance.onDidChangeModelContent(syncCode);
      // Initial sync after a tick to capture content set during mount
      setTimeout(syncCode, 100);

      // Track cursor position
      editorInstance.onDidChangeCursorPosition((e) => {
        setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
      });
    },
    [currentFileName, user]
  );

  // Rebind when file changes
  useEffect(() => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;

    const ytext = ydocRef.current.getText(currentFileName);
    const content = ytext.toString();
    const editorInstance = editorRef.current;
    const model = editorInstance.getModel();

    if (model) {
      // Check if the file already has content in Yjs
      const modelValue = model.getValue();
      const yjsValue = ytext.toString();

      if (modelValue !== yjsValue) {
        editorInstance.setValue(yjsValue);
        setCurrentCode(yjsValue);
      }

      bindingRef.current?.destroy();
      bindingRef.current = new MonacoBinding(
        ytext,
        model,
        new Set([editorInstance]),
        providerRef.current.awareness
      );
    }
  }, [currentFileName]);

  // File operations
  const handleCreateFile = useCallback(
    (name: string) => {
      if (isLockedForUser) {
        toast.error('This room is in read-only mode');
        return;
      }
      if (!fileListRef.current || !ydocRef.current) return;
      const list = fileListRef.current;
      if (!list.toArray().includes(name)) {
        list.push([name]);
        // Initialize empty content if not exists
        const ytext = ydocRef.current.getText(name);
        if (!ytext.toString()) {
          ytext.insert(0, '');
        }
        setCurrentFileName(name);
        logActivity('file_add', `added file ${name}`);
      }
    },
    [isLockedForUser, logActivity]
  );

  const handleRenameFile = useCallback(
    (oldName: string, newName: string) => {
      if (!fileListRef.current || !ydocRef.current) return;
      const list = fileListRef.current;
      const idx = list.toArray().indexOf(oldName);
      if (idx === -1) return;

      // Copy content to new name
      const ydoc = ydocRef.current;
      const oldContent = ydoc.getText(oldName).toString();
      ydoc.getText(newName).insert(0, oldContent);
      ydoc.getText(oldName).delete(0, oldContent.length);

      // Update file list
      list.delete(idx, 1);
      list.insert(idx, [newName]);

      // Update current file if renamed
      if (currentFileName === oldName) {
        setCurrentFileName(newName);
      }
    },
    [currentFileName, setCurrentFileName]
  );

  // Reorder files in Y.js
  const handleReorderFiles = useCallback(
    (newOrder: string[]) => {
      if (!fileListRef.current || !ydocRef.current) return;
      const list = fileListRef.current;
      const current = list.toArray();
      // Only update if order actually changed
      if (JSON.stringify(current) === JSON.stringify(newOrder)) return;
      ydocRef.current.transact(() => {
        list.delete(0, list.length);
        list.insert(0, newOrder);
      });
      logActivity('file_reorder', 'reordered files in the file tree');
    },
    [logActivity]
  );

  const handleDeleteFile = useCallback(
    (name: string) => {
      if (isLockedForUser) {
        toast.error('This room is in read-only mode');
        return;
      }
      if (!fileListRef.current || !ydocRef.current) return;
      const list = fileListRef.current;
      const idx = list.toArray().indexOf(name);
      if (idx === -1) return;

      list.delete(idx, 1);

      // Delete the Y.Text content
      const ytext = ydocRef.current.getText(name);
      const content = ytext.toString();
      ytext.delete(0, content.length);

      // Select another file
      if (currentFileName === name) {
        const remaining = list.toArray();
        if (remaining.length > 0) {
          setCurrentFileName(remaining[0]);
        } else {
          // Create a default file
          handleCreateFile('index.js');
        }
      }
      logActivity('file_delete', `deleted file ${name}`);
    },
    [currentFileName, setCurrentFileName, handleCreateFile, isLockedForUser, logActivity]
  );

  // Run code
  const handleRun = useCallback(async () => {
    if (isLockedForUser) {
      toast.error('This room is in read-only mode');
      return;
    }
    if (!ydocRef.current) return;
    setIsRunning(true);
    setOutput('');
    setRunResultIsHtml(false);
    setRunResultIsCss(false);
    setOutputPanelOpen(true);
    playSound('run_start');
    try {
      const ytext = ydocRef.current.getText(currentFileName);
      const code = ytext?.toString() || '';
      const fileLanguage = getLanguageFromFilename(currentFileName);

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, language: fileLanguage }),
      });
      const data = await res.json();
      const hasErrors = !!data.error;
      if (data.isHtml) {
        setRunResultIsHtml(true);
        setOutput(data.output || '');
      } else if (data.isCss) {
        setRunResultIsCss(true);
        setOutput(data.output || 'CSS preview available in the Preview panel');
      } else {
        setOutput(data.output || data.error || 'No output');
      }
      playSound('run_complete', { hasErrors });
      if (hasErrors) {
        const firstLine = (data.error || 'Unknown error').split('\n')[0];
        toast.error(firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine);
        addNotification({ type: 'error', title: 'Run error', message: firstLine.length > 120 ? firstLine.slice(0, 120) + '…' : firstLine });
      } else {
        toast.success('Code executed successfully');
        addNotification({ type: 'success', title: 'Code ran', message: `${currentFileName} executed successfully` });
      }
      logActivity('run', `ran code in ${currentFileName}`);
    } catch {
      setOutput('Error: Failed to execute code');
      playSound('error');
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  }, [currentFileName, getLanguageFromFilename, setIsRunning, setOutput, setOutputPanelOpen, isLockedForUser, logActivity]);

  // Save
  const handleSave = useCallback(async () => {
    if (!currentRoomId || !ydocRef.current) return;
    setIsSaving(true);
    try {
      const fileNames = fileListRef.current?.toArray() || files;
      const fileEntries = fileNames.map((name) => ({
        name,
        content: ydocRef.current?.getText(name)?.toString() || '',
      }));
      await fetch(`/api/rooms/${currentRoomId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ files: fileEntries }),
      });
      playSound('save');
      toast.success('Room saved');
      addNotification({ type: 'success', title: 'File saved', message: 'Room saved successfully' });
      logActivity('save', 'saved the document');
    } catch {
      playSound('error');
      toast.error('Failed to save');
      addNotification({ type: 'error', title: 'Save failed', message: 'Failed to save room' });
    } finally {
      setIsSaving(false);
    }
  }, [currentRoomId, files, logActivity]);

  // Format Document
  const handleFormat = useCallback(() => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;
    const action = editorInstance.getAction('editor.action.formatDocument');
    if (action) {
      action.run();
      toast.success('Document formatted');
    } else {
      // Fallback: simple indentation cleanup
      const model = editorInstance.getModel();
      if (!model) return;
      const lines = model.getValue().split('\n');
      let indent = 0;
      const formatted = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          // Decrease indent for closing braces/brackets
          if (/^[}\])]/.test(trimmed)) indent = Math.max(0, indent - 1);
          const result = '  '.repeat(indent) + trimmed;
          // Increase indent for opening braces/brackets
          if (/[{(\[]\s*$/.test(trimmed)) indent++;
          return result;
        })
        .join('\n');
      editorInstance.setValue(formatted);
      toast.success('Document formatted');
    }
  }, []);

  // Share
  const handleShare = useCallback(() => {
    if (!currentRoom) return;
    const inviteLink = `${window.location.origin}?join=${currentRoom.inviteCode}`;
    navigator.clipboard.writeText(inviteLink).then(
      () => toast.success('Invite link copied!'),
      () => toast.error('Failed to copy link')
    );
  }, [currentRoom]);

  // Export room as ZIP
  const handleExportRoom = useCallback(async () => {
    if (!currentRoomId) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoomId}/export`, {
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error('Failed to export room');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentRoom?.name || 'room').replace(/[^a-zA-Z0-9_\-.]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Room exported successfully!');
      logActivity('export', 'exported room as ZIP');
    } catch {
      toast.error('Failed to export room');
    }
  }, [currentRoomId, currentRoom, logActivity]);

  // Chat send
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!socketRef.current || !user || !currentRoomId) return;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId: currentRoomId,
        senderId: user.id,
        senderName: user.name,
        senderColor: user.avatarColor,
        text,
        createdAt: new Date().toISOString(),
      };
      socketRef.current.emit('chat_message', { roomId: currentRoomId, message: msg });
    },
    [user, currentRoomId]
  );

  // Panel toggles
  const handleToggleChat = useCallback(() => {
    if (rightPanelOpen && rightPanelTab === 'chat') {
      setRightPanelOpen(false);
    } else {
      setRightPanelTab('chat');
      setRightPanelOpen(true);
      resetUnreadChatCount();
    }
  }, [rightPanelOpen, rightPanelTab, setRightPanelOpen, setRightPanelTab, resetUnreadChatCount]);

  const handleToggleAI = useCallback(() => {
    if (rightPanelOpen && rightPanelTab === 'ai') {
      setRightPanelOpen(false);
    } else {
      setRightPanelTab('ai');
      setRightPanelOpen(true);
    }
  }, [rightPanelOpen, rightPanelTab, setRightPanelOpen, setRightPanelTab]);

  const handleBack = useCallback(() => {
    setCurrentRoomId('');
    setCurrentRoom(null);
    setCurrentPage('dashboard');
  }, [setCurrentRoomId, setCurrentRoom, setCurrentPage]);

  // Determine if current file supports HTML preview
  const isHtmlFile = useMemo(() => {
    const ext = currentFileName.split('.').pop()?.toLowerCase() || '';
    return ext === 'html' || ext === 'htm' || ext === 'css';
  }, [currentFileName]);

  // Determine if current file is a Markdown file
  const isMarkdownFile = useMemo(() => {
    const ext = currentFileName.split('.').pop()?.toLowerCase() || '';
    return ext === 'md' || ext === 'mdx';
  }, [currentFileName]);

  const handleTogglePreview = useCallback(() => {
    setHtmlPreviewOpen((v) => !v);
  }, []);

  // Version history restore
  const handleVersionRestore = useCallback((snapshot: VersionSnapshot) => {
    if (!ydocRef.current || !editorRef.current) return;
    const ytext = ydocRef.current.getText(currentFileName);
    const currentContent = ytext.toString();
    ytext.delete(0, currentContent.length);
    ytext.insert(0, snapshot.content);
    lastSnapshotContentRef.current = snapshot.content;
    setCurrentCode(snapshot.content);
  }, [currentFileName]);

  // Version history toggle
  const handleToggleVersionHistory = useCallback(() => {
    setVersionHistoryOpen((v) => !v);
  }, []);

  // Audio toggle
  const handleToggleAudio = useCallback(() => {
    const newState = doToggleAudio();
    setAudioEnabledState(newState);
    if (newState) {
      playSound('success');
      toast.success('Audio notifications enabled');
    } else {
      toast.info('Audio notifications disabled');
    }
  }, []);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      logActivity('language_change', `changed language to ${lang}`);
    },
    [setLanguage, logActivity]
  );

  const handleRenameRoom = useCallback(
    async (name: string) => {
      if (!currentRoomId) return;
      try {
        const res = await fetch(`/api/rooms/${currentRoomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (data.room) {
          setCurrentRoom(data.room);
        }
      } catch {
        toast.error('Failed to rename room');
      }
    },
    [currentRoomId, setCurrentRoom]
  );

  const handleSettingsUpdate = useCallback(
    (updatedRoom: Room) => {
      setCurrentRoom(updatedRoom);
      setLanguage(updatedRoom.language);
    },
    [setCurrentRoom, setLanguage]
  );

  // Apply word wrap, minimap, and read-only options to Monaco
  useEffect(() => {
    editorRef.current?.updateOptions({
      wordWrap,
      minimap: { enabled: minimapEnabled },
      readOnly: isLockedForUser,
    });
  }, [wordWrap, minimapEnabled, isLockedForUser]);

  // Build command palette items
  const commandItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'new-file',
        label: 'New File',
        icon: FilePlus,
        category: 'File Operations',
        action: () => {
          const name = window.prompt('Enter file name:', 'untitled.js');
          if (name?.trim()) handleCreateFile(name.trim());
        },
      },
      {
        id: 'rename-file',
        label: 'Rename File',
        icon: Pencil,
        category: 'File Operations',
        action: () => {
          const newName = window.prompt(
            'Enter new name:',
            currentFileName
          );
          if (newName?.trim() && newName.trim() !== currentFileName) {
            handleRenameFile(currentFileName, newName.trim());
          }
        },
      },
      {
        id: 'delete-file',
        label: 'Delete Current File',
        icon: Trash2,
        category: 'File Operations',
        action: () => {
          if (files.length <= 1) {
            toast.error('Cannot delete the only file');
            return;
          }
          handleDeleteFile(currentFileName);
        },
      },
      {
        id: 'save-room',
        label: 'Save Room',
        icon: Save,
        shortcut: ['Ctrl', 'S'],
        category: 'File Operations',
        action: handleSave,
      },
      {
        id: 'export-room',
        label: 'Export Room as ZIP',
        icon: Download,
        category: 'File Operations',
        action: handleExportRoom,
      },
      {
        id: 'run-code',
        label: 'Run Code',
        icon: Play,
        shortcut: ['Ctrl', 'Enter'],
        category: 'Editor Actions',
        action: handleRun,
      },
      {
        id: 'toggle-terminal',
        label: 'Toggle Terminal',
        icon: Terminal,
        category: 'Editor Actions',
        action: () => setOutputPanelOpen(!outputPanelOpen),
      },
      {
        id: 'toggle-side-panel',
        label: 'Toggle Side Panel',
        icon: PanelRight,
        shortcut: ['Ctrl', 'B'],
        category: 'Editor Actions',
        action: () => setRightPanelOpen(!rightPanelOpen),
      },
      {
        id: 'format-document',
        label: 'Format Document',
        icon: Paintbrush,
        shortcut: ['Shift', 'Alt', 'F'],
        category: 'Editor Actions',
        action: handleFormat,
      },
      {
        id: 'go-to-dashboard',
        label: 'Go to Dashboard',
        icon: LayoutDashboard,
        category: 'Navigation',
        action: handleBack,
      },
      {
        id: 'open-settings',
        label: 'Open Settings',
        icon: Settings,
        category: 'Navigation',
        action: () => setSettingsOpen(true),
      },
      {
        id: 'toggle-shortcuts',
        label: 'Toggle Keyboard Shortcuts',
        icon: Keyboard,
        shortcut: ['Ctrl', '/'],
        category: 'Navigation',
        action: () => setShortcutsOpen((v) => !v),
      },
      {
        id: 'toggle-word-wrap',
        label: 'Toggle Word Wrap',
        icon: WrapText,
        category: 'Editor',
        action: () =>
          setWordWrap((v) => (v === 'on' ? 'off' : 'on')),
      },
      {
        id: 'toggle-minimap',
        label: 'Toggle Minimap',
        icon: Map,
        category: 'View',
        action: () => setMinimapEnabled((v) => !v),
      },
      {
        id: 'find',
        label: 'Find in File',
        icon: Search,
        shortcut: ['Ctrl', 'F'],
        category: 'Editor Actions',
        action: () => editorRef.current?.getAction('actions.find')?.run(),
      },
      {
        id: 'replace',
        label: 'Find and Replace',
        icon: Replace,
        shortcut: ['Ctrl', 'H'],
        category: 'Editor Actions',
        action: () => editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run(),
      },
      {
        id: 'quick-open-file',
        label: 'Quick Open File',
        icon: FileSearch,
        shortcut: ['Ctrl', 'P'],
        category: 'Navigation',
        action: () => {
          if (files.length <= 1) return;
          setFileSearchFiles(
            files.map((f) => ({
              name: f,
              action: () => setCurrentFileName(f),
            }))
          );
          setCommandFilter(null);
          setCommandPaletteOpen(true);
        },
      },
      {
        id: 'toggle-preview',
        label: 'Toggle Preview',
        icon: Eye,
        shortcut: ['Ctrl', 'Shift', 'V'],
        category: 'View',
        action: handleTogglePreview,
      },
      {
        id: 'toggle-version-history',
        label: 'Toggle Version History',
        icon: History,
        shortcut: ['Ctrl', 'Shift', 'H'],
        category: 'View',
        action: handleToggleVersionHistory,
      },
      {
        id: 'toggle-activity-log',
        label: 'Toggle Activity Log',
        icon: ClipboardList,
        shortcut: ['Ctrl', 'Shift', 'A'],
        category: 'View',
        action: () => setActivityLogOpen((v) => !v),
      },
      {
        id: 'toggle-notifications',
        label: 'Toggle Notifications',
        icon: Inbox,
        shortcut: ['Ctrl', 'Shift', 'N'],
        category: 'View',
        action: () => setNotificationsOpen((v) => !v),
      },
    ],
    [
      handleCreateFile,
      handleRenameFile,
      handleDeleteFile,
      handleSave,
      handleRun,
      handleFormat,
      handleExportRoom,
      handleBack,
      currentFileName,
      files.length,
      outputPanelOpen,
      rightPanelOpen,
      htmlPreviewOpen,
      handleToggleVersionHistory,
    ]
  );

  // Keyboard shortcuts — capture phase to intercept before Monaco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // When command palette is open, let it handle everything
      if (commandPaletteOpen) return;

      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      } else if (isMod && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleRun();
      } else if (isMod && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        setCommandPaletteOpen(true);
      } else if (isMod && e.key === 'b') {
        e.preventDefault();
        e.stopPropagation();
        setRightPanelOpen(!rightPanelOpen);
      } else if (isMod && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        // Ctrl+P: Open file search in command palette
        e.preventDefault();
        e.stopPropagation();
        if (files.length > 1) {
          setFileSearchFiles(
            files.map((f) => ({
              name: f,
              action: () => setCurrentFileName(f),
            }))
          );
          setCommandFilter(null);
          setCommandPaletteOpen(true);
        }
      } else if (isMod && e.key === '/') {
        e.preventDefault();
        e.stopPropagation();
        setShortcutsOpen(true);
      } else if (isMod && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        e.stopPropagation();
        if (isHtmlFile || isMarkdownFile) handleTogglePreview();
      } else if (isMod && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        e.stopPropagation();
        handleToggleVersionHistory();
      } else if (isMod && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        e.stopPropagation();
        setNotificationsOpen((v) => !v);
      } else if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        handleFormat();
      } else if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        e.stopPropagation();
        setWordWrap((v) => (v === 'on' ? 'off' : 'on'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setRightPanelOpen(false);
        setOutputPanelOpen(false);
        setHtmlPreviewOpen(false);
        setVersionHistoryOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSave, handleRun, handleFormat, rightPanelOpen, commandPaletteOpen, isHtmlFile, isMarkdownFile, handleTogglePreview, handleToggleVersionHistory, files, setCurrentFileName]);

  // Remote cursor decorations: CSS for y-monaco's built-in selection highlighting
  // + name labels for each remote user's cursor position
  useEffect(() => {
    const provider = providerRef.current;
    const editorInstance = editorRef.current;
    if (!provider || !editorInstance) return;

    const awareness = provider.awareness;
    let labelDecorations: string[] = [];
    const styleEl = document.createElement('style');
    styleEl.dataset.collabCursor = 'true';
    document.head.appendChild(styleEl);

    const updateRemoteCursors = () => {
      const states = awareness.getStates();
      const localClientId = awareness.clientID;
      let css = '';
      const newLabelDecorations: editor.IModelDeltaDecoration[] = [];
      const model = editorInstance.getModel();

      states.forEach((state: any, clientId: number) => {
        if (clientId === localClientId) return;

        const user = state.user as { name?: string; color?: string } | undefined;
        const name = user?.name || 'Anonymous';
        const color = user?.color || '#8b949e';
        const safeId = clientId.toString().replace(/[^a-z0-9]/gi, '');

        // Inject CSS for y-monaco's built-in selection/cursor decoration classes
        css += `.yRemoteSelection-${safeId} { background-color: ${color}33 !important; }\n`;
        css += `.yRemoteSelectionHead-${safeId} { border-left: 2px solid ${color} !important; }\n`;

        if (!model) return;

        // Resolve cursor line from awareness state
        let cursorLine: number | null = null;

        // Method 1: y-monaco sets 'selection' with Y.RelativePositions
        if (state.selection?.head != null && ydocRef.current) {
          const ytext = ydocRef.current.getText(currentFileName);
          if (ytext) {
            const headAbs = Y.createAbsolutePositionFromRelativePosition(
              state.selection.head,
              ytext.doc
            );
            if (headAbs !== null && headAbs.type === ytext) {
              cursorLine = model.getPositionAt(headAbs.index).lineNumber;
            }
          }
        }

        // Method 2: fallback to 'cursor' field with { line, column }
        if (cursorLine === null && state.cursor?.line != null) {
          cursorLine = state.cursor.line;
        }

        // Add name label decoration at the cursor line
        if (cursorLine !== null) {
          const safeLine = Math.max(1, cursorLine);
          css += `.cc-label-${safeId} { background: ${color}; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 3px 3px 3px 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 16px; display: inline-block; margin-left: 4px; vertical-align: middle; pointer-events: none; }\n`;

          newLabelDecorations.push({
            range: {
              startLineNumber: safeLine,
              startColumn: 1,
              endLineNumber: safeLine,
              endColumn: 1,
            },
            options: {
              isWholeLine: true,
              after: {
                content: `  ${name} `,
                inlineClassName: `cc-label-${safeId}`,
              },
            },
          });
        }
      });

      styleEl.textContent = css;
      labelDecorations = editorInstance.deltaDecorations(
        labelDecorations,
        newLabelDecorations
      );
    };

    awareness.on('change', updateRemoteCursors);
    updateRemoteCursors();

    return () => {
      awareness.off('change', updateRemoteCursors);
      editorInstance.deltaDecorations(labelDecorations, []);
      if (styleEl.parentNode) {
        document.head.removeChild(styleEl);
      }
    };
  }, [currentFileName]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117]">
      {/* Top bar */}
      <EditorTopBar
        room={currentRoom}
        user={user}
        onlineUsers={onlineUsers}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onSave={handleSave}
        onFormat={handleFormat}
        onShare={handleShare}
        onToggleChat={handleToggleChat}
        onToggleAI={handleToggleAI}
        onToggleOutput={() => setOutputPanelOpen(!outputPanelOpen)}
        onBack={handleBack}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onTogglePreview={handleTogglePreview}
        previewOpen={htmlPreviewOpen}
        showPreview={isHtmlFile || isMarkdownFile}
        rightPanelOpen={rightPanelOpen}
        outputPanelOpen={outputPanelOpen}
        unreadChatCount={unreadChatCount}
        isRunning={isRunning}
        isSaving={isSaving}
        onRenameRoom={handleRenameRoom}
        isConnected={connected}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onToggleHistory={handleToggleVersionHistory}
        historyOpen={versionHistoryOpen}
        isReadOnly={currentRoom?.isReadOnly ?? false}
        isOwner={isOwner}
        onExport={handleExportRoom}
        onToggleMobileFileTree={() => setMobileFileTreeOpen((v) => !v)}
        onToggleActivityLog={() => setActivityLogOpen((v) => !v)}
        activityLogOpen={activityLogOpen}
        onToggleNotifications={() => setNotificationsOpen((v) => !v)}
        notificationsOpen={notificationsOpen}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        onToggleWordWrap={() => setWordWrap((w) => (w === 'on' ? 'off' : 'on'))}
        wordWrap={wordWrap}
      />

      {/* Read-only mode banner */}
      {isLockedForUser && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#f0883e]/10 border-b border-[#f0883e]/30 shrink-0">
          <span className="text-xs text-[#f0883e] font-medium">
            🔒 This room is in read-only mode
          </span>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* File Tree - desktop */}
        {!isMobile && (
          <FileTree
            files={files}
            currentFile={currentFileName}
            onSelectFile={setCurrentFileName}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            collapsed={fileTreeCollapsed}
            onToggleCollapse={() => setFileTreeCollapsed(!fileTreeCollapsed)}
            isReadOnly={isLockedForUser}
            onReorderFiles={handleReorderFiles}
          />
        )}
        {/* Mobile File Tree overlay */}
        {isMobile && mobileFileTreeOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileFileTreeOpen(false)}
            />
            <motion.div
              className="fixed top-12 left-0 right-0 z-50 max-h-[50vh] overflow-hidden rounded-b-2xl bg-[#0d1117] border-b border-x border-[#30363d] shadow-2xl"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#30363d]" />
              </div>
              <FileTree
                files={files}
                currentFile={currentFileName}
                onSelectFile={(name) => {
                  setCurrentFileName(name);
                  setMobileFileTreeOpen(false);
                }}
                onCreateFile={(name) => {
                  handleCreateFile(name);
                  setMobileFileTreeOpen(false);
                }}
                onRenameFile={handleRenameFile}
                onDeleteFile={(name) => {
                  handleDeleteFile(name);
                }}
                collapsed={false}
                onToggleCollapse={() => setMobileFileTreeOpen(false)}
                isReadOnly={isLockedForUser}
                onReorderFiles={handleReorderFiles}
              />
            </motion.div>
          </>
        )}


        <div className="flex flex-col flex-1 min-w-0">
          {/* Editor Tabs */}
          <EditorTabs
            files={files}
            activeFile={currentFileName}
            onSelectFile={(name) => {
              setCurrentFileName(name);
              // If HTML preview is open and new file isn't HTML, close it
              const ext = name.split('.').pop()?.toLowerCase() || '';
              if (htmlPreviewOpen && !['html', 'htm', 'css'].includes(ext)) {
                setHtmlPreviewOpen(false);
              }
            }}
            onCloseFile={(name) => {
              if (files.length <= 1) {
                toast.error('Cannot close the only file');
                return;
              }
              handleDeleteFile(name);
            }}
          />
          {/* Editor Breadcrumb */}
          <EditorBreadcrumb
            roomName={currentRoom?.name || 'Untitled'}
            fileName={currentFileName}
            language={language}
            onBack={handleBack}
          />
          {/* Editor + Preview horizontal split */}
          <div className="flex flex-1 min-h-0">
            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 min-w-0">
              <Editor
                height="100%"
                language={getMonacoLanguage(language)}
                theme="vs-dark"
                onMount={handleEditorMount}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#161b22]">
                    <div className="flex flex-col items-center gap-3 text-[#8b949e]">
                      <div className="size-6 border-2 border-[#30363d] border-t-[#238636] rounded-full animate-spin" />
                      <span className="text-sm">Loading editor...</span>
                    </div>
                  </div>
                }
                options={{
                  fontSize: 13,
                  fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: minimapEnabled },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'line',
                  padding: { top: 12, bottom: 12 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  bracketPairColorization: { enabled: true },
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: wordWrap,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  overviewRulerBorder: false,
                  readOnly: isLockedForUser,
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                    verticalSliderSize: 8,
                    horizontalSliderSize: 8,
                  },
                  backgroundColor: '#161b22',
                }}
              />
            </div>

            {/* HTML Preview Panel */}
            <AnimatePresence initial={false}>
              {htmlPreviewOpen && isHtmlFile && (
                <motion.div
                  key="html-preview"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '50%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="overflow-hidden shrink-0"
                >
                  <HtmlPreview
                    code={currentCode}
                    visible={htmlPreviewOpen}
                    onClose={() => setHtmlPreviewOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Markdown Preview Panel */}
            <AnimatePresence initial={false}>
              {htmlPreviewOpen && isMarkdownFile && (
                <motion.div
                  key="markdown-preview"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '50%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="overflow-hidden shrink-0"
                >
                  <MarkdownPreview
                    code={currentCode}
                    visible={htmlPreviewOpen}
                    onClose={() => setHtmlPreviewOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Output Panel */}
          <AnimatePresence initial={false}>
            {outputPanelOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 200 }}
                exit={{ height: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="overflow-hidden border-t border-[#30363d] shrink-0"
              >
                <OutputPanel
                  output={output}
                  isRunning={isRunning}
                  onClear={() => { setOutput(''); setRunResultIsHtml(false); setRunResultIsCss(false); }}
                  onClose={() => setOutputPanelOpen(false)}
                  onToggle={() => setOutputPanelOpen(false)}
                  isHtml={runResultIsHtml}
                  isCss={runResultIsCss}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel — Desktop sidebar */}
        {!isMobile && (
          <AnimatePresence initial={false}>
            {rightPanelOpen && (
              <motion.div
                key="right-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="border-l border-[#30363d] overflow-hidden shrink-0"
              >
                <div className="w-80 h-full" style={{ width: '320px' }}>
                  <Tabs
                    value={rightPanelTab}
                    onValueChange={(v) => {
                      setRightPanelTab(v as 'chat' | 'ai');
                      if (v === 'chat') resetUnreadChatCount();
                    }}
                    className="h-full flex flex-col"
                  >
                    <div className="px-2 pt-2 shrink-0">
                      <TabsList className="w-full bg-[#161b22] border border-[#30363d] h-8">
                        <TabsTrigger
                          value="chat"
                          className="text-xs data-[state=active]:bg-[#0d1117] data-[state=active]:text-[#e6edf3] h-6 flex-1 gap-1.5"
                        >
                          <MessageSquare className="size-3" />
                          Chat
                        </TabsTrigger>
                        <TabsTrigger
                          value="ai"
                          className="text-xs data-[state=active]:bg-[#0d1117] data-[state=active]:text-purple-400 h-6 flex-1 gap-1.5"
                        >
                          <Sparkles className="size-3" />
                          AI Assist
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
                      <ChatPanel
                        roomId={currentRoomId}
                        socket={socketRef.current}
                        user={user}
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        onlineUsers={onlineUsers}
                      />
                    </TabsContent>

                    <TabsContent value="ai" className="flex-1 mt-0 min-h-0">
                      <AIPanel
                        currentCode={currentCode}
                        language={language}
                        currentFileName={currentFileName}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Right Panel — Mobile bottom sheet */}
        {isMobile && (
          <AnimatePresence>
            {rightPanelOpen && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setRightPanelOpen(false)}
                />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[#161b22] border-t border-[#30363d] shadow-2xl"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  style={{ height: '70vh', maxHeight: '70vh' }}
                >
                  {/* Drag handle bar */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-[#30363d]" />
                  </div>
                  {/* Panel content */}
                  <div className="flex-1 overflow-hidden h-[calc(70vh-20px)]">
                    <Tabs
                      value={rightPanelTab}
                      onValueChange={(v) => {
                        setRightPanelTab(v as 'chat' | 'ai');
                        if (v === 'chat') resetUnreadChatCount();
                      }}
                      className="h-full flex flex-col"
                    >
                      <div className="px-2 pt-1 shrink-0">
                        <TabsList className="w-full bg-[#0d1117] border border-[#30363d] h-8">
                          <TabsTrigger
                            value="chat"
                            className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-[#e6edf3] h-6 flex-1 gap-1.5"
                          >
                            <MessageSquare className="size-3" />
                            Chat
                          </TabsTrigger>
                          <TabsTrigger
                            value="ai"
                            className="text-xs data-[state=active]:bg-[#161b22] data-[state=active]:text-purple-400 h-6 flex-1 gap-1.5"
                          >
                            <Sparkles className="size-3" />
                            AI Assist
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
                        <ChatPanel
                          roomId={currentRoomId}
                          socket={socketRef.current}
                          user={user}
                          messages={chatMessages}
                          onSendMessage={handleSendMessage}
                          onlineUsers={onlineUsers}
                        />
                      </TabsContent>

                      <TabsContent value="ai" className="flex-1 mt-0 min-h-0">
                        <AIPanel
                          currentCode={currentCode}
                          language={language}
                          currentFileName={currentFileName}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}

        {/* Version History Panel */}
        <VersionHistoryPanel
          isOpen={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
          snapshots={versionSnapshots}
          onRestore={handleVersionRestore}
          currentFileName={currentFileName}
        />
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        fileName={currentFileName}
        language={language}
        cursorPosition={cursorPosition}
        connected={connected}
        tabSize={2}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
      />

      {/* Room Settings Modal */}
      <RoomSettingsModal
        room={currentRoom}
        user={user}
        onlineUsers={onlineUsers}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdate={handleSettingsUpdate}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => {
          setCommandPaletteOpen(false);
          setCommandFilter(null);
          setFileSearchFiles(undefined);
        }}
        commands={commandItems}
        commandFilter={commandFilter}
        files={fileSearchFiles}
      />

      {/* Activity Log Panel */}
      <ActivityLogPanel
        isOpen={activityLogOpen}
        onClose={() => setActivityLogOpen(false)}
        activities={activities}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={notifications.filter((n) => !n.read).length}
        onMarkRead={markNotificationRead}
        onMarkAllRead={() => notifications.forEach((n) => { if (!n.read) markNotificationRead(n.id); })}
        onClearAll={clearNotifications}
      />
    </div>
  );
}