'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TUI_COLORS_G1 = '#0F1014';
import InjectStyles from './components/shared/InjectStyles';
import RoomListView from './components/RoomListView';
import RoomInteriorView from './components/RoomInteriorView';
import PasswordDialog from './components/dialogs/PasswordDialog';
import CreateRoomDialog from './components/dialogs/CreateRoomDialog';
import type { VoiceRoom, AuthUser, RoomMode } from './types';

/* ═══════════════════════════════════════════════════════════════════════
   VoiceRoomsPage — Entry point

   Handles auth state, room restore, join, create, exit flows.
   InjectStyles is rendered globally for Cairo font + animations.
   PasswordDialog is always mounted for key-mode rooms.
   CreateRoomDialog is managed here and triggered from RoomListView.
   ═══════════════════════════════════════════════════════════════════════ */

export default function VoiceRoomsPage() {
  const { toast } = useToast();
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [pendingPasswordRoom, setPendingPasswordRoom] = useState<VoiceRoom | null>(null);

  // Lobby state
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [myRoom, setMyRoom] = useState<VoiceRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  /* ── Fetch auth user ── */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setAuthUser({
            id: d.user.id,
            username: d.user.username,
            displayName: d.user.displayName || d.user.username,
            avatar: d.user.avatar || '',
            vipLevel: d.user.vipLevel || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Restore active room from localStorage on mount ── */
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const savedRoomId = localStorage.getItem('vr_active_room');
        if (savedRoomId) {
          const [roomData, partData] = await Promise.all([
            fetch(`/api/voice-rooms/${savedRoomId}?action=room-details`).then((r) => r.json()),
            fetch(`/api/voice-rooms/${savedRoomId}?action=my-participant`).then((r) => r.json()),
          ]);
          if (!cancelled) {
            if (roomData.success && roomData.room && partData.success && partData.participant) {
              const room = { ...roomData.room, lockedSeats: roomData.room.lockedSeats || [] };
              setActiveRoom(room);
            } else {
              localStorage.removeItem('vr_active_room');
            }
            setRestoring(false);
          }
        } else {
          if (!cancelled) setRestoring(false);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('vr_active_room');
          setRestoring(false);
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch rooms for lobby (when no active room) ── */
  const fetchLobbyRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch('/api/voice-rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setMyRoom(data.myRoom || null);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!restoring && !activeRoom) {
      fetchLobbyRooms();
    }
  }, [restoring, activeRoom, fetchLobbyRooms]);

  const handleRoomUpdate = useCallback((updatedRoom: VoiceRoom) => {
    setActiveRoom(updatedRoom);
    try {
      localStorage.setItem('vr_active_room', updatedRoom.id);
    } catch {}
  }, []);

  const handleJoinRoom = useCallback(
    async (room: VoiceRoom, password?: string) => {
      const isGuest = !authUser;
      const userId = authUser?.id || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const username = authUser?.username || `guest_${Math.random().toString(36).substr(2, 6)}`;
      const displayName = authUser?.displayName || 'مستمع';
      const avatar = authUser?.avatar || '';

      try {
        const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            displayName,
            avatar,
            ...(password ? { password } : {}),
            ...(isGuest ? { guestId: userId } : {}),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActiveRoom(room);
          try {
            localStorage.setItem('vr_active_room', room.id);
          } catch {}
        } else {
          toast({
            title: 'لا يمكن الانضمام',
            description: data.error || 'حاول مرة أخرى',
          });
        }
      } catch {
        toast({ title: 'خطأ في الاتصال' });
      }
    },
    [authUser, toast],
  );

  /* ── Public entry: when clicking a room card ── */
  const handleRoomClick = useCallback(
    (room: VoiceRoom) => {
      // Owner always bypasses password — server-side will handle it
      if (room.hostId === authUser?.id) {
        handleJoinRoom(room);
        return;
      }
      // Non-owner: show password dialog for key-mode rooms
      if (room.roomMode === 'key') {
        setPendingPasswordRoom(room);
      } else {
        handleJoinRoom(room);
      }
    },
    [handleJoinRoom, authUser?.id],
  );

  /* ── Password dialog callback ── */
  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (pendingPasswordRoom) {
        handleJoinRoom(pendingPasswordRoom, password);
        setPendingPasswordRoom(null);
      }
    },
    [pendingPasswordRoom, handleJoinRoom],
  );

  /* ── Create room ── */
  const handleCreateRoom = useCallback(
    async (data: {
      name: string;
      description: string;
      micSeatCount: number;
      roomMode: RoomMode;
      roomPassword: string;
      maxParticipants: number;
      isAutoMode: boolean;
      micTheme: string;
      roomImage?: string;
    }) => {
      try {
        const res = await fetch('/api/voice-rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            hostName: authUser?.displayName || '',
          }),
        });
        const result = await res.json();
        if (result.success && result.room) {
          try {
            await fetch(`/api/voice-rooms/${result.room.id}?action=save-template`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: data.name,
                description: data.description,
                micSeatCount: data.micSeatCount,
                roomMode: data.roomMode,
                roomPassword: data.roomPassword,
                maxParticipants: data.maxParticipants,
                isAutoMode: data.isAutoMode,
                micTheme: data.micTheme,
                allowedRoles: [],
              }),
            });
          } catch { /* ignore */ }

          // Update lobby data after creating
          fetchLobbyRooms();
          setCreateDialogOpen(false);
          handleJoinRoom(result.room);
        }
      } catch { /* ignore */ }
    },
    [authUser, handleJoinRoom, fetchLobbyRooms],
  );

  /* ── Exit room ── */
  const handleExitRoom = useCallback(async (alreadyCalledLeave?: boolean) => {
    try {
      if (!alreadyCalledLeave) {
        const savedRoomId = localStorage.getItem('vr_active_room');
        if (savedRoomId) {
          await fetch(`/api/voice-rooms/${savedRoomId}?action=leave`, {
            method: 'POST',
          });
        }
      }
    } catch { /* ignore */ }
    setActiveRoom(null);
    try {
      localStorage.removeItem('vr_active_room');
    } catch {}
    // Refresh lobby rooms when returning
    fetchLobbyRooms();
  }, [fetchLobbyRooms]);

  /* ── Loading while restoring room ── */
  if (restoring) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: TUI_COLORS_G1 }}
        dir="rtl"
      >
        <Loader2 className="w-10 h-10 text-[#6c63ff] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Global styles injection (Cairo font + animations) */}
      <InjectStyles />

      {activeRoom ? (
        <RoomInteriorView
          room={activeRoom}
          onExit={handleExitRoom}
          authUser={authUser}
          onRoomUpdate={handleRoomUpdate}
        />
      ) : (
        <RoomListView
          rooms={rooms}
          myRoom={myRoom}
          onRoomClick={handleRoomClick}
          onCreateRoom={() => setCreateDialogOpen(true)}
          authUser={authUser}
          loading={loadingRooms}
        />
      )}

      {/* Password dialog for key-mode rooms */}
      <PasswordDialog
        isOpen={!!pendingPasswordRoom}
        onClose={() => setPendingPasswordRoom(null)}
        onSubmit={handlePasswordSubmit}
      />

      {/* Create Room dialog */}
      <CreateRoomDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateRoom}
        authUser={authUser}
      />
    </>
  );
}
