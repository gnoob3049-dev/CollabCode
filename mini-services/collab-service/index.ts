import http from 'http';
import { WebSocketServer as WSServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { Server as SocketIOServer } from 'socket.io';

// --- Y.js message types (must match y-websocket client) ---
const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;

// --- Y.js document rooms ---
interface YjsRoom {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<WebSocket>;
}

const yjsRooms = new Map<string, YjsRoom>();

function getYjsRoom(roomname: string): YjsRoom {
  if (!yjsRooms.has(roomname)) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    const room: YjsRoom = { doc, awareness, conns: new Set() };

    awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = added.concat(updated).concat(removed);
      for (const conn of room.conns) {
        if (conn.readyState !== WebSocket.OPEN) continue;
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
        );
        conn.send(encoding.toUint8Array(encoder));
      }
    });

    yjsRooms.set(roomname, room);
  }
  return yjsRooms.get(roomname)!;
}

function handleYjsConnection(ws: WebSocket, request: http.IncomingMessage) {
  // Extract room name from URL: /yjs/{roomname}
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  // parts[0] = "yjs", parts[1] = roomname
  const roomname = parts[1] || 'default';
  const room = getYjsRoom(roomname);
  room.conns.add(ws);

  // Listen for document updates and broadcast to other connections
  const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
    if (origin === ws) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const data = encoding.toUint8Array(encoder);
    for (const conn of room.conns) {
      if (conn !== ws && conn.readyState === WebSocket.OPEN) {
        conn.send(data);
      }
    }
  };
  room.doc.on('update', docUpdateHandler);

  ws.on('message', (data: Buffer | ArrayBuffer) => {
    try {
      const encoder = encoding.createEncoder();
      const decoder = decoding.createDecoder(new Uint8Array(data instanceof Buffer ? data : new Uint8Array(data)));
      const messageType = decoding.readVarUint(decoder) as number;

      switch (messageType) {
        case messageSync: {
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
          // Send reply back to the requesting client
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          // If the sync step 2 was generated, broadcast the doc state to all other clients
          const reply = encoding.toUint8Array(encoder);
          if (reply.length > 1) {
            for (const conn of room.conns) {
              if (conn !== ws && conn.readyState === WebSocket.OPEN) {
                conn.send(reply);
              }
            }
          }
          break;
        }
        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            ws,
          );
          break;
        }
        case messageAuth: {
          // Auth not implemented - just acknowledge
          break;
        }
      }
    } catch (err) {
      console.error('Error processing Y.js message:', err);
    }
  });

  ws.on('close', () => {
    room.conns.delete(ws);
    room.doc.off('update', docUpdateHandler);
    awarenessProtocol.removeAwarenessStates(room.awareness, [room.doc.clientID], 'disconnect');
  });

  ws.on('error', (err) => {
    console.error(`Y.js WebSocket error in room ${roomname}:`, err.message);
  });
}

// --- HTTP Server ---
const server = http.createServer();

// --- Socket.io for chat & presence ---
interface RoomUser {
  id: string;
  name: string;
  color: string;
}

const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  addTrailingSlash: false,
});

const chatRooms = new Map<string, Set<RoomUser>>();

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, user }: { roomId: string; user: RoomUser }) => {
    socket.join(roomId);
    if (!chatRooms.has(roomId)) chatRooms.set(roomId, new Set());
    chatRooms.get(roomId)!.add(user);

    io.to(roomId).emit('users_update', {
      users: Array.from(chatRooms.get(roomId)!),
    });

    io.to(roomId).emit('user_joined', {
      user,
      text: `${user.name} joined the room`,
    });
  });

  socket.on('leave_room', ({ roomId, user }: { roomId: string; user: RoomUser }) => {
    socket.leave(roomId);
    if (chatRooms.has(roomId)) {
      chatRooms.get(roomId)!.delete(user);
      io.to(roomId).emit('users_update', {
        users: Array.from(chatRooms.get(roomId)!),
      });
      io.to(roomId).emit('user_left', {
        user,
        text: `${user.name} left the room`,
      });
    }
  });

  socket.on('chat_message', ({ roomId, message }: { roomId: string; message: unknown }) => {
    io.to(roomId).emit('chat_message', message);
  });

  socket.on('disconnect', () => {
    for (const [roomId, users] of chatRooms) {
      for (const user of users) {
        if (user.id === socket.id) {
          users.delete(user);
          io.to(roomId).emit('users_update', {
            users: Array.from(users),
          });
          io.to(roomId).emit('user_left', {
            user,
            text: `${user.name} left the room`,
          });
          break;
        }
      }
    }
  });
});

// --- WebSocket upgrade for Y.js (path: /yjs/{roomname}) ---
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);

  if (url.pathname.startsWith('/yjs')) {
    // Let the ws Server handle the upgrade
    yjsWss.handleUpgrade(request, socket, head, (ws) => {
      yjsWss.emit('connection', ws, request);
    });
  } else {
    // Destroy connections to unhandled paths
    socket.destroy();
  }
});

// Create the ws server for Y.js (noServer: true since we handle upgrades manually)
const yjsWss = new WSServer({ noServer: true });

yjsWss.on('connection', (ws, request) => {
  handleYjsConnection(ws, request);
});

// --- Start ---
server.listen(3003, () => {
  console.log('CollabCode WebSocket service running on port 3003');
  console.log('  Y.js CRDT sync:   ws://localhost:3003/yjs/{roomname}');
  console.log('  Socket.io (chat):  ws://localhost:3003/socket.io/?EIO=4&transport=websocket');
});