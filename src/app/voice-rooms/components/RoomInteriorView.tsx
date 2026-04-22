'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Loader2, X, ArrowRight, Share2,
  Crown, Volume2, VolumeX, Mic, MicOff, Gift, Send,
  Megaphone, Pencil,
  Lock, MoreVertical, Users, Settings2, Shield,
  PencilLine, Sparkles,
  UserPlus, LogOut, Heart, AlertTriangle,
  MessageSquare, UserCog, Trophy, LogIn, Minimize2, MoreHorizontal,
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
   RoomInteriorView — TUILiveKit Room Interior (Improved Match)

   Structure (h-screen flex flex-col relative):
     ├── Background (teal-green: #0D8A7A → #0A6B5E → #074a42)
     ├── z-10 flex flex-col h-full
     │   ├── Header (room avatar+name+Lv | audience avatars | close+⋮)
     │   ├── Announcement bar
     │   ├── Mic Seat Area (5 layout patterns with number badges, names, glow)
     │   ├── Audience Row (stacked avatars with +N badge)
     │   ├── ChatPanel (floating transparent messages)
     │   ├── LikeAnimation (left side)
     │   ├── GiftAnimations (overlay)
     │   └── Bottom Bar (chat pill | ❤️ like | 🎁 gift | 🔊 mic/speaker)
     ├── LEFT SIDE MENU (3 music/function buttons — clean minimal style)
     ├── Three-Dots Menu (overlay, 3-column icon grid)
     └── All sheets/dialogs (SettingsSheet LOCKED)
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
        @keyframes seatRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes giftShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

/* ── Role-based border colors for occupied seats ── */
function getSeatBorderColor(role: RoomRole, isSpeaking: boolean): string {
  if (isSpeaking) return TUI.colors.tealLight;
  switch (role) {
    case 'owner': return TUI.colors.gold;
    case 'coowner': return '#a78bfa';
    case 'admin': return '#60a5fa';
    default: return TUI.colors.tealLight;
  }
}

function getSeatGlow(role: RoomRole, isSpeaking: boolean): string {
  if (isSpeaking) return '0 0 16px rgba(0,200,150,0.55), 0 0 32px rgba(0,200,150,0.25), inset 0 0 10px rgba(0,200,150,0.12)';
  switch (role) {
    case 'owner': return '0 0 12px rgba(255,215,0,0.4), 0 0 24px rgba(255,215,0,0.15)';
    case 'coowner': return '0 0 10px rgba(167,139,250,0.35), 0 0 20px rgba(167,139,250,0.12)';
    case 'admin': return '0 0 10px rgba(96,165,250,0.35), 0 0 20px rgba(96,165,250,0.12)';
    default: return '0 0 10px rgba(0,200,150,0.3), 0 0 20px rgba(0,200,150,0.1)';
  }
}

/* ── Seat Circle — TUILiveKit exact mic seat with number badge, name label, glow ── */
function SeatCircle({
  seat,
  size = 50,
  onSeatClick,
}: {
  seat: SeatData;
  size?: number;
  onSeatClick: (idx: number) => void;
}) {
  const isLocked = !seat.participant && seat.status === 'locked';
  const isEmpty = !seat.participant && !isLocked;
  const isOccupied = !!seat.participant;
  const isSpeaking = isOccupied && !seat.participant!.isMuted && !seat.participant!.micFrozen;
  const seatRole = isOccupied ? seat.participant!.role : 'visitor';
  const innerSize = size - 6;
  const fontSize = size <= 46 ? 10 : size <= 50 ? 11 : 12;

  return (
    <button
      type="button"
      onClick={() => onSeatClick(seat.seatIndex)}
      className="flex flex-col items-center touch-manipulation bg-transparent border-none cursor-pointer group"
      style={{ gap: 2, minWidth: size + 2, minHeight: size + 28 }}
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
          backgroundColor: isEmpty ? 'rgba(255,255,255,0.06)' : isLocked ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: isOccupied
            ? `2.5px solid ${getSeatBorderColor(seatRole, isSpeaking)}`
            : isLocked
              ? '2px dashed rgba(255,255,255,0.15)'
              : '2px solid rgba(255,255,255,0.08)',
          boxShadow: isOccupied
            ? getSeatGlow(seatRole, isSpeaking)
            : 'none',
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
        }}
        onMouseEnter={(e) => { if (isOccupied) { e.currentTarget.style.transform = 'scale(1.06)'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {/* ── Seat Number Badge (top-left) ── */}
        <span
          className="absolute flex items-center justify-center rounded-full pointer-events-none select-none"
          style={{
            top: -4,
            left: -4,
            width: 17,
            height: 17,
            background: isOccupied
              ? ['linear-gradient(135deg, ', getSeatBorderColor(seatRole, false), ', ', TUI.colors.tealDark, ')'].join('')
              : 'rgba(255,255,255,0.12)',
            fontSize: 9,
            fontWeight: 700,
            color: isOccupied ? TUI.colors.white : 'rgba(255,255,255,0.5)',
            zIndex: 3,
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            border: isOccupied ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
          }}
        >
          {seat.seatIndex + 1}
        </span>

        {/* Locked state */}
        {isLocked && (
          <Lock size={size * 0.35} style={{ color: 'rgba(255,255,255,0.3)' }} strokeWidth={1.5} />
        )}

        {/* Empty state */}
        {isEmpty && (
          <Mic size={size * 0.35} style={{ color: 'rgba(255,255,255,0.18)' }} strokeWidth={1.5} />
        )}

        {/* Occupied — avatar */}
        {isOccupied && seat.participant && (
          <>
            {/* Speaking ripple ring */}
            {isSpeaking && (
              <>
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -5,
                    border: `2px solid ${TUI.colors.tealLight}`,
                    opacity: 0.6,
                    animation: 'seatRipple 1.5s ease-out infinite',
                  }}
                />
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -5,
                    border: `2px solid ${TUI.colors.tealLight}`,
                    opacity: 0.6,
                    animation: 'seatRipple 1.5s ease-out 0.75s infinite',
                  }}
                />
              </>
            )}

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
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  backgroundColor: TUI.colors.red,
                  zIndex: 2,
                  boxShadow: '0 1px 6px rgba(252,85,85,0.5)',
                  border: '2px solid rgba(10,14,39,0.9)',
                }}
              >
                <MicOff size={9} color="#fff" strokeWidth={2.5} />
              </span>
            )}

            {/* Owner crown */}
            {seat.participant.role === 'owner' && (
              <span
                className="absolute flex items-center justify-center"
                style={{ top: -4, right: -4, width: 18, height: 18, zIndex: 2 }}
              >
                <Crown size={15} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
              </span>
            )}

            {/* Admin badge */}
            {seat.participant.role === 'admin' && !isSpeaking && (
              <span
                className="absolute flex items-center justify-center"
                style={{ top: -4, right: -4, width: 16, height: 16, zIndex: 2, backgroundColor: 'rgba(96,165,250,0.9)', borderRadius: '50%', border: '1.5px solid rgba(10,14,39,0.9)' }}
              >
                <Shield size={9} fill="#fff" stroke="#fff" strokeWidth={2} />
              </span>
            )}
          </>
        )}
      </div>

      {/* Name label below seat */}
      <span
        className="text-center leading-tight select-none"
        style={{
          maxWidth: size + 10,
          fontSize,
          color: isOccupied ? (isSpeaking ? TUI.colors.tealLight : TUI.colors.G7) : 'transparent',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          height: fontSize + 2,
          fontWeight: isSpeaking ? 600 : 400,
        }}
      >
        {isOccupied ? (seat.participant!.displayName.length > 6 ? seat.participant!.displayName.slice(0, 6) + '…' : seat.participant!.displayName) : '\u00A0'}
      </span>

      {/* Speaking bars (only when speaking, replaces name) */}
      {isSpeaking && <SpeakingBars active={true} />}
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
  // NOTE: All seats rendered sequentially — owner moves like everyone else
  if (layoutId === 'broadcast5') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 16px 8px', gap: 14 }}
      >
        {/* Top row: seat 0 */}
        <div className="flex items-center justify-center">
          <SeatCircle seat={seats[0]} size={seatSize + 6} onSeatClick={onSeatClick} />
        </div>
        {/* Bottom row: seats 1-4 */}
        <div className="flex items-center justify-center" style={{ gap: 10 }}>
          {seats.slice(1).map((seat) => (
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

  /* ── Exit menu state (share/exit dropdown) ── */
  const [showExitMenu, setShowExitMenu] = useState(false);

  /* ── Seat management sheet state ── */
  const [seatMgmtOpen, setSeatMgmtOpen] = useState(false);

  /* ── Room info sheet state ── */
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  /* ── Three-dots menu state ── */
  const [showDotsMenu, setShowDotsMenu] = useState(false);

  /* ── Gift recipient preselection ── */
  const [giftRecipient, setGiftRecipient] = useState<{ type: 'everyone' | 'mic' | 'specific'; userId?: string; displayName?: string } | null>(null);

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
  function handleGiftSend(giftId: string, quantity: number, recipient?: { type: 'everyone' | 'mic' | 'specific'; userId?: string }) {
    // Pass recipient display name for better notification text
    const recipientName = giftRecipient?.displayName;
    if (recipient?.type === 'specific' && recipient.userId) {
      vr.handleSendGift(giftId, 'specific', quantity, recipient.userId, recipientName);
    } else if (recipient?.type === 'mic') {
      vr.handleSendGift(giftId, 'everyone', quantity);
    } else {
      vr.handleSendGift(giftId, 'everyone', quantity);
    }
    vr.setGiftSheetOpen(false);
    setGiftRecipient(null);
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

  /* ── Background: use roomImage if set, otherwise teal-green gradient ── */
  const bgStyle: React.CSSProperties = room.roomImage
    ? {
        backgroundImage: `url(${room.roomImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: 'linear-gradient(180deg, #0D8A7A 0%, #0A6B5E 30%, #074a42 100%)' };

  // Overlay to ensure text readability over background images
  const bgOverlay = room.roomImage
    ? 'rgba(0,0,0,0.35)'
    : 'transparent';

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
        style={{ ...bgStyle }}
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
          Background: teal-green gradient (matching lobby & WAFA Ludo design)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{ ...bgStyle }}>
        {/* Dark overlay for readability when background image is set */}
        {room.roomImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: bgOverlay, zIndex: 1 }}
          />
        )}
        {/* ════════════════════════════════════════════════════════
            MAIN CONTENT LAYER (z-10)
            ════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col h-full" style={room.roomImage ? { zIndex: 2 } : undefined}>

          {/* ════════════════════════════════════════════
              HEADER — Room name + ID + Share/Exit buttons
              ════════════════════════════════════════════ */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{
              padding: '8px 12px 0',
              backgroundColor: 'rgba(7, 74, 66, 0.4)',
            }}
          >
            {/* ── Top Row: Room info + Action buttons ── */}
            <div className="flex items-center justify-between">
              {/* Right: Room name + ID */}
              <button
                type="button"
                onClick={() => setRoomInfoOpen(true)}
                className="flex flex-col items-start min-w-0 bg-transparent border-none cursor-pointer touch-manipulation"
                style={{ gap: 0, flex: 1 }}
                aria-label="معلومات الغرفة"
              >
                <span
                  className="truncate"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: TUI.colors.white,
                    maxWidth: 180,
                    lineHeight: '20px',
                  }}
                >
                  {vr.room.name}
                </span>
                <span
                  className="truncate"
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.45)',
                    maxWidth: 150,
                    lineHeight: '14px',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                >
                  ID: {vr.room.id.slice(0, 10)}
                </span>
              </button>

              {/* Left: Settings (admin) + Share + Exit buttons */}
              <div className="flex items-center flex-shrink-0" style={{ gap: 6 }}>
                {/* Settings button — admin/owner only, opens three-dots menu */}
                {isAdmin && (
                  <button
                    onClick={() => setShowDotsMenu(true)}
                    className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="الإعدادات"
                  >
                    <Settings2 size={16} style={{ color: TUI.colors.white }} />
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
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="مشاركة الغرفة"
                >
                  <Share2 size={16} style={{ color: TUI.colors.white }} />
                </button>

                {/* Exit button with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExitMenu(prev => !prev)}
                    className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="خروج"
                  >
                    {isOwner
                      ? <X size={16} style={{ color: TUI.colors.red }} strokeWidth={2.5} />
                      : <LogIn size={16} style={{ color: TUI.colors.white }} />
                    }
                  </button>

                  {/* Exit dropdown menu */}
                  {showExitMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExitMenu(false)}
                      />
                      <div
                        className="absolute z-50 flex flex-col"
                        style={{
                          top: 40,
                          left: 0,
                          backgroundColor: 'rgba(10, 40, 36, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: '4px 0',
                          minWidth: 150,
                          backdropFilter: 'blur(16px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                      >
                        {/* Minimize / Keep room alive */}
                        <button
                          onClick={() => {
                            setShowExitMenu(false);
                            // Minimize room — hide view but keep room running
                            // DO NOT call handleLeaveRoom — just signal minimize
                            onExit(false);
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer touch-manipulation w-full"
                          style={{ transition: TUI.anim.fast }}
                        >
                          <Minimize2 size={15} style={{ color: TUI.colors.G6 }} />
                          <span style={{ fontSize: 12, color: TUI.colors.white }}>
                            تصغير الغرفة
                          </span>
                        </button>
                        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 12px' }} />
                        {/* Leave and close room */}
                        <button
                          onClick={() => {
                            setShowExitMenu(false);
                            handleClose();
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer touch-manipulation w-full"
                          style={{ transition: TUI.anim.fast }}
                        >
                          <LogOut size={15} style={{ color: TUI.colors.red }} />
                          <span style={{ fontSize: 12, color: TUI.colors.red }}>
                            {isOwner ? 'إنهاء البث' : 'مغادرة الغرفة'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              INFO ROW — Trophy/club + Online avatars + Count
              ════════════════════════════════════════════ */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              padding: '6px 12px 4px',
              gap: 10,
              backgroundColor: 'rgba(7, 74, 66, 0.25)',
            }}
          >
            {/* ── Left: Trophy — Member Club weekly gems ── */}
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 10px 4px 6px',
              }}
            >
              <Trophy size={14} fill="#f59e0b" stroke="#f59e0b" />
              <span style={{ fontSize: 10, fontWeight: 600, color: TUI.colors.gold }}>
                {vr.weeklyGems > 0 ? vr.weeklyGems.toLocaleString() : '0'}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>💎</span>
            </div>

            {/* ── Center: Online avatars (overlapping, no names) ── */}
            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
              <div
                className="flex items-center"
                style={{ marginRight: -6 }}
              >
                {vr.participants.length > 0 ? (
                  vr.participants.slice(0, 8).map((p, i) => (
                    <div
                      key={p.userId}
                      className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        marginLeft: i > 0 ? -6 : 0,
                        border: '1.5px solid rgba(7, 74, 66, 0.9)',
                        zIndex: 8 - i,
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
                          {p.displayName.charAt(0)}
                        </div>
                      )}
                      {/* Owner crown badge */}
                      {p.role === 'owner' && (
                        <div
                          className="absolute flex items-center justify-center"
                          style={{
                            top: -4,
                            right: -4,
                            width: 12,
                            height: 12,
                            backgroundColor: '#a78bfa',
                            borderRadius: '50%',
                            border: '1.5px solid rgba(7, 74, 66, 0.9)',
                          }}
                        >
                          <Crown size={7} fill="#fff" stroke="#fff" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Users size={10} style={{ color: TUI.colors.G5 }} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Online count badge ── */}
            <div
              className="flex items-center gap-1 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 10px',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: TUI.colors.white,
                  lineHeight: '14px',
                }}
              >
                {vr.participants.length}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                متواجد
              </span>
            </div>
          </div>

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
              BOTTOM BAR — TUILiveKit: chat input | like | gift | speaker
              ════════════════════════════════════════════ */}
          <footer
            className="flex-shrink-0 w-full"
            style={{
              padding: '6px 10px',
              paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))',
              backgroundColor: 'rgba(7, 74, 66, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center w-full" style={{ gap: 6 }}>

              {/* Chat text input (pill) */}
              <div
                className="flex items-center flex-1 min-w-0"
                style={{
                  height: 36,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: '9999px',
                  padding: '0 14px',
                  border: '1px solid rgba(255,255,255,0.05)',
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
                    : 'اكتب رسالة...'
                  }
                  disabled={vr.isRoomMuted || !authUser}
                  maxLength={200}
                  dir="rtl"
                  className="flex-1 min-w-0 bg-transparent outline-none"
                  style={{ fontSize: 12, color: TUI.colors.white, caretColor: 'rgba(255,255,255,0.6)' }}
                />
                {chatInput.trim() && !vr.isRoomMuted && authUser && (
                  <button
                    onClick={() => { handleSendChat(); inputRef.current?.focus(); }}
                    className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.7)', transition: TUI.anim.fast }}
                    aria-label="إرسال"
                  >
                    <Send size={13} />
                  </button>
                )}
              </div>

              {/* Like / Heart button */}
              {authUser && (
                <button
                  onTouchStart={() => setLikeActive(true)}
                  onTouchEnd={() => setLikeActive(false)}
                  onMouseDown={() => setLikeActive(true)}
                  onMouseUp={() => setLikeActive(false)}
                  onMouseLeave={() => setLikeActive(false)}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation relative"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    transition: TUI.anim.fast,
                  }}
                  aria-label="إعجاب"
                >
                  <Heart
                    size={22}
                    fill={likeActive ? TUI.colors.likeRed : 'none'}
                    style={{
                      color: likeActive ? TUI.colors.likeRed : 'rgba(255,255,255,0.55)',
                      transform: likeActive ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease, fill 0.15s ease',
                      filter: likeActive ? 'drop-shadow(0 0 6px rgba(255,59,48,0.5))' : 'none',
                    }}
                  />
                </button>
              )}

              {/* Gift button (golden glow with badge) */}
              {authUser && (
                <button
                  onClick={() => vr.setGiftSheetOpen(true)}
                  className="rounded-[10px] flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation relative overflow-hidden"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)',
                    backgroundSize: '200% 200%',
                    boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
                    transition: TUI.anim.fast,
                    animation: 'giftShimmer 3s ease-in-out infinite',
                  }}
                  aria-label="إرسال هدية"
                >
                  <Gift size={18} fill={TUI.colors.white} style={{ color: TUI.colors.white, zIndex: 1, position: 'relative' }} />
                  {/* Unread gifts count badge */}
                  {vr.topGifts.length > 0 && (
                    <span
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        top: -4,
                        right: -4,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        backgroundColor: TUI.colors.red,
                        fontSize: 9,
                        fontWeight: 700,
                        color: TUI.colors.white,
                        boxShadow: `0 0 6px ${TUI.colors.red}`,
                        border: '2px solid rgba(7, 74, 66, 0.9)',
                        zIndex: 2,
                      }}
                    >
                      {vr.topGifts.length > 9 ? '9+' : vr.topGifts.length}
                    </span>
                  )}
                </button>
              )}

              {/* Speaker / Volume (admin) or Mic toggle (non-admin on seat) */}
              {isAdmin ? (
                <button
                  onClick={vr.handleToggleRoomMute}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 36, height: 36, minWidth: 44, minHeight: 44,
                    backgroundColor: vr.isRoomMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.07)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isRoomMuted ? 'إلغاء كتم الغرفة' : 'كتم الغرفة'}
                >
                  {vr.isRoomMuted
                    ? <VolumeX size={17} style={{ color: TUI.colors.red }} />
                    : <Volume2 size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />}
                </button>
              ) : vr.isOnSeat ? (
                <button
                  onClick={vr.handleToggleMic}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 36, height: 36, minWidth: 44, minHeight: 44,
                    backgroundColor: vr.isMicMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.07)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={vr.isMicMuted ? 'إلغاء الكتم' : 'كتم الميك'}
                >
                  {vr.isMicMuted
                    ? <MicOff size={17} style={{ color: TUI.colors.red }} />
                    : <Mic size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />}
                </button>
              ) : null}
            </div>
          </footer>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LEFT SIDE VERTICAL MENU — TUILiveKit-style floating function buttons
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="fixed flex-col items-center"
          style={{
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            gap: 8,
          }}
        >
          {/* Chat / Messages */}
          <button
            className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none"
            onClick={() => inputRef.current?.focus()}
            aria-label="الرسائل"
          >
            <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
              <MessageSquare size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>
          </button>

          {/* Seat Management (admin only) */}
          {isAdmin && (
            <button
              className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none relative"
              onClick={() => setSeatMgmtOpen(true)}
              aria-label="إدارة المقاعد"
            >
              <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
                <UserCog size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>
              {pendingSeatRequests > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                  style={{ width: 14, height: 14, backgroundColor: TUI.colors.red, fontSize: 8, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(10,14,39,0.9)' }}
                >
                  {pendingSeatRequests > 9 ? '9' : pendingSeatRequests}
                </span>
              )}
            </button>
          )}

          {/* Share */}
          <button
            className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none"
            onClick={handleShare}
            aria-label="مشاركة"
          >
            <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
              <Share2 size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>
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
            key={giftRecipient?.userId || 'default'}
            isOpen={vr.giftSheetOpen}
            onClose={() => { vr.setGiftSheetOpen(false); setGiftRecipient(null); }}
            onSendGift={handleGiftSend}
            gems={vr.myGemsBalance}
            preselectedRecipient={giftRecipient}
            micParticipants={vr.participants.filter(p => p.userId !== authUser?.id).map(p => ({
              userId: p.userId,
              displayName: p.displayName,
              avatar: p.avatar,
            }))}
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
          onGiftClick={() => {
            const targetUser = vr.profileSheet;
            setGiftRecipient({
              type: 'specific',
              userId: targetUser?.userId,
              displayName: targetUser?.displayName,
            });
            vr.setProfileSheet(null);
            setTimeout(() => vr.setGiftSheetOpen(true), 300);
          }}
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
