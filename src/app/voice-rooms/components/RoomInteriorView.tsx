'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Loader2, AlertTriangle, X, ArrowRight, Share2,
  Crown, Volume2, VolumeX, Mic, MicOff, Gift, Send,
  Megaphone, Pencil, Trophy, Disc3, ListMusic, Music, Music2,
  Power, Lock, MoreVertical, Users, Settings2, Shield,
  PencilLine, VolumeIcon as VolumeOff2, Sparkles,
  UserPlus, LogOut, Heart,
} from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import {
  TUI, DEFAULT_BG_URLS, ROLE_LABELS, canDo, getAvatarColor,
  getAvatarColorFromPalette, getMicLayout,
  type RoomRole, type SeatData, type VoiceRoomParticipant, type MicLayoutId,
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

import type { VoiceRoom, AuthUser } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   RoomInteriorView — TUILiveKit Room Interior (Matching Lobby + Settings)

   Structure (h-screen flex flex-col relative):
     ├── Background (teal-green: #0D8A7A → #0A6B5E → #074a42 — same as lobby)
     ├── z-10 flex flex-col h-full
     │   ├── Header (semi-transparent teal: avatar+crown+name | share+3dots+power)
     │   ├── Announcement Bar (subtle dark with megaphone)
     │   ├── Mic Seat Area (layout based on micTheme: chat5/broadcast5/chat10/team10/chat15)
     │   ├── ChatPanel (compact, floating messages)
     │   ├── LikeAnimation (overlay, left side)
     │   ├── GiftAnimations (overlay)
     │   └── Bottom Bar (inline: volume+mic | chat pill | gift)
     ├── LEFT SIDE VERTICAL MENU (music icons: Disc3, ListMusic, Music, Music2 + Crown + Trophy)
     ├── Three-Dots Menu (overlay, grid of icons)
     └── All sheets/dialogs (EXACTLY unchanged — SettingsSheet LOCKED)
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

/* ── Seat Circle — reusable mic seat circle ── */
function SeatCircle({
  seat,
  size = 50,
  onSeatClick,
}: {
  seat: SeatData;
  size?: number;
  onSeatClick: (idx: number) => void;
}) {
  const isLocked = seat.status === 'locked';
  const isEmpty = !seat.participant && !isLocked;
  const isOccupied = !!seat.participant;
  const isSpeaking = isOccupied && !seat.participant!.isMuted && !seat.participant!.micFrozen;
  const innerSize = size - 6;

  return (
    <button
      type="button"
      onClick={() => onSeatClick(seat.seatIndex)}
      className="flex flex-col items-center touch-manipulation bg-transparent border-none cursor-pointer"
      style={{ gap: 3, minWidth: size + 4, minHeight: size + 22 }}
      aria-label={
        isOccupied
          ? `مقعد ${seat.seatIndex + 1}: ${seat.participant!.displayName}`
          : `مقعد ${seat.seatIndex + 1}: ${isLocked ? 'مقفل' : 'فارغ'}`
      }
    >
      {/* Seat circle */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: isEmpty ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: isOccupied
            ? `2.5px solid ${TUI.colors.tealLight}`
            : isLocked
              ? '2px solid rgba(255,255,255,0.12)'
              : '2px solid rgba(255,255,255,0.08)',
          boxShadow: isOccupied
            ? `0 0 12px rgba(0, 200, 150, 0.4), 0 0 24px rgba(0, 200, 150, 0.15)`
            : isSpeaking
              ? `0 0 12px rgba(0, 200, 150, 0.3)`
              : 'none',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Locked state */}
        {isLocked && (
          <Lock size={size * 0.4} style={{ color: 'rgba(255,255,255,0.35)' }} strokeWidth={1.5} />
        )}

        {/* Empty state */}
        {isEmpty && (
          <Mic size={size * 0.4} style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />
        )}

        {/* Occupied — avatar */}
        {isOccupied && seat.participant && (
          <>
            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{ width: innerSize, height: innerSize }}
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
                    fontSize: innerSize * 0.42,
                    fontWeight: 600,
                  }}
                >
                  {seat.participant.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Muted badge */}
            {(seat.participant.isMuted || seat.participant.micFrozen) && (
              <span
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  bottom: -1,
                  right: -1,
                  width: 16,
                  height: 16,
                  backgroundColor: TUI.colors.red,
                  zIndex: 2,
                }}
              >
                <MicOff size={8} color="#fff" strokeWidth={2.5} />
              </span>
            )}

            {/* Owner crown */}
            {seat.participant.role === 'owner' && (
              <span
                className="absolute flex items-center justify-center"
                style={{ top: -3, right: -3, width: 16, height: 16, zIndex: 2 }}
              >
                <Crown size={14} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
              </span>
            )}
          </>
        )}
      </div>

      {/* Speaking bars */}
      <SpeakingBars active={isSpeaking} />
    </button>
  );
}

