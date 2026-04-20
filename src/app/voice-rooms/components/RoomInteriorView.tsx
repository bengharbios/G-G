'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { TUI, DEFAULT_BG_URLS, ROLE_LABELS, canDo, type RoomRole } from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

import InjectStyles from './shared/InjectStyles';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import MicSeatGrid from './MicSeatGrid';
import ChatPanel from './ChatPanel';
import LikeAnimation from './LikeAnimation';
import GiftAnimations from './GiftAnimations';

// ─── Sheets ──────────────────────────────────────────────────────────────────

import GiftSheet from './sheets/GiftSheet';
import SettingsSheet from './sheets/SettingsSheet';
import ProfileSheet from './sheets/ProfileSheet';
import MicMenuSheet from './sheets/MicMenuSheet';
import SeatManagementSheet from './sheets/SeatManagementSheet';
import RoomInfoSheet from './sheets/RoomInfoSheet';

// ─── Dialogs ─────────────────────────────────────────────────────────────────

import KickDurationDialog from './dialogs/KickDurationDialog';
import MembershipDialog from './dialogs/MembershipDialog';
import MicInviteDialog from './dialogs/MicInviteDialog';

// ─── Types ───────────────────────────────────────────────────────────────────

import type { VoiceRoom, AuthUser } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   RoomInteriorView — TUILiveKit VoiceRoomRootWidget exact port

   Layer stack (z-order, bottom → top):
     1. Background image + gradient overlay
     2. MicSeatGrid (z-10, top:122)
     3. ChatPanel (z-20, left:16, bottom:84)
     4. TopBar (z-20, top:54)
     5. BottomBar (z-20, bottom:36)
     6. LikeAnimation (z-30, bottom-left)
     7. GiftAnimations (z-40, full screen)
     8. All sheets/dialogs (z-50)
   ═══════════════════════════════════════════════════════════════════════ */

interface RoomInteriorViewProps {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (room: VoiceRoom) => void;
}

// ─── Speaking Simulation ────────────────────────────────────────────────────
// Randomly toggles 1-3 seated users as "speaking" every 3 seconds.
// Uses a tick counter to drive re-renders; speaking set computed inline.

