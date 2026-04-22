/* ═══════════════════════════════════════════════════════════════════════
   Voice Signaling Service — WebSocket signaling for WebRTC P2P voice

   Architecture:
   - Socket.io server on port 3010
   - Rooms mapped by room_id
   - Events: join-room, leave-room, offer, answer, ice-candidate,
             mic-toggle, speaker-toggle, request-offer, peer-leave
   - STUN only (no TURN dependency)
   - Auto-cleanup of disconnected clients
   ═══════════════════════════════════════════════════════════════════════ */

import { Server } from 'socket.io';

const PORT = 3010;

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ── Room state ──
// Map: room_id → Map(socket_id → { userId, displayName, onMic, micMuted })
const rooms = new Map<string, Map<string, {
  userId: string;
  displayName: string;
  onMic: boolean;
  micMuted: boolean;
  joinedAt: number;
}>>();

// ── Get or create room ──
function getRoom(roomId: string): Map<string, typeof rooms extends Map<string, infer V> ? V : never> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId)!;
}

// ── Clean stale clients (older than 5 minutes no heartbeat) ──
function cleanupStaleClients() {
  const now = Date.now();
  for (const [roomId, members] of rooms.entries()) {
    for (const [socketId, member] of members.entries()) {
      if (now - member.joinedAt > 5 * 60 * 1000) {
        // Check if socket is still connected
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          members.delete(socketId);
        }
      }
    }
    // Delete empty rooms
    if (members.size === 0) {
      rooms.delete(roomId);
    }
  }
}

// Run cleanup every 60 seconds
setInterval(cleanupStaleClients, 60_000);

// ── Track heartbeat ──
const heartbeats = new Map<string, number>();

io.on('connection', (socket) => {
  console.log(`[VoiceSignal] Client connected: ${socket.id}`);

  // ── Heartbeat ──
  socket.on('heartbeat', () => {
    heartbeats.set(socket.id, Date.now());
    const roomIds = [...rooms.keys()];
    for (const roomId of roomIds) {
      const members = rooms.get(roomId);
      if (members?.has(socket.id)) {
        members.get(socket.id)!.joinedAt = Date.now(); // refresh as heartbeat
        break;
      }
    }
  });

  // ── Join a voice room ──
  socket.on('join-room', (data: { roomId: string; userId: string; displayName: string; onMic: boolean; micMuted: boolean }) => {
    const { roomId, userId, displayName, onMic, micMuted } = data;
    const room = getRoom(roomId);

    // Remove from any previous room
    for (const [rId, members] of rooms.entries()) {
      if (rId !== roomId && members.has(socket.id)) {
        // Notify previous room
        const prev = members.get(socket.id)!;
        members.delete(socket.id);
        socket.leave(rId);
        io.to(rId).emit('peer-leave', {
          socketId: socket.id,
          userId: prev.userId,
          roomId: rId,
        });
      }
    }

    // Join the room
    socket.join(roomId);
    room.set(socket.id, {
      userId,
      displayName,
      onMic,
      micMuted,
      joinedAt: Date.now(),
    });

    // Send current room members to the new joiner
    const members: Array<{ socketId: string; userId: string; displayName: string; onMic: boolean; micMuted: boolean }> = [];
    for (const [sid, m] of room.entries()) {
      if (sid !== socket.id) {
        members.push({ socketId: sid, userId: m.userId, displayName: m.displayName, onMic: m.onMic, micMuted: m.micMuted });
      }
    }

    socket.emit('room-members', { roomId, members });

    // Notify room about new member
    socket.to(roomId).emit('peer-joined', {
      socketId: socket.id,
      userId,
      displayName,
      onMic,
      micMuted,
      roomId,
    });

    console.log(`[VoiceSignal] ${displayName}(${userId}) joined room ${roomId} (onMic=${onMic}, total=${room.size})`);
  });

  // ── Leave a voice room ──
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        room.delete(socket.id);
        socket.leave(roomId);
        io.to(roomId).emit('peer-leave', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
        });
        if (room.size === 0) {
          rooms.delete(roomId);
        }
        console.log(`[VoiceSignal] ${member.displayName} left room ${roomId}`);
      }
    }
  });

  // ── WebRTC Signaling: Offer ──
  socket.on('offer', (data: { targetSocketId: string; roomId: string; offer: RTCSessionDescriptionInit }) => {
    const { targetSocketId, roomId, offer } = data;
    io.to(targetSocketId).emit('offer', {
      fromSocketId: socket.id,
      roomId,
      offer,
    });
  });

  // ── WebRTC Signaling: Answer ──
  socket.on('answer', (data: { targetSocketId: string; roomId: string; answer: RTCSessionDescriptionInit }) => {
    const { targetSocketId, roomId, answer } = data;
    io.to(targetSocketId).emit('answer', {
      fromSocketId: socket.id,
      roomId,
      answer,
    });
  });

  // ── WebRTC Signaling: ICE Candidate ──
  socket.on('ice-candidate', (data: { targetSocketId: string; roomId: string; candidate: RTCIceCandidateInit }) => {
    const { targetSocketId, roomId, candidate } = data;
    io.to(targetSocketId).emit('ice-candidate', {
      fromSocketId: socket.id,
      roomId,
      candidate,
    });
  });

  // ── Mic state change ──
  socket.on('mic-toggle', (data: { roomId: string; micMuted: boolean }) => {
    const { roomId, micMuted } = data;
    const room = rooms.get(roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.micMuted = micMuted;
        io.to(roomId).emit('peer-mic-toggle', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
          micMuted,
        });
      }
    }
  });

  // ── Seat change (on mic / off mic) ──
  socket.on('seat-change', (data: { roomId: string; onMic: boolean; micMuted: boolean }) => {
    const { roomId, onMic, micMuted } = data;
    const room = rooms.get(roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.onMic = onMic;
        member.micMuted = micMuted;
        io.to(roomId).emit('peer-seat-change', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
          onMic,
          micMuted,
        });
      }
    }
  });

  // ── Request offer from all on-mic peers (when joining mic) ──
  socket.on('request-offers', (data: { roomId: string }) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room) {
      for (const [sid, member] of room.entries()) {
        if (sid !== socket.id && member.onMic && !member.micMuted) {
          io.to(sid).emit('request-offer', {
            targetSocketId: socket.id,
            roomId,
          });
        }
      }
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[VoiceSignal] Client disconnected: ${socket.id}`);
    heartbeats.delete(socket.id);

    // Remove from all rooms and notify
    for (const [roomId, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        const member = members.get(socket.id)!;
        members.delete(socket.id);
        io.to(roomId).emit('peer-leave', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
        });
        if (members.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

console.log(`[VoiceSignal] 🎙️ Voice signaling service running on port ${PORT}`);
