'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, MicOff, Gift, Lock, Volume2,
  X, Loader2, Send, Settings,
  Users, Key, Globe, EyeOff, Ban,
  UserMinus, Unlock, ImageIcon,
  VolumeX, Link2, Timer, Home, User, Store, Trophy
} from 'lucide-react';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteBottomNav from '@/components/shared/SiteBottomNav';
import RoomInfoSheet from './components/RoomInfoSheet';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  vipLevel?: number;
}

type RoomRole = 'owner' | 'coowner' | 'admin' | 'member' | 'visitor';
type SeatStatus = 'open' | 'locked' | 'request' | 'reserved';
type RoomMode = 'public' | 'key' | 'private';

interface VoiceRoom {
  id: string; name: string; description: string; hostId: string; hostName: string;
  maxParticipants: number; isPrivate: boolean; micSeatCount: number;
  roomMode: RoomMode; roomPassword: string;
  roomLevel: number; micTheme: string; bgmEnabled: boolean; chatMuted: boolean;
  announcement: string; giftSplit: number; isAutoMode: boolean;
  lockedSeats: number[];
  participantCount?: number; createdAt: string;
  roomImage?: string;
}

interface VoiceRoomParticipant {
  id: string; roomId: string; userId: string; username: string; displayName: string;
  avatar: string; isMuted: boolean; micFrozen: boolean; role: RoomRole;
  seatIndex: number; seatStatus: SeatStatus; vipLevel: number; joinedAt: string;
  pendingRole?: string;
  pendingMicInvite?: number;
}

interface Gift {
  id: string; name: string; nameAr: string; emoji: string; price: number;
}

interface RoomTemplate {
  id: string; userId: string; name: string; description: string;
  micSeatCount: number; roomMode: string; roomPassword: string;
  maxParticipants: number; isAutoMode: boolean; micTheme: string;
  allowedRoles: string[]; updatedAt: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isGift?: boolean;
}

