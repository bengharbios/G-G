'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Users, Lock, EyeOff, Crown, Radio, Hash, Mic, Volume2,
} from 'lucide-react';
import CreateRoomDialog from './dialogs/CreateRoomDialog';
import { DESIGN_TOKENS } from '../types';
import type { VoiceRoom, AuthUser, RoomMode } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoomListViewProps {
  onJoinRoom: (room: VoiceRoom) => void;
  onCreateRoom: (data: {
    name: string; description: string; micSeatCount: number;
    roomMode: RoomMode; roomPassword: string; maxParticipants: number;
    isAutoMode: boolean; micTheme: string;
  }) => void;
  authUser: AuthUser | null;
}

// ─── Filter pill definitions ─────────────────────────────────────────────────

const FILTER_PILLS: { key: RoomMode | 'all'; label: string; icon: typeof Radio }[] = [
  { key: 'all', label: 'الكل', icon: Hash },
  { key: 'public', label: 'العامة', icon: Radio },
  { key: 'key', label: 'بكلمة سر', icon: Lock },
  { key: 'private', label: 'الخاصة', icon: EyeOff },
];

// ─── Mode badge config ───────────────────────────────────────────────────────

const MODE_BADGE: Record<RoomMode, { bg: string; text: string; border: string; label: string }> = {
  public: {
    bg: 'rgba(34,197,94,0.15)',
    text: DESIGN_TOKENS.colors.accent.success,
    border: 'rgba(34,197,94,0.35)',
    label: 'عام',
  },
  key: {
    bg: 'rgba(245,158,11,0.15)',
    text: DESIGN_TOKENS.colors.accent.warning,
    border: 'rgba(245,158,11,0.35)',
    label: 'بكلمة سر',
  },
  private: {
    bg: 'rgba(108,99,255,0.15)',
    text: '#a78bfa',
    border: 'rgba(108,99,255,0.35)',
    label: 'خاص',
  },
};