/* ── Mic Seat Layouts (TUILiveKit screenshot-matched) ── */
function MicSeatGrid({
  seats,
  layoutId,
  onSeatClick,
}: {
  seats: SeatData[];
  layoutId: MicLayoutId;
  onSeatClick: (idx: number) => void;
}) {
  const seatSize = seats.length <= 5 ? 54 : seats.length <= 10 ? 50 : 46;
  const rowGap = seats.length <= 5 ? 0 : seats.length <= 10 ? 12 : 10;

  // ── Chat 5: 1 row of 5 (horizontal line) ──
  if (layoutId === 'chat5') {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ padding: '24px 12px 8px', gap: 10 }}
      >
        {seats.map((seat) => (
          <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} />
        ))}
      </div>
    );
  }

  // ── Broadcast 5: 1 top (host) + 4 bottom (pyramid) ──
  if (layoutId === 'broadcast5') {
    const hostSeat = seats.find(s => s.participant?.role === 'owner') || seats[0];
    const bottomSeats = seats.filter(s => s.seatIndex !== hostSeat.seatIndex);
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 16px 8px', gap: 14 }}
      >
        {/* Top row: Host (slightly larger) */}
        <div className="flex items-center justify-center">
          <SeatCircle seat={hostSeat} size={seatSize + 6} onSeatClick={onSeatClick} />
        </div>
        {/* Bottom row: 4 seats */}
        <div className="flex items-center justify-center" style={{ gap: 10 }}>
          {bottomSeats.map((seat) => (
            <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} />
          ))}
        </div>
      </div>
    );
  }

  // ── Chat 10: 2 rows of 5 (2×5 grid) ──
  if (layoutId === 'chat10') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 12px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => (
          <div key={row} className="flex items-center justify-center" style={{ gap: 8 }}>
            {seats.slice(row * 5, (row + 1) * 5).map((seat) => (
              <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Team 10: 2 rows of 5 with divider between seats 2&3 ──
  if (layoutId === 'team10') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 12px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => {
          const rowSeats = seats.slice(row * 5, (row + 1) * 5);
          return (
            <div key={row} className="flex items-center justify-center" style={{ gap: 0 }}>
              {/* Team A: seats 0, 1 */}
              {rowSeats.slice(0, 2).map((seat) => (
                <div key={seat.seatIndex} style={{ padding: '0 4px' }}>
                  <SeatCircle seat={seat} size={seatSize} onSeatClick={onSeatClick} />
                </div>
              ))}
              {/* Divider */}
              <div
                style={{
                  width: 2,
                  height: seatSize + 16,
                  backgroundColor: 'rgba(0, 200, 150, 0.35)',
                  borderRadius: 1,
                  margin: '0 6px',
                }}
              />
              {/* Team B: seats 2, 3, 4 */}
              {rowSeats.slice(2, 5).map((seat) => (
                <div key={seat.seatIndex} style={{ padding: '0 4px' }}>
                  <SeatCircle seat={seat} size={seatSize} onSeatClick={onSeatClick} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Chat 15: 3 rows of 5 (3×5 grid) ──
  if (layoutId === 'chat15') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '12px 8px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => (
          <div key={row} className="flex items-center justify-center" style={{ gap: 6 }}>
            {seats.slice(row * 5, (row + 1) * 5).map((seat) => (
              <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Default fallback: single row (for any seat count) ──
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 flex-wrap"
      style={{ padding: '16px 12px 8px', gap: 10 }}
    >
      {seats.map((seat) => (
        <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} />
      ))}
    </div>
  );
}

// ─── Three-Dots Menu Overlay ─────────────────────────────────────────────────

function ThreeDotsMenu({
  isOpen,
  onClose,
  isAdmin,
  isOwner,
  pendingRequests,
  onOpenSettings,
  onOpenSeatMgmt,
  onOpenRoomInfo,
  onOpenProfile,
  onShare,
  onToggleRoomMute,
  isRoomMuted,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  pendingRequests: number;
  onOpenSettings: () => void;
  onOpenSeatMgmt: () => void;
  onOpenRoomInfo: () => void;
  onOpenProfile: () => void;
  onShare: () => void;
  onToggleRoomMute: () => void;
  isRoomMuted: boolean;
}) {
  if (!isOpen) return null;

  const items = [
    { icon: Settings2, label: 'الإعدادات', action: onOpenSettings, show: isAdmin },
    { icon: PencilLine, label: 'تعديل الغرفة', action: onOpenRoomInfo, show: isOwner },
    { icon: Users, label: 'إدارة المقاعد', action: onOpenSeatMgmt, show: isAdmin, badge: pendingRequests },
    { icon: Shield, label: 'إدارة الأدوار', action: onOpenProfile, show: isAdmin },
    { icon: Volume2, label: isRoomMuted ? 'إلغاء كتم الغرفة' : 'كتم الغرفة', action: onToggleRoomMute, show: isAdmin, color: isRoomMuted ? TUI.colors.red : undefined },
    { icon: Share2, label: 'مشاركة', action: onShare, show: true },
    { icon: UserPlus, label: 'دعوة', action: () => {}, show: true },
    { icon: Sparkles, label: 'تأثيرات', action: () => {}, show: true },
    { icon: LogOut, label: 'خروج', action: onClose, show: true, color: TUI.colors.red },
  ];

  const visibleItems = items.filter(item => item.show);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      {/* Menu Panel */}
      <div
        className="absolute"
        style={{
          top: 48,
          right: 12,
          width: 200,
          backgroundColor: 'rgba(10, 107, 94, 0.98)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeInScale 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grid of icons (3 columns) */}
        <div className="grid grid-cols-3 gap-1 p-2">
          {visibleItems.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center justify-center py-2.5 px-1 rounded-lg bg-transparent border-none cursor-pointer touch-manipulation relative"
              style={{
                transition: TUI.anim.fast,
                gap: 4,
              }}
              aria-label={item.label}
            >
              <div
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: item.color ? `${item.color}20` : 'rgba(255,255,255,0.08)',
                }}
              >
                <item.icon size={18} style={{ color: item.color || TUI.colors.white }} />
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: TUI.colors.red,
                      fontSize: 10,
                      fontWeight: 700,
                      color: TUI.colors.white,
                      border: '2px solid rgba(10, 107, 94, 0.98)',
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className="truncate w-full text-center"
                style={{ fontSize: 10, color: item.color || TUI.colors.G6, lineHeight: '14px' }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
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

  /* ── Chat input state ── */
  const [chatInput, setChatInput] = useState('');

  /* ── End Live confirmation dialog (owner only) ── */
  const [showEndLiveDialog, setShowEndLiveDialog] = useState(false);

  /* ── Seat management sheet state ── */
  const [seatMgmtOpen, setSeatMgmtOpen] = useState(false);

  /* ── Room info sheet state ── */
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  /* ── Three-dots menu state ── */
  const [showDotsMenu, setShowDotsMenu] = useState(false);

  /* ── Mic layout ── */
  const micLayout = getMicLayout(vr.room.micTheme, vr.seats.length);

  /* ── Accept/Reject seat handlers ── */
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

  /* ── Toggle auto mode ── */
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

  /* ── Close handler ── */
  function handleClose() {
    if (isOwner) {
      setShowEndLiveDialog(true);
    } else {
      vr.handleLeaveRoom().then(() => onExit(true));
    }
  }

  /* ── End Live confirmed ── */
  async function handleEndLive() {
    setShowEndLiveDialog(false);
    await vr.handleLeaveRoom();
    onExit(true);
  }

  /* ── Kick duration confirmed ── */
  function handleKickDurationConfirm(minutes: number) {
    const targetUserId = vr.micMenuSheet.participant?.userId;
    if (targetUserId) vr.handleKickTemp(minutes, targetUserId);
    vr.setKickDialogOpen(false);
  }

  /* ── Copy link ── */
  function handleShare() {
    vr.handleCopyLink();
  }

  /* ── Audience list ── */
  const audienceList = vr.participants.filter(p => p.seatIndex < 0);

  /* ── Host participant ── */
  const hostParticipant = vr.participants.find(p => p.userId === vr.room.hostId);

  /* ── Bottom bar input ref ── */
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
    },
    [handleSendChat],
  );

  /* ── Teal-green gradient background (matching lobby & settings) ── */
  const bgGradient = 'linear-gradient(180deg, #0D8A7A 0%, #0A6B5E 30%, #074a42 100%)';

  /* ── Left side menu icon style (shared) ── */
  const menuBtnStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.06)',
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
        <Loader2 size={40} className="animate-spin mb-4" style={{ color: TUI.colors.white }} />
        <span style={{ fontSize: TUI.font.body14.size, color: TUI.colors.white }}>جاري تحميل الغرفة...</span>
      </div>
    );
  }

  return (
    <>
      <InjectStyles />

      {/* ═══════════════════════════════════════════════════════════════════════
          ROOT CONTAINER
          Background: teal-green gradient matching lobby & settings
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: bgGradient }}
        dir="rtl"
      >
        {/* ════════════════════════════════════════════════════════
            MAIN CONTENT LAYER (z-10)
            ════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col h-full">

          {/* ════════════════════════════════════════════
              HEADER
              Right (visual): back arrow + avatar+crown+name + "مستمع X"
              Left (visual): share + three-dots + power/exit
              ════════════════════════════════════════════ */}
          <header
            className="flex items-center justify-between flex-shrink-0"
            style={{
              height: 56,
              minHeight: 56,
              padding: '0 16px',
              backgroundColor: 'rgba(7, 74, 66, 0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* ── Back arrow ── */}
            <button
              onClick={handleClose}
              className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation flex-shrink-0"
              style={{
                width: 34,
                height: 34,
                minWidth: 44,
                minHeight: 44,
                backgroundColor: 'rgba(255,255,255,0.08)',
                transition: TUI.anim.fast,
              }}
              aria-label="رجوع"
            >
              <ArrowRight size={18} style={{ color: TUI.colors.white }} />
            </button>

            {/* ── Center: room avatar + crown + name + level badge + listener count ── */}
            <button
              type="button"
              onClick={() => setRoomInfoOpen(true)}
              className="flex items-center min-w-0 flex-1 gap-2.5 bg-transparent border-none cursor-pointer touch-manipulation justify-center"
              style={{ padding: 0 }}
              aria-label="معلومات الغرفة"
            >
              <div
                className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: vr.room.roomAvatar
                    ? 'transparent'
                    : getAvatarColorFromPalette(vr.room.id).bg,
                  border: '2px solid rgba(0, 200, 150, 0.5)',
                  boxShadow: '0 0 8px rgba(0, 200, 150, 0.2)',
                }}
              >
                {vr.room.roomAvatar ? (
                  <img src={vr.room.roomAvatar} alt={vr.room.name} className="w-full h-full object-cover rounded-full" draggable={false} loading="lazy" />
                ) : hostParticipant?.avatar ? (
                  <img src={hostParticipant.avatar} alt={hostParticipant.displayName || hostParticipant.username} className="w-full h-full object-cover rounded-full" draggable={false} loading="lazy" />
                ) : (
                  <span className="font-medium" style={{ fontSize: 13, color: getAvatarColorFromPalette(vr.room.id).text, lineHeight: 1 }}>
                    {(vr.room.name?.charAt(0) || hostParticipant?.displayName?.charAt(0) || '?')}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center min-w-0" style={{ gap: 1 }}>
                <div className="flex items-center min-w-0" style={{ gap: 4 }}>
                  <Crown size={13} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} className="flex-shrink-0" />
                  <span className="truncate font-bold" style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.white, maxWidth: 150 }}>
                    {vr.room.name}
                  </span>
                  {vr.room.roomLevel > 0 && (
                    <span
                      className="flex items-center gap-0.5 flex-shrink-0 px-1 rounded-full"
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: TUI.colors.gold,
                        backgroundColor: 'rgba(255, 215, 0, 0.12)',
                        padding: '1px 5px',
                        lineHeight: '14px',
                      }}
                    >
                      <Trophy size={9} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1.5} />
                      {vr.room.roomLevel}
                    </span>
                  )}
                </div>
                <span className="truncate" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', maxWidth: 180 }}>
                  {vr.listenerCount} مستمع
                </span>
              </div>
            </button>

            {/* ── Left (visual): share + three-dots + power ── */}
            <div className="flex items-center flex-shrink-0" style={{ gap: 6 }}>
              {/* Share */}
              <button
                onClick={handleShare}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{ width: 34, height: 34, minWidth: 44, minHeight: 44, backgroundColor: 'rgba(255,255,255,0.08)', transition: TUI.anim.fast }}
                aria-label="مشاركة"
              >
                <Share2 size={16} style={{ color: TUI.colors.white }} />
              </button>

              {/* Three dots menu */}
              <button
                onClick={() => setShowDotsMenu(prev => !prev)}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{ width: 34, height: 34, minWidth: 44, minHeight: 44, backgroundColor: 'rgba(255,255,255,0.08)', transition: TUI.anim.fast }}
                aria-label="القائمة"
              >
                <MoreVertical size={16} style={{ color: TUI.colors.white }} />
              </button>

              {/* Power / Exit */}
              <button
                onClick={handleClose}
                className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                style={{
                  width: 34, height: 34, minWidth: 44, minHeight: 44,
                  backgroundColor: isOwner ? 'rgba(252, 85, 85, 0.2)' : 'rgba(255,255,255,0.08)',
                  transition: TUI.anim.fast,
                }}
                aria-label={isOwner ? 'إنهاء الغرفة' : 'خروج'}
              >
                {isOwner ? <Power size={16} style={{ color: TUI.colors.red }} /> : <LogOut size={16} style={{ color: TUI.colors.white }} />}
              </button>
            </div>
          </header>

          {/* ════════════════════════════════════════════
              ANNOUNCEMENT BAR — subtle dark
              ════════════════════════════════════════════ */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 193, 7, 0.08)',
              gap: 8,
              borderBottom: '1px solid rgba(255, 193, 7, 0.1)',
            }}
          >
            <Megaphone size={14} style={{ color: TUI.colors.goldDark, flexShrink: 0 }} />
            <span
              className="flex-1 min-w-0 truncate"
              style={{ fontSize: 12, color: TUI.colors.goldDark, lineHeight: '18px' }}
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
                <Pencil size={12} style={{ color: TUI.colors.goldDark }} />
              </button>
            )}
          </div>

          {/* ════════════════════════════════════════════
              MIC SEAT AREA — layout based on micTheme
              ════════════════════════════════════════════ */}
          <MicSeatGrid
            seats={vr.seats}
            layoutId={micLayout.id}
            onSeatClick={vr.handleSeatClick}
          />

          {/* ════════════════════════════════════════════════════════
              AUDIENCE ROW — horizontal avatars below mic seats
              ════════════════════════════════════════════════════════ */}
          {audienceList.length > 0 && (
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ padding: '4px 16px', gap: 3 }}
            >
              {audienceList.slice(0, 8).map((p) => (
                <div
                  key={p.userId}
                  className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    border: '1.5px solid rgba(0, 200, 150, 0.3)',
                  }}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover rounded-full" draggable={false} loading="lazy" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center rounded-full"
                      style={{
                        backgroundColor: getAvatarColorFromPalette(p.userId).bg,
                        color: getAvatarColorFromPalette(p.userId).text,
                        fontSize: 8,
                        fontWeight: 600,
                      }}
                    >
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {audienceList.length > 8 && (
                <span
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    fontSize: 8,
                    fontWeight: 600,
                    color: TUI.colors.G6,
                  }}
                >
                  +{audienceList.length - 8}
                </span>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              CHAT PANEL
              ════════════════════════════════════════════ */}
          <ChatPanel
            messages={vr.chatMessages}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            participants={vr.participants}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />

          {/* ════════════════════════════════════════════
              LIKE ANIMATION (left side overlay)
              ════════════════════════════════════════════ */}
          <div
            className="absolute left-4 bottom-20 pointer-events-none"
            style={{ width: 80, height: 200, zIndex: 30 }}
          >
            <LikeAnimation active={likeActive} />
          </div>

          {/* ════════════════════════════════════════════
              GIFT ANIMATIONS (overlay)
              ════════════════════════════════════════════ */}
          <GiftAnimations activeAnimation={vr.activeGiftAnimation} />

          {/* ════════════════════════════════════════════
              BOTTOM BAR
              Left: Volume toggle (admin) + Mic toggle (on seat)
              Center: Chat text input pill
              Right: Like + Gift icon
              ════════════════════════════════════════════ */}
          <footer
            className="flex-shrink-0 w-full"
            style={{
              padding: '8px 12px',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
              backgroundColor: 'rgba(7, 74, 66, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center w-full" style={{ gap: 8 }}>

              {/* Volume toggle (admin only) */}
              {isAdmin && (
                <button
                  onClick={vr.handleToggleRoomMute}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    backgroundColor: vr.isRoomMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.08)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isRoomMuted ? 'الغرفة مكتومة' : 'كتم الغرفة'}
                >
                  {vr.isRoomMuted
                    ? <VolumeX size={18} style={{ color: TUI.colors.red }} />
                    : <Volume2 size={18} style={{ color: TUI.colors.white }} />}
                </button>
              )}

              {/* Mic toggle (when on seat) */}
              {vr.isOnSeat && (
                <button
                  onClick={vr.handleToggleMic}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    backgroundColor: vr.isMicMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(0, 200, 150, 0.15)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isMicMuted ? 'إلغاء الكتم' : 'كتم الميك'}
                >
                  {vr.isMicMuted
                    ? <MicOff size={18} style={{ color: TUI.colors.red }} />
                    : <Mic size={18} style={{ color: TUI.colors.tealLight }} />}
                </button>
              )}

              {/* Text input pill */}
              <div
                className="flex items-center flex-1 min-w-0"
                style={{
                  height: 38,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '9999px',
                  padding: '0 14px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    vr.isRoomMuted ? 'الغرفة مكتومة'
                    : !authUser ? 'سجل دخولك للمشاركة'
                    : 'اكتب شيئاً'
                  }
                  disabled={vr.isRoomMuted || !authUser}
                  maxLength={200}
                  dir="rtl"
                  className="flex-1 min-w-0 bg-transparent outline-none"
                  style={{ fontSize: 13, color: TUI.colors.white, caretColor: TUI.colors.tealLight }}
                />
                {chatInput.trim() && !vr.isRoomMuted && authUser && (
                  <button
                    onClick={() => { handleSendChat(); inputRef.current?.focus(); }}
                    className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{ width: 28, height: 28, color: TUI.colors.tealLight, transition: TUI.anim.fast }}
                    aria-label="إرسال"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>

              {/* Like button */}
              {authUser && (
                <button
                  onTouchStart={() => setLikeActive(true)}
                  onTouchEnd={() => setLikeActive(false)}
                  onMouseDown={() => setLikeActive(true)}
                  onMouseUp={() => setLikeActive(false)}
                  onMouseLeave={() => setLikeActive(false)}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    backgroundColor: 'rgba(255, 59, 48, 0.15)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="إعجاب"
                >
                  <Heart size={18} style={{ color: TUI.colors.likeRed }} fill={likeActive ? TUI.colors.likeRed : 'none'} />
                </button>
              )}

              {/* Gift icon */}
              {authUser && (
                <button
                  onClick={() => vr.setGiftSheetOpen(true)}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    background: 'linear-gradient(135deg, #00C896 0%, #0D8A7A 100%)',
                    transition: TUI.anim.fast,
                    boxShadow: '0 0 12px rgba(0, 200, 150, 0.3)',
                  }}
                  aria-label="إرسال هدية"
                >
                  <Gift size={18} fill={TUI.colors.white} style={{ color: TUI.colors.white }} />
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LEFT SIDE VERTICAL MENU — floating music + utility icons
            (Moved from right to left per user request)
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="fixed flex-col items-center"
          style={{
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            gap: 8,
          }}
        >
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="تشغيل">
            <Disc3 size={17} style={{ color: TUI.colors.tealLight }} />
          </button>
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="قائمة التشغيل">
            <ListMusic size={17} style={{ color: TUI.colors.white }} />
          </button>
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="موسيقى">
            <Music size={17} style={{ color: TUI.colors.white }} />
          </button>
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="مؤثرات صوتية">
            <Music2 size={17} style={{ color: TUI.colors.white }} />
          </button>
          <div style={{ width: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="كنز">
            <Crown size={17} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
          </button>
          <button className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation" style={menuBtnStyle} aria-label="أنشطة">
            <Trophy size={17} style={{ color: TUI.colors.goldDark }} />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            THREE-DOTS MENU OVERLAY
            ════════════════════════════════════════════════════════════════════ */}
        <ThreeDotsMenu
          isOpen={showDotsMenu}
          onClose={() => setShowDotsMenu(false)}
          isAdmin={isAdmin}
          isOwner={isOwner}
          pendingRequests={pendingSeatRequests}
          onOpenSettings={() => vr.setSettingsOpen(true)}
          onOpenSeatMgmt={() => setSeatMgmtOpen(true)}
          onOpenRoomInfo={() => setRoomInfoOpen(true)}
          onOpenProfile={() => {}}
          onShare={handleShare}
          onToggleRoomMute={vr.handleToggleRoomMute}
          isRoomMuted={vr.isRoomMuted}
        />

        {/* ════════════════════════════════════════════════════════════════════
            ALL SHEETS & DIALOGS (z-50)
            SettingsSheet and all others — EXACTLY unchanged
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
            // @ts-expect-error — pre-existing
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
          isOwner={isOwner}
          onUpdateAvatar={async (avatarBase64: string) => { await vr.handleUpdateSettings({ roomAvatar: avatarBase64 }); }}
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
            style={{ zIndex: 60, backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEndLiveDialog(false); }}
          >
            <div
              className="flex flex-col items-center w-[300px] p-6"
              style={{
                backgroundColor: '#0A6B5E',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                animation: TUI.anim.drawer,
              }}
            >
              <div className="flex items-center justify-center mb-4" style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(252, 85, 85, 0.15)' }}>
                <AlertTriangle size={24} style={{ color: TUI.colors.red }} />
              </div>
              <h3 className="mb-3 font-bold text-center" style={{ fontSize: TUI.font.title16.size, fontWeight: 600, color: TUI.colors.white }}>
                إنهاء الغرفة
              </h3>
              <p className="mb-6 text-center leading-relaxed" style={{ fontSize: TUI.font.body14.size, color: 'rgba(255,255,255,0.6)', lineHeight: '22px' }}>
                هل أنت متأكد من إنهاء الغرفة؟ سيتم إخراج جميع المشاركين.
              </p>
              <button
                onClick={handleEndLive}
                className="w-full mb-3 flex items-center justify-center cursor-pointer"
                style={{ height: 44, backgroundColor: TUI.colors.red, color: TUI.colors.white, borderRadius: 10, border: 'none', fontSize: TUI.font.title16.size, fontWeight: 600, transition: TUI.anim.fast }}
              >
                إنهاء
              </button>
              <button
                onClick={() => setShowEndLiveDialog(false)}
                className="w-full flex items-center justify-center cursor-pointer"
                style={{ height: 44, backgroundColor: 'rgba(255,255,255,0.08)', color: TUI.colors.white, borderRadius: 10, border: 'none', fontSize: TUI.font.title16.size, fontWeight: 500, transition: TUI.anim.fast }}
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