function useSpeakingSimulation(seats: { participant: { userId: string } | null }[]) {
  const seatedIds = seats
    .filter(s => s.participant !== null)
    .map(s => s.participant!.userId);

  // Stable key for effect dependency
  const seatedIdsKey = seatedIds.join(',');

  // Tick counter forces periodic re-computation of speaking set
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (seatedIds.length === 0) return;
    timerRef.current = setInterval(() => setTick(t => t + 1), 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [seatedIdsKey]);

  // Compute speaking set deterministically but differently each tick
  if (seatedIds.length === 0) return new Set<string>();
  const count = 1 + ((tick * 7 + seatedIds.length) % Math.min(3, seatedIds.length));
  const shuffled = [...seatedIds].sort((a, b) => {
    const ha = ((tick + 1) * 31 + a.charCodeAt(0)) % 100;
    const hb = ((tick + 1) * 31 + b.charCodeAt(0)) % 100;
    return ha - hb;
  });
  return new Set(shuffled.slice(0, count));
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RoomInteriorView({
  room: initialRoom,
  onExit,
  authUser,
  onRoomUpdate,
}: RoomInteriorViewProps) {
  /* ── Voice room hook — all state and actions ── */
  const vr = useVoiceRoom(initialRoom, authUser, onRoomUpdate);

  /* ── Derived state ── */
  const isOwner = vr.myRole === 'owner';
  const isAdmin = canDo(vr.myRole, 'admin');
  const pendingSeatRequests = vr.participants.filter(p => p.seatStatus === 'request').length;

  /* ── Speaking simulation ── */
  const speakingUserIds = useSpeakingSimulation(vr.seats);

  /* ── Like hold state ── */
  const [likeActive, setLikeActive] = useState(false);

  /* ── End Live confirmation dialog (owner only) ── */
  const [showEndLiveDialog, setShowEndLiveDialog] = useState(false);

  /* ── Seat management sheet state ── */
  const [seatMgmtOpen, setSeatMgmtOpen] = useState(false);

  /* ── Room info sheet state ── */
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  /* ── Accept/Reject seat handlers (not in hook — direct API calls) ── */
  async function handleAcceptSeat(userId: string) {
    try {
      await fetch(`/api/voice-rooms/${vr.room.id}?action=accept-seat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      await vr.fetchParticipants();
    } catch { /* ignore */ }
  }

  async function handleRejectSeat(userId: string) {
    try {
      await fetch(`/api/voice-rooms/${vr.room.id}?action=reject-seat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      await vr.fetchParticipants();
    } catch { /* ignore */ }
  }

  /* ── Toggle auto mode (for SeatManagementSheet) ── */
  async function handleToggleAutoMode() {
    await vr.handleUpdateSettings({ isAutoMode: !vr.room.isAutoMode });
  }

  /* ── GiftSheet onSendGift adapter (GiftSheet sends giftId+quantity, hook expects giftId+target+quantity) ── */
  function handleGiftSend(giftId: string, quantity: number) {
    vr.handleSendGift(giftId, 'everyone', quantity);
  }

  /* ── Close handler (owner → confirm, audience → exit) ── */
  function handleClose() {
    if (isOwner) {
      setShowEndLiveDialog(true);
    } else {
      vr.handleLeaveRoom().then(() => {
        onExit(true);
      });
    }
  }

  /* ── End Live confirmed ── */
  async function handleEndLive() {
    setShowEndLiveDialog(false);
    await vr.handleLeaveRoom();
    onExit(true);
  }

  /* ── Kick duration confirmed (from KickDurationDialog) ── */
  function handleKickDurationConfirm(minutes: number) {
    const targetUserId = vr.micMenuSheet.participant?.userId;
    if (targetUserId) {
      vr.handleKickTemp(minutes, targetUserId);
    }
    vr.setKickDialogOpen(false);
  }

  /* ── Leave seat (from BottomBar) ── */
  async function handleLeaveSeat() {
    try {
      await fetch(`/api/voice-rooms/${vr.room.id}?action=leave-seat`, { method: 'POST' });
      await vr.fetchParticipants();
      await vr.fetchMyParticipant();
    } catch { /* ignore */ }
  }

  /* ── Background image ── */
  const bgImage = vr.room.roomImage || DEFAULT_BG_URLS[0];

  /* ── Loading state ── */
  if (vr.loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ backgroundColor: TUI.colors.G1 }}
      >
        <Loader2
          size={40}
          className="animate-spin mb-4"
          style={{ color: TUI.colors.G5 }}
        />
        <span
          style={{
            fontSize: TUI.font.body14.size,
            color: TUI.colors.G5,
          }}
        >
          جاري تحميل الغرفة...
        </span>
      </div>
    );
  }

  return (
    <>
      <InjectStyles />

      {/* ═══════════════════════════════════════════════════════════════════════
          ROOT CONTAINER — full screen, overflow hidden
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 overflow-hidden"
        style={{ backgroundColor: TUI.colors.G1 }}
        dir="rtl"
      >
        {/* ════════════════════════════════════════════════════════════════════
            LAYER 0 — Background Image + Gradient Overlay
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(15,16,20,0.3) 0%, rgba(15,16,20,0.7) 50%, rgba(15,16,20,0.95) 100%)',
          }}
        />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 1 — MicSeatGrid (z-10, top:122, full width)
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="absolute left-0 right-0 z-10"
          style={{ top: 'clamp(90px, 14vh, 122px)' }}
        >
          <MicSeatGrid
            seats={vr.seats}
            currentUserId={vr.currentUserId}
            speakingUserIds={speakingUserIds}
            isOwner={isOwner}
            onSeatClick={vr.handleSeatClick}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 2 — ChatPanel (z-20, left:16, bottom:84)
            ════════════════════════════════════════════════════════════════════ */}
        <ChatPanel
          messages={vr.chatMessages}
          isMuted={vr.isRoomMuted}
          onSendChat={vr.handleSendChat}
          authUser={authUser}
        />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 3 — TopBar (z-20, top:54)
            ════════════════════════════════════════════════════════════════════ */}
        <TopBar
          roomName={vr.room.name}
          participantCount={vr.participants.length}
          isOwner={isOwner}
          onClose={handleClose}
          onRoomInfo={() => setRoomInfoOpen(true)}
          participants={vr.participants}
        />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 4 — BottomBar (z-20, bottom:36)
            ════════════════════════════════════════════════════════════════════ */}
        <BottomBar
          isOwner={isOwner}
          isOnSeat={!!vr.isOnSeat}
          isMuted={vr.isMicMuted}
          isApplyingSeat={vr.myParticipant?.seatStatus === 'request'}
          onOpenSeatManagement={() => setSeatMgmtOpen(true)}
          onOpenSettings={() => vr.setSettingsOpen(true)}
          onOpenGift={() => vr.setGiftSheetOpen(true)}
          onLike={() => setLikeActive(true)}
          onToggleMic={vr.handleToggleMic}
          onRequestSeat={() => vr.handleRequestSeat(-1)}
          onLeaveSeat={handleLeaveSeat}
          pendingSeatRequests={pendingSeatRequests}
        />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 5 — LikeAnimation (z-30, bottom-left)
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="fixed left-4 bottom-24 z-30 pointer-events-none"
          style={{ width: '80px', height: '200px' }}
        >
          <LikeAnimation active={likeActive} />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 6 — GiftAnimations (z-40, full screen overlay)
            ════════════════════════════════════════════════════════════════════ */}
        <GiftAnimations activeAnimation={vr.activeGiftAnimation} />

        {/* ════════════════════════════════════════════════════════════════════
            LAYER 7 — All Sheets & Dialogs (z-50)
            ════════════════════════════════════════════════════════════════════ */}

        {/* ── Settings Sheet (owner/admin only) ── */}
        {isAdmin && (
          <SettingsSheet
            isOpen={vr.settingsOpen}
            onClose={() => vr.setSettingsOpen(false)}
            room={vr.room}
            onUpdate={(data) => vr.handleUpdateSettings(data)}
          />
        )}

        {/* ── Gift Sheet ── */}
        {authUser && (
          <GiftSheet
            isOpen={vr.giftSheetOpen}
            onClose={() => vr.setGiftSheetOpen(false)}
            onSendGift={handleGiftSend}
            gems={vr.weeklyGems}
          />
        )}

        {/* ── Profile Sheet ── */}
        <ProfileSheet
          isOpen={!!vr.profileSheet}
          onClose={() => vr.setProfileSheet(null)}
          participant={vr.profileSheet}
          currentUserId={vr.currentUserId}
          myRole={vr.myRole}
          stats={vr.profileStats ? {
            daysActive: 0,
            giftsSent: vr.profileStats.giftsSent,
            giftsReceived: vr.profileStats.giftsReceived,
          } : undefined}
          onKickTemp={vr.handleProfileKickTemp}
          onBan={vr.handleProfileBan}
          onChangeRole={vr.handleChangeRole}
          onRemoveRole={vr.handleRemoveRole}
          onInviteToMic={vr.handleInviteToMic}
        />

        {/* ── Mic Menu Sheet ── */}
        <MicMenuSheet
          isOpen={vr.micMenuSheet.isOpen}
          onClose={() => vr.setMicMenuSheet(prev => ({ ...prev, isOpen: false }))}
          state={vr.micMenuSheet}
          myRole={vr.myRole}
          isAutoMode={vr.room.isAutoMode}
          onAction={vr.handleMicMenuAction}
        />

        {/* ── Seat Management Sheet (owner/admin only) ── */}
        {isAdmin && (
          <SeatManagementSheet
            isOpen={seatMgmtOpen}
            onClose={() => setSeatMgmtOpen(false)}
            participants={vr.participants}
            seats={vr.seats}
            isAutoMode={vr.room.isAutoMode}
            onToggleAutoMode={handleToggleAutoMode}
            onAcceptSeat={handleAcceptSeat}
            onRejectSeat={handleRejectSeat}
            onKickFromMic={vr.handleKickFromMic}
            onInviteToMic={vr.handleInviteToMic}
          />
        )}

        {/* ── Room Info Sheet ── */}
        <RoomInfoSheet
          isOpen={roomInfoOpen}
          onClose={() => setRoomInfoOpen(false)}
          room={vr.room}
          participantCount={vr.participants.length}
        />

        {/* ── Kick Duration Dialog ── */}
        <KickDurationDialog
          isOpen={vr.kickDialogOpen}
          onClose={() => vr.setKickDialogOpen(false)}
          onConfirm={handleKickDurationConfirm}
        />

        {/* ── Membership / Role Invitation Dialog ── */}
        <MembershipDialog
          isOpen={!!vr.pendingInvite}
          onClose={() => vr.setPendingInvite('')}
          onAccept={vr.handleAcceptInvite}
          onReject={vr.handleRejectInvite}
          roleLabel={ROLE_LABELS[vr.pendingInvite as RoomRole] || vr.pendingInvite}
        />

        {/* ── Mic Invite Dialog ── */}
        <MicInviteDialog
          isOpen={vr.pendingMicInvite >= 0}
          onClose={() => vr.setPendingMicInvite(-1)}
          onAccept={vr.handleAcceptMicInvite}
          onReject={vr.handleRejectMicInvite}
          seatIndex={vr.pendingMicInvite}
        />

        {/* ── End Live Confirmation Dialog (owner only) ── */}
        {showEndLiveDialog && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 60,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEndLiveDialog(false);
            }}
          >
            <div
              className="flex flex-col items-center w-[300px] p-6"
              style={{
                backgroundColor: TUI.colors.G2,
                borderRadius: '15px',
                animation: TUI.anim.drawer,
              }}
            >
              {/* Warning icon */}
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(252, 85, 85, 0.1)',
                }}
              >
                <AlertTriangle size={24} style={{ color: TUI.colors.red }} />
              </div>

              {/* Title */}
              <h3
                className="mb-3 font-bold text-center"
                style={{
                  fontSize: TUI.font.title16.size,
                  fontWeight: 600,
                  color: TUI.colors.white,
                }}
              >
                إنهاء الغرفة
              </h3>

              {/* Body */}
              <p
                className="mb-6 text-center leading-relaxed"
                style={{
                  fontSize: TUI.font.body14.size,
                  color: TUI.colors.G7,
                  lineHeight: '22px',
                }}
              >
                هل أنت متأكد من إنهاء الغرفة؟ سيتم إخراج جميع المشاركين.
              </p>

              {/* End Live button */}
              <button
                onClick={handleEndLive}
                className="w-full mb-3 flex items-center justify-center cursor-pointer"
                style={{
                  height: 44,
                  backgroundColor: TUI.colors.red,
                  color: TUI.colors.white,
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: TUI.font.title16.size,
                  fontWeight: 600,
                  transition: TUI.anim.fast,
                }}
              >
                إنهاء
              </button>

              {/* Cancel button */}
              <button
                onClick={() => setShowEndLiveDialog(false)}
                className="w-full flex items-center justify-center cursor-pointer"
                style={{
                  height: 36,
                  backgroundColor: 'transparent',
                  color: TUI.colors.G6,
                  border: 'none',
                  fontSize: TUI.font.body14.size,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INVISIBLE LIKE ACTIVATION AREA
          Catch pointer-up globally to stop like animation on release
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ pointerEvents: likeActive ? 'auto' : 'none' }}
        onPointerUp={() => setLikeActive(false)}
        onPointerLeave={() => setLikeActive(false)}
      />
    </>
  );
}