// ─── Animations ──────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomListView({ onJoinRoom, onCreateRoom, authUser }: RoomListViewProps) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [myRoom, setMyRoom] = useState<VoiceRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoomMode | 'all'>('all');

  const hasRoom = !!myRoom;

  // ── Fetch rooms ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/voice-rooms');
        const data = await res.json();
        if (!cancelled && data.success) {
          setRooms(data.rooms || []);
          setMyRoom(data.myRoom || null);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Filtered rooms ──
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesFilter = activeFilter === 'all' || r.roomMode === activeFilter;
      const matchesSearch = searchQuery.trim() === ''
        || r.name.includes(searchQuery.trim())
        || (r.hostName || '').includes(searchQuery.trim())
        || (r.description || '').includes(searchQuery.trim());
      return matchesFilter && matchesSearch;
    });
  }, [rooms, activeFilter, searchQuery]);

  // ── Color tokens shortcut ──
  const c = DESIGN_TOKENS.colors;

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ backgroundColor: c.bg.primary }}
    >
      {/* ═══════ HEADER ═══════ */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4"
        style={{
          height: '48px',
          backgroundColor: c.bg.secondary,
          borderBottom: `1px solid ${c.stroke.primary}`,
        }}
      >
        {/* Right side (RTL) — Title */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: '32px',
              height: '32px',
              background: `linear-gradient(135deg, ${c.accent.primary}, #a78bfa)`,
            }}
          >
            <Radio className="w-4 h-4 text-white" />
          </div>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: DESIGN_TOKENS.typography.lg,
              color: c.text.primary,
            }}
          >
            غرف صوتية
          </h1>
        </div>

        {/* Left side — User info */}
        {authUser && (
          <button className="flex items-center gap-2 group">
            <span
              className="text-sm font-medium group-hover:opacity-80 transition-opacity"
              style={{ color: c.text.secondary }}
            >
              {authUser.displayName}
            </span>
            <div className="relative">
              {authUser.avatar ? (
                <img
                  src={authUser.avatar}
                  alt={authUser.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[rgba(108,99,255,0.4)] transition-all"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: c.accent.primary }}
                >
                  {(authUser.displayName || '?').charAt(0)}
                </div>
              )}
            </div>
          </button>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: '48px' }} />

      {/* ═══════ SEARCH / FILTER BAR ═══════ */}
      <div
        className="sticky top-[48px] z-40 px-4 py-3"
        style={{
          backgroundColor: c.bg.primary,
          borderBottom: `1px solid ${c.stroke.primary}`,
        }}
      >
        {/* Search input */}
        <div className="relative mb-3">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: '16px', height: '16px', color: c.text.tertiary }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن غرفة..."
            className="w-full pr-10 pl-4 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-[rgba(108,99,255,0.4)]"
            style={{
              backgroundColor: c.bg.tertiary,
              border: `1px solid ${c.stroke.primary}`,
              color: c.text.primary,
            }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isActive = activeFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: isActive ? c.accent.primary : c.bg.tertiary,
                  color: isActive ? '#ffffff' : c.text.secondary,
                  border: `1px solid ${isActive ? 'transparent' : c.stroke.primary}`,
                }}
              >
                <Icon className="w-3 h-3" />
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      <main className="flex-1 px-4 py-4 pb-24">

        {/* ── My pinned room ── */}
        {hasRoom && (
          <div className="mb-4">
            <p
              className="text-[10px] font-semibold mb-2 px-1"
              style={{ color: c.text.tertiary }}
            >
              غرفتي
            </p>
            <motion.button
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => onJoinRoom(myRoom!)}
              className="w-full rounded-xl overflow-hidden text-right transition-all"
              style={{
                backgroundColor: c.bg.secondary,
                border: `2px solid ${c.stroke.primary}`,
              }}
            >
              {/* Cover */}
              <div className="relative h-36 overflow-hidden">
                {myRoom.roomImage ? (
                  <img src={myRoom.roomImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, rgba(108,99,255,0.3), rgba(167,139,250,0.1))`,
                    }}
                  />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #111827, transparent 60%)' }} />

                {/* Live badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: 'rgba(34,197,94,0.15)',
                      color: c.accent.success,
                      border: `1px solid rgba(34,197,94,0.35)`,
                    }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full animate-live-pulse"
                      style={{ backgroundColor: c.accent.live }}
                    />
                    مباشر
                  </span>
                </div>

                {/* Level badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <div
                    className="flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
                  >
                    <Crown className="w-3 h-3" style={{ color: c.accent.warning }} />
                    <span className="text-[9px] font-bold" style={{ color: c.accent.warning }}>
                      LV {myRoom.roomLevel || 1}
                    </span>
                  </div>
                </div>

                {/* Participant count */}
                <div
                  className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px]"
                  style={{ color: c.text.secondary }}
                >
                  <Users className="w-3 h-3" />
                  <span>{myRoom.participantCount || 0}</span>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3">
                <h3
                  className="text-[15px] font-bold truncate mb-0.5 transition-colors"
                  style={{ color: c.text.primary }}
                >
                  {myRoom.name}
                </h3>
                <p className="text-xs truncate" style={{ color: c.text.tertiary }}>
                  {myRoom.description || 'بدون وصف'}
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: c.accent.primary, borderTopColor: 'transparent' }} />
          </div>
        ) : rooms.length === 0 && !hasRoom ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: c.bg.tertiary }}
            >
              <Volume2 className="w-10 h-10" style={{ color: c.text.tertiary }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: c.text.secondary }}>
              لا توجد غرف حالياً
            </p>
            <p className="text-sm mb-5" style={{ color: c.text.tertiary }}>
              كن أول من ينشئ غرفة صوتية!
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                backgroundColor: c.accent.primary,
                boxShadow: DESIGN_TOKENS.shadow.glow,
              }}
            >
              <Plus className="w-4 h-4" />
              إنشاء غرفة جديدة
            </motion.button>
          </div>
        ) : filteredRooms.length === 0 ? (
          /* ── No matching results ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-10 h-10 mb-4" style={{ color: c.text.tertiary }} />
            <p className="text-sm" style={{ color: c.text.tertiary }}>
              لا توجد نتائج مطابقة
            </p>
          </div>
        ) : (
          /* ── Room grid ── */
          <>
            {!hasRoom && (
              <p
                className="text-[10px] font-semibold mb-3 px-1"
                style={{ color: c.text.tertiary }}
              >
                الغرف المتاحة
              </p>
            )}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredRooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  onJoin={onJoinRoom}
                />
              ))}
            </motion.div>
          </>
        )}
      </main>

      {/* ═══════ CREATE ROOM FAB ═══════ */}
      {!loading && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-6 left-6 z-50 flex items-center justify-center rounded-full text-white shadow-lg transition-shadow"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: c.accent.primary,
            boxShadow: `0 4px 24px rgba(108,99,255,0.45), ${DESIGN_TOKENS.shadow.glow}`,
          }}
          aria-label="إنشاء غرفة جديدة"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* ═══════ DIALOGS ═══════ */}
      <CreateRoomDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={onCreateRoom}
      />
    </div>
  );
}

// ─── Room Card Sub-component ──────────────────────────────────────────────────

function RoomCard({
  room,
  index,
  onJoin,
}: {
  room: VoiceRoom;
  index: number;
  onJoin: (room: VoiceRoom) => void;
}) {
  const c = DESIGN_TOKENS.colors;
  const badge = MODE_BADGE[room.roomMode || 'public'];

  return (
    <motion.button
      custom={index}
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onJoin(room)}
      className="w-full rounded-xl overflow-hidden text-right group"
      style={{
        backgroundColor: c.bg.secondary,
        border: `1px solid ${c.stroke.primary}`,
        transition: `border-color ${DESIGN_TOKENS.animation.normal}, box-shadow ${DESIGN_TOKENS.animation.normal}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.stroke.secondary;
        e.currentTarget.style.boxShadow = c.shadow.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = c.stroke.primary;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* ── Cover area (16:9) ── */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {room.roomImage ? (
          <img
            src={room.roomImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${c.bg.tertiary}, ${c.bg.secondary})`,
            }}
          >
            <Mic className="w-8 h-8" style={{ color: c.text.tertiary }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(17,24,39,0.95) 0%, rgba(17,24,39,0.4) 50%, transparent 100%)',
          }}
        />

        {/* Live indicator dot */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <span
              className="block w-2 h-2 rounded-full animate-live-pulse"
              style={{ backgroundColor: c.accent.live }}
            />
            <span className="text-[9px] font-semibold text-white">LIVE</span>
          </div>
        </div>

        {/* Participant count — top-left */}
        <div className="absolute top-2 left-2">
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <Users className="w-3 h-3" />
            <span className="font-medium">{room.participantCount || 0}</span>
          </div>
        </div>

        {/* Room name — overlay bottom */}
        <div className="absolute bottom-2 right-2 left-2">
          <h3
            className="text-[13px] font-semibold text-white truncate leading-tight"
            title={room.name}
          >
            {room.name}
          </h3>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Host row */}
        <div className="flex items-center gap-1.5">
          {room.hostId ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white"
              style={{ backgroundColor: c.accent.primary }}
            >
              {(room.hostName || '?').charAt(0)}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: c.bg.tertiary }}
            />
          )}
          <span
            className="text-[11px] truncate"
            style={{ color: c.text.secondary }}
          >
            {room.hostName || 'مجهول'}
          </span>
        </div>

        {/* Bottom row: mode badge + mic count */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium"
            style={{
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
            }}
          >
            {badge.label}
          </span>

          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: c.text.tertiary }}>
            <Mic className="w-3 h-3" />
            <span>{room.micSeatCount}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
