'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle, Settings2, X, ArrowRight, Share2 } from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { TUI, DEFAULT_BG_URLS, ROLE_LABELS, canDo, getAvatarColor, type RoomRole } from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

import InjectStyles from './shared/InjectStyles';
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

import type { VoiceRoom, AuthUser, VoiceRoomParticipant } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   RoomInteriorView — OLD-style flex-column layout

   Structure:
     h-screen flex flex-col relative
     ├── Background image + overlay (absolute)
     ├── z-10 flex flex-col h-full
     │   ├── Header (h-14, flex, room name + settings/exit/share)
     │   ├── AudienceRow (horizontal scrollable audience avatars)
     │   ├── MicSeatGrid (grid, 5 columns)
     │   ├── ChatPanel (flex-1, scrollable message list)
     │   ├── LikeAnimation
     │   ├── GiftAnimations
     │   └── BottomBar (footer, full-width, chat input + gift + mic + mute)
     └── All sheets/dialogs
   ═══════════════════════════════════════════════════════════════════════ */

interface RoomInteriorViewProps {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (room: VoiceRoom) => void;
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

  /* ── Like hold state ── */
  const [likeActive, setLikeActive] = useState(false);

  /* ── Chat input state (managed here, passed to BottomBar) ── */
  const [chatInput, setChatInput] = useState('');

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

  /* ── GiftSheet onSendGift adapter ── */
  function handleGiftSend(giftId: string, quantity: number) {
    vr.handleSendGift(giftId, 'everyone', quantity);
  }

  /* ── Send chat handler ── */
  function handleSendChat() {
    if (!chatInput.trim() || vr.isRoomMuted || !authUser) return;
    vr.handleSendChat(chatInput.trim());
    setChatInput('');
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

  /* ── Copy link ── */
  function handleShare() {
    vr.handleCopyLink();
  }

  /* ── Background image ── */
  const bgImage = vr.room.roomImage || DEFAULT_BG_URLS[0];

  /* ── Audience list (participants NOT on a mic seat) ── */
  const audienceList = vr.participants.filter(p => p.seatIndex < 0);

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
          ROOT CONTAINER — h-screen flex flex-col relative
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{ backgroundColor: TUI.colors.G1 }}
        dir="rtl"
      >
        {/* ════════════════════════════════════════════════════════════════════
            BACKGROUND — absolute, behind everything
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
              'linear-gradient(to bottom, rgba(15,16,20,1) 0%, rgba(15,16,20,0.5) 50%, rgba(15,16,20,1) 100%)',
          }}
        />

        {/* ════════════════════════════════════════════════════════════════════
            MAIN CONTENT LAYER (z-10, flex-column, fills screen)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col h-full">

          {/* ════════════════════════════════════════════════════════
              HEADER — inline, h-14, flex, items-center, justify-between
              ════════════════════════════════════════════════════════ */}
          <header
            className="flex items-center justify-between flex-shrink-0"
            style={{
              height: 56,
              minHeight: 56,
              padding: '0 16px',
              borderBottom: `1px solid ${TUI.colors.G3Divider}`,
              backgroundColor: 'rgba(15, 16, 20, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {/* ── Right: Room name + host badge + listener count ── */}
            <button
              type="button"
              onClick={() => setRoomInfoOpen(true)}
              className="flex items-center min-w-0 flex-1 gap-2 bg-transparent border-none cursor-pointer touch-manipulation"
              style={{ padding: 0 }}
              aria-label="Room info"
            >
              <span
                className="truncate font-bold"
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: TUI.colors.white,
                  maxWidth: 180,
                }}
              >
                {vr.room.name}
              </span>

