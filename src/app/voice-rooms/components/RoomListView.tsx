'use client';

/* ═══════════════════════════════════════════════════════════════════════
   RoomListView — Voice Room Lobby (Yalla Ludo–style design)

   Full-screen room list with:
   - Teal-green gradient background + diamond pattern overlay
   - Header: avatar+shield | 3 tabs (اكتشف / رائج / غرفي) | search
   - "إنشاء غرفتي" create button
   - Sub-tabs: مؤخراً / منضم / متابَع (pill-shaped)
   - Scrollable room cards with image, name, host, participants, badge
   - Fixed bottom nav (Events, Battle, Chat, Social) with badges
   - Empty state with illustration + CTA
   ═══════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  Plus,
  Users,
  Swords,
  MessageCircle,
  Gift,
  ChevronLeft,
  Crown,
  Mic,
  Lock,
  Eye,
  Shield,
  Headphones,
  Star,
} from 'lucide-react';
import {
  TUI,
  type VoiceRoom,
  type AuthUser,
  type RoomMode,
  getAvatarColorFromPalette,
} from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomListViewProps {
  rooms: VoiceRoom[];
  onRoomClick: (room: VoiceRoom) => void;
  onCreateRoom: () => void;
  authUser: AuthUser | null;
  loading: boolean;
}

// ─── Main Tabs ───────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: 'explore', label: 'اكتشف' },
  { id: 'hot', label: 'رائج' },
  { id: 'mine', label: 'غرفي' },
] as const;

type MainTab = (typeof MAIN_TABS)[number]['id'];

// ─── Sub Tabs (visible on "غرفي" main tab) ───────────────────────────────────

const SUB_TABS = [
  { id: 'recent', label: 'مؤخراً' },
  { id: 'joined', label: 'منضم' },
  { id: 'following', label: 'متابَع' },
] as const;

type SubTab = (typeof SUB_TABS)[number]['id'];

// ─── Room theme gradients ─────────────────────────────────────────────────────

const THEME_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #1C66E5 0%, #6C54E8 100%)',
  green: 'linear-gradient(135deg, #00C2A8 0%, #0099FF 100%)',
  orange: 'linear-gradient(135deg, #FF643D 0%, #f59e0b 100%)',
  pink: 'linear-gradient(135deg, #F23C5B 0%, #7B61FF 100%)',
  teal: 'linear-gradient(135deg, #00E5E5 0%, #1C66E5 100%)',
  red: 'linear-gradient(135deg, #FC5555 0%, #FF643D 100%)',
  gold: 'linear-gradient(135deg, #F59E0B 0%, #FFD700 100%)',
};

function getRoomGradient(theme: string): string {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.teal;
}

// ─── Bottom Nav Items ─────────────────────────────────────────────────────────

const BOTTOM_NAV = [
  { id: 'events', label: 'فعاليات', icon: Headphones, badge: 3 },
  { id: 'battle', label: 'تحدي', icon: Swords, badge: 0 },
  { id: 'chat', label: 'محادثة', icon: MessageCircle, badge: 5 },
  { id: 'social', label: 'اجتماعي', icon: Gift, badge: 12 },
] as const;

// ─── Diamond pattern SVG (inline for no external deps) ───────────────────────

function DiamondPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.04 }}
    >
      <defs>
        <pattern id="diamondPattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 0 L32 16 L16 32 L0 16 Z" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diamondPattern)" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomListView({
  rooms,
  onRoomClick,
  onCreateRoom,
  authUser,
  loading,
}: RoomListViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>('explore');
  const [subTab, setSubTab] = useState<SubTab>('recent');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Show sub-tabs only when on "غرفي" ──
  const showSubTabs = mainTab === 'mine';

  // ── Filter rooms by main tab ──
  // For 'explore' show all, 'hot' show rooms with >10 participants, 'mine' show based on subTab
  const displayRooms = rooms.filter((room) => {
    if (mainTab === 'explore') return true;
    if (mainTab === 'hot') return (room.participantCount || 0) > 10;
    // 'mine' — all rooms (in a real app would filter by user history)
    return true;
  });

  // ── Avatar palette for user ──
  const avatarPalette = authUser
    ? getAvatarColorFromPalette(authUser.id)
    : { bg: '#E0F7FA', text: '#0D8A7A' };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      dir="rtl"
      style={{
        background: `linear-gradient(180deg, ${TUI.colors.teal} 0%, ${TUI.colors.tealDark} 40%, #074a42 100%)`,
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      {/* ═══ Diamond Pattern Overlay ═══ */}
      <DiamondPattern />

      {/* ══════════════════════════════════════════════════════════════
          HEADER — Avatar+Shield | Tabs | Search
          ══════════════════════════════════════════════════════════════ */}
      <header
        className="relative z-10 flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* ── Top Row: Avatar | Search ── */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          {/* User Avatar + Shield Badge */}
          <div className="relative flex-shrink-0">
            <div
              className="flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: 42,
                height: 42,
                border: `2px solid ${TUI.colors.gold}`,
              }}
            >
              {authUser?.avatar ? (
                <img
                  src={authUser.avatar}
                  alt={authUser.displayName || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: avatarPalette.bg, color: avatarPalette.text }}
                >
                  {(authUser?.displayName || 'م')[0]}
                </div>
              )}
            </div>
            {/* Shield / VIP badge */}
            {authUser?.vipLevel && authUser.vipLevel > 0 ? (
              <div
                className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: TUI.colors.gold,
                  border: `2px solid ${TUI.colors.teal}`,
                }}
              >
                <Crown size={10} style={{ color: TUI.colors.tealDark }} />
              </div>
            ) : (
              <div
                className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: TUI.colors.tealLight,
                  border: `2px solid ${TUI.colors.teal}`,
                }}
              >
                <Shield size={9} style={{ color: TUI.colors.white }} />
              </div>
            )}
          </div>

          {/* Search Icon */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors active:scale-95"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: TUI.colors.white,
            }}
            aria-label="بحث"
          >
            <Search size={20} />
          </button>
        </div>

        {/* ── Main Tabs: اكتشف | رائج | غرفي ── */}
        <div className="flex items-center justify-center gap-1 px-4 pb-1">
          {MAIN_TABS.map((tab) => {
            const isActive = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className="relative flex-shrink-0 px-4 py-2 transition-colors"
                style={{
                  fontSize: 'clamp(14px, 3.8vw, 16px)',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? TUI.colors.white : 'rgba(255,255,255,0.6)',
                  minHeight: 44,
                }}
              >
                {tab.label}
                {/* Active underline */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: 32,
                      height: 3,
                      backgroundColor: TUI.colors.tealLight,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          CREATE ROOM BUTTON
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 px-4 pt-2 pb-1">
        <button
          onClick={onCreateRoom}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${TUI.colors.tealLight} 0%, ${TUI.colors.teal} 100%)`,
            color: TUI.colors.white,
            fontSize: 'clamp(14px, 3.8vw, 16px)',
            fontWeight: 700,
            boxShadow: `0 4px 15px rgba(0, 200, 150, 0.3)`,
            minHeight: 48,
          }}
        >
          <Plus size={20} strokeWidth={3} />
          <span>إنشاء غرفتي</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUB-TABS (pill-shaped, shown on "غرفي" only)
          ══════════════════════════════════════════════════════════════ */}
      {showSubTabs && (
        <div className="relative z-10 flex items-center justify-center gap-2 px-4 py-2">
          {SUB_TABS.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className="flex-shrink-0 px-5 py-1.5 rounded-full transition-all active:scale-95"
                style={{
                  fontSize: 'clamp(12px, 3.2vw, 13px)',
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive
                    ? TUI.colors.tealLight
                    : 'rgba(255,255,255,0.12)',
                  color: TUI.colors.white,
                  minHeight: 36,
                  boxShadow: isActive ? `0 2px 10px rgba(0, 200, 150, 0.25)` : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ROOM LIST (scrollable area)
          ══════════════════════════════════════════════════════════════ */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-3 pt-2"
        style={{ paddingBottom: 80 }}
      >
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
              style={{
                borderColor: 'rgba(255,255,255,0.2)',
                borderTopColor: TUI.colors.tealLight,
                borderWidth: 3,
              }}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && displayRooms.length === 0 && (
          <EmptyState onCreateRoom={onCreateRoom} mainTab={mainTab} />
        )}

        {/* Room Cards */}
        {!loading && displayRooms.length > 0 && (
          <div className="flex flex-col gap-3">
            {displayRooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={() => onRoomClick(room)} />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM NAV BAR (fixed)
          ══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around"
        style={{
          height: 64,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'linear-gradient(180deg, rgba(10,107,94,0.95) 0%, rgba(7,74,66,0.98) 100%)',
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const hasBadge = item.badge > 0;
          return (
            <button
              key={item.id}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-transform active:scale-95"
              style={{ minHeight: 64 }}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
                {hasBadge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 flex items-center justify-center rounded-full text-white"
                    style={{
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      backgroundColor: TUI.colors.red,
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: '16px',
                    }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, onClick }: { room: VoiceRoom; onClick: () => void }) {
  const modeConfig: Record<RoomMode, { icon: typeof Mic; label: string; color: string }> = {
    public: { icon: Eye, label: 'عام', color: TUI.colors.tealLight },
    key: { icon: Lock, label: 'بسر', color: TUI.colors.gold },
    private: { icon: Star, label: 'خاص', color: TUI.colors.purple },
  };

  const mode = modeConfig[room.roomMode] || modeConfig.public;
  const ModeIcon = mode.icon;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: 80,
      }}
      onClick={onClick}
    >
      {/* ── Room Cover ── */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden relative"
        style={{ width: 64, height: 64 }}
      >
        {room.roomImage ? (
          <img
            src={room.roomImage}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: getRoomGradient(room.micTheme) }}
          >
            <Mic size={22} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
        )}
        {/* Live indicator dot */}
        <div
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: TUI.colors.green,
            boxShadow: `0 0 6px ${TUI.colors.green}`,
          }}
        />
      </div>

      {/* ── Room Info ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Room Name */}
        <p
          className="truncate"
          style={{
            fontSize: 'clamp(13px, 3.6vw, 15px)',
            fontWeight: 600,
            color: TUI.colors.white,
          }}
        >
          {room.name}
        </p>

        {/* Host + Mode badge */}
        <div className="flex items-center gap-2">
          <span
            className="truncate"
            style={{
              fontSize: 'clamp(11px, 2.8vw, 12px)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {room.hostName}
          </span>
          {/* Mode pill */}
          <span
            className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: mode.color,
              backgroundColor: `${mode.color}20`,
            }}
          >
            <ModeIcon size={9} />
            {mode.label}
          </span>
        </div>

        {/* Participants */}
        <div
          className="flex items-center gap-1"
          style={{
            fontSize: 'clamp(10px, 2.6vw, 11px)',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <Users size={12} />
          <span>{room.participantCount || 0} / {room.maxParticipants || 200}</span>
        </div>
      </div>

      {/* ── Join arrow ── */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <ChevronLeft size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onCreateRoom,
  mainTab,
}: {
  onCreateRoom: () => void;
  mainTab: string;
}) {
  const isMine = mainTab === 'mine';

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 px-6">
      {/* Illustration: empty room icon */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 120,
          height: 120,
        }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px dashed rgba(255,255,255,0.15)`,
          }}
        />
        {/* Inner circle with icon */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {isMine ? (
            <Mic size={36} style={{ color: 'rgba(255,255,255,0.3)' }} />
          ) : (
            <Headphones size={36} style={{ color: 'rgba(255,255,255,0.3)' }} />
          )}
        </div>
      </div>

      {/* Text */}
      <p
        className="text-center"
        style={{
          fontSize: 'clamp(14px, 3.8vw, 16px)',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.8,
        }}
      >
        {isMine ? 'لم تزر أي غرفة مؤخراً' : 'لا توجد غرف صوتية حالياً'}
      </p>

      <p
        className="text-center"
        style={{
          fontSize: 'clamp(12px, 3.2vw, 13px)',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        {isMine
          ? 'ابدأ باستكشاف الغرف المتاحة وابقَ على اطلاع'
          : 'كن أول من ينشئ غرفة وابدأ المحادثة'}
      </p>

      {/* CTA Button */}
      <button
        onClick={onCreateRoom}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-bold transition-all active:scale-95 mt-2"
        style={{
          backgroundColor: TUI.colors.orange,
          fontSize: 'clamp(14px, 3.8vw, 16px)',
          boxShadow: `0 4px 15px rgba(255, 152, 0, 0.35)`,
          minHeight: 48,
        }}
      >
        <Search size={18} />
        {isMine ? 'ابحث عن غرف' : 'أنشئ غرفتك الأولى'}
      </button>
    </div>
  );
}
