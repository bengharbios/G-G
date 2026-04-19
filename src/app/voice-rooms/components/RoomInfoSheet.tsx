'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Heart,
  Sparkles,
  ArrowLeft,
  Crown,
  Shield,
  Star,
  User,
} from 'lucide-react';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RoomInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    name: string;
    description: string;
    hostId: string;
    hostName: string;
    roomLevel: number;
    roomImage: string;
    micSeatCount: number;
    maxParticipants: number;
    joinPrice: number;
    isAutoMode: boolean;
    roomMode: string;
  };
  participantCount: number;
  weeklyGems: number;
  onJoin: () => void;
  onFollow: (isFollowing: boolean) => void;
  isFollowing: boolean;
  isJoined: boolean;
  members: Array<{
    userId: string;
    displayName: string;
    avatar: string;
    role: string;
    joinedAt: string;
  }>;
  topGifts: Array<{
    id: string;
    giftName: string;
    giftEmoji: string;
    senderName: string;
    senderAvatar: string;
    receiverName: string;
    receiverAvatar: string;
    gems: number;
    createdAt: string;
  }>;
  userGems: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  return `منذ ${days} أيام`;
}

const roleOrder: Record<string, number> = {
  owner: 0,
  coowner: 1,
  admin: 2,
  member: 3,
  visitor: 4,
};

const roleConfig: Record<
  string,
  { label: string; color: string; Icon: typeof Crown }
> = {
  owner: { label: 'المالك', color: '#f59e0b', Icon: Crown },
  coowner: { label: 'النائب', color: '#f97316', Icon: Star },
  admin: { label: 'مشرف', color: '#3b82f6', Icon: Shield },
  member: { label: 'عضو', color: '#a78bfa', Icon: User },
};

