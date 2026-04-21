'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Loader2, AlertTriangle, Settings2, X, ArrowRight, Share2,
  Crown, Volume2, VolumeX, Mic, MicOff, Gift, Send,
  Megaphone, Pencil, Trophy, Disc3, ListMusic, Music, Music2,
  Gamepad2, Power, Lock,
} from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import {
  TUI, DEFAULT_BG_URLS, ROLE_LABELS, canDo, getAvatarColor,
  getAvatarColorFromPalette, type RoomRole,
} from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

import InjectStyles from './shared/InjectStyles';
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
   RoomInteriorView — Yalla Ludo-style voice room interior (Redesigned)

   Structure (h-screen flex flex-col relative):
     ├── Background (teal-green gradient: #0D8A7A → #0A6B5E → #074a42)
     ├── z-10 flex flex-col h-full
     │   ├── Header (semi-transparent: avatar+crown+name | share+settings+power)
     │   ├── Announcement Bar (yellow banner with megaphone)
     │   ├── Mic Seat Arc (curved semi-circular layout, 52px circles)
     │   ├── ChatPanel (compact, floating messages)
     │   ├── LikeAnimation (overlay, left side)
     │   ├── GiftAnimations (overlay)
     │   └── Bottom Bar (inline: volume+mic | chat pill | game+gift)
     ├── Right Side Vertical Menu (music icons: Disc3, ListMusic, Music, Music2 + Crown + Trophy)
     └── All sheets/dialogs (EXACTLY unchanged)
   ═══════════════════════════════════════════════════════════════════════ */

interface RoomInteriorViewProps {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (room: VoiceRoom) => void;
}

/* ── Speaking Audio Bars sub-component ── */
function SpeakingBars({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center justify-center" style={{ gap: 2, height: 14 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 3,
            height: 8 + (i === 1 ? 6 : 3),
            borderRadius: '1.5px',
            backgroundColor: TUI.colors.tealLight,
            animation: `speakBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speakBar {
          0% { transform: scaleY(0.4); opacity: 0.5; }
          100% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Arc Y-offset calculator for curved seat layout ── */
function getArcOffset(index: number, total: number): number {
  if (total <= 1) return 0;
  const normalized = (index / (total - 1)) - 0.5; // -0.5 to 0.5
  return Math.pow(normalized * 2, 2) * 16; // parabolic curve, max 16px
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

  /* ── Chat input state (managed here, passed inline to bottom bar) ── */
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

  /* ── Leave seat (from bottom bar) ── */
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

  /* ── Background image (kept for potential future use) ── */
  const bgImage = vr.room.roomImage || DEFAULT_BG_URLS[0];

  /* ── Audience list (participants NOT on a mic seat) ── */
  const audienceList = vr.participants.filter(p => p.seatIndex < 0);

  /* ── Host participant (for header display) ── */
  const hostParticipant = vr.participants.find(p => p.userId === vr.room.hostId);

  /* ── Bottom bar input ref ── */
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
    },
    [handleSendChat],
  );

  /* ── Teal-green gradient background (matches lobby) ── */
  const bgGradient = 'linear-gradient(180deg, #0D8A7A 0%, #0A6B5E 50%, #074a42 100%)';

  /* ── Right side menu icon style (shared) ── */
  const menuBtnStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: TUI.anim.fast,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  /* ── Loading state ── */
  if (vr.loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: bgGradient }}
      >
        <Loader2
          size={40}
          className="animate-spin mb-4"
          style={{ color: TUI.colors.white }}
        />
        <span
          style={{
            fontSize: TUI.font.body14.size,
            color: TUI.colors.white,
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
          Background: teal-green gradient matching lobby
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: bgGradient }}
        dir="rtl"
      >
        {/* ════════════════════════════════════════════════════════
            MAIN CONTENT LAYER (z-10, flex-column, fills screen)
            ════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col h-full">

          {/* ════════════════════════════════════════════
              HEADER — semi-transparent, teal tinted
              Right (visual): host avatar + crown + name + "مستمع X"
              Left (visual): share + settings gear (admin) + power/exit
              ════════════════════════════════════════════ */}
          <header
            className="flex items-center justify-between flex-shrink-0"
            style={{
              height: 56,
              minHeight: 56,
              padding: '0 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: 'none',
            }}
          >
            {/* ── Right side (visual start in RTL): host avatar + crown + name + listener count ── */}
            <button
              type="button"
              onClick={() => setRoomInfoOpen(true)}
              className="flex items-center min-w-0 flex-1 gap-2.5 bg-transparent border-none cursor-pointer touch-manipulation"
              style={{ padding: 0 }}
              aria-label="معلومات الغرفة"
            >
              {/* Host avatar (36px circle) */}
              <div
                className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: hostParticipant?.avatar
                    ? 'transparent'
                    : (hostParticipant ? getAvatarColor(hostParticipant.userId) : 'rgba(255,255,255,0.15)'),
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {hostParticipant?.avatar ? (
                  <img
                    src={hostParticipant.avatar}
                    alt={hostParticipant.displayName || hostParticipant.username}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="font-medium"
                    style={{ fontSize: 14, color: TUI.colors.white, lineHeight: 1 }}
                  >
                    {(hostParticipant?.displayName || hostParticipant?.username || vr.room.hostName || '?').charAt(0)}
                  </span>
                )}
              </div>

              {/* Crown + Name + Listener count */}
              <div className="flex flex-col items-start min-w-0" style={{ gap: 1 }}>
                <div className="flex items-center min-w-0" style={{ gap: 4 }}>
                  <Crown
                    size={14}
                    fill={TUI.colors.gold}
                    stroke={TUI.colors.gold}
                    strokeWidth={1}
                    className="flex-shrink-0"
                  />
                  <span
                    className="truncate font-bold"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: TUI.colors.white,
                      maxWidth: 160,
                    }}
                  >
                    {vr.room.name}
                  </span>
                </div>
                <span
                  className="truncate"
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                    maxWidth: 200,
                  }}
                >
                  {vr.listenerCount} مستمع
                </span>
              </div>
            </button>

            {/* ── Left side (visual end in RTL): share + settings + power ── */}
            <div className="flex items-center flex-shrink-0" style={{ gap: 8 }}>
              {/* Share button */}
              <button
                onClick={handleShare}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transition: TUI.anim.fast,
                }}
                aria-label="مشاركة"
              >
                <Share2 size={16} style={{ color: TUI.colors.white }} />
              </button>

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
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="الإعدادات"
                >
                  <Settings2 size={16} style={{ color: TUI.colors.white }} />
                </button>
              )}

              {/* End / Exit button */}
              <button
                onClick={handleClose}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: isOwner ? 'rgba(252, 85, 85, 0.25)' : 'rgba(255,255,255,0.1)',
                  transition: TUI.anim.fast,
                }}
                aria-label={isOwner ? 'إنهاء الغرفة' : 'خروج'}
              >
                {isOwner ? (
                  <Power size={16} style={{ color: TUI.colors.red }} />
                ) : (
                  <ArrowRight size={16} style={{ color: TUI.colors.white }} />
                )}
              </button>
            </div>
          </header>

          {/* ════════════════════════════════════════════
              ANNOUNCEMENT BAR — yellow banner with megaphone
              ════════════════════════════════════════════ */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              padding: '8px 14px',
              backgroundColor: '#FFF3CD',
              gap: 8,
              borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
            }}
          >
            <Megaphone size={15} style={{ color: '#856404', flexShrink: 0 }} />
            <span
              className="flex-1 min-w-0 truncate"
              style={{
                fontSize: 12,
                color: '#856404',
                lineHeight: '18px',
              }}
            >
              {vr.room.announcement || 'أضف إعلان غرفتك هنا'}
            </span>
            {isAdmin && (
              <button
                onClick={() => setRoomInfoOpen(true)}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer touch-manipulation flex-shrink-0"
                style={{ padding: 4, minWidth: 32, minHeight: 32 }}
                aria-label="تعديل الإعلان"
              >
                <Pencil size={13} style={{ color: '#856404' }} />
              </button>
            )}
          </div>

          {/* ════════════════════════════════════════════
              MIC SEAT ARC — curved semi-circular layout
              52px circles, teal border glow for occupied
              Animated speaking bars below speaking seats
              ════════════════════════════════════════════ */}
          <div
            className="flex items-end justify-center flex-shrink-0"
            style={{
              padding: '20px 16px 8px',
              gap: 8,
            }}
          >
            {vr.seats.map((seat) => {
              const isLocked = seat.status === 'locked';
              const isEmpty = !seat.participant && !isLocked;
              const isOccupied = !!seat.participant;
              const isSpeaking = isOccupied && !seat.participant!.isMuted && !seat.participant!.micFrozen;
              const yOffset = getArcOffset(seat.seatIndex, vr.seats.length);

              return (
                <button
                  key={seat.seatIndex}
                  type="button"
                  onClick={() => vr.handleSeatClick(seat.seatIndex)}
                  className="flex flex-col items-center touch-manipulation bg-transparent border-none cursor-pointer"
                  style={{
                    gap: 4,
                    minWidth: 52,
                    minHeight: 76,
                    transform: `translateY(${yOffset}px)`,
                    transition: 'transform 0.3s ease',
                  }}
                  aria-label={
                    isOccupied
                      ? `مقعد ${seat.seatIndex + 1}: ${seat.participant!.displayName}`
                      : `مقعد ${seat.seatIndex + 1}: ${isLocked ? 'مقفل' : 'فارغ'}`
                  }
                >
                  {/* Seat circle (52px) */}
                  <div
                    className="relative rounded-full flex items-center justify-center"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: isEmpty
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'transparent',
                      border: isOccupied
                        ? `2.5px solid ${TUI.colors.tealLight}`
                        : '2px solid rgba(255,255,255,0.15)',
                      boxShadow: isOccupied
                        ? `0 0 14px rgba(0, 200, 150, 0.5), 0 0 28px rgba(0, 200, 150, 0.2)`
                        : 'none',
                      transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                    }}
                  >
                    {/* Locked state */}
                    {isLocked && (
                      <Lock size={20} style={{ color: 'rgba(255,255,255,0.5)' }} strokeWidth={1.5} />
                    )}

                    {/* Empty state */}
                    {isEmpty && (
                      <Mic size={20} style={{ color: 'rgba(255,255,255,0.4)' }} strokeWidth={1.5} />
                    )}

                    {/* Occupied state — avatar */}
                    {isOccupied && seat.participant && (
                      <>
                        <div
                          className="rounded-full overflow-hidden flex items-center justify-center"
                          style={{ width: 46, height: 46 }}
                        >
                          {seat.participant.avatar ? (
                            <img
                              src={seat.participant.avatar}
                              alt={seat.participant.displayName}
                              className="w-full h-full object-cover rounded-full"
                              draggable={false}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center rounded-full w-full h-full"
                              style={{
                                backgroundColor: getAvatarColorFromPalette(seat.participant.userId).bg,
                                color: getAvatarColorFromPalette(seat.participant.userId).text,
                                fontSize: 20,
                                fontWeight: 600,
                              }}
                            >
                              {seat.participant.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Muted badge (bottom-right) */}
                        {(seat.participant.isMuted || seat.participant.micFrozen) && (
                          <span
                            className="absolute flex items-center justify-center rounded-full"
                            style={{
                              bottom: -1,
                              right: -1,
                              width: 17,
                              height: 17,
                              backgroundColor: TUI.colors.red,
                              zIndex: 2,
                            }}
                          >
                            <MicOff size={9} color="#fff" strokeWidth={2.5} />
                          </span>
                        )}

                        {/* Owner crown badge (top-right) */}
                        {seat.participant.role === 'owner' && (
                          <span
                            className="absolute flex items-center justify-center"
                            style={{
                              top: -2,
                              right: -2,
                              width: 16,
                              height: 16,
                              zIndex: 2,
                            }}
                          >
                            <Crown size={14} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Speaking audio bars */}
                  <SpeakingBars active={isSpeaking} />

                  {/* Seat number below */}
                  <span
                    className="select-none"
                    style={{
                      fontSize: 11,
                      color: isOccupied ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                      fontWeight: isOccupied ? 500 : 400,
                    }}
                  >
                    {seat.seatIndex + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════
              CHAT PANEL — compact floating messages
              Smaller area, messages float over the background
              ════════════════════════════════════════════ */}
          <ChatPanel
            messages={vr.chatMessages}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            participants={vr.participants}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />

          {/* ════════════════════════════════════════════
              LIKE ANIMATION (overlay, pointer-events-none, left side)
              ════════════════════════════════════════════ */}
          <div
            className="absolute left-4 bottom-20 pointer-events-none"
            style={{ width: 80, height: 200, zIndex: 30 }}
          >
            <LikeAnimation active={likeActive} />
          </div>

          {/* ════════════════════════════════════════════
              GIFT ANIMATIONS (overlay, pointer-events-none)
              ════════════════════════════════════════════ */}
          <GiftAnimations activeAnimation={vr.activeGiftAnimation} />

          {/* ════════════════════════════════════════════
              BOTTOM BAR — inline (not separate component)
              Left: Volume toggle (admin) + Mic toggle (on seat)
              Center: Chat text input pill ("اكتب شيئاً") + send
              Right: Gamepad icon + Gift icon (gradient orange-red)
              ════════════════════════════════════════════ */}
          <footer
            className="flex-shrink-0 w-full"
            style={{
              padding: '8px 12px',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center w-full" style={{ gap: 8 }}>

              {/* ── Left (visual): volume/speaker toggle (admin only) ── */}
              {isAdmin && (
                <button
                  onClick={vr.handleToggleRoomMute}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 44,
                    minHeight: 44,
                    backgroundColor: vr.isRoomMuted
                      ? 'rgba(252, 85, 85, 0.2)'
                      : 'rgba(255,255,255,0.12)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isRoomMuted ? 'الغرفة مكتومة' : 'كتم الغرفة'}
                >
                  {vr.isRoomMuted ? (
                    <VolumeX size={18} style={{ color: TUI.colors.red }} />
                  ) : (
                    <Volume2 size={18} style={{ color: TUI.colors.white }} />
                  )}
                </button>
              )}

              {/* ── Mic toggle (when on seat) ── */}
              {vr.isOnSeat && (
                <button
                  onClick={vr.handleToggleMic}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 44,
                    minHeight: 44,
                    backgroundColor: vr.isMicMuted
                      ? 'rgba(252, 85, 85, 0.2)'
                      : 'rgba(255,255,255,0.12)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isMicMuted ? 'إلغاء الكتم' : 'كتم الميك'}
                >
                  {vr.isMicMuted ? (
                    <MicOff size={18} style={{ color: TUI.colors.red }} />
                  ) : (
                    <Mic size={18} style={{ color: TUI.colors.tealLight }} />
                  )}
                </button>
              )}

              {/* ── Center: text input "اكتب شيئاً" pill shape ── */}
              <div
                className="flex items-center flex-1 min-w-0"
                style={{
                  height: 38,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  padding: '0 14px',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    vr.isRoomMuted
                      ? 'الغرفة مكتومة'
                      : !authUser
                        ? 'سجل دخولك للمشاركة'
                        : 'اكتب شيئاً'
                  }
                  disabled={vr.isRoomMuted || !authUser}
                  maxLength={200}
                  dir="rtl"
                  className="flex-1 min-w-0 bg-transparent outline-none"
                  style={{
                    fontSize: 13,
                    color: TUI.colors.white,
                    caretColor: TUI.colors.tealLight,
                  }}
                />

                {/* Send button */}
                {chatInput.trim() && !vr.isRoomMuted && authUser && (
                  <button
                    onClick={() => { handleSendChat(); inputRef.current?.focus(); }}
                    className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{
                      width: 28,
                      height: 28,
                      color: TUI.colors.tealLight,
                      transition: TUI.anim.fast,
                    }}
                    aria-label="إرسال"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>

              {/* ── Right (visual): gamepad icon + gift icon ── */}
              {authUser && (
                <>
                  <button
                    className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{
                      width: 38,
                      height: 38,
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="ألعاب"
                  >
                    <Gamepad2 size={18} style={{ color: TUI.colors.white }} />
                  </button>

                  <button
                    onClick={() => vr.setGiftSheetOpen(true)}
                    className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{
                      width: 38,
                      height: 38,
                      minWidth: 44,
                      minHeight: 44,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="إرسال هدية"
                  >
                    <Gift size={18} fill={TUI.colors.white} style={{ color: TUI.colors.white }} />
                  </button>
                </>
              )}
            </div>
          </footer>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT SIDE VERTICAL MENU — floating music + utility icons
            Icons: Disc3, ListMusic, Music, Music2, Crown, Trophy
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="fixed flex-col items-center"
          style={{
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            gap: 10,
          }}
        >
          {/* ── Music Disc — تشغيل ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="تشغيل"
          >
            <Disc3 size={18} style={{ color: TUI.colors.tealLight }} />
          </button>

          {/* ── Playlist — قائمة التشغيل ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="قائمة التشغيل"
          >
            <ListMusic size={18} style={{ color: TUI.colors.white }} />
          </button>

          {/* ── Music — موسيقى ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="موسيقى"
          >
            <Music size={18} style={{ color: TUI.colors.white }} />
          </button>

          {/* ── Sound Effects — مؤثرات صوتية ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="مؤثرات صوتية"
          >
            <Music2 size={18} style={{ color: TUI.colors.white }} />
          </button>

          {/* ── Divider ── */}
          <div style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />

          {/* ── Treasure / Crown ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="كنز"
          >
            <Crown size={18} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
          </button>

          {/* ── Activity / Trophy ── */}
          <button
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={menuBtnStyle}
            aria-label="أنشطة"
          >
            <Trophy size={18} style={{ color: TUI.colors.orange }} />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ALL SHEETS & DIALOGS (z-50)
            SettingsSheet and all others — EXACTLY unchanged
            ════════════════════════════════════════════════════════════════════ */}

        {/* ── Settings Sheet (owner/admin only) — UNCHANGED ── */}
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
            // @ts-expect-error — handleKickFromMic is internal to hook, pre-existing
            onKickFromMic={vr.handleKickFromMic as unknown as (userId: string) => void}
            onInviteToMic={vr.handleInviteToMic as unknown as () => void}
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
                backgroundColor: '#1a3a36',
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
                  backgroundColor: 'rgba(252, 85, 85, 0.15)',
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
                  color: 'rgba(255,255,255,0.7)',
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
                  height: 44,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: TUI.colors.white,
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: TUI.font.title16.size,
                  fontWeight: 500,
                  transition: TUI.anim.fast,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