              {/* LV badge */}
              <span
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  minWidth: 20,
                  height: 18,
                  padding: '0 5px',
                  backgroundColor: 'rgba(41, 204, 106, 0.15)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: TUI.colors.liveGreen,
                  lineHeight: '18px',
                }}
              >
                LV{vr.room.roomLevel}
              </span>

              {/* Listener count */}
              <span
                className="flex-shrink-0"
                style={{
                  fontSize: 12,
                  color: TUI.colors.G5,
                }}
              >
                {vr.listenerCount} مستمع
              </span>
            </button>

            {/* ── Left: Settings + Exit + Share ── */}
            <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
              {/* Settings button (admin+ only) */}
              {isAdmin && (
                <button
                  onClick={() => vr.setSettingsOpen(true)}
                  className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 44,
                    minHeight: 44,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="الإعدادات"
                >
                  <Settings2 size={16} style={{ color: TUI.colors.G7 }} />
                </button>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  transition: TUI.anim.fast,
                }}
                aria-label="مشاركة"
              >
                <Share2 size={16} style={{ color: TUI.colors.G7 }} />
              </button>

              {/* Exit button */}
              <button
                onClick={handleClose}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: 'rgba(252, 85, 85, 0.15)',
                  transition: TUI.anim.fast,
                }}
                aria-label={isOwner ? 'إنهاء الغرفة' : 'خروج'}
              >
                {isOwner ? (
                  <X size={16} style={{ color: TUI.colors.red }} />
                ) : (
                  <ArrowRight size={16} style={{ color: TUI.colors.red }} />
                )}
              </button>
            </div>
          </header>

          {/* ════════════════════════════════════════════════════════
              AUDIENCE ROW — horizontal scrollable audience avatars with role badges
              ════════════════════════════════════════════════════════ */}
          {audienceList.length > 0 && (
            <div
              className="flex-shrink-0 overflow-x-auto"
              style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${TUI.colors.G3Divider}`,
                scrollbarWidth: 'none',
              }}
            >
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              <div className="flex items-center" style={{ gap: 10 }}>
                {audienceList.slice(0, 20).map(p => (
                  <AudienceAvatar key={p.userId} participant={p} onClick={() => vr.setProfileSheet(p)} />
                ))}
                {audienceList.length > 20 && (
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: TUI.colors.bgInput,
                      fontSize: 11,
                      fontWeight: 600,
                      color: TUI.colors.G6,
                    }}
                  >
                    +{audienceList.length - 20}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              MIC SEAT GRID — 5-column grid with header
              ════════════════════════════════════════════════════════ */}
          <MicSeatGrid
            seats={vr.seats}
            currentUserId={vr.currentUserId}
            myRole={vr.myRole}
            hostId={vr.room.hostId}
            onSeatClick={vr.handleSeatClick}
          />

          {/* ════════════════════════════════════════════════════════
              CHAT PANEL — flex-1 scrollable message list
              ════════════════════════════════════════════════════════ */}
          <ChatPanel
            messages={vr.chatMessages}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            participants={vr.participants}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />

          {/* ════════════════════════════════════════════════════════
              LIKE ANIMATION (overlay, pointer-events-none)
              ════════════════════════════════════════════════════════ */}
          <div
            className="absolute left-4 bottom-20 pointer-events-none"
            style={{ width: 80, height: 200, zIndex: 30 }}
          >
            <LikeAnimation active={likeActive} />
          </div>

          {/* ════════════════════════════════════════════════════════
              GIFT ANIMATIONS (overlay)
              ════════════════════════════════════════════════════════ */}
          <GiftAnimations activeAnimation={vr.activeGiftAnimation} />

          {/* ════════════════════════════════════════════════════════
              BOTTOM BAR — full-width footer with always-visible chat input
              ════════════════════════════════════════════════════════ */}
          <BottomBar
            myRole={vr.myRole}
            isOnSeat={!!vr.isOnSeat}
            isMicMuted={vr.isMicMuted}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendChat={handleSendChat}
            onToggleMic={vr.handleToggleMic}
            onToggleRoomMute={vr.handleToggleRoomMute}
            onGiftOpen={() => vr.setGiftSheetOpen(true)}
          />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ALL SHEETS & DIALOGS (z-50)
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
          hostId={vr.room.hostId}
          stats={vr.profileStats ? {
            daysActive: 0,
            giftsSent: vr.profileStats.giftsSent,
            giftsReceived: vr.profileStats.giftsReceived,
            totalReceivedValue: vr.profileStats.totalReceivedValue ?? 0,
          } : undefined}
          onKickTemp={vr.handleProfileKickTemp}
          onBan={vr.handleProfileBan}
          onChangeRole={vr.handleChangeRole}
          onRemoveRole={vr.handleRemoveRole}
          onInviteToMic={vr.handleInviteToMic}
          onGiftClick={() => { vr.setProfileSheet(null); setTimeout(() => vr.setGiftSheetOpen(true), 300); }}
          authUserId={authUser?.id}
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
          participants={vr.participants}
          weeklyGems={vr.weeklyGems}
          topGifts={vr.topGifts}
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

/* ═══════════════════════════════════════════════════════════════════════
   AudienceAvatar — Inline component for audience row
   Circular avatar with optional role badge
   ═══════════════════════════════════════════════════════════════════════ */

function AudienceAvatar({
  participant,
  onClick,
}: {
  participant: VoiceRoomParticipant;
  onClick: () => void;
}) {
  const hasRole = participant.role !== 'visitor' && participant.role !== 'member';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center flex-shrink-0 bg-transparent border-none cursor-pointer touch-manipulation"
      style={{ gap: 2, minWidth: 44, minHeight: 44 }}
    >
      {/* Avatar circle */}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          backgroundColor: participant.avatar ? 'transparent' : getAvatarColor(participant.userId),
        }}
      >
        {participant.avatar ? (
          <img
            src={participant.avatar}
            alt={participant.displayName || participant.username}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
          />
        ) : (
          <span
            className="font-medium"
            style={{
              fontSize: 14,
              color: TUI.colors.white,
              lineHeight: 1,
            }}
          >
            {(participant.displayName || participant.username || '?').charAt(0)}
          </span>
        )}

        {/* Role badge (bottom-right) */}
        {hasRole && (
          <span
            className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
            style={{
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              fontSize: 8,
              fontWeight: 600,
              lineHeight: '16px',
              backgroundColor: TUI.colors.bgOperate,
              border: `1.5px solid ${TUI.colors.G1}`,
            }}
          >
            {participant.role === 'owner' ? '👑' : participant.role === 'coowner' ? '⚡' : '🛡️'}
          </span>
        )}
      </div>

      {/* Name label */}
      <span
        className="text-center truncate w-full"
        style={{
          maxWidth: 48,
          fontSize: 10,
          color: TUI.colors.G5,
          lineHeight: '14px',
        }}
      >
        {participant.displayName || participant.username || ''}
      </span>
    </button>
  );
}
