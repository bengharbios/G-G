'use client';

/* ═══════════════════════════════════════════════════════════════════════
   RoomListView — Voice Room Lobby (TUILiveKit LiveListView exact design)

   Full-screen room list with:
   - Sticky header (48px): back arrow, title, create button
   - Search bar with icon
   - Horizontal category tabs
   - Room card list with join actions per room mode
   - Empty state with CTA
   - Create Room dialog trigger

   Responsive: 44px touch targets, fluid card sizing, responsive search
   ═══════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Plus,
  Search,
  Users,
  Mic,
  Lock,
} from 'lucide-react';
import {
  TUI,
  type VoiceRoom,
  type AuthUser,
  type RoomMode,
  getAvatarColor,
} from '../types';
import AudienceRow from './AudienceRow';
import CreateRoomDialog from './dialogs/CreateRoomDialog';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateRoomData {
  name: string;
  description: string;
  micSeatCount: number;
  roomMode: RoomMode;
  roomPassword: string;
  maxParticipants: number;
  isAutoMode: boolean;
  micTheme: string;
}

interface RoomListViewProps {
  onJoinRoom: (room: VoiceRoom) => void;
  onCreateRoom: (data: CreateRoomData) => void;
  authUser: AuthUser | null;
}

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'music', label: 'غنائية' },
  { id: 'education', label: 'تعليمية' },
  { id: 'games', label: 'ألعاب' },
  { id: 'general', label: 'عام' },
] as const;

// ─── Gradient Themes for Room Cover Placeholders ─────────────────────────────

const THEME_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #1C66E5 0%, #6C54E8 100%)',
  green: 'linear-gradient(135deg, #00C2A8 0%, #0099FF 100%)',
  orange: 'linear-gradient(135deg, #FF643D 0%, #f59e0b 100%)',
  pink: 'linear-gradient(135deg, #F23C5B 0%, #7B61FF 100%)',
  teal: 'linear-gradient(135deg, #00E5E5 0%, #1C66E5 100%)',
  red: 'linear-gradient(135deg, #FC5555 0%, #FF643D 100%)',
};

function getRoomGradient(theme: string): string {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.blue;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomListView({ onJoinRoom, onCreateRoom, authUser }: RoomListViewProps) {
  // ── State ──
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch rooms ──
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/voice-rooms?action=list');
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      }
    } catch {
      // silently fail — rooms will remain empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    pollRef.current = setInterval(fetchRooms, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRooms]);

  // ── Filter rooms ──
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !searchQuery.trim() ||
      room.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesSearch;
  });

  // ── Handlers ──
  const handleBack = () => {
    window.location.href = '/';
  };

  const handleCreate = (data: {
    name: string;
    description: string;
    micSeatCount: number;
    roomMode: RoomMode;
    roomPassword: string;
    maxParticipants: number;
    isAutoMode: boolean;
    roomImage?: string;
  }) => {
    onCreateRoom({
      ...data,
      micTheme: data.roomImage || 'blue',
    });
    setShowCreateDialog(false);
  };

  const handleJoin = (room: VoiceRoom) => {
    onJoinRoom(room);
  };

  // ── Render ──
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: TUI.colors.G1 }}
      dir="rtl"
    >
      {/* ══════════════════════════════════════════════════════════════
          HEADER (sticky top, 48px)
          ══════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4"
        style={{
          height: 48,
          backgroundColor: TUI.colors.G1,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Back — 44px touch target */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-11 h-11 -ml-1.5 rounded-full transition-colors hover:bg-white/10 touch-manipulation"
          style={{ color: TUI.colors.white }}
          aria-label="العودة"
        >
          <ArrowRight size={22} />
        </button>

        {/* Title */}
        <h1
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            fontSize: 'clamp(18px, 5vw, 20px)',
            fontWeight: 700,
            color: TUI.colors.white,
          }}
        >
          غرف الصوت
        </h1>

        {/* Create Room Button — 44px touch target */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center justify-center rounded-full transition-transform active:scale-95 hover:brightness-110 touch-manipulation"
          style={{
            width: 44,
            height: 44,
            backgroundColor: TUI.colors.B1,
            color: TUI.colors.white,
          }}
          aria-label="إنشاء غرفة"
        >
          <Plus size={22} />
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          SEARCH BAR
          ══════════════════════════════════════════════════════════════ */}
      <div className="px-3 sm:px-4 mt-3 mb-2">
        <div
          className="flex items-center gap-2 px-3"
          style={{
            height: 40,
            backgroundColor: '#1F2024',
            borderRadius: 8,
          }}
        >
          <Search size={16} style={{ color: TUI.colors.G5, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن غرفة..."
            className="flex-1 bg-transparent outline-none text-sm touch-manipulation"
            style={{
              color: TUI.colors.white,
              caretColor: TUI.colors.B1,
              fontSize: 'clamp(13px, 3.5vw, 14px)',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CATEGORY TABS
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center gap-5 overflow-x-auto pb-2 px-3 sm:px-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="relative flex-shrink-0 py-1.5 transition-colors touch-manipulation"
              style={{
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? TUI.colors.white : TUI.colors.G5,
                borderBottom: isActive
                  ? `2px solid ${TUI.colors.B1}`
                  : '2px solid transparent',
                minHeight: 44,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROOM LIST
          ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-3 sm:px-4 mt-2 pb-6 overflow-y-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: TUI.colors.G4, borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: TUI.colors.bgInput }}
            >
              <Mic size={28} style={{ color: TUI.colors.G5 }} />
            </div>
            <p style={{ fontSize: 14, color: TUI.colors.G5 }}>
              لا توجد غرف صوتية حالياً
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium transition-transform active:scale-95 touch-manipulation"
              style={{ backgroundColor: TUI.colors.B1, fontSize: 14, minHeight: 44 }}
            >
              <Plus size={16} />
              أنشئ غرفتك الأولى
            </button>
          </div>
        )}

        {/* Room Cards */}
        {!loading && filteredRooms.length > 0 && (
          <div className="flex flex-col gap-2">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CREATE ROOM DIALOG
          ══════════════════════════════════════════════════════════════ */}
      <CreateRoomDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
        authUser={authUser}
      />
    </div>
  );
}

// ─── Room Card Sub-Component ──────────────────────────────────────────────────

function RoomCard({ room, onJoin }: { room: VoiceRoom; onJoin: (room: VoiceRoom) => void }) {
  const isPublic = room.roomMode === 'public';
  const isKey = room.roomMode === 'key';
  const isPrivate = room.roomMode === 'private';

  // Generate fake participants for AudienceRow display (from participantCount)
  const fakeParticipants = Array.from({ length: Math.min(room.participantCount || 1, 8) }, (_, i) => ({
    avatar: '',
    userId: `p${i}`,
  }));

  return (
    <div
      className="flex items-center gap-3 p-3 sm:p-4 rounded-[12px] transition-all cursor-pointer touch-manipulation"
      style={{
        backgroundColor: TUI.colors.G2,
      }}
      onClick={() => onJoin(room)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.05)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.filter = 'none';
      }}
    >
      {/* ── Cover Image / Gradient (responsive) ── */}
      <div
        className="flex-shrink-0 rounded-[8px] overflow-hidden"
        style={{ width: 'clamp(48px, 14vw, 60px)', height: 'clamp(48px, 14vw, 60px)' }}
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
            <Mic size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Room Name */}
        <p
          className="truncate"
          style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: 600,
            color: TUI.colors.white,
          }}
        >
          {room.name}
        </p>

        {/* Host Name */}
        <p style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: TUI.colors.G5 }}>
          بواسطة {room.hostName}
        </p>

        {/* Bottom row: participants + mics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" style={{ fontSize: 'clamp(10px, 2.8vw, 11px)', color: TUI.colors.G5 }}>
            <Users size={12} />
            <span>{room.participantCount || 0}</span>
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: 'clamp(10px, 2.8vw, 11px)', color: TUI.colors.G5 }}>
            <Mic size={12} />
            <span>{room.micSeatCount}</span>
          </div>
          <AudienceRow participants={fakeParticipants} max={3} />
        </div>
      </div>

      {/* ── Join Button (44px min touch target) ── */}
      <div className="flex-shrink-0 flex items-center">
        {isPublic && (
          <button
            className="flex items-center justify-center rounded-[16px] text-white transition-transform active:scale-95 hover:brightness-110 touch-manipulation"
            style={{
              minWidth: 60,
              height: 44,
              minHeight: 44,
              paddingHorizontal: 'clamp(12px, 3vw, 16px)',
              backgroundColor: TUI.colors.B1,
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: 700,
            }}
          >
            انضمام
          </button>
        )}
        {isKey && (
          <button
            className="flex items-center justify-center gap-1 rounded-[16px] transition-transform active:scale-95 hover:bg-white/5 touch-manipulation"
            style={{
              minWidth: 60,
              height: 44,
              minHeight: 44,
              paddingHorizontal: 'clamp(12px, 3vw, 16px)',
              backgroundColor: 'transparent',
              border: `1px solid ${TUI.colors.G3}`,
              color: TUI.colors.G7,
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: 700,
            }}
          >
            <Lock size={12} />
            انضمام
          </button>
        )}
        {isPrivate && (
          <button
            className="flex items-center justify-center rounded-[16px] cursor-not-allowed"
            style={{
              minWidth: 70,
              height: 44,
              minHeight: 44,
              paddingHorizontal: 'clamp(12px, 3vw, 16px)',
              backgroundColor: 'transparent',
              border: `1px solid ${TUI.colors.G3}`,
              color: TUI.colors.G3,
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: 600,
            }}
            disabled
          >
            دعوة فقط
          </button>
        )}
      </div>
    </div>
  );
}