const tabs = [
  { key: 'info', label: 'معلومات' },
  { key: 'members', label: 'الأعضاء' },
  { key: 'moments', label: 'اللحظات' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RoomInfoSheet({
  isOpen,
  onClose,
  room,
  participantCount,
  weeklyGems,
  onJoin,
  onFollow,
  isFollowing,
  isJoined,
  members,
  topGifts,
  userGems,
}: RoomInfoSheetProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const sortedMembers = [...members]
    .filter((m) => m.role !== 'visitor')
    .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  const sortedGifts = [...topGifts].sort((a, b) => b.gems - a.gems);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────── */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Sheet ─────────────────────────────────────────────── */}
          <motion.div
            dir="rtl"
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl"
            style={{ backgroundColor: '#0d0f1a', maxHeight: '85vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* ── Handle bar ──────────────────────────────────────── */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#5a6080]/40" />
            </div>

            {/* ── Room image banner ───────────────────────────────── */}
            <div className="relative mx-4 mt-2 h-36 w-auto overflow-hidden rounded-2xl">
              <Image
                src={room.roomImage}
                alt={room.name}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 100vw, 480px"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f1a]/90 via-transparent to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                aria-label="إغلاق"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Room level badge */}
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,99,255,0.25)', color: '#a78bfa' }}
              >
                <Star className="h-3.5 w-3.5" />
                <span>مستوى {room.roomLevel}</span>
              </div>
            </div>

            {/* ── Room info header ────────────────────────────────── */}
            <div className="px-5 pt-3 pb-2">
              <h2
                className="text-xl font-bold leading-tight"
                style={{ color: '#f0f0f8' }}
              >
                {room.name}
              </h2>
              {room.description && (
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ color: '#9ca3c4' }}
                >
                  {room.description}
                </p>
              )}
            </div>

            {/* ── Tab bar ─────────────────────────────────────────── */}
            <div
              className="relative flex border-b"
              style={{ borderColor: 'rgba(90,96,128,0.2)' }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative flex flex-1 items-center justify-center py-3 text-sm font-semibold transition-colors"
                    style={{ color: isActive ? '#a78bfa' : '#5a6080' }}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                        style={{ backgroundColor: '#6c63ff' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content (scrollable) ────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <TabInfo
                    key="info"
                    room={room}
                    participantCount={participantCount}
                    weeklyGems={weeklyGems}
                  />
                )}
                {activeTab === 'members' && (
                  <TabMembers key="members" sortedMembers={sortedMembers} />
                )}
                {activeTab === 'moments' && (
                  <TabMoments key="moments" sortedGifts={sortedGifts} />
                )}
              </AnimatePresence>
            </div>

            {/* ── Bottom action buttons ───────────────────────────── */}
            <div className="flex gap-3 border-t px-5 py-4" style={{ borderColor: 'rgba(90,96,128,0.2)' }}>
              {/* Follow button */}
              <button
                onClick={() => onFollow(!isFollowing)}
                className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  isFollowing
                    ? 'bg-[rgba(239,68,68,0.12)] text-red-400'
                    : 'bg-[rgba(239,68,68,0.15)] text-red-400 hover:bg-[rgba(239,68,68,0.25)]'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isFollowing ? 'fill-red-400' : ''}`}
                  style={{ color: '#ef4444' }}
                />
                {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
              </button>

              {/* Join button */}
              <button
                onClick={onJoin}
                disabled={isJoined}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                  isJoined
                    ? 'bg-[rgba(90,96,128,0.15)] text-[#5a6080]'
                    : 'bg-[rgba(108,99,255,0.2)] text-white hover:bg-[rgba(108,99,255,0.35)]'
                }`}
              >
                {isJoined ? (
                  <>
                    <Users className="h-4 w-4" />
                    تم الانضمام
                  </>
                ) : room.joinPrice > 0 ? (
                  <>
                    <Sparkles className="h-4 w-4" style={{ color: '#a78bfa' }} />
                    انضمام ({room.joinPrice} 💎)
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" style={{ color: '#a78bfa' }} />
                    انضمام
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Tab: Info ───────────────────────────────────────────────────────────────

function TabInfo({
  room,
  participantCount,
  weeklyGems,
}: {
  room: RoomInfoSheetProps['room'];
  participantCount: number;
  weeklyGems: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 px-5 py-4"
    >
      {/* Host */}
      <div
        className="flex items-center gap-3 rounded-xl p-3"
        style={{ backgroundColor: 'rgba(24,28,46,0.6)' }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
        >
          <Crown className="h-5 w-5" style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: '#5a6080' }}>
            صاحب الغرفة
          </p>
          <p className="text-sm font-semibold" style={{ color: '#f0f0f8' }}>
            {room.hostName}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Participants */}
        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ backgroundColor: 'rgba(24,28,46,0.6)' }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(108,99,255,0.15)' }}
          >
            <Users className="h-5 w-5" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#5a6080' }}>
              المشاركون
            </p>
            <p className="text-sm font-bold" style={{ color: '#f0f0f8' }}>
              {participantCount}
            </p>
          </div>
        </div>

        {/* Weekly gems */}
        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ backgroundColor: 'rgba(24,28,46,0.6)' }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
          >
            <Trophy className="h-5 w-5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: '#5a6080' }}>
              جواهر أسبوعية
            </p>
            <p className="text-sm font-bold" style={{ color: '#f0f0f8' }}>
              {weeklyGems.toLocaleString('ar-SA')} 💎
            </p>
          </div>
        </div>
      </div>

      {/* Room details */}
      <div
        className="rounded-xl p-3"
        style={{ backgroundColor: 'rgba(24,28,46,0.6)' }}
      >
        <div className="space-y-2.5">
          <InfoRow label="عدد المقاعد" value={`${room.micSeatCount} مقعد`} />
          <InfoRow
            label="الحد الأقصى"
            value={`${room.maxParticipants} مشارك`}
          />
          <InfoRow
            label="نوع الغرفة"
            value={room.isAutoMode ? 'تلقائي' : 'يدوي'}
          />
          <InfoRow label="وضع الغرفة" value={room.roomMode} />
          {room.joinPrice > 0 ? (
            <InfoRow
              label="رسوم الانضمام"
              value={`${room.joinPrice} 💎`}
            />
          ) : (
            <InfoRow label="رسوم الانضمام" value="مجاني" valueColor="#22c55e" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: '#9ca3c4' }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: valueColor ?? '#f0f0f8' }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Tab: Members ────────────────────────────────────────────────────────────

