'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { type OnMount, type editor } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { io, type Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EditorTopBar from './EditorTopBar';
import FileTree from './FileTree';
import ChatPanel from './ChatPanel';
import AIPanel from './AIPanel';
import OutputPanel from './OutputPanel';
import RoomSettingsModal from './RoomSettingsModal';
import EditorStatusBar from './EditorStatusBar';
import type { ChatMessage, Room } from '@/store/useStore';

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
  const [isSaving, setIsSaving] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

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
      };
      return map[ext] || language;
    },
    [language]
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
      }
    });

    socket.on('user_joined', ({ text }: { text: string }) => {
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

      // Track current code
      editorInstance.onDidChangeModelContent(() => {
        setCurrentCode(editorInstance.getValue());
      });

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
      }
    },
    []
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

  const handleDeleteFile = useCallback(
    (name: string) => {
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
    },
    [currentFileName, setCurrentFileName, handleCreateFile]
  );

  // Run code
  const handleRun = useCallback(async () => {
    if (!ydocRef.current) return;
    setIsRunning(true);
    setOutput('');
    setOutputPanelOpen(true);
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
      setOutput(data.output || data.error || 'No output');
    } catch {
      setOutput('Error: Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  }, [currentFileName, getLanguageFromFilename, setIsRunning, setOutput, setOutputPanelOpen]);

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
      toast.success('Room saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [currentRoomId, files]);

  // Share
  const handleShare = useCallback(() => {
    if (!currentRoom) return;
    const inviteLink = `${window.location.origin}?join=${currentRoom.inviteCode}`;
    navigator.clipboard.writeText(inviteLink).then(
      () => toast.success('Invite link copied!'),
      () => toast.error('Failed to copy link')
    );
  }, [currentRoom]);

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

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
    },
    [setLanguage]
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isMod && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (isMod && e.key === 'b') {
        e.preventDefault();
        setRightPanelOpen(!rightPanelOpen);
      } else if (e.key === 'Escape') {
        setRightPanelOpen(false);
        setOutputPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleRun, rightPanelOpen]);

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
        onShare={handleShare}
        onToggleChat={handleToggleChat}
        onToggleAI={handleToggleAI}
        onToggleOutput={() => setOutputPanelOpen(!outputPanelOpen)}
        onBack={handleBack}
        onOpenSettings={() => setSettingsOpen(true)}
        rightPanelOpen={rightPanelOpen}
        outputPanelOpen={outputPanelOpen}
        unreadChatCount={unreadChatCount}
        isRunning={isRunning}
        isSaving={isSaving}
        onRenameRoom={handleRenameRoom}
        isConnected={connected}
      />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* File Tree */}
        <FileTree
          files={files}
          currentFile={currentFileName}
          onSelectFile={setCurrentFileName}
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          collapsed={fileTreeCollapsed}
          onToggleCollapse={() => setFileTreeCollapsed(!fileTreeCollapsed)}
        />

        {/* Editor + Output */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
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
                minimap: { enabled: false },
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
                wordWrap: 'on',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                overviewRulerBorder: false,
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
                  onClear={() => setOutput('')}
                  onClose={() => setOutputPanelOpen(false)}
                  onToggle={() => setOutputPanelOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel (Chat / AI) */}
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
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        fileName={currentFileName}
        language={language}
        cursorPosition={cursorPosition}
        connected={connected}
        tabSize={2}
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
    </div>
  );
}