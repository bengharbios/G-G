/* ═══════════════════════════════════════════════════════════════════════
   Voice Signaling Service — WebSocket signaling for WebRTC P2P voice

   Architecture:
   - Socket.io server on port 3010
   - Rooms mapped by room_id
   - Events: join-room, leave-room, offer, answer, ice-candidate,
             mic-toggle, speaker-toggle, request-offer, peer-leave
   - STUN + TURN servers configured client-side
   - Auto-cleanup of disconnected clients
   - In-app notification support for room events
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
type RoomMember = {
  userId: string;
  displayName: string;
  onMic: boolean;
  micMuted: boolean;
  joinedAt: number;
};

const rooms = new Map<string, Map<string, RoomMember>>();

// ── User-to-socket mapping (for cross-room notifications) ──
const userSockets = new Map<string, string>(); // userId → socketId

// ── Socket-to-user mapping ──
const socketUsers = new Map<string, { userId: string; displayName: string; roomId: string }>();

function getRoom(roomId: string): Map<string, RoomMember> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId)!;
}

// ── Clean stale clients ──
function cleanupStaleClients() {
  const now = Date.now();
  for (const [roomId, members] of rooms.entries()) {
    for (const [socketId, member] of members.entries()) {
      if (now - member.joinedAt > 5 * 60 * 1000) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          members.delete(socketId);
        }
      }
    }
    if (members.size === 0) {
      rooms.delete(roomId);
    }
  }
}

setInterval(cleanupStaleClients, 60_000);

const heartbeats = new Map<string, number>();

io.on('connection', (socket) => {
  console.log(`[VoiceSignal] Client connected: ${socket.id}`);

  // ── Heartbeat ──
  socket.on('heartbeat', () => {
    heartbeats.set(socket.id, Date.now());
    for (const [, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        members.get(socket.id)!.joinedAt = Date.now();
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

    socket.join(roomId);
    room.set(socket.id, { userId, displayName, onMic, micMuted, joinedAt: Date.now() });

    // Update mappings
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, { userId, displayName, roomId });

    // Send current room members to the new joiner
    const members: Array<{ socketId: string; userId: string; displayName: string; onMic: boolean; micMuted: boolean }> = [];
    for (const [sid, m] of room.entries()) {
      if (sid !== socket.id) {
        members.push({ socketId: sid, userId: m.userId, displayName: m.displayName, onMic: m.onMic, micMuted: m.micMuted });
      }
    }

    socket.emit('room-members', { roomId, members });

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
    socketUsers.delete(socket.id);
  });

  // ── WebRTC Signaling: Offer ──
  socket.on('offer', (data: { targetSocketId: string; roomId: string; offer: RTCSessionDescriptionInit }) => {
    io.to(data.targetSocketId).emit('offer', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      offer: data.offer,
    });
  });

  // ── WebRTC Signaling: Answer ──
  socket.on('answer', (data: { targetSocketId: string; roomId: string; answer: RTCSessionDescriptionInit }) => {
    io.to(data.targetSocketId).emit('answer', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      answer: data.answer,
    });
  });

  // ── WebRTC Signaling: ICE Candidate ──
  socket.on('ice-candidate', (data: { targetSocketId: string; roomId: string; candidate: RTCIceCandidateInit }) => {
    io.to(data.targetSocketId).emit('ice-candidate', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      candidate: data.candidate,
    });
  });

  // ── Mic state change ──
  socket.on('mic-toggle', (data: { roomId: string; micMuted: boolean }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.micMuted = data.micMuted;
        io.to(data.roomId).emit('peer-mic-toggle', {
          socketId: socket.id,
          userId: member.userId,
          roomId: data.roomId,
          micMuted: data.micMuted,
        });
      }
    }
  });

  // ── Seat change ──
  socket.on('seat-change', (data: { roomId: string; onMic: boolean; micMuted: boolean }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.onMic = data.onMic;
        member.micMuted = data.micMuted;
        io.to(data.roomId).emit('peer-seat-change', {
          socketId: socket.id,
          userId: member.userId,
          roomId: data.roomId,
          onMic: data.onMic,
          micMuted: data.micMuted,
        });
      }
    }
  });

  // ── Request offers ──
  socket.on('request-offers', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      for (const [sid, member] of room.entries()) {
        if (sid !== socket.id && member.onMic && !member.micMuted) {
          io.to(sid).emit('request-offer', {
            targetSocketId: socket.id,
            roomId: data.roomId,
          });
        }
      }
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Push Notification Support
  // ═══════════════════════════════════════════════════════════

  // ── Send notification to a specific user (cross-room) ──
  socket.on('send-notification', (data: {
    targetUserId: string;
    type: 'invite' | 'mention' | 'kick' | 'seat_request' | 'seat_granted' | 'room_event';
    title: string;
    body: string;
    roomId: string;
  }) => {
    const { targetUserId, type, title, body, roomId } = data;
    const sender = socketUsers.get(socket.id);

    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        title,
        body,
        roomId,
        fromUserId: sender?.userId,
        fromDisplayName: sender?.displayName,
        timestamp: Date.now(),
      });
    }

    console.log(`[VoiceSignal] Notification sent to ${targetUserId}: ${type} — ${title}`);
  });

  // ── Send notification to all users in a room ──
  socket.on('broadcast-notification', (data: {
    type: 'room_event';
    title: string;
    body: string;
    roomId: string;
  }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: data.type,
        title: data.title,
        body: data.body,
        roomId: data.roomId,
        timestamp: Date.now(),
      };
      io.to(data.roomId).emit('notification', notification);
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[VoiceSignal] Client disconnected: ${socket.id}`);
    heartbeats.delete(socket.id);

    const userInfo = socketUsers.get(socket.id);
    if (userInfo) {
      userSockets.delete(userInfo.userId);
    }
    socketUsers.delete(socket.id);

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