interface SeatData {
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  status: SeatStatus;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

const ROLE_LEVELS: Record<RoomRole, number> = {
  owner: 5, coowner: 4, admin: 3, member: 2, visitor: 1,
};

const ROLE_LABELS: Record<RoomRole, string> = {
  owner: 'المالك', coowner: 'النائب', admin: 'إدارة', member: 'عضو', visitor: 'زائر',
};

const ROLE_COLORS: Record<RoomRole, string> = {
  owner: '#f59e0b',
  coowner: '#a78bfa',
  admin: '#60a5fa',
  member: '#22c55e',
  visitor: '#94a3b8',
};

const ROLE_PILL_BG: Record<RoomRole, string> = {
  owner: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  coowner: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
  admin: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  member: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
  visitor: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
};

const DEFAULT_GIFTS: Gift[] = [
  { id: 'g1', name: 'Rose', nameAr: 'ورد', emoji: '🌹', price: 3 },
  { id: 'g2', name: 'Star', nameAr: 'نجمة', emoji: '⭐', price: 9 },
  { id: 'g3', name: 'GiftBox', nameAr: 'هدية', emoji: '🎁', price: 99 },
  { id: 'g4', name: 'Crown', nameAr: 'تاج', emoji: '👑', price: 199 },
  { id: 'g5', name: 'Rocket', nameAr: 'صاروخ', emoji: '🚀', price: 1999 },
  { id: 'g6', name: 'Diamond', nameAr: 'ماسة', emoji: '💎', price: 2999 },
  { id: 'g7', name: 'Trophy', nameAr: 'كأس', emoji: '🏆', price: 3999 },
  { id: 'g8', name: 'GoldStar', nameAr: 'نجم ذهبي', emoji: '🌟', price: 4999 },
];

const MIC_OPTIONS = [5, 10, 15, 20];

const ROOM_MODE_OPTIONS: { value: RoomMode; label: string; icon: typeof Globe; desc: string }[] = [
  { value: 'public', label: 'عام', icon: Globe, desc: 'يمكن لأي شخص الدخول' },
  { value: 'key', label: 'بكلمة سر', icon: Key, desc: 'تحتاج كلمة مرور' },
  { value: 'private', label: 'خاص', icon: EyeOff, desc: 'دعوات فقط' },
];

const AVATAR_COLORS = ['#1e3a7a', '#3a1e6a', '#1a4040', '#3a2010', '#4a1e3a', '#1e4a3a', '#3a3a1e', '#2a1e4a'];

const CHAT_SENDER_COLORS = ['#6c63ff', '#f59e0b', '#22c55e', '#f97316'];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function canDo(myRole: RoomRole, requiredRole: RoomRole): boolean {
  return (ROLE_LEVELS[myRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getSenderColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return CHAT_SENDER_COLORS[Math.abs(hash) % CHAT_SENDER_COLORS.length];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

/* ═══════════════════════════════════════════════════════════════════════
   INJECTED STYLES (Cairo font + keyframe animations)
   ═══════════════════════════════════════════════════════════════════════ */

function InjectStyles() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .voice-room-root { font-family: 'Cairo', sans-serif; }
        @keyframes speakRing {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes speakGlow {
          0%, 100% { box-shadow: 0 0 3px 1px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 6px 2px rgba(34,197,94,0.5); }
        }
        .animate-speak-ring { animation: speakRing 1s infinite; }
        .animate-speak-glow { animation: speakGlow 2s ease-in-out infinite; }
        .animate-live-pulse { animation: livePulse 1.8s infinite; }
        .animate-fade-up { animation: fadeUp 0.3s ease; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MIC SEAT COMPONENT (HTML reference: 5-per-row, 52px avatars, states)
   ═══════════════════════════════════════════════════════════════════════ */

function MicSeat({
  seatIndex, seatData, currentUserId, myRole, hostId, onClick,
}: {
  seatIndex: number;
  seatData: SeatData;
  currentUserId: string;
  myRole: RoomRole;
  hostId: string;
  onClick: () => void;
}) {
  const { participant, status } = seatData;
  const isOwner = participant?.userId === hostId;
  const isSpeaking = participant && !participant.isMuted && !participant.micFrozen;

  /* ── Locked seat ── */
  if (status === 'locked' && !participant) {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
        <div className="relative">
          <div className="w-[52px] h-[52px] rounded-full bg-[#111318] border-2 border-[rgba(255,255,255,0.06)] flex items-center justify-center opacity-70">
            <Lock className="w-4 h-4 text-[#555]" />
          </div>
        </div>
        <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
        <span className="text-[9.5px] text-[#5a6080]">مقفل</span>
      </button>
    );
  }

  /* ── Occupied seat ── */
  if (participant) {
    const avatarColor = getAvatarColor(participant.userId);

    let ringClass = 'border-[#22c55e] bg-[#1c2035]';
    if (isOwner) ringClass = 'border-[#f59e0b] bg-[#1c2035] shadow-[0_0_0_2px_rgba(245,158,11,0.2)]';
    else if (isSpeaking) ringClass = 'border-[#22c55e] bg-[#1c2035] animate-speak-glow';

    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
        <div className="relative">
          <div
            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center overflow-hidden border-2 ${ringClass}`}
            style={{ background: avatarColor }}
          >
            {participant.avatar ? (
              <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-white">{participant.displayName.charAt(0)}</span>
            )}
          </div>
          {/* Owner badge */}
          {isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#f59e0b] border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">★</span>
            </div>
          )}
          {/* Speaking indicator - subtle green dot (no animation) */}
          {isSpeaking && !isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">♪</span>
            </div>
          )}
          {/* Muted indicator */}
          {participant.isMuted && !isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#ef4444]/80 border-2 border-[#141726] flex items-center justify-center">
              <MicOff className="w-2 h-2 text-white" />
            </div>
          )}
          {/* Frozen indicator */}
          {participant.micFrozen && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-blue-500/80 border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">❄</span>
            </div>
          )}
        </div>
        <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
        <span
          className="text-[9.5px] text-center max-w-[54px] overflow-hidden text-ellipsis whitespace-nowrap leading-tight"
          style={{ color: ROLE_COLORS[participant.role] }}
        >
          {participant.displayName}
        </span>
      </button>
    );
  }

  /* ── Empty seat ── */
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
      <div className="relative">
        <div className="w-[52px] h-[52px] rounded-full bg-[#1a2540] border-2 border-[rgba(108,99,255,0.25)] flex items-center justify-center">
          <Mic className="w-4 h-4 text-[#6c63ff]/60" />
        </div>
      </div>
      <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
      <span className="text-[9.5px] text-[#5a6080]">{'\u00A0'}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED BOTTOM SHEET WRAPPER (slide-up from bottom)
   ═══════════════════════════════════════════════════════════════════════ */

function BottomSheetOverlay({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/55 z-[80]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#181c2e] rounded-t-[22px] border-t border-[rgba(108,99,255,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-9 h-1 bg-[rgba(255,255,255,0.15)] rounded-full mx-auto mt-3 mb-3.5" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MIC MENU BOTTOM SHEET (admin: conditional options based on seat state)
   ═══════════════════════════════════════════════════════════════════════ */

function MicMenuBottomSheet({
  isOpen, onClose, seatIndex, participant, isSeatLocked, onAction, currentUserId, myRole, mySeatIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  isSeatLocked: boolean;
  onAction: (action: string) => void;
  currentUserId: string;
  myRole: RoomRole;
  mySeatIndex: number;
}) {
  const isAdmin = canDo(myRole, 'admin');
  const isOnMic = participant?.userId === currentUserId;
  const isAlreadyOnSeat = mySeatIndex >= 0 && mySeatIndex !== seatIndex;
  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      {/* Title */}
      <div className="text-[13px] font-bold text-[#9ca3c4] text-center px-4 pb-3 border-b border-[rgba(255,255,255,0.07)] mx-4">
        {participant
          ? `المايك ${seatIndex + 1} — ${participant.displayName}`
          : `المايك ${seatIndex + 1}`}
      </div>

      {/* Menu items */}
      <div className="p-3 space-y-1 pb-6">
        {/* When someone is ON the mic */}
        {participant && (
          <>
            {/* View profile — always available */}
            <button
              onClick={() => { onAction('view-profile'); onClose(); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#a78bfa] hover:bg-[#232843] active:bg-[#232843] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[rgba(108,99,255,0.15)] flex items-center justify-center flex-shrink-0">
                <Users className="w-[18px] h-[18px] text-[#a78bfa]" />
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold">عرض البروفايل</div>
                <div className="text-[11px] text-[#5a6080] font-normal">مشاهدة ملف المستخدم الشخصي</div>
              </div>
            </button>

            {/* ── ADMIN ACTIONS: only visible to admin+ ── */}
            {isAdmin && (
              <>
                {/* Close mic (lock + pull) */}
                {!isSeatLocked && (
                  <button
                    onClick={() => { onAction('close-seat'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f59e0b] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,0.15)] flex items-center justify-center flex-shrink-0">
                      <Lock className="w-[18px] h-[18px] text-[#f59e0b]" />
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold">إغلاق المايك</div>
                      <div className="text-[11px] text-[#5a6080] font-normal">إغلاق المايك وإخراج العضو منه</div>
                    </div>
                  </button>
                )}

                {/* Pull from mic (without locking) */}
                <button
                  onClick={() => { onAction('pull-from-mic'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                    <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">إنزال من المايك</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">إخراج العضو من المنبر فوراً</div>
                  </div>
                </button>

                {/* Open the mic (unlock) - only if locked */}
                {isSeatLocked && (
                  <button
                    onClick={() => { onAction('unlock-seat'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                      <Unlock className="w-[18px] h-[18px] text-[#22c55e]" />
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold">فتح المايك</div>
                      <div className="text-[11px] text-[#5a6080] font-normal">فتح المايك والسماح بالجلوس</div>
                    </div>
                  </button>
                )}

                {/* Temp kick from room */}
                <button
                  onClick={() => { onAction('kick-temp'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f97316] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(249,115,22,0.15)] flex items-center justify-center flex-shrink-0">
                    <Timer className="w-[18px] h-[18px] text-[#f97316]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">طرد مؤقت من الروم</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">مدة الطرد: 10 دقائق</div>
                  </div>
                </button>

                {/* Perm ban from room */}
                <button
                  onClick={() => { onAction('kick-perm'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                    <Ban className="w-[18px] h-[18px] text-[#ef4444]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">طرد نهائي من الروم</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">حظر دائم من الغرفة</div>
                  </div>
                </button>
              </>
            )}

            {/* ── OWN SEAT ACTIONS: only for the person sitting on this mic ── */}
            {isOnMic && (
              <button
                onClick={() => { onAction('leave-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">النزول من المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">ترك مقعدك الصوتي</div>
                </div>
              </button>
            )}
          </>
        )}

        {/* When seat is EMPTY */}
        {!participant && (
          <>
            {/* Change mic (if already on a different seat) */}
            {isAlreadyOnSeat && (
              <button
                onClick={() => { onAction('change-mic'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#a78bfa] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(108,99,255,0.15)] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-[18px] h-[18px] text-[#a78bfa]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">تغيير المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">الانتقال من المايك {mySeatIndex + 1} إلى المايك {seatIndex + 1}</div>
                </div>
              </button>
            )}
            {/* Sit on this mic (when not on any seat) */}
            {!isAlreadyOnSeat && (
              <button
                onClick={() => { onAction('take-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-[18px] h-[18px] text-[#22c55e]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">صعود للمايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">الجلوس على هذا المقعد الصوتي</div>
                </div>
              </button>
            )}

            {/* Lock seat (close empty mic) */}
            {!isSeatLocked && isAdmin && (
              <button
                onClick={() => { onAction('lock-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f59e0b] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,0.15)] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-[18px] h-[18px] text-[#f59e0b]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">إغلاق المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">منع أي شخص من الجلوس هنا</div>
                </div>
              </button>
            )}

            {/* Unlock seat (open empty mic) */}
            {isSeatLocked && isAdmin && (
              <button
                onClick={() => { onAction('unlock-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                  <Unlock className="w-[18px] h-[18px] text-[#22c55e]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">فتح المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">السماح للأعضاء بالجلوس</div>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </BottomSheetOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE BOTTOM SHEET (stats row + action buttons)
   ═══════════════════════════════════════════════════════════════════════ */

function ProfileBottomSheet({
  isOpen, onClose, participant, stats, onGiftClick, myRole, authUserId, hostId, onKickTemp, onBanUser, onChangeRole, onInviteToMic, onRemoveRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  participant: VoiceRoomParticipant | null;
  stats: { giftsSent: number; giftsReceived: number; totalReceivedValue: number } | null;
  onGiftClick: () => void;
  myRole: RoomRole;
  authUserId: string;
  hostId: string;
  onKickTemp: (userId: string) => void;
  onBanUser: (userId: string) => void;
  onChangeRole: (userId: string, newRole: RoomRole) => void;
  onInviteToMic: (userId: string) => void;
  onRemoveRole: (userId: string) => void;
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  if (!participant && !isOpen) return null;
  const avatarColor = participant ? getAvatarColor(participant.userId) : '#1c2035';

  // Cannot manage self or host
  const isNotSelf = participant?.userId !== authUserId && participant?.userId !== hostId;
  // Owner and co-owner can fully manage roles (change/grant)
  const canManageRoles = canDo(myRole, 'coowner') && isNotSelf;
  // Admin+ can remove membership from members (demote to visitor)
  const canRemoveMembership = canDo(myRole, 'admin') && isNotSelf && participant?.role === 'member';
  // Owner+ can remove admin/co-owner roles
  const canRemoveHigherRole = canDo(myRole, 'coowner') && isNotSelf && ['admin', 'coowner'].includes(participant?.role || '');
  const canInviteMic = canDo(myRole, 'admin') && participant?.userId !== authUserId && participant?.seatIndex < 0;
  // Check if target is an unregistered guest (no real username, or userId starts with 'guest-')
  const isGuest = !participant?.username || participant?.userId?.startsWith('guest-');
  const availableRoles: RoomRole[] = ['member', 'admin', 'coowner'];
  // Visitors get "grant membership", members get "change role"
  const showGrantMembership = canManageRoles && participant?.role === 'visitor' && !isGuest;
  // Show remove role button for anyone with a role higher than visitor
  const showRemoveRole = canRemoveMembership || canRemoveHigherRole;
  const removeRoleLabel = participant?.role === 'coowner' ? 'إزالة النيابة' : participant?.role === 'admin' ? 'إزالة الإشراف' : 'إزالة العضوية';

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      {participant && (
        <>
          {/* Header with avatar + name + role */}
          <div className="flex items-center gap-3.5 px-5 pb-4 border-b border-[rgba(255,255,255,0.07)]">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#6c63ff] overflow-hidden"
              style={{ background: avatarColor }}
            >
              {participant.avatar ? (
                <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{participant.displayName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold text-[#f0f0f8] truncate">{participant.displayName}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_PILL_BG[participant.role]}`}>
                  {ROLE_LABELS[participant.role]}
                </span>
                {isGuest && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[rgba(148,163,184,0.15)] text-[#5a6080]">
                    مستمع
                  </span>
                )}
                {participant.vipLevel > 0 && (
                  <span className="text-[11px] text-[#5a6080]">
                    مستوى <span className="text-[#f0f0f8] font-bold">{participant.vipLevel}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row: gifts sent / gifts received / jewels */}
          <div className="flex mx-4 mt-3 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.07)]">
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center border-l border-[rgba(255,255,255,0.07)]">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.giftsSent ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">هدايا أُرسلت</div>
            </div>
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center border-l border-[rgba(255,255,255,0.07)]">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.giftsReceived ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">هدايا مستلمة</div>
            </div>
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.totalReceivedValue ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">مجوهرات</div>
            </div>
          </div>

          {/* Role management - owner only */}
          {canManageRoles && !isGuest && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              {showGrantMembership ? (
                <button
                  onClick={() => { onChangeRole(participant.userId, 'member'); onClose(); }}
                  className="w-full flex items-center gap-3 bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⭐</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-[#f0f0f8]">منح العضوية</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">ترقية المستخدم ليصبح عضواً في الغرفة</div>
                  </div>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-[#f0f0f8]">تغيير الدور</span>
                    <span className="text-[11px] text-[#5a6080]">{ROLE_LABELS[participant.role]}</span>
                  </button>
                  {roleMenuOpen && (
                    <div className="flex gap-1.5 mt-2">
                      {availableRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => { onChangeRole(participant.userId, role); setRoleMenuOpen(false); onClose(); }}
                          className={`flex-1 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                            participant.role === role
                              ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                              : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[#6c63ff]'
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* Remove role button - for members, admins, co-owners */}
          {showRemoveRole && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <button
                onClick={() => { onRemoveRole(participant!.userId); onClose(); }}
                className="w-full flex items-center gap-3 bg-[rgba(239,68,68,0.06)] rounded-xl px-3.5 py-3 hover:bg-[rgba(239,68,68,0.1)] active:bg-[rgba(239,68,68,0.1)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold text-[#ef4444]">{removeRoleLabel}</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">إزالة الدور وإعادته إلى زائر في الغرفة</div>
                </div>
              </button>
            </div>
          )}
          {/* Guest indicator - unregistered users */}
          {isGuest && canDo(myRole, 'admin') && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <div className="flex items-center gap-2 bg-[rgba(148,163,184,0.08)] rounded-xl px-3.5 py-3">
                <Users className="w-4 h-4 text-[#5a6080]" />
                <span className="text-[12px] text-[#5a6080]">مستخدم غير مسجل - لا يمكن منحه عضوية</span>
              </div>
            </div>
          )}

          {/* Admin action buttons: kick temp + ban */}
          {canDo(myRole, 'admin') && participant?.userId !== authUserId && participant?.userId !== hostId && (
            <div className="flex gap-2 px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <button onClick={() => { onKickTemp(participant!.userId); onClose(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] text-[#f97316] text-[12px] font-semibold">
                <Timer className="w-4 h-4" /> طرد مؤقت
              </button>
              <button onClick={() => { onBanUser(participant!.userId); onClose(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12px] font-semibold">
                <Ban className="w-4 h-4" /> حظر نهائي
              </button>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex gap-2 px-4 mt-3 pb-6">
            {/* Invite to mic - admin only, for users not on a seat */}
            {canInviteMic && (
            <button
              onClick={() => { onInviteToMic(participant!.userId); onClose(); }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.15)] active:scale-[0.97] transition-all"
            >
              <Mic className="w-[22px] h-[22px] text-[#22c55e]" />
              <span className="text-[11px] text-[#22c55e] font-semibold">دعوة للمايك</span>
            </button>
            )}
            {/* Send gift - only for registered users */}
            {authUserId && (
            <button
              onClick={() => { onClose(); setTimeout(onGiftClick, 300); }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <Gift className="w-[22px] h-[22px] text-[#f59e0b]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إرسال هدية</span>
            </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <ImageIcon className="w-[22px] h-[22px] text-[#a78bfa]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إطار 5 دقائق</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <X className="w-[22px] h-[22px] text-[#5a6080]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إغلاق</span>
            </button>
          </div>
        </>
      )}
    </BottomSheetOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GIFT BOTTOM SHEET (4-column grid + target selector)
   ═══════════════════════════════════════════════════════════════════════ */

function GiftBottomSheet({
  isOpen, onClose, gifts, onSendGift,
}: {
  isOpen: boolean;
  onClose: () => void;
  gifts: Gift[];
  onSendGift: (giftId: string, target: string) => void;
}) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [target, setTarget] = useState<'specific' | 'on-mic' | 'everyone'>('everyone');

  const giftList = gifts.length > 0 ? gifts : DEFAULT_GIFTS;

  useEffect(() => {
    if (isOpen) setSelectedGift(null);
  }, [isOpen]);

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] flex flex-col pb-6">
        {/* Title */}
        <div className="text-[14px] font-bold text-center text-[#f0f0f8] px-4 pb-2.5">
          اختر هدية
        </div>

        {/* Target selector pills */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {([
            { value: 'specific' as const, label: 'شخص محدد' },
            { value: 'on-mic' as const, label: 'من في المايك' },
            { value: 'everyone' as const, label: 'جميع الغرفة' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTarget(opt.value)}
              className={`flex-shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                target === opt.value
                  ? 'bg-[rgba(108,99,255,0.15)] border-[#6c63ff] text-[#a78bfa]'
                  : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#5a6080]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Scrollable gift grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-4 gap-2 px-3 pb-3">
            {giftList.map((gift) => {
              const receive = Math.floor(gift.price / 3);
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-[14px] border transition-all ${
                    selectedGift === gift.id
                      ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.08)]'
                      : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)]'
                  }`}
                >
                  <span className="text-[26px] leading-none">{gift.emoji}</span>
                  <span className="text-[10px] text-[#9ca3c4] font-semibold">{gift.nameAr}</span>
                  <span className="text-[11px] font-bold text-[#f59e0b]">{gift.price.toLocaleString()} 💎</span>
                  <span className="text-[9px] text-[#5a6080]">يصل: {receive} 💎</span>
                </button>
              );
            })}
          </div>

          {/* Send button */}
          <div className="px-4 pb-2">
            <button
              onClick={() => {
                if (selectedGift) {
                  onSendGift(selectedGift, target);
                  setSelectedGift(null);
                  onClose();
                }
              }}
              disabled={!selectedGift}
              className="w-full h-11 rounded-[14px] font-bold text-[15px] text-white bg-gradient-to-l from-[#6c63ff] to-[#a78bfa] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              إرسال الهدية
            </button>
          </div>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SETTINGS BOTTOM SHEET (slide up from bottom, NOT a Dialog)
   ═══════════════════════════════════════════════════════════════════════ */

function SettingsBottomSheet({
  isOpen, onClose, room, onUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const [micCount, setMicCount] = useState(room.micSeatCount);
  const [guestMic, setGuestMic] = useState(false);
  const [memberMic, setMemberMic] = useState(true);
  const [roomType, setRoomType] = useState<RoomMode>(room.roomMode);
  const [kickDuration] = useState(10);
  const [saving, setSaving] = useState(false);
  const [availableBgs, setAvailableBgs] = useState<Array<{ id: string; imageUrl: string; thumbnailUrl: string; nameAr: string; rarity: string; price: number; owned: boolean }>>([]);
  const [selectedBg, setSelectedBg] = useState(room.roomImage || '');
  const [bgLoading, setBgLoading] = useState(false);
  const hasLoadedBgs = useRef(false);

  const roomTypes: { value: RoomMode; label: string; icon: string }[] = [
    { value: 'public', label: 'عامة', icon: '🔓' },
    { value: 'private', label: 'خاصة', icon: '🔒' },
    { value: 'key', label: 'مقيّدة', icon: '🔑' },
  ];

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      micSeatCount: micCount,
      roomMode: roomType,
      isAutoMode: guestMic ? 1 : 0,
      guestMicEnabled: guestMic,
      memberMicEnabled: memberMic,
      roomImage: selectedBg,
    });
    setSaving(false);
    onClose();
  };

  // Only load backgrounds once when the sheet opens (not on every room change)
  useEffect(() => {
    if (isOpen) {
      // Reset form values from room state at the moment of opening
      setMicCount(room.micSeatCount);
      setRoomType(room.roomMode);
      setSelectedBg(room.roomImage || '');
      hasLoadedBgs.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for fetching backgrounds - only once per open
  useEffect(() => {
    if (!isOpen || hasLoadedBgs.current) return;
    hasLoadedBgs.current = true;
    setBgLoading(true);
    fetch('/api/room-backgrounds')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.backgrounds) {
          setAvailableBgs(data.backgrounds.map((b: any) => ({
            id: b.background.id,
            imageUrl: b.background.imageUrl,
            thumbnailUrl: b.background.thumbnailUrl,
            nameAr: b.background.nameAr,
            rarity: b.background.rarity,
            price: b.background.price,
            owned: b.owned,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setBgLoading(false));
  }, [isOpen]);

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] flex flex-col pb-6">
        {/* Title */}
        <div className="text-[15px] font-bold text-center text-[#f0f0f8] px-4 pb-3.5 border-b border-[rgba(255,255,255,0.07)] mb-2">
          إعدادات الغرفة
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
          {/* Section: Mic count */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">عدد المايكات</div>
            <div className="flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎙</span>
                <span className="text-[13px] font-semibold text-[#f0f0f8]">المقاعد الصوتية</span>
              </div>
              <div className="flex gap-1.5">
                {MIC_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setMicCount(n)}
                    className={`px-3 py-1 rounded-lg border text-[12px] font-bold transition-all ${
                      micCount === n
                        ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                        : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Mic permissions */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">صلاحيات الصعود للمايك</div>
            <div className="space-y-1">
              <button
                onClick={() => setGuestMic(!guestMic)}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👤</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">الزوار يصعدون للمايك</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${guestMic ? 'bg-[#22c55e]' : 'bg-[#5a6080]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${guestMic ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </button>
              <button
                onClick={() => setMemberMic(!memberMic)}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⭐</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">الأعضاء يصعدون مباشرة</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${memberMic ? 'bg-[#22c55e]' : 'bg-[#5a6080]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${memberMic ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Section: Room Background */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">موضوع الغرفة (الخلفية)</div>
            {bgLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#6c63ff]" />
              </div>
            ) : availableBgs.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {/* No background option */}
                <button
                  onClick={() => setSelectedBg('')}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                    selectedBg === '' ? 'border-[#6c63ff]' : 'border-transparent'
                  }`}
                >
                  <div className="w-full h-full bg-[#141726] flex items-center justify-center">
                    <span className="text-[10px] text-[#5a6080]">بدون</span>
                  </div>
                </button>
                {availableBgs.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => bg.owned ? setSelectedBg(bg.imageUrl) : undefined}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                      selectedBg === bg.imageUrl ? 'border-[#6c63ff]' : 'border-transparent'
                    } ${!bg.owned ? 'opacity-50' : ''}`}
                  >
                    {(bg.thumbnailUrl || bg.imageUrl) ? (
                      <img src={bg.thumbnailUrl || bg.imageUrl} alt={bg.nameAr} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1c2035] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-[#5a6080]" />
                      </div>
                    )}
                    {!bg.owned && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[9px] text-[#f59e0b] font-bold">{bg.price} 💎</span>
                      </div>
                    )}
                    {selectedBg === bg.imageUrl && (
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#6c63ff] flex items-center justify-center">
                        <span className="text-[8px] text-white">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-[#1c2035] rounded-xl px-3.5 py-3 text-center">
                <span className="text-[12px] text-[#5a6080]">لا توجد خلفيات متاحة حالياً</span>
              </div>
            )}
          </div>

          {/* Section: Privacy */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">خصوصية الغرفة</div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  const idx = roomTypes.findIndex(r => r.value === roomType);
                  setRoomType(roomTypes[(idx + 1) % roomTypes.length].value);
                }}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{roomTypes.find(r => r.value === roomType)?.icon || '🔓'}</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">نوع الغرفة</span>
                </div>
                <span className="text-[12px] text-[#5a6080]">
                  {roomTypes.find(r => r.value === roomType)?.label}
                </span>
              </button>
              <div className="flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⏱</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">مدة الطرد المؤقت</span>
                </div>
                <span className="text-[12px] text-[#5a6080]">{kickDuration} دقائق</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold text-[14px] text-white bg-gradient-to-l from-[#6c63ff] to-[#a78bfa] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KICK DURATION DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function KickDurationDialog({
  isOpen, onClose, onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}) {
  const [duration, setDuration] = useState(5);
  const presets = [
    { label: '٥ دقائق', value: 5 },
    { label: '١٥ دقيقة', value: 15 },
    { label: '٣٠ دقيقة', value: 30 },
    { label: 'ساعة', value: 60 },
    { label: '٢٤ ساعة', value: 1440 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">مدة الطرد المؤقت</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setDuration(p.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                duration === p.value
                  ? 'border-[#f59e0b]/50 bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                  : 'border-[rgba(255,255,255,0.07)] bg-[#1c2035] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              {p.label}
            </button>
          ))}
          <Button onClick={() => onConfirm(duration)} className="w-full bg-[#ef4444] hover:bg-[#ef4444]/80 rounded-xl mt-2">
            <Ban className="w-4 h-4 ml-2" /> طرد
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PASSWORD DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function PasswordDialog({
  isOpen, onClose, onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [pw, setPw] = useState('');
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">كلمة المرور</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="أدخل كلمة المرور..."
            className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8] text-center"
            type="password"
            onKeyDown={(e) => e.key === 'Enter' && pw && onSubmit(pw)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl text-[#9ca3c4]">إلغاء</Button>
            <Button onClick={() => pw && onSubmit(pw)} disabled={!pw} className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/80 rounded-xl">دخول</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CREATE ROOM DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function CreateRoomDialog({
  isOpen, onClose, onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; micSeatCount: number; roomMode: RoomMode; roomPassword: string; maxParticipants: number; isAutoMode: boolean; micTheme: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [micSeatCount, setMicSeatCount] = useState(10);
  const [roomMode, setRoomMode] = useState<RoomMode>('public');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/voice-rooms/template-create?action=template')
        .then(r => r.json())
        .then(d => {
          if (d.template) {
            const t = d.template;
            setName(t.name || '');
            setDescription(t.description || '');
            setMicSeatCount(t.micSeatCount || 10);
            setRoomMode((t.roomMode as RoomMode) || 'public');
            setRoomPassword(t.roomPassword || '');
            setMaxParticipants(t.maxParticipants || 50);
            setIsAutoMode(t.isAutoMode || false);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate({ name, description, micSeatCount, roomMode, roomPassword, maxParticipants, isAutoMode, micTheme: 'default' });
    setSaving(false);
    onClose();
    setName(''); setDescription(''); setRoomPassword('');
    setMicSeatCount(10); setRoomMode('public'); setMaxParticipants(50); setIsAutoMode(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">إنشاء غرفة صوتية</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-3">
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">اسم الغرفة *</label>
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الغرفة"
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">الوصف</label>
            <Input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للغرفة"
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1.5 block">عدد المايكات</label>
            <div className="grid grid-cols-4 gap-2">
              {MIC_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setMicSeatCount(n)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    micSeatCount === n
                      ? 'bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.4)] text-[#a78bfa]'
                      : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1.5 block">نوع الغرفة</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_MODE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRoomMode(opt.value)}
                    className={`py-2.5 rounded-xl border text-center transition-all ${
                      roomMode === opt.value
                        ? 'bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.4)] text-[#a78bfa]'
                        : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-0.5" />
                    <span className="text-[10px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {roomMode === 'key' && (
            <div>
              <label className="text-xs text-[#5a6080] mb-1 block">كلمة المرور</label>
              <Input
                value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">الحد الأقصى للمشاركين</label>
            <Input
              type="number" min={5} max={500}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="w-full bg-gradient-to-l from-[#6c63ff] to-[#a78bfa] hover:opacity-90 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الغرفة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOM LIST VIEW
   ═══════════════════════════════════════════════════════════════════════ */

function RoomListView({
  onJoinRoom, onCreateRoom, authUser,
}: {
  onJoinRoom: (room: VoiceRoom) => void;
  onCreateRoom: () => void;
  authUser: AuthUser | null;
}) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [myRoom, setMyRoom] = useState<VoiceRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const hasRoom = !!myRoom;

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

  const modeLabel: Record<RoomMode, string> = {
    public: 'عام', key: '🔒', private: '✨ خاص',
  };

  const modeColor: Record<RoomMode, string> = {
    public: 'bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[rgba(34,197,94,0.4)]',
    key: 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border-[rgba(245,158,11,0.4)]',
    private: 'bg-[rgba(108,99,255,0.2)] text-[#a78bfa] border-[rgba(108,99,255,0.4)]',
  };

  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      {/* Shared Header (same as main page) */}
      <SiteHeader
        authUser={authUser}
        onProfileClick={() => { window.location.href = '/profile'; }}
        extraContent={
          !hasRoom ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-amber-500 to-red-500 text-white text-sm font-medium"
            >
              <span>+</span>
              <span className="hidden sm:inline">إنشاء</span>
            </button>
          ) : undefined
        }
      />

      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16" />

      {/* Room Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#6c63ff] animate-spin" />
          </div>
        ) : rooms.length === 0 && !hasRoom ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1c2035] flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-[#5a6080]" />
            </div>
            <p className="text-[#9ca3c4] text-sm mb-1">لا توجد غرف صوتية</p>
            <p className="text-[#5a6080] text-xs mb-4">كن أول من ينشئ غرفة!</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-xl bg-[#6c63ff] text-white text-sm font-medium hover:bg-[#6c63ff]/80 transition-colors">
              إنشاء غرفة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My room - pinned */}
            {hasRoom && (
              <div className="mb-2">
                <div className="text-[10px] text-[#5a6080] font-semibold mb-2 px-1">غرفتي</div>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onJoinRoom(myRoom!)}
                  className="w-full bg-[#141726] border-2 border-[rgba(245,158,11,0.3)] rounded-2xl overflow-hidden text-right hover:border-[rgba(245,158,11,0.5)] transition-all group"
                >
                  {/* Room image or gradient */}
                  <div className="h-28 relative overflow-hidden">
                    {myRoom.roomImage ? (
                      <img src={myRoom.roomImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-l from-[#6c63ff]/30 to-[#a78bfa]/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141726] via-transparent to-transparent" />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.2)] text-[#22c55e] border border-[rgba(34,197,94,0.4)]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-live-pulse ml-1" />
                        مباشر
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5">
                      <div className="flex items-center gap-1 bg-[rgba(245,158,11,0.15)] rounded-full px-2 py-0.5">
                        <span className="text-[9px] font-bold text-[#f59e0b]">LV</span>
                        <span className="text-[9px] font-bold text-[#f0f0f8]">{myRoom.roomLevel || 1}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[#c0c0d0] text-[10px]">
                      <Users className="w-3 h-3" />
                      <span>{myRoom.participantCount || 0}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[15px] font-bold text-[#f0f0f8] truncate group-hover:text-[#f59e0b] transition-colors">
                        {myRoom.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#5a6080]">#{myRoom.hostId?.substring(0, 8)}</span>
                    </div>
                    <p className="text-[11px] text-[#5a6080] truncate">{myRoom.description || 'بدون وصف'}</p>
                  </div>
                </motion.button>
              </div>
            )}

            {/* Other rooms */}
            {rooms.length > 0 && (
              <div>
                {!hasRoom && rooms.length > 0 && <div className="text-[10px] text-[#5a6080] font-semibold mb-2 px-1">الغرف العامة</div>}
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map((room, i) => (
                    <motion.button
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onJoinRoom(room)}
                      className="bg-[#141726] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden text-right hover:border-[rgba(108,99,255,0.3)] transition-all group"
                    >
                      {room.roomImage ? (
                        <div className="h-20 overflow-hidden">
                          <img src={room.roomImage} alt="" className="w-full h-full object-cover" />
                          <div className="relative inset-0 bg-gradient-to-t from-[#141726] to-transparent" />
                        </div>
                      ) : null}
                      <div className={`${room.roomImage ? 'px-3 pt-2.5 pb-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${modeColor[room.roomMode || 'public']}`}>
                            {modeLabel[room.roomMode || 'public']}
                          </span>
                          <div className="flex items-center gap-1 text-[#5a6080] text-[10px]">
                            <Users className="w-3 h-3" />
                            <span>{room.participantCount || 0}</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-[#f0f0f8] truncate mb-1 group-hover:text-[#a78bfa] transition-colors">
                          {room.name}
                        </h3>
                        <p className="text-[11px] text-[#5a6080] truncate">{room.description || 'بدون وصف'}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#6c63ff] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{(room.hostName || '?').charAt(0)}</span>
                          </div>
                          <span className="text-[10px] text-[#5a6080]">{room.hostName || 'مجهول'}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateRoomDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={onCreateRoom}
      />

      {/* Shared Bottom Navigation (same as main page) */}
      <SiteBottomNav activeTab="council" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MEMBERSHIP INVITATION DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function MembershipInviteDialog({
  isOpen, onClose, onAccept, onReject, pendingRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  pendingRole: string;
}) {
  const roleLabel = pendingRole === 'member' ? 'عضو' : pendingRole === 'admin' ? 'مشرف' : pendingRole === 'coowner' ? 'نائب' : pendingRole;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-[#181c2e] border border-[rgba(108,99,255,0.3)] rounded-2xl p-5 shadow-2xl"
            dir="rtl"
          >
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <div className="text-[16px] font-bold text-[#f0f0f8] mb-1">دعوة للانضمام!</div>
              <div className="text-[12px] text-[#9ca3c4]">تمت دعوتك لتصبح <span className="text-[#a78bfa] font-bold">{roleLabel}</span> في هذه الغرفة</div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-l from-[#22c55e] to-[#16a34a] text-white text-[13px] font-bold active:scale-[0.97] transition-transform"
              >
                قبول
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2.5 rounded-xl bg-[#1c2035] border border-[rgba(255,255,255,0.07)] text-[#9ca3c4] text-[13px] font-semibold hover:bg-[#232843] active:scale-[0.97] transition-transform"
              >
                رفض
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MIC INVITATION DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function MicInviteDialog({
  isOpen, onClose, onAccept, onReject, seatIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  seatIndex: number;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-[#181c2e] border border-[rgba(34,197,94,0.3)] rounded-2xl p-5 shadow-2xl"
            dir="rtl"
          >
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
                <span className="text-2xl">🎙</span>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-[16px] font-bold text-[#f0f0f8] mb-1">دعوة للمايك!</div>
              <div className="text-[12px] text-[#9ca3c4]">تمت دعوتك للصعود على <span className="text-[#22c55e] font-bold">المايك {seatIndex + 1}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-l from-[#22c55e] to-[#16a34a] text-white text-[13px] font-bold active:scale-[0.97] transition-transform"
              >
                قبول
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2.5 rounded-xl bg-[#1c2035] border border-[rgba(255,255,255,0.07)] text-[#9ca3c4] text-[13px] font-semibold hover:bg-[#232843] active:scale-[0.97] transition-transform"
              >
                رفض
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOM INTERIOR VIEW
   ═══════════════════════════════════════════════════════════════════════ */

function RoomInteriorView({
  room: initialRoom, onExit, authUser, onRoomUpdate,
}: {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (updatedRoom: VoiceRoom) => void;
}) {
  const { toast } = useToast();

  /* ── State ── */
  const [room, setRoom] = useState<VoiceRoom>(initialRoom);
  const [participants, setParticipants] = useState<VoiceRoomParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<VoiceRoomParticipant | null>(null);
  const [myRole, setMyRole] = useState<RoomRole>('visitor');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRoomMuted, setIsRoomMuted] = useState(false);
  const [lastChatTimestamp, setLastChatTimestamp] = useState(0);
  const [profileStats, setProfileStats] = useState<{ giftsSent: number; giftsReceived: number; totalReceivedValue: number } | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyGems, setWeeklyGems] = useState(0);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const [topGifts, setTopGifts] = useState<Array<{
    giftName: string; giftEmoji: string; gems: number;
    senderName: string; senderAvatar: string;
    receiverName: string; receiverAvatar: string;
    createdAt: string;
  }>>([]);

  /* ── UI state ── */
  const [profileSheet, setProfileSheet] = useState<VoiceRoomParticipant | null>(null);
  const [giftSheetOpen, setGiftSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<string>(''); // stores pending role invitation
  const [pendingMicInvite, setPendingMicInvite] = useState<number>(-1); // stores pending mic seat invitation

  const [micMenuSheet, setMicMenuSheet] = useState<{
    isOpen: boolean;
    seatIndex: number;
    participant: VoiceRoomParticipant | null;
    mySeatIndex: number;
  }>({ isOpen: false, seatIndex: -1, participant: null, mySeatIndex: -1 });

  /* ── Refs ── */
  const chatEndRef = useRef<HTMLDivElement>(null);

  const roomId = room.id;
  const currentUserId = myParticipant?.userId || authUser?.id || '';
  const isOnSeat = myParticipant && myParticipant.seatIndex >= 0;

  /* ── Build seat data array using lockedSeats from room ── */
  const buildSeats = useCallback((): SeatData[] => {
    const seatMap = new Map<number, VoiceRoomParticipant>();
    participants.forEach(p => {
      if (p.seatIndex >= 0) seatMap.set(p.seatIndex, p);
    });
    const lockedSet = new Set(room.lockedSeats || []);
    const seats: SeatData[] = [];
    for (let i = 0; i < room.micSeatCount; i++) {
      const p = seatMap.get(i) || null;
      const isLocked = lockedSet.has(i);
      seats.push({
        seatIndex: i,
        participant: p,
        status: p ? (p.seatStatus || 'open') : (isLocked ? 'locked' : 'open'),
      });
    }
    return seats;
  }, [participants, room.micSeatCount, room.lockedSeats]);

  /* ── API fetchers ── */
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=participants`);
      const data = await res.json();
      if (data.success && data.participants) {
        setParticipants(data.participants);
        const me = data.participants.find((p: VoiceRoomParticipant) => p.userId === authUser?.id);
        if (me) {
          setMyParticipant(me);
          setMyRole(me.role);
          setIsMicMuted(me.isMuted);
        }
      }
    } catch { /* ignore */ }
  }, [roomId, authUser?.id]);

  const fetchMyParticipant = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=my-participant`);
      const data = await res.json();
      if (data.success && data.participant) {
        setMyParticipant(data.participant);
        setMyRole(data.participant.role);
        setIsMicMuted(data.participant.isMuted);
        // Check for pending role invitation
        if (data.participant.pendingRole && data.participant.pendingRole !== '') {
          setPendingInvite(data.participant.pendingRole);
        }
        // Check for pending mic invitation
        if (data.participant.pendingMicInvite !== undefined && Number(data.participant.pendingMicInvite) >= 0) {
          setPendingMicInvite(Number(data.participant.pendingMicInvite));
        }
      }
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=gifts`);
      const data = await res.json();
      if (data.success && data.gifts) setGifts(data.gifts);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchWeeklyGems = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=weekly-gems`);
      const data = await res.json();
      if (data.success) setWeeklyGems(data.gems);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchTopGifts = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=top-gifts&limit=20`);
      const data = await res.json();
      if (data.success && data.gifts) setTopGifts(data.gifts);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchChatMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}/chat?after=${lastChatTimestamp}`);
      const data = await res.json();
      if (data.success && data.messages?.length > 0) {
        setChatMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages
            .filter((m: any) => !existingIds.has(m.id))
            .map((m: any) => ({
              id: m.id,
              userId: m.userId,
              displayName: m.displayName,
              avatar: m.avatar,
              text: m.text,
              time: new Date(m.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
              isSystem: m.isSystem,
              isGift: m.isGift,
            }));
          const maxTs = Math.max(...data.messages.map((m: any) => m.timestamp));
          if (maxTs > lastChatTimestamp) setLastChatTimestamp(maxTs);
          return [...prev, ...newMsgs];
        });
      }
    } catch { /* ignore */ }
  }, [roomId, lastChatTimestamp]);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=room-details`);
      const data = await res.json();
      if (data.success && data.room) {
        const updatedRoom = { ...data.room, lockedSeats: data.room.lockedSeats || [] };
        setRoom(updatedRoom);
        setIsRoomMuted(!!updatedRoom.chatMuted);
        onRoomUpdate(updatedRoom);
      }
    } catch { /* ignore */ }
  }, [roomId, onRoomUpdate]);

  const checkKicked = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kicked`);
      const data = await res.json();
      return data.success && data.kicked;
    } catch { return false; }
  }, [roomId]);

  /* ── Stable polling using refs (avoids re-render loops) ── */
  const fetchParticipantsRef = useRef(fetchParticipants);
  const fetchChatMessagesRef = useRef(fetchChatMessages);
  const fetchRoomDetailsRef = useRef(fetchRoomDetails);
  const fetchMyParticipantRef = useRef(fetchMyParticipant);
  const fetchGiftsRef = useRef(fetchGifts);
  const fetchWeeklyGemsRef = useRef(fetchWeeklyGems);
  const fetchTopGiftsRef = useRef(fetchTopGifts);
  const checkKickedRef = useRef(checkKicked);
  const toastRef = useRef(toast);
  const onExitRef = useRef(onExit);

  useEffect(() => { fetchParticipantsRef.current = fetchParticipants; }, [fetchParticipants]);
  useEffect(() => { fetchChatMessagesRef.current = fetchChatMessages; }, [fetchChatMessages]);
  useEffect(() => { fetchRoomDetailsRef.current = fetchRoomDetails; }, [fetchRoomDetails]);
  useEffect(() => { fetchMyParticipantRef.current = fetchMyParticipant; }, [fetchMyParticipant]);
  useEffect(() => { fetchGiftsRef.current = fetchGifts; }, [fetchGifts]);
  useEffect(() => { fetchWeeklyGemsRef.current = fetchWeeklyGems; }, [fetchWeeklyGems]);
  useEffect(() => { fetchTopGiftsRef.current = fetchTopGifts; }, [fetchTopGifts]);
  useEffect(() => { checkKickedRef.current = checkKicked; }, [checkKicked]);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);

  useEffect(() => {
    let cancelled = false;
    let partPoll: ReturnType<typeof setInterval> | null = null;
    let chatPoll: ReturnType<typeof setInterval> | null = null;
    let roomPoll: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      setLoading(true);
      const kicked = await checkKickedRef.current();
      if (kicked) {
        toastRef.current({ title: 'تم طردك من الغرفة', description: 'لا يمكنك الدخول حالياً' });
        onExitRef.current();
        setLoading(false);
        return;
      }
      if (!cancelled) {
        await Promise.all([
          fetchParticipantsRef.current(),
          fetchMyParticipantRef.current(),
          fetchGiftsRef.current(),
          fetchChatMessagesRef.current(),
          fetchRoomDetailsRef.current(),
          fetchWeeklyGemsRef.current(),
          fetchTopGiftsRef.current(),
        ]);
        setLoading(false);
      }
    };
    init();

    // Stable intervals that won't reset when callbacks change
    partPoll = setInterval(() => { if (!cancelled) fetchParticipantsRef.current(); }, 4000);
    chatPoll = setInterval(() => { if (!cancelled) fetchChatMessagesRef.current(); }, 3000);
    roomPoll = setInterval(() => { if (!cancelled) fetchRoomDetailsRef.current(); }, 6000);
    const myPoll = setInterval(() => { if (!cancelled) fetchMyParticipantRef.current(); }, 4000);
    const gemsPoll = setInterval(() => { if (!cancelled) fetchWeeklyGemsRef.current(); }, 10000);

    return () => {
      cancelled = true;
      if (partPoll) clearInterval(partPoll);
      if (chatPoll) clearInterval(chatPoll);
      if (roomPoll) clearInterval(roomPoll);
      if (myPoll) clearInterval(myPoll);
      if (gemsPoll) clearInterval(gemsPoll);
    };
  }, [roomId]);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ── Fetch profile stats when profileSheet changes ── */
  useEffect(() => {
    if (!profileSheet) return;
    let cancelled = false;
    fetch(`/api/voice-rooms/${roomId}?action=user-stats&userId=${profileSheet.userId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setProfileStats(d.stats); })
      .catch(() => { if (!cancelled) setProfileStats(null); });
    return () => { cancelled = true; };
  }, [profileSheet, roomId]);

  /* ── Fetch top gifts when roomInfo opens ── */
  useEffect(() => {
    if (!roomInfoOpen) return;
    fetchTopGifts();
  }, [roomInfoOpen, fetchTopGifts]);

  /* ── Actions ── */

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isRoomMuted || !authUser) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      await fetch(`/api/voice-rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          displayName: authUser.displayName,
          avatar: authUser.avatar,
        }),
      });
      // Optimistic add is handled by the polling
    } catch { /* ignore */ }
  }, [chatInput, isRoomMuted, authUser, roomId]);

  const handleToggleMic = useCallback(async () => {
    if (myParticipant?.micFrozen) {
      toast({ title: 'المايك مجمد', description: 'لا يمكنك إلغاء الكتم' });
      return;
    }
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=toggle-mic`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setIsMicMuted(data.isMuted);
        if (!data.frozen) {
          toast({ title: data.isMuted ? 'تم كتم المايك' : 'تم فتح المايك' });
        }
      }
    } catch { /* ignore */ }
  }, [roomId, myParticipant, toast]);

  const handleToggleRoomMute = useCallback(async () => {
    const newMuted = !isRoomMuted;
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatMuted: newMuted ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRoomMuted(newMuted);
        toast({ title: newMuted ? 'تم كتم الغرفة' : 'تم فتح الغرفة' });
      }
    } catch { /* ignore */ }
  }, [roomId, isRoomMuted, toast]);

  const handleRequestSeat = useCallback(async (seatIndex: number) => {
    if (!authUser) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجل دخولك أولاً للصعود على المايك' });
      return;
    }
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=request-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.username,
          displayName: authUser.displayName,
          avatar: authUser.avatar,
          seatIndex,
        }),
      });
      const data = await res.json();
      if (data.success && data.autoAssigned) {
        toast({ title: 'تم تعيينك على المايك', description: `مقعد ${data.seatIndex + 1}` });
      } else if (data.success) {
        toast({ title: 'تم إرسال الطلب', description: 'بانتظار الموافقة' });
      } else {
        toast({ title: 'لم يتم الصعود', description: data.error || 'حاول مرة أخرى' });
      }
      // Always refresh participants after any seat request
      await fetchParticipants();
      await fetchMyParticipant();
    } catch { /* ignore */ }
  }, [roomId, authUser, fetchParticipants, fetchMyParticipant, toast]);

  const handleKickFromMic = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kick-from-mic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم سحبه من المايك' });
        await fetchParticipants();
      } else {
        toast({ title: 'فشل', description: data.error || 'حاول مرة أخرى' });
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleKickTemp = useCallback(async (minutes: number) => {
    if (!micMenuSheet.participant) return;
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kick-from-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: micMenuSheet.participant.userId, durationMinutes: minutes }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم طرده مؤقتاً' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, micMenuSheet.participant, fetchParticipants, toast]);

  const handleBan = useCallback(async () => {
    if (!micMenuSheet.participant) return;
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: micMenuSheet.participant.userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم طرده نهائياً' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, micMenuSheet.participant, fetchParticipants, toast]);

  const handleSetSeatStatus = useCallback(async (seatIndex: number, status: SeatStatus) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=set-seat-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIndex, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: status === 'locked' ? 'تم قفل المقعد' : 'تم فتح المقعد' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleSendGift = useCallback(async (giftId: string, target: string) => {
    if (!authUser) return;
    try {
      const toUserId = target === 'specific' ? profileSheet?.userId : undefined;
      if (target === 'specific' && !toUserId) return;
      const body: Record<string, unknown> = { giftId };
      if (toUserId) body.toUserId = toUserId;
      const res = await fetch(`/api/voice-rooms/${roomId}?action=gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const giftData = (gifts.length > 0 ? gifts : DEFAULT_GIFTS).find(g => g.id === giftId);
        const giftMsg: ChatMessage = {
          id: genId(),
          userId: authUser.id,
          displayName: authUser.displayName,
          avatar: authUser.avatar,
          text: `⭐ ${authUser.displayName} أرسل ${giftData?.nameAr || 'هدية'} ${target === 'everyone' ? 'للجميع' : `لـ ${profileSheet?.displayName || 'شخص'}`}`,
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          isGift: true,
        };
        setChatMessages(prev => [...prev, giftMsg]);
        toast({ title: 'تم إرسال الهدية! 🎉' });
      }
    } catch { /* ignore */ }
  }, [roomId, authUser, gifts, profileSheet, toast]);

  /* ── Seat click handler ── */
  const handleSeatClick = useCallback((seatIndex: number) => {
    const seats = buildSeats();
    const seatData = seats[seatIndex];
    if (!seatData) return;

    const isAdmin = canDo(myRole, 'admin');
    const mySeat = myParticipant?.seatIndex ?? -1;

    if (seatData.participant) {
      // Someone is on this seat
      if (isAdmin) {
        setMicMenuSheet({ isOpen: true, seatIndex, participant: seatData.participant, mySeatIndex: mySeat });
      } else if (seatData.participant.userId === currentUserId) {
        // Clicking own seat - show menu with leave option
        setMicMenuSheet({ isOpen: true, seatIndex, participant: seatData.participant, mySeatIndex: mySeat });
      } else {
        setProfileSheet(seatData.participant);
      }
    } else {
      // Empty seat
      if (seatData.status === 'locked') {
        if (isAdmin) {
          setMicMenuSheet({ isOpen: true, seatIndex, participant: null, mySeatIndex: mySeat });
        } else {
          toast({ title: 'المقعد مقفل', description: 'لا يمكنك الجلوس هنا' });
        }
      } else {
        // Open seat
        if (isAdmin) {
          setMicMenuSheet({ isOpen: true, seatIndex, participant: null, mySeatIndex: mySeat });
        } else if (mySeat >= 0 && mySeat !== seatIndex) {
          // Non-admin user already on a seat - change mic directly
          handleRequestSeat(seatIndex);
        } else {
          // Members and visitors sit directly (members go directly, visitors may get waitlisted)
          handleRequestSeat(seatIndex);
        }
      }
    }
  }, [myRole, buildSeats, handleRequestSeat, toast, currentUserId, myParticipant?.seatIndex]);

  /* ── Mic menu action dispatcher ── */
  const handleMicMenuAction = useCallback(async (action: string) => {
    const { seatIndex, participant } = micMenuSheet;
    switch (action) {
      case 'view-profile':
        if (participant) setProfileSheet(participant);
        break;
      case 'take-seat':
        await handleRequestSeat(seatIndex);
        break;
      case 'change-mic':
        await handleRequestSeat(seatIndex);
        break;
      case 'lock-seat':
        await handleSetSeatStatus(seatIndex, 'locked');
        await fetchRoomDetails();
        break;
      case 'unlock-seat':
        await handleSetSeatStatus(seatIndex, 'open');
        await fetchRoomDetails();
        break;
      case 'close-seat':
        // Lock the seat AND pull the person from mic
        if (participant) await handleKickFromMic(participant.userId);
        await handleSetSeatStatus(seatIndex, 'locked');
        await fetchRoomDetails();
        break;
      case 'pull-from-mic':
        if (participant) await handleKickFromMic(participant.userId);
        break;
      case 'kick-temp':
        setKickDialogOpen(true);
        break;
      case 'kick-perm':
        await handleBan();
        break;
      case 'leave-seat':
        // User voluntarily leaving their seat
        try {
          await fetch(`/api/voice-rooms/${roomId}?action=leave-seat`, { method: 'POST' });
          await fetchParticipants();
          await fetchMyParticipant();
        } catch { /* ignore */ }
        break;
    }
  }, [micMenuSheet, handleRequestSeat, handleSetSeatStatus, handleKickFromMic, handleBan, fetchRoomDetails]);

  /* ── Update settings ── */
  const handleUpdateSettings = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'تم تحديث الإعدادات' });
        // Update room state immediately with the sent data for instant UI feedback
        setRoom(prev => ({ ...prev, ...data }));
        onRoomUpdate({ ...room, ...data });
        // Also re-fetch from server for consistency
        fetchRoomDetails();
        fetchParticipants();
      } else {
        toast({ title: 'فشل التحديث', description: result.error || 'حاول مرة أخرى' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال' });
    }
  }, [roomId, toast, fetchRoomDetails, fetchParticipants, room, onRoomUpdate]);

  /* ── Accept/Reject role invitation ── */
  const handleAcceptInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=accept-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم قبول الدعوة! ⭐', description: `أصبحت ${ROLE_LABELS[pendingInvite as RoomRole] || pendingInvite}` });
        setPendingInvite('');
        await Promise.all([fetchParticipants(), fetchMyParticipant()]);
      } else {
        toast({ title: 'فشل قبول الدعوة', description: data.error || 'حاول مرة أخرى' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تحقق من الإنترنت وحاول مرة أخرى' });
    }
  }, [roomId, pendingInvite, toast, fetchParticipants, fetchMyParticipant]);

  const handleRejectInvite = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=reject-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setPendingInvite('');
      toast({ title: 'تم رفض الدعوة' });
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Invite user to mic (admin action) ── */
  const handleInviteToMic = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=invite-to-mic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, seatIndex: -1 }), // auto-pick empty seat
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إرسال دعوة للمايك' });
      } else {
        toast({ title: 'فشل الإرسال', description: data.error || 'لا توجد مقاعد فارغة' });
      }
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Accept mic invitation ── */
  const handleAcceptMicInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=accept-mic-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم الصعود للمايك', description: `مقعد ${data.seatIndex + 1}` });
        setPendingMicInvite(-1);
        await Promise.all([fetchParticipants(), fetchMyParticipant()]);
      } else {
        toast({ title: 'المقعد لم يعد متاحاً' });
        setPendingMicInvite(-1);
      }
    } catch { /* ignore */ }
  }, [roomId, toast, fetchParticipants, fetchMyParticipant]);

  /* ── Reject mic invitation ── */
  const handleRejectMicInvite = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=reject-mic-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      setPendingMicInvite(-1);
      toast({ title: 'تم رفض دعوة المايك' });
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Leave room ── */
  const handleLeaveRoom = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=leave`, { method: 'POST' });
    } catch { /* ignore */ }
    setChatMessages([]);
    onExit(true); // pass flag: already called leave API
  }, [roomId, onExit]);

  /* ── Copy link ── */
  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      toast({ title: 'تم نسخ رابط الغرفة' });
    }).catch(() => {
      toast({ title: 'تم نسخ رابط الغرفة' });
    });
  }, [toast]);

  const seats = buildSeats();
  const listenerCount = Math.max(0, participants.length - participants.filter(p => p.seatIndex >= 0).length);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 text-[#6c63ff] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <InjectStyles />
      <div className="h-screen flex flex-col voice-room-root relative" dir="rtl" style={{ backgroundColor: '#0d0f1a' }}>
        {/* Room background image */}
        {room.roomImage && (
          <div className="absolute inset-0 z-0">
            <img src={room.roomImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#0d0f1a]/75" />
          </div>
        )}
        <div className="relative z-10 flex flex-col h-full">

        {/* ══════════════════════════════════════════════
            TOP BAR: room info (right), settings+exit+share (left)
            ══════════════════════════════════════════════ */}
        <header className="h-14 bg-transparent flex items-center justify-between px-4 border-b border-[rgba(108,99,255,0.18)] flex-shrink-0">
          {/* Room info — right side in RTL */}
          <div className="flex flex-col items-start gap-0 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#22c55e] animate-live-pulse flex-shrink-0" />
              <button onClick={() => setRoomInfoOpen(true)} className="active:scale-[0.97] transition-transform">
                <span className="text-[15px] font-bold text-[#f0f0f8] truncate max-w-[160px] block">{room.name}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[rgba(108,99,255,0.12)] rounded-full px-1.5 py-0.5">
                <span className="text-[9px] font-bold text-[#a78bfa]">LV</span>
                <span className="text-[9px] font-bold text-[#f0f0f8]">{room.roomLevel || 1}</span>
              </div>
              <span className="text-[9px] text-[#5a6080] font-mono">#{room.hostId?.substring(0, 8) || '----'}</span>
              <span className="text-[9px] text-[#5a6080]">{listenerCount} مستمع</span>
            </div>
          </div>

          {/* Settings + Exit + Share — left side in RTL */}
          <div className="flex items-center gap-2">
            {canDo(myRole, 'admin') && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-[34px] h-[34px] rounded-[10px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] flex items-center justify-center active:bg-[#232843] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#9ca3c4]" />
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#ef4444] active:bg-[rgba(239,68,68,0.25)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="w-[34px] h-[34px] rounded-[10px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] flex items-center justify-center active:bg-[#232843] transition-colors"
            >
              <Link2 className="w-4 h-4 text-[#9ca3c4]" />
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════
            AUDIENCE ROW: trophy (right RTL) + scrollable listeners + user count (left RTL)
            ══════════════════════════════════════════════ */}
        <section className="bg-transparent px-3 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Right side (RTL): Trophy pill + weekly gems */}
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-[rgba(245,158,11,0.12)] rounded-full px-2.5 py-1">
              <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center">
                <Trophy className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[11px] text-[#f59e0b] font-bold tabular-nums">{weeklyGems.toLocaleString('ar-SA')}</span>
            </div>

            {/* Center: Scrollable listener avatars — no header label */}
            <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 min-w-0">
              {participants
                .filter(p => p.seatIndex < 0)
                .map(p => {
                  const isGuestUser = !p.username || p.userId?.startsWith('guest-');
                  return (
                    <button
                      key={p.userId}
                      onClick={() => setProfileSheet(p)}
                      className="flex-shrink-0 active:scale-95 transition-transform"
                    >
                      <div className="relative">
                        <div
                          className={`w-[34px] h-[34px] rounded-full overflow-hidden flex items-center justify-center shadow-sm ${
                            isGuestUser
                              ? 'opacity-50'
                              : ''
                          }`}
                          style={{ background: getAvatarColor(p.userId) }}
                        >
                          {p.avatar ? (
                            <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-white">{p.displayName.charAt(0)}</span>
                          )}
                        </div>
                        {isGuestUser && (
                          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-[#5a6080] border-2 border-[#0d0f1a] flex items-center justify-center">
                            <span className="text-[5px] leading-none text-white">?</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Left side (RTL): User count pill */}
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-[rgba(108,99,255,0.12)] rounded-full px-2.5 py-1">
              <div className="w-4 h-4 rounded-full bg-[#6c63ff] flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[11px] text-[#a78bfa] font-bold tabular-nums">{participants.length}</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            MIC GRID: 5 per row, 52px avatars
            ══════════════════════════════════════════════ */}
        <section className="bg-transparent px-3 py-3.5 pb-2.5 border-b border-[rgba(255,255,255,0.07)] flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-[#5a6080]">المنابر الصوتية</span>
            <span className="text-[10px] bg-[rgba(108,99,255,0.15)] text-[#a78bfa] border border-[rgba(108,99,255,0.3)] rounded-full px-2 py-0.5">
              {room.micSeatCount} مايك
            </span>
          </div>
          {/* Grid: exactly 5 per row */}
          <div className="grid grid-cols-5 gap-x-1.5 gap-y-2.5">
            {seats.map((seat) => (
              <MicSeat
                key={seat.seatIndex}
                seatIndex={seat.seatIndex}
                seatData={seat}
                currentUserId={currentUserId}
                myRole={myRole}
                hostId={room.hostId}
                onClick={() => handleSeatClick(seat.seatIndex)}
              />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CHAT AREA: session-only, scrollable
            ══════════════════════════════════════════════ */}
        <section className="flex-1 overflow-y-auto px-3 py-2.5 scrollbar-hide" style={{ minHeight: 0 }}>
          <div className="flex flex-col gap-1.5">
            {chatMessages.length === 0 && (
              <p className="text-center text-[10px] text-[#5a6080] py-4">ابدأ المحادثة...</p>
            )}

            {chatMessages.map((msg) => (
              <div key={msg.id}>
                {msg.isGift ? (
                  /* Gift notification pill */
                  <div className="self-center animate-fade-up flex justify-center">
                    <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-full px-3.5 py-1 text-[10.5px] text-[#f59e0b] flex items-center gap-1.5">
                      <span>{msg.text}</span>
                    </div>
                  </div>
                ) : msg.isSystem ? (
                  <p className="text-center text-[10px] text-[#5a6080] py-0.5 italic animate-fade-up">{msg.text}</p>
                ) : (
                  /* Normal chat message */
                  <div className="flex items-start gap-1.5 animate-fade-up">
                    <button
                      onClick={() => {
                        const p = participants.find(p => p.userId === msg.userId);
                        if (p) {
                          setProfileSheet(p);
                        } else {
                          setProfileSheet({
                            id: '', roomId, userId: msg.userId, username: '',
                            displayName: msg.displayName, avatar: msg.avatar || '',
                            isMuted: false, micFrozen: false, role: 'visitor' as RoomRole,
                            seatIndex: -1, seatStatus: 'open' as SeatStatus, vipLevel: 0,
                            joinedAt: new Date().toISOString(),
                          });
                        }
                      }}
                      className="flex-shrink-0 mt-0.5 active:scale-95 transition-transform"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                        style={{ background: getAvatarColor(msg.userId) }}
                      >
                        {msg.avatar ? (
                          <img src={msg.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-white">{msg.displayName.charAt(0)}</span>
                        )}
                      </div>
                    </button>
                    <div className="bg-[#1c2035] border border-[rgba(255,255,255,0.07)] rounded-[12px_4px_12px_12px] px-2.5 py-1.5 max-w-[75%]">
                      <button
                        onClick={() => {
                          const p = participants.find(p => p.userId === msg.userId);
                          if (p) {
                            setProfileSheet(p);
                          } else {
                            setProfileSheet({
                              id: '', roomId, userId: msg.userId, username: '',
                              displayName: msg.displayName, avatar: msg.avatar || '',
                              isMuted: false, micFrozen: false, role: 'visitor' as RoomRole,
                              seatIndex: -1, seatStatus: 'open' as SeatStatus, vipLevel: 0,
                              joinedAt: new Date().toISOString(),
                            });
                          }
                        }}
                        className="text-[10px] font-bold mb-0.5 text-right w-full"
                        style={{ color: getSenderColor(msg.userId) }}
                      >
                        {msg.displayName}
                      </button>
                      <div className="text-[12px] text-[#9ca3c4] leading-relaxed break-words">{msg.text}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BOTTOM BAR: mute-room + mic-toggle + chat-input + gift
            ══════════════════════════════════════════════ */}
        <footer className="bg-transparent border-t border-[rgba(108,99,255,0.18)] px-3 py-2.5 pb-5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mute room button — only for admin+ */}
            {canDo(myRole, 'admin') && (
            <button
              onClick={handleToggleRoomMute}
              className={`w-[38px] h-[38px] rounded-full bg-[#1c2035] border flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${
                isRoomMuted
                  ? 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)]'
                  : 'border-[rgba(255,255,255,0.07)]'
              }`}
            >
              {isRoomMuted
                ? <VolumeX className="w-[18px] h-[18px] text-[#ef4444]" />
                : <Volume2 className="w-[18px] h-[18px] text-[#9ca3c4]" />
              }
            </button>
            )}

            {/* Mic toggle — only when user is on a seat */}
            {isOnSeat && (
              <button
                onClick={handleToggleMic}
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${
                  isMicMuted
                    ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]'
                    : 'bg-[rgba(34,197,94,0.15)] border border-[#22c55e]'
                }`}
              >
                {isMicMuted
                  ? <MicOff className="w-[18px] h-[18px] text-[#ef4444]" />
                  : <Mic className="w-[18px] h-[18px] text-[#22c55e]" />
                }
              </button>
            )}

            {/* Chat input */}
            <div className="flex-1 bg-[#1c2035] border border-[rgba(255,255,255,0.07)] rounded-full flex items-center px-3.5 h-[38px] gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={!authUser ? 'سجل دخولك للمشاركة في المحادثة' : isRoomMuted ? 'المحادثة مكتومة' : 'اكتب رسالة...'}
                disabled={isRoomMuted || !authUser}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#f0f0f8] placeholder:text-[#5a6080] disabled:opacity-50"
                dir="rtl"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isRoomMuted || !authUser}
                className="w-[26px] h-[26px] rounded-full bg-[#6c63ff] flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Gift button - only for registered users */}
            {authUser && (
            <button
              onClick={() => setGiftSheetOpen(true)}
              className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg active:scale-95 transition-transform"
            >
              <Gift className="w-[18px] h-[18px] text-white" />
            </button>
            )}
          </div>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════
          BOTTOM SHEETS & DIALOGS
          ══════════════════════════════════════════════ */}

      <MicMenuBottomSheet
        isOpen={micMenuSheet.isOpen}
        onClose={() => setMicMenuSheet(prev => ({ ...prev, isOpen: false }))}
        seatIndex={micMenuSheet.seatIndex}
        participant={micMenuSheet.participant}
        isSeatLocked={(room.lockedSeats || []).includes(micMenuSheet.seatIndex)}
        onAction={handleMicMenuAction}
        currentUserId={currentUserId}
        myRole={myRole}
        mySeatIndex={micMenuSheet.mySeatIndex}
      />

      <ProfileBottomSheet
        isOpen={!!profileSheet}
        onClose={() => setProfileSheet(null)}
        participant={profileSheet}
        stats={profileStats}
        onGiftClick={() => setGiftSheetOpen(true)}
        myRole={myRole}
        authUserId={authUser?.id || ''}
        hostId={room.hostId}
        onInviteToMic={handleInviteToMic}
        onRemoveRole={async (userId: string) => {
          try {
            const res = await fetch(`/api/voice-rooms/${roomId}?action=change-role`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId: userId, newRole: 'visitor' }),
            });
            const data = await res.json();
            if (data.success) {
              toast({ title: 'تم إزالة الدور', description: 'أصبح المستخدم زائراً في الغرفة' });
              await fetchParticipants();
              await fetchMyParticipant();
            } else {
              toast({ title: 'فشل الإزالة', description: data.error || 'لا يمكنك إزالة هذا الدور' });
            }
          } catch {
            toast({ title: 'خطأ في الاتصال' });
          }
        }}
        onKickTemp={(userId: string) => {
          fetch(`/api/voice-rooms/${roomId}?action=kick-from-room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId, durationMinutes: 10 }),
          }).then(r => r.json()).then(d => {
            if (d.success) { toast({ title: 'تم طرده مؤقتاً' }); fetchParticipants(); }
          }).catch(() => {});
        }}
        onBanUser={(userId: string) => {
          fetch(`/api/voice-rooms/${roomId}?action=ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId }),
          }).then(r => r.json()).then(d => {
            if (d.success) { toast({ title: 'تم طرده نهائياً' }); fetchParticipants(); }
          }).catch(() => {});
        }}
        onChangeRole={async (userId: string, newRole: RoomRole) => {
          try {
            // For granting membership to visitors, use invitation system
            if (newRole === 'member') {
              const res = await fetch(`/api/voice-rooms/${roomId}?action=invite-role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, newRole }),
              });
              const data = await res.json();
              if (data.success) {
                toast({ title: 'تم إرسال دعوة العضوية ⭐', description: 'بانتظار قبول المستخدم' });
              } else {
                toast({ title: 'فشل إرسال الدعوة', description: data.error || 'حاول مرة أخرى' });
              }
              return;
            }
            // For other role changes (admin, coowner), change directly
            const res = await fetch(`/api/voice-rooms/${roomId}?action=change-role`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetUserId: userId, newRole }),
            });
            const data = await res.json();
            if (data.success) {
              toast({ title: `تم تغيير الدور إلى ${ROLE_LABELS[newRole]}` });
              await fetchParticipants();
              await fetchMyParticipant();
            } else {
              toast({ title: 'فشل تغيير الدور', description: data.error || 'حاول مرة أخرى' });
            }
          } catch {
            toast({ title: 'خطأ في الاتصال' });
          }
        }}
      />

      <GiftBottomSheet
        isOpen={giftSheetOpen}
        onClose={() => setGiftSheetOpen(false)}
        gifts={gifts}
        onSendGift={handleSendGift}
      />

      <SettingsBottomSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={room}
        onUpdate={handleUpdateSettings}
      />

      <KickDurationDialog
        isOpen={kickDialogOpen}
        onClose={() => setKickDialogOpen(false)}
        onConfirm={(minutes) => { handleKickTemp(minutes); setKickDialogOpen(false); }}
      />

      <PasswordDialog
        isOpen={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSubmit={() => { setPasswordDialogOpen(false); }}
      />

      {/* Membership invitation dialog */}
      <MembershipInviteDialog
        isOpen={!!pendingInvite}
        onClose={() => setPendingInvite('')}
        onAccept={handleAcceptInvite}
        onReject={handleRejectInvite}
        pendingRole={pendingInvite}
      />

      {/* Mic invitation dialog */}
      <MicInviteDialog
        isOpen={pendingMicInvite >= 0}
        onClose={() => setPendingMicInvite(-1)}
        onAccept={handleAcceptMicInvite}
        onReject={handleRejectMicInvite}
        seatIndex={pendingMicInvite}
      />

      {/* Room info sheet */}
      <RoomInfoSheet
        isOpen={roomInfoOpen}
        onClose={() => setRoomInfoOpen(false)}
        room={{
          id: room.id,
          name: room.name,
          description: room.description || '',
          hostId: room.hostId,
          hostName: room.hostName || '',
          roomLevel: room.roomLevel || 1,
          roomImage: room.roomImage || '',
          micSeatCount: room.micSeatCount || 10,
          maxParticipants: room.maxParticipants || 50,
          joinPrice: (room as any).joinPrice || 0,
          isAutoMode: room.isAutoMode !== false,
          roomMode: room.roomMode || 'public',
        }}
        participantCount={participants.length}
        weeklyGems={weeklyGems}
        onJoin={() => { setRoomInfoOpen(false); }}
        onFollow={() => { toast({ title: 'تمت المتابعة' }); }}
        isFollowing={false}
        isJoined={!!myParticipant}
        members={participants
          .filter(p => ['owner', 'coowner', 'admin', 'member'].includes(p.role))
          .map(p => ({
            userId: p.userId,
            displayName: p.displayName,
            avatar: p.avatar,
            role: p.role,
            joinedAt: p.joinedAt,
          }))}
        topGifts={topGifts}
        userGems={0}
      />
      </div>
        {/* End relative z-10 */}
      </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function VoiceRoomsPage() {
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
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

  // Restore active room from localStorage on mount
  useEffect(() => {
    try {
      const savedRoomId = localStorage.getItem('vr_active_room');
      if (savedRoomId) {
        // Verify we're still in the room by checking our participant record
        Promise.all([
          fetch(`/api/voice-rooms/${savedRoomId}?action=room-details`).then(r => r.json()),
          fetch(`/api/voice-rooms/${savedRoomId}?action=my-participant`).then(r => r.json()),
        ]).then(([roomData, partData]) => {
          if (roomData.success && roomData.room && partData.success && partData.participant) {
            const room = { ...roomData.room, lockedSeats: roomData.room.lockedSeats || [] };
            setActiveRoom(room);
          } else {
            localStorage.removeItem('vr_active_room');
          }
          setRestoring(false);
        }).catch(() => {
          localStorage.removeItem('vr_active_room');
          setRestoring(false);
        });
      } else {
        setRestoring(false);
      }
    } catch {
      setRestoring(false);
    }
  }, []);

  const handleRoomUpdate = useCallback((updatedRoom: VoiceRoom) => {
    setActiveRoom(updatedRoom);
    try { localStorage.setItem('vr_active_room', updatedRoom.id); } catch {}
  }, []);

  const handleJoinRoom = useCallback(async (room: VoiceRoom) => {
    if (room.roomMode === 'key' && !room.roomPassword) {
      // Would need password dialog in real flow
    }

    try {
      const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser?.username || '',
          displayName: authUser?.displayName || '',
          avatar: authUser?.avatar || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom(room);
        try { localStorage.setItem('vr_active_room', room.id); } catch {}
      } else {
        toast({ title: 'لا يمكن الانضمام', description: data.error || 'حاول مرة أخرى' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال' });
    }
  }, [authUser, toast]);

  const handleCreateRoom = useCallback(async (data: {
    name: string; description: string; micSeatCount: number;
    roomMode: RoomMode; roomPassword: string; maxParticipants: number;
    isAutoMode: boolean; micTheme: string;
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

        await handleJoinRoom(result.room);
      }
    } catch { /* ignore */ }
  }, [authUser, handleJoinRoom]);

  const handleExitRoom = useCallback(async (alreadyCalledLeave?: boolean) => {
    try {
      if (!alreadyCalledLeave) {
        const savedRoomId = localStorage.getItem('vr_active_room');
        if (savedRoomId) {
          await fetch(`/api/voice-rooms/${savedRoomId}?action=leave`, { method: 'POST' });
        }
      }
    } catch { /* ignore */ }
    setActiveRoom(null);
    try { localStorage.removeItem('vr_active_room'); } catch {}
  }, []);

  // Show loading while restoring room
  if (restoring) {
    return (
      <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 text-[#6c63ff] animate-spin" />
      </div>
    );
  }

  if (activeRoom) {
    return <RoomInteriorView room={activeRoom} onExit={handleExitRoom} authUser={authUser} onRoomUpdate={handleRoomUpdate} />;
  }

  return <RoomListView onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} authUser={authUser} />;
}