function TabMembers({
  sortedMembers,
}: {
  sortedMembers: RoomInfoSheetProps['members'];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-2 px-5 py-4"
    >
      {/* Members count header */}
      <div className="mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" style={{ color: '#5a6080' }} />
        <span className="text-xs font-medium" style={{ color: '#5a6080' }}>
          {sortedMembers.length} عضو
        </span>
      </div>

      {sortedMembers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-10"
          style={{ backgroundColor: 'rgba(24,28,46,0.4)' }}
        >
          <Users className="mb-2 h-8 w-8" style={{ color: '#5a6080' }} />
          <p className="text-sm" style={{ color: '#5a6080' }}>
            لا يوجد أعضاء بعد
          </p>
        </div>
      ) : (
        sortedMembers.map((member) => {
          const config = roleConfig[member.role];
          if (!config) return null;
          const { label, color, Icon } = config;

          return (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors"
              style={{ backgroundColor: 'rgba(24,28,46,0.5)' }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Image
                  src={member.avatar}
                  alt={member.displayName}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
                {/* Role icon overlay */}
                <div
                  className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#0d0f1a' }}
                >
                  <Icon className="h-3 w-3" style={{ color }} />
                </div>
              </div>

              {/* Name & role */}
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: '#f0f0f8' }}
                >
                  {member.displayName}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                    }}
                  >
                    {label}
                  </span>
                  <span className="text-[11px]" style={{ color: '#5a6080' }}>
                    {daysSince(member.joinedAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}

// ─── Tab: Moments (Top Gifts) ────────────────────────────────────────────────

function TabMoments({
  sortedGifts,
}: {
  sortedGifts: RoomInfoSheetProps['topGifts'];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-2 px-5 py-4"
    >
      {/* Gifts header */}
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: '#f59e0b' }} />
        <span className="text-xs font-medium" style={{ color: '#5a6080' }}>
          أجمل اللحظات
        </span>
      </div>

      {sortedGifts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-10"
          style={{ backgroundColor: 'rgba(24,28,46,0.4)' }}
        >
          <Sparkles className="mb-2 h-8 w-8" style={{ color: '#5a6080' }} />
          <p className="text-sm" style={{ color: '#5a6080' }}>
            لا توجد لحظات بعد
          </p>
        </div>
      ) : (
        sortedGifts.map((gift, index) => (
          <div
            key={gift.id}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: 'rgba(24,28,46,0.5)' }}
          >
            {/* Rank */}
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor:
                  index === 0
                    ? 'rgba(245,158,11,0.2)'
                    : index === 1
                      ? 'rgba(192,192,192,0.2)'
                      : index === 2
                        ? 'rgba(205,127,50,0.2)'
                        : 'rgba(90,96,128,0.15)',
                color:
                  index === 0
                    ? '#f59e0b'
                    : index === 1
                      ? '#c0c0c0'
                      : index === 2
                        ? '#cd7f32'
                        : '#5a6080',
              }}
            >
              {index + 1}
            </div>

            {/* Gift emoji */}
            <span className="flex-shrink-0 text-2xl">{gift.giftEmoji}</span>

            {/* Gift name & flow */}
            <div className="flex-1 min-w-0">
              <p
                className="truncate text-xs font-semibold"
                style={{ color: '#f0f0f8' }}
              >
                {gift.giftName}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Image
                  src={gift.senderAvatar}
                  alt={gift.senderName}
                  width={16}
                  height={16}
                  className="rounded-full object-cover"
                />
                <span
                  className="max-w-[70px] truncate text-[11px]"
                  style={{ color: '#9ca3c4' }}
                >
                  {gift.senderName}
                </span>
                <ArrowLeft className="h-3 w-3 flex-shrink-0" style={{ color: '#5a6080' }} />
                <Image
                  src={gift.receiverAvatar}
                  alt={gift.receiverName}
                  width={16}
                  height={16}
                  className="rounded-full object-cover"
                />
                <span
                  className="max-w-[70px] truncate text-[11px]"
                  style={{ color: '#9ca3c4' }}
                >
                  {gift.receiverName}
                </span>
              </div>
            </div>

            {/* Gems */}
            <div
              className="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
            >
              <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>
                {gift.gems.toLocaleString('ar-SA')}
              </span>
              <span className="text-[10px]">💎</span>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}
