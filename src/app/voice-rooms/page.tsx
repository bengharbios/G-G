'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, MicOff, LogOut, Gift, Plus, Users, Lock, Volume2,
  X, Loader2, Crown, Send, Radio, Eye, MessageCircle,
  Sparkles, ArrowLeft, Settings, Headphones, Shield,
  Star, UserMinus, Snowflake, Ban, Unlock, Key, UserPlus,
  Globe, EyeOff, ChevronDown, AlertTriangle, Clock,
  List, ScrollText, HandMetal, ShieldCheck, Swords, Ghost,
  Check, CircleDot, ChevronUp, ShieldAlert, UserX,
  VolumeX, Megaphone, Hand, Heart, Zap, Gem, Trophy,
  RotateCcw, Copy, Trash2, Edit3
} from 'lucide-react';

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
  participantCount?: number; createdAt: string;
}

interface VoiceRoomParticipant {
  id: string; roomId: string; userId: string; username: string; displayName: string;
  avatar: string; isMuted: boolean; micFrozen: boolean; role: RoomRole;
  seatIndex: number; seatStatus: SeatStatus; vipLevel: number; joinedAt: string;
}

interface RoomWaitlist {
  id: string; roomId: string; userId: string; username: string; displayName: string;
  avatar: string; vipLevel: number; requestedSeat: number; createdAt: string;
}

interface RoomActionLog {
  id: string; roomId: string; actorId: string; actorName: string; action: string;
  targetId: string; targetName: string; details: string; createdAt: string;
}

interface Gift {
  id: string; name: string; nameAr: string; emoji: string; price: number;
}

interface RoomBan {
  id: string; roomId: string; userId: string; bannedBy: string; reason: string; createdAt: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

const ROLE_POWER: Record<RoomRole, number> = {
  owner: 5, coowner: 4, admin: 3, member: 2, visitor: 1,
};

const ROLE_LABELS: Record<RoomRole, string> = {
  owner: 'المالك', coowner: 'النائب', admin: 'إدارة', member: 'عضو', visitor: 'زائر',
};

const ROLE_COLORS: Record<RoomRole, string> = {
  owner: 'text-amber-400', coowner: 'text-purple-400', admin: 'text-blue-400',
  member: 'text-green-400', visitor: 'text-slate-400',
};

const ROLE_BG: Record<RoomRole, string> = {
  owner: 'bg-amber-500/20 border-amber-500/40', coowner: 'bg-purple-500/20 border-purple-500/40',
  admin: 'bg-blue-500/20 border-blue-500/40', member: 'bg-green-500/20 border-green-500/40',
  visitor: 'bg-slate-500/20 border-slate-500/40',
};

const ROLE_ICONS: Record<RoomRole, typeof Crown> = {
  owner: Crown, coowner: Shield, admin: Star, member: CircleDot, visitor: Users,
};

const SEAT_STATUS_CONFIG: Record<SeatStatus, { label: string; color: string; icon: typeof Lock; border: string }> = {
  open: { label: 'متاح', color: 'text-slate-400', icon: Plus, border: 'border-dashed border-slate-600/60' },
  locked: { label: 'مقفل', color: 'text-red-400', icon: Lock, border: 'border-red-500/50' },
  request: { label: 'طلب', color: 'text-yellow-400', icon: Clock, border: 'border-yellow-500/50' },
  reserved: { label: 'محجوز', color: 'text-purple-400', icon: UserPlus, border: 'border-purple-500/50' },
};

const MIC_LAYOUTS = [
  { value: 5, label: '٥ مايكات', desc: 'صف واحد × ٥ مقاعد' },
  { value: 10, label: '١٠ مايكات', desc: 'صفين × ٥ مقاعد' },
  { value: 11, label: '١١ مايك', desc: 'مقدم + صفين × ٥' },
  { value: 15, label: '١٥ مايك', desc: '٣ صفوف × ٥ مقاعد' },
] as const;

const MIC_THEMES = [
  { value: 'default', label: 'افتراضي', gradient: 'from-purple-500/30 to-pink-500/30' },
  { value: 'ocean', label: 'محيط', gradient: 'from-cyan-500/30 to-blue-500/30' },
  { value: 'forest', label: 'غابة', gradient: 'from-green-500/30 to-emerald-500/30' },
  { value: 'sunset', label: 'غروب', gradient: 'from-orange-500/30 to-red-500/30' },
  { value: 'galaxy', label: 'مجرة', gradient: 'from-violet-500/30 to-fuchsia-500/30' },
  { value: 'gold', label: 'ذهبي', gradient: 'from-amber-500/30 to-yellow-500/30' },
] as const;

const ROOM_MODE_OPTIONS: { value: RoomMode; label: string; icon: typeof Globe; desc: string }[] = [
  { value: 'public', label: 'عام', icon: Globe, desc: 'يمكن لأي شخص الدخول' },
  { value: 'key', label: 'بكلمة سر', icon: Key, desc: 'تحتاج كلمة مرور' },
  { value: 'private', label: 'خاص', icon: EyeOff, desc: 'دعوات فقط' },
];

const AVATAR_GRADIENTS = [
  'from-purple-500 to-pink-600', 'from-cyan-500 to-blue-600', 'from-green-500 to-emerald-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-red-600', 'from-violet-500 to-fuchsia-600',
  'from-teal-500 to-green-600', 'from-pink-500 to-rose-600',
];

function getAvatarGradient(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const FALLBACK_GIFTS: Gift[] = [
  { id: 'g1', name: 'Rose', nameAr: 'وردة', emoji: '🌹', price: 1 },
  { id: 'g2', name: 'Heart', nameAr: 'قلب', emoji: '❤️', price: 5 },
  { id: 'g3', name: 'Star', nameAr: 'نجمة', emoji: '⭐', price: 10 },
  { id: 'g4', name: 'Crown', nameAr: 'تاج', emoji: '👑', price: 50 },
  { id: 'g5', name: 'Diamond', nameAr: 'ألماس', emoji: '💎', price: 100 },
  { id: 'g6', name: 'Fire', nameAr: 'نار', emoji: '🔥', price: 20 },
  { id: 'g7', name: 'Gift Box', nameAr: 'هدية', emoji: '🎁', price: 15 },
  { id: 'g8', name: 'Rocket', nameAr: 'صاروخ', emoji: '🚀', price: 200 },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function hasPower(myRole: RoomRole, required: RoomRole): boolean {
  return ROLE_POWER[myRole] >= ROLE_POWER[required];
}

function canDo(action: string, myRole: RoomRole): boolean {
  switch (action) {
    case 'close-room':
    case 'transfer-ownership':
    case 'set-coowner':
      return myRole === 'owner';
    case 'change-room-mode':
    case 'change-password':
      return myRole === 'owner';
    case 'change-admin':
    case 'change-member':
    case 'freeze-mic':
    case 'update-settings':
    case 'set-seat-status':
      return hasPower(myRole, 'coowner');
    case 'kick-from-mic':
    case 'kick-from-room':
    case 'ban':
    case 'manage-waitlist':
    case 'assign-seat':
      return hasPower(myRole, 'admin');
    case 'mute-self':
    case 'leave-seat':
    case 'send-gift':
      return hasPower(myRole, 'visitor');
    case 'request-seat':
      return myRole === 'visitor';
    default:
      return false;
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function getActionColor(action: string): string {
  if (action.includes('join')) return 'text-green-400';
  if (action.includes('leave') || action.includes('kick')) return 'text-red-400';
  if (action.includes('ban')) return 'text-red-500';
  if (action.includes('role') || action.includes('admin')) return 'text-purple-400';
  if (action.includes('gift')) return 'text-amber-400';
  if (action.includes('freeze') || action.includes('unfreeze')) return 'text-blue-400';
  if (action.includes('seat') || action.includes('mic')) return 'text-cyan-400';
  if (action.includes('transfer') || action.includes('owner')) return 'text-amber-500';
  return 'text-slate-400';
}

/* ═══════════════════════════════════════════════════════════════════════
   AVATAR COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

function UserAvatar({
  userId, avatar, displayName, size = 'md',
  border, showStatus, isMuted, micFrozen,
}: {
  userId: string; avatar?: string; displayName: string; size?: 'sm' | 'md' | 'lg';
  border?: string; showStatus?: boolean; isMuted?: boolean; micFrozen?: boolean;
}) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-14 h-14 sm:w-16 sm:h-16 text-lg', lg: 'w-20 h-20 text-2xl' };
  const gradient = getAvatarGradient(userId);
  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-2 ${border || 'border-transparent'} overflow-hidden`}>
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="font-bold text-white">{displayName.charAt(0)}</span>
        )}
      </div>
      {showStatus && isMuted && (
        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center">
          <MicOff className="w-2.5 h-2.5 text-red-400" />
        </div>
      )}
      {showStatus && !isMuted && micFrozen && (
        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-slate-900 border-2 border-blue-500/50 rounded-full flex items-center justify-center">
          <Snowflake className="w-2.5 h-2.5 text-blue-400" />
        </div>
      )}
      {showStatus && !isMuted && !micFrozen && (
        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MIC SEAT COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

function MicSeat({
  seatIndex,
  participant,
  seatStatus,
  currentUserId,
  myRole,
  micTheme,
  onClick,
}: {
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  seatStatus: SeatStatus;
  currentUserId: string;
  myRole: RoomRole;
  micTheme: string;
  onClick: () => void;
}) {
  const isCurrentUser = participant?.userId === currentUserId;
  const statusCfg = SEAT_STATUS_CONFIG[seatStatus];
  const StatusIcon = statusCfg.icon;
  const theme = MIC_THEMES.find(t => t.value === micTheme) || MIC_THEMES[0];
  const RoleIcon = participant ? ROLE_ICONS[participant.role] : null;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer group w-full max-w-[80px] sm:max-w-[90px]"
    >
      {/* Avatar area */}
      <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
        participant
          ? `${isCurrentUser ? 'ring-2 ring-purple-400/50 ' : ''}bg-gradient-to-br ${getAvatarGradient(participant.userId)} border-white/20 shadow-lg`
          : `border-2 ${statusCfg.border} bg-gradient-to-br ${theme.gradient} bg-opacity-30`
      }`}>
        {participant ? (
          <>
            {participant.avatar ? (
              <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg sm:text-xl font-bold text-white">{participant.displayName.charAt(0)}</span>
            )}

            {/* Role badge top-right */}
            {RoleIcon && (
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${ROLE_BG[participant.role]}`}>
                <RoleIcon className="w-3 h-3" />
              </div>
            )}

            {/* Status indicator bottom-left */}
            <div className="absolute -bottom-1 -left-1">
              {participant.micFrozen ? (
                <div className="w-6 h-6 bg-slate-900 border-2 border-blue-500/50 rounded-full flex items-center justify-center">
                  <Snowflake className="w-3 h-3 text-blue-400" />
                </div>
              ) : participant.isMuted ? (
                <div className="w-6 h-6 bg-slate-900 border-2 border-red-500/50 rounded-full flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-red-400" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* VIP badge bottom-right */}
            {participant.vipLevel > 0 && (
              <div className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center px-0.5 shadow-lg shadow-amber-500/30">
                <span className="text-[8px] font-bold text-slate-900">{participant.vipLevel}</span>
              </div>
            )}
          </>
        ) : (
          <StatusIcon className={`w-5 h-5 ${statusCfg.color} opacity-50`} />
        )}
      </div>

      {/* Info below */}
      <div className="text-center w-full">
        {participant ? (
          <>
            <p className={`text-[10px] sm:text-xs font-medium truncate ${ROLE_COLORS[participant.role]}`}>
              {participant.displayName}
            </p>
            <p className="text-[8px] text-slate-500">{ROLE_LABELS[participant.role]}</p>
          </>
        ) : (
          <p className={`text-[9px] ${statusCfg.color}`}>{statusCfg.label}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MIC GRID LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function MicGridLayout({
  participants,
  seatCount,
  hostId,
  currentUserId,
  myRole,
  micTheme,
  onSeatClick,
}: {
  participants: VoiceRoomParticipant[];
  seatCount: number;
  hostId: string;
  currentUserId: string;
  myRole: RoomRole;
  micTheme: string;
  onSeatClick: (seatIndex: number, participant: VoiceRoomParticipant | null) => void;
}) {
  const isHostLayout = seatCount === 11;

  // Build seat map: seatIndex -> participant
  const seatMap = new Map<number, VoiceRoomParticipant>();
  participants.forEach(p => {
    if (p.seatIndex >= 0) seatMap.set(p.seatIndex, p);
  });

  if (isHostLayout) {
    const hostParticipant = seatMap.get(0) || participants.find(p => p.userId === hostId) || null;
    const row2: (VoiceRoomParticipant | null)[] = [];
    const row3: (VoiceRoomParticipant | null)[] = [];

    for (let i = 1; i <= 5; i++) row2.push(seatMap.get(i) || null);
    for (let i = 6; i <= 10; i++) row3.push(seatMap.get(i) || null);

    return (
      <div className="flex flex-col items-center gap-5">
        {/* Host row */}
        <div className="flex justify-center">
          <MicSeat
            seatIndex={0}
            participant={hostParticipant}
            seatStatus={hostParticipant ? 'open' : 'open'}
            currentUserId={currentUserId}
            myRole={myRole}
            micTheme={micTheme}
            onClick={() => onSeatClick(0, hostParticipant)}
          />
        </div>

        <div className="flex items-center gap-3 w-full max-w-sm px-4">
          <div className="flex-1 h-px bg-gradient-to-l from-purple-500/40 to-transparent" />
          <Sparkles className="w-4 h-4 text-purple-400/60" />
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
        </div>

        {[row2, row3].map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            {row.map((p, i) => {
              const idx = rowIdx === 0 ? i + 1 : i + 6;
              const status = p ? 'open' : (idx === 1 ? 'open' : 'open');
              return (
                <MicSeat
                  key={idx}
                  seatIndex={idx}
                  participant={p}
                  seatStatus={status}
                  currentUserId={currentUserId}
                  myRole={myRole}
                  micTheme={micTheme}
                  onClick={() => onSeatClick(idx, p)}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Standard grid: always 5 per row
  const totalRows = Math.ceil(seatCount / 5);
  const rows: { idx: number; p: VoiceRoomParticipant | null }[][] = [];

  for (let r = 0; r < totalRows; r++) {
    const row: { idx: number; p: VoiceRoomParticipant | null }[] = [];
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c;
      if (idx < seatCount) {
        row.push({ idx, p: seatMap.get(idx) || null });
      }
    }
    if (row.length > 0) rows.push(row);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-2 sm:gap-3 flex-wrap">
          {row.map(({ idx, p }) => (
            <MicSeat
              key={idx}
              seatIndex={idx}
              participant={p}
              seatStatus={p ? 'open' : 'open'}
              currentUserId={currentUserId}
              myRole={myRole}
              micTheme={micTheme}
              onClick={() => onSeatClick(idx, p)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AUDIENCE ROW
   ═══════════════════════════════════════════════════════════════════════ */

function AudienceRow({
  participants,
  onUserClick,
}: {
  participants: VoiceRoomParticipant[];
  onUserClick: (participant: VoiceRoomParticipant) => void;
}) {
  if (participants.length === 0) return null;

  return (
    <div className="mt-5 pt-3 border-t border-slate-800/40">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] text-slate-500 font-medium">المشاهدون ({participants.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {participants.slice(0, 24).map((p) => (
          <div
            key={p.id}
            onClick={() => onUserClick(p)}
            className="relative cursor-pointer hover:scale-110 transition-transform"
            title={p.displayName}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br overflow-hidden border border-slate-700/50 flex items-center justify-center">
              {p.avatar ? (
                <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{p.displayName.charAt(0)}</span>
              )}
            </div>
            {p.vipLevel > 0 && (
              <div className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center px-0.5">
                <span className="text-[6px] font-bold text-slate-900">{p.vipLevel}</span>
              </div>
            )}
          </div>
        ))}
        {participants.length > 24 && (
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
            <span className="text-[10px] text-slate-400">+{participants.length - 24}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SLIDE-UP PANEL WRAPPER
   ═══════════════════════════════════════════════════════════════════════ */

function SlideUpPanel({
  isOpen, onClose, title, icon, children, className = '',
}: {
  isOpen: boolean; onClose: () => void; title: string; icon?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/50 rounded-t-3xl max-h-[75vh] flex flex-col ${className}`}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                {icon}
                <h3 className="text-sm font-bold text-white">{title}</h3>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAT PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function ChatPanel({
  isOpen, onClose, messages, chatMuted, chatInput, setChatInput, onSend,
}: {
  isOpen: boolean; onClose: () => void; messages: ChatMessage[];
  chatMuted: boolean; chatInput: string; setChatInput: (v: string) => void; onSend: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <SlideUpPanel isOpen={isOpen} onClose={onClose} title="المحادثة" icon={<MessageCircle className="w-4 h-4 text-purple-400" />}>
      <div className="space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-600 py-8">ابدأ المحادثة...</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.isSystem ? (
              <p className="text-center text-[10px] text-slate-500 py-1 italic">{msg.text}</p>
            ) : (
              <div className="flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(msg.userId)} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                  {msg.avatar ? (
                    <img src={msg.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-white">{msg.displayName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-purple-300">{msg.displayName}</span>
                    <span className="text-[8px] text-slate-600">{msg.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{msg.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {!chatMuted ? (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/50">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="اكتب رسالة..."
            className="h-9 text-xs bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl"
          />
          <Button size="sm" onClick={onSend} className="h-9 w-9 p-0 bg-purple-600 hover:bg-purple-500 rounded-xl flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-800/50 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5" /> المحادثة مكتومة
          </p>
        </div>
      )}
    </SlideUpPanel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GIFT PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function GiftPanel({
  isOpen, onClose, gifts, targetName, onSendGift,
}: {
  isOpen: boolean; onClose: () => void; gifts: Gift[];
  targetName: string; onSendGift: (giftId: string) => void;
}) {
  return (
    <SlideUpPanel isOpen={isOpen} onClose={onClose} title={`إرسال هدية إلى ${targetName}`} icon={<Gift className="w-4 h-4 text-amber-400" />}>
      <div className="grid grid-cols-4 gap-2">
        {(gifts.length > 0 ? gifts : FALLBACK_GIFTS).map((gift) => (
          <motion.button
            key={gift.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSendGift(gift.id)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all hover:scale-105 border border-slate-700/30"
          >
            <span className="text-2xl">{gift.emoji}</span>
            <span className="text-[9px] text-slate-400 truncate w-full text-center">{gift.nameAr || gift.name}</span>
            <span className="text-[8px] text-amber-400 font-medium">
              {gift.price > 0 ? `${gift.price} جوهرة` : 'مجاني'}
            </span>
          </motion.button>
        ))}
      </div>
    </SlideUpPanel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function SettingsPanel({
  isOpen, onClose, room, isOwner, myRole, onUpdate,
}: {
  isOpen: boolean; onClose: () => void; room: VoiceRoom;
  isOwner: boolean; myRole: RoomRole;
  onUpdate: (data: Partial<VoiceRoom>) => void;
}) {
  const [form, setForm] = useState<Partial<VoiceRoom>>(() => ({
    name: room.name,
    description: room.description,
    roomMode: room.roomMode,
    roomPassword: room.roomPassword,
    chatMuted: room.chatMuted,
    isAutoMode: room.isAutoMode,
    giftSplit: room.giftSplit,
    announcement: room.announcement,
    micTheme: room.micTheme,
    bgmEnabled: room.bgmEnabled,
  }));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(form);
    setSaving(false);
    onClose();
  };

  return (
    <SlideUpPanel isOpen={isOpen} onClose={onClose} title="إعدادات الغرفة" icon={<Settings className="w-4 h-4 text-purple-400" />}>
      <div className="space-y-4">
        {/* Room Name */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">اسم الغرفة</label>
          <Input
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-9 text-sm bg-slate-800 border-slate-700 text-white"
            disabled={!isOwner}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">الوصف</label>
          <Input
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="h-9 text-sm bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Mic Theme */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">سمة المايك</label>
          <div className="grid grid-cols-3 gap-2">
            {MIC_THEMES.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setForm({ ...form, micTheme: theme.value })}
                className={`p-2 rounded-xl border text-center transition-all text-[10px] ${
                  form.micTheme === theme.value
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                    : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`w-full h-6 rounded-lg bg-gradient-to-r ${theme.gradient} mb-1`} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Room Mode */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">نوع الغرفة</label>
          <div className="grid grid-cols-3 gap-2">
            {ROOM_MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => isOwner && setForm({ ...form, roomMode: opt.value })}
                  disabled={!isOwner}
                  className={`p-2 rounded-xl border text-center transition-all text-[10px] ${
                    form.roomMode === opt.value
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                      : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Password (key mode) */}
        {form.roomMode === 'key' && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">كلمة المرور</label>
            <Input
              value={form.roomPassword || ''}
              onChange={(e) => setForm({ ...form, roomPassword: e.target.value })}
              placeholder="كلمة المرور"
              className="h-9 text-sm bg-slate-800 border-slate-700 text-white"
              disabled={!isOwner}
            />
          </div>
        )}

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-300">كتم المحادثة</span>
                <p className="text-[9px] text-slate-500">منع الجميع من الكتابة</p>
              </div>
            </div>
            <Switch checked={form.chatMuted} onCheckedChange={(v) => setForm({ ...form, chatMuted: v })} />
          </div>

          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-300">وضع تلقائي</span>
                <p className="text-[9px] text-slate-500">تعيين المقاعد تلقائياً</p>
              </div>
            </div>
            <Switch checked={form.isAutoMode} onCheckedChange={(v) => setForm({ ...form, isAutoMode: v })} />
          </div>

          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-300">موسيقى خلفية</span>
              </div>
            </div>
            <Switch checked={form.bgmEnabled} onCheckedChange={(v) => setForm({ ...form, bgmEnabled: v })} />
          </div>
        </div>

        {/* Gift Split */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">نسبة توزيع الهدايا: {form.giftSplit || 0}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.giftSplit || 0}
            onChange={(e) => setForm({ ...form, giftSplit: Number(e.target.value) })}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Announcement */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">إعلان الغرفة</label>
          <Input
            value={form.announcement || ''}
            onChange={(e) => setForm({ ...form, announcement: e.target.value })}
            placeholder="أضف إعلاناً للمشاركين..."
            className="h-9 text-sm bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-500 rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الإعدادات'}
        </Button>
      </div>
    </SlideUpPanel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   WAITLIST PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function WaitlistPanel({
  isOpen, onClose, waitlist, onApprove, onReject,
}: {
  isOpen: boolean; onClose: () => void; waitlist: RoomWaitlist[];
  onApprove: (waitlistId: string) => void; onReject: (waitlistId: string) => void;
}) {
  return (
    <SlideUpPanel
      isOpen={isOpen}
      onClose={onClose}
      title={`قائمة الانتظار (${waitlist.length})`}
      icon={<Clock className="w-4 h-4 text-yellow-400" />}
    >
      {waitlist.length === 0 ? (
        <p className="text-center text-xs text-slate-600 py-8">لا يوجد أحد في قائمة الانتظار</p>
      ) : (
        <div className="space-y-2">
          {waitlist.map((w) => (
            <div key={w.id} className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(w.userId)} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                {w.avatar ? (
                  <img src={w.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{w.displayName.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{w.displayName}</p>
                <p className="text-[10px] text-slate-500">مقعد {w.requestedSeat >= 0 ? w.requestedSeat + 1 : 'أي مقعد'} · {formatTime(w.createdAt)}</p>
              </div>
              {w.vipLevel > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[9px] px-1.5">
                  VIP{w.vipLevel}
                </Badge>
              )}
              <div className="flex gap-1.5 flex-shrink-0">
                <Button size="sm" onClick={() => onApprove(w.id)} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-[10px]">
                  <Check className="w-3 h-3 ml-0.5" /> قبول
                </Button>
                <Button size="sm" onClick={() => onReject(w.id)} variant="ghost" className="h-7 px-2 text-red-400 hover:bg-red-500/10 text-[10px]">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideUpPanel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACTION LOG PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function ActionLogPanel({
  isOpen, onClose, logs,
}: {
  isOpen: boolean; onClose: () => void; logs: RoomActionLog[];
}) {
  return (
    <SlideUpPanel
      isOpen={isOpen}
      onClose={onClose}
      title="سجل الأحداث"
      icon={<ScrollText className="w-4 h-4 text-slate-400" />}
    >
      {logs.length === 0 ? (
        <p className="text-center text-xs text-slate-600 py-8">لا توجد أحداث بعد</p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 bg-slate-800/30 rounded-lg p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-purple-300">{log.actorName}</span>
                  <span className={`text-[10px] ${getActionColor(log.action)}`}>{log.action}</span>
                  {log.targetName && (
                    <span className="text-[10px] font-medium text-slate-300">{log.targetName}</span>
                  )}
                </div>
                {log.details && (
                  <p className="text-[9px] text-slate-500 mt-0.5">{log.details}</p>
                )}
                <span className="text-[8px] text-slate-600">{formatTime(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideUpPanel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   USER PROFILE MENU
   ═══════════════════════════════════════════════════════════════════════ */

function UserProfileMenu({
  isOpen, onClose, participant, myRole, currentUserId,
  onAction,
}: {
  isOpen: boolean; onClose: () => void; participant: VoiceRoomParticipant;
  myRole: RoomRole; currentUserId: string;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}) {
  const isSelf = participant.userId === currentUserId;
  const RoleIcon = ROLE_ICONS[participant.role];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/50 rounded-t-3xl"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="px-4 pb-3 pt-1 border-b border-slate-800/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">الملف الشخصي</h3>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  userId={participant.userId}
                  avatar={participant.avatar}
                  displayName={participant.displayName}
                  border={`border-2 ${ROLE_BG[participant.role].split(' ')[1]}`}
                  showStatus
                  isMuted={participant.isMuted}
                  micFrozen={participant.micFrozen}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">{participant.displayName}</span>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border ${ROLE_BG[participant.role]}`}>
                      <RoleIcon className="w-3 h-3" />
                      <span className={`text-[9px] font-medium ${ROLE_COLORS[participant.role]}`}>
                        {ROLE_LABELS[participant.role]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">@{participant.username}</span>
                    {participant.vipLevel > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[9px] px-1.5 h-4">
                        VIP{participant.vipLevel}
                      </Badge>
                    )}
                    {participant.seatIndex >= 0 && (
                      <span className="text-[9px] text-slate-500">مقعد {participant.seatIndex + 1}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isSelf && (
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">إجراءات</p>

                  <button
                    onClick={() => { onAction('gift'); onClose(); }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors text-right"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs text-slate-300">إرسال هدية</span>
                  </button>

                  {canDo('kick-from-mic', myRole) && participant.seatIndex >= 0 && (
                    <button
                      onClick={() => { onAction('kick-from-mic'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <MicOff className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-xs text-red-300">طرده من المايك</span>
                    </button>
                  )}

                  {canDo('kick-from-room', myRole) && (
                    <button
                      onClick={() => { onAction('kick-from-room'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <UserMinus className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-xs text-red-300">طرده من الغرفة</span>
                    </button>
                  )}

                  {canDo('ban', myRole) && (
                    <button
                      onClick={() => { onAction('ban'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                        <Ban className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-xs text-red-400">حظره من الغرفة</span>
                    </button>
                  )}

                  {canDo('freeze-mic', myRole) && participant.seatIndex >= 0 && (
                    <button
                      onClick={() => { onAction('freeze-seat'); onClose(); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-blue-500/10 transition-colors text-right"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Snowflake className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-xs text-blue-300">
                        {participant.micFrozen ? 'إلغاء تجميد المايك' : 'تجميد المايك'}
                      </span>
                    </button>
                  )}

                  {/* Change Role */}
                  {myRole === 'owner' && participant.role !== 'owner' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">تغيير الدور</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['coowner', 'admin', 'member', 'visitor'] as RoomRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => { onAction('change-role', { newRole: role }); onClose(); }}
                            disabled={participant.role === role}
                            className={`flex items-center gap-1.5 p-2 rounded-lg text-[10px] transition-colors ${
                              participant.role === role
                                ? 'bg-slate-800/60 text-slate-500'
                                : 'bg-slate-800/30 hover:bg-slate-700/40 text-slate-300'
                            }`}
                          >
                            {(() => { const I = ROLE_ICONS[role]; return <I className="w-3 h-3" />; })()}
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(myRole === 'owner' || myRole === 'coowner') && participant.role !== 'owner' && participant.role !== 'coowner' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['admin', 'member', 'visitor'] as RoomRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => { onAction('change-role', { newRole: role }); onClose(); }}
                            disabled={participant.role === role}
                            className={`flex items-center gap-1.5 p-2 rounded-lg text-[10px] transition-colors ${
                              participant.role === role
                                ? 'bg-slate-800/60 text-slate-500'
                                : 'bg-slate-800/30 hover:bg-slate-700/40 text-slate-300'
                            }`}
                          >
                            {(() => { const I = ROLE_ICONS[role]; return <I className="w-3 h-3" />; })()}
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfer ownership (owner only) */}
                  {myRole === 'owner' && (
                    <div className="pt-2 border-t border-slate-800/50">
                      <button
                        onClick={() => { onAction('transfer-ownership'); onClose(); }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-500/10 transition-colors text-right"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Crown className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs text-amber-300">نقل الملكية</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Self actions */}
              {isSelf && participant.seatIndex >= 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">إجراءاتي</p>
                  <button
                    onClick={() => { onAction('leave-seat'); onClose(); }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors text-right"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700/30 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-300">مغادرة المقعد</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SEAT CONTEXT MENU (for admins on empty seats)
   ═══════════════════════════════════════════════════════════════════════ */

function SeatContextMenu({
  isOpen, onClose, seatIndex, currentStatus, onSetStatus,
}: {
  isOpen: boolean; onClose: () => void; seatIndex: number;
  currentStatus: SeatStatus; onSetStatus: (seatIndex: number, status: SeatStatus) => void;
}) {
  const statuses: SeatStatus[] = ['open', 'locked', 'request', 'reserved'];
  const labels: Record<SeatStatus, string> = {
    open: 'متاح', locked: 'مقفل', request: 'طلب', reserved: 'محجوز',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-2xl min-w-[160px]"
          >
            <p className="text-xs text-slate-400 mb-2 text-center">مقعد {seatIndex + 1}</p>
            <div className="space-y-1">
              {statuses.map((s) => {
                const cfg = SEAT_STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => { onSetStatus(seatIndex, s); onClose(); }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                      currentStatus === s ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOM CARD (List View)
   ═══════════════════════════════════════════════════════════════════════ */

function RoomCard({
  room, index, onClick,
}: {
  room: VoiceRoom; index: number; onClick: () => void;
}) {
  const gradients = [
    'from-purple-600/20 to-pink-600/20',
    'from-cyan-600/20 to-blue-600/20',
    'from-emerald-600/20 to-teal-600/20',
    'from-amber-600/20 to-orange-600/20',
    'from-rose-600/20 to-red-600/20',
    'from-violet-600/20 to-fuchsia-600/20',
  ];
  const modeIcon = room.roomMode === 'public' ? Globe : room.roomMode === 'key' ? Key : EyeOff;
  const ModeIcon = modeIcon;
  const modeLabel = room.roomMode === 'public' ? 'عام' : room.roomMode === 'key' ? 'بكلمة سر' : 'خاص';
  const modeColor = room.roomMode === 'public' ? 'text-green-400 bg-green-500/20' : room.roomMode === 'key' ? 'text-yellow-400 bg-yellow-500/20' : 'text-red-400 bg-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className="bg-gradient-to-br border-slate-800/50 hover:border-purple-500/30 transition-all cursor-pointer overflow-hidden group"
        style={{ backgroundImage: `linear-gradient(to bottom left, var(--tw-gradient-stops))` }}
        onClick={onClick}
      >
        <div className={`bg-gradient-to-br ${gradients[index % gradients.length]}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-sm truncate">{room.name}</h3>
                  <p className="text-[10px] text-slate-400 truncate">بقلم {room.hostName}</p>
                </div>
              </div>
            </div>

            {room.description && (
              <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">{room.description}</p>
            )}

            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={`${modeColor} border-0 text-[9px] px-1.5 h-4 flex items-center gap-0.5`}>
                <ModeIcon className="w-2.5 h-2.5" /> {modeLabel}
              </Badge>
              {room.roomLevel > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[9px] px-1.5 h-4">
                  Lv.{room.roomLevel}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-400">{room.participantCount || 0} / {room.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-400">{room.micSeatCount} مقعد</span>
              </div>
              {(room.participantCount || 0) > 0 && (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CREATE ROOM DIALOG
   ═══════════════════════════════════════════════════════════════════════ */

function CreateRoomDialog({
  open, onOpenChange, onCreate, loading,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onCreate: (data: Record<string, unknown>) => void; loading: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxParticipants: 50,
    roomMode: 'public' as RoomMode,
    roomPassword: '',
    micSeatCount: 10,
    isAutoMode: true,
    micTheme: 'default',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-l from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 rounded-xl">
          <Plus className="w-4 h-4 ml-1.5" />
          إنشاء غرفة
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" />
            إنشاء غرفة صوتية
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            placeholder="اسم الغرفة"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Input
            placeholder="الوصف (اختياري)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />

          {/* Room Mode */}
          <div>
            <label className="text-xs text-slate-300 mb-1.5 block font-medium">نوع الغرفة</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, roomMode: opt.value })}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      form.roomMode === opt.value
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[9px] mt-0.5 opacity-70">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password (key mode) */}
          {form.roomMode === 'key' && (
            <Input
              placeholder="كلمة المرور"
              value={form.roomPassword}
              onChange={(e) => setForm({ ...form, roomPassword: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          )}

          {/* Mic Layout */}
          <div>
            <label className="text-xs text-slate-300 mb-1.5 block font-medium">
              <Mic className="w-4 h-4 inline ml-1 text-purple-400" />
              توزيع المقاعد
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MIC_LAYOUTS.map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => setForm({ ...form, micSeatCount: layout.value })}
                  className={`p-3 rounded-xl border transition-all text-right ${
                    form.micSeatCount === layout.value
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <p className="text-sm font-bold">{layout.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{layout.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Max participants */}
          <div>
            <label className="text-xs text-slate-300 mb-1 block font-medium">
              <Users className="w-4 h-4 inline ml-1 text-purple-400" />
              الحد الأقصى للمشاركين
            </label>
            <Input
              type="number"
              min={2}
              max={500}
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 50 })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Auto mode */}
          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs text-slate-300">وضع تلقائي</span>
                <p className="text-[9px] text-slate-500">تعيين المقاعد تلقائياً</p>
              </div>
            </div>
            <Switch checked={form.isAutoMode} onCheckedChange={(v) => setForm({ ...form, isAutoMode: v })} />
          </div>

          {/* Mic Theme */}
          <div>
            <label className="text-xs text-slate-300 mb-1.5 block">سمة المايك</label>
            <div className="grid grid-cols-3 gap-2">
              {MIC_THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setForm({ ...form, micTheme: theme.value })}
                  className={`p-2 rounded-xl border text-center transition-all text-[10px] ${
                    form.micTheme === theme.value
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                      : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-full h-6 rounded-lg bg-gradient-to-r ${theme.gradient} mb-1`} />
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => onCreate(form)}
            disabled={!form.name.trim() || loading}
            className="w-full bg-gradient-to-l from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الغرفة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function VoiceRoomsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Auth
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // List view
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Room interior
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [roomDetails, setRoomDetails] = useState<VoiceRoom | null>(null);
  const [participants, setParticipants] = useState<VoiceRoomParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<VoiceRoomParticipant | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [waitlist, setWaitlist] = useState<RoomWaitlist[]>([]);
  const [actionLog, setActionLog] = useState<RoomActionLog[]>([]);

  // UI State
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [showJoinPassword, setShowJoinPassword] = useState<string | null>(null);

  // Panels
  const [showChat, setShowChat] = useState(false);
  const [showGift, setShowGift] = useState<string | null>(null); // userId
  const [showSettings, setShowSettings] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showActionLog, setShowActionLog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState<VoiceRoomParticipant | null>(null);
  const [showSeatContext, setShowSeatContext] = useState<number | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);

  // Polling refs
  const pollParticipantsRef = useRef<NodeJS.Timeout | null>(null);
  const pollWaitlistRef = useRef<NodeJS.Timeout | null>(null);
  const pollActionLogRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Auth ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) setUser(data.user);
        else router.push('/');
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
        setLoading(false);
      });
  }, [router]);

  // ─── Load Rooms ────────────────────────────────────────────────────

  const loadRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const res = await fetch('/api/voice-rooms');
      const data = await res.json();
      if (data.success) setRooms(data.rooms || []);
    } catch { /* silent */ }
    finally { setRoomsLoading(false); }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // ─── Polling ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeRoom) return;

    // Poll participants every 5 seconds
    const loadParticipants = async () => {
      try {
        const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=participants`);
        const data = await res.json();
        if (data.success) {
          setParticipants(data.participants || []);
          // Update my participant
          const me = (data.participants || []).find((p: VoiceRoomParticipant) => p.userId === user?.id);
          setMyParticipant(me || null);
        }
      } catch { /* silent */ }
    };

    loadParticipants();
    pollParticipantsRef.current = setInterval(loadParticipants, 5000);

    return () => {
      if (pollParticipantsRef.current) clearInterval(pollParticipantsRef.current);
    };
  }, [activeRoom, user?.id]);

  // Poll waitlist for admins
  useEffect(() => {
    if (!activeRoom || !myParticipant || !canDo('manage-waitlist', myParticipant.role)) return;

    const loadWaitlist = async () => {
      try {
        const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=waitlist`);
        const data = await res.json();
        if (data.success) {
          const sorted = [...(data.waitlist || [])].sort((a, b) => {
            if (b.vipLevel !== a.vipLevel) return b.vipLevel - a.vipLevel;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          setWaitlist(sorted);
        }
      } catch { /* silent */ }
    };

    loadWaitlist();
    pollWaitlistRef.current = setInterval(loadWaitlist, 10000);

    return () => {
      if (pollWaitlistRef.current) clearInterval(pollWaitlistRef.current);
    };
  }, [activeRoom, myParticipant]);

  // Poll action log when panel is open
  useEffect(() => {
    if (!activeRoom || !showActionLog) return;

    const loadLog = async () => {
      try {
        const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=action-log&limit=50`);
        const data = await res.json();
        if (data.success) setActionLog(data.log || []);
      } catch { /* silent */ }
    };

    loadLog();
    pollActionLogRef.current = setInterval(loadLog, 15000);

    return () => {
      if (pollActionLogRef.current) clearInterval(pollActionLogRef.current);
    };
  }, [activeRoom, showActionLog]);

  // ─── Room Actions ──────────────────────────────────────────────────

  const loadRoomDetails = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=room-details`);
      const data = await res.json();
      if (data.success && data.room) setRoomDetails(data.room);
    } catch { /* silent */ }
  };

  const loadGifts = async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom!.id}?action=gifts`);
      const data = await res.json();
      if (data.success && data.gifts) setGifts(data.gifts);
    } catch { /* silent */ }
  };

  const joinRoom = async (room: VoiceRoom) => {
    if (!user) return;

    // If key room, show password dialog
    if (room.roomMode === 'key' && !room.roomPassword) {
      setShowJoinPassword(room.id);
      return;
    }

    setJoiningRoom(room.id);
    try {
      const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar,
          password: room.roomMode === 'key' ? joinPassword : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom(room);
        loadRoomDetails();
        loadGifts();
        addSystemMessage(`انضم ${user.displayName || user.username} إلى الغرفة`);
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل الانضمام', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
    setJoiningRoom(null);
  };

  const joinRoomWithPassword = async () => {
    if (!activeRoom || !user) return;
    const room = rooms.find(r => r.id === showJoinPassword);
    if (!room) return;

    setJoiningRoom(room.id);
    try {
      const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar,
          password: joinPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom(room);
        loadRoomDetails();
        loadGifts();
        setShowJoinPassword(null);
        setJoinPassword('');
        addSystemMessage(`انضم ${user.displayName || user.username} إلى الغرفة`);
      } else {
        toast({ title: 'خطأ', description: data.error || 'كلمة المرور غير صحيحة', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
    setJoiningRoom(null);
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await fetch(`/api/voice-rooms/${activeRoom.id}?action=leave`, { method: 'POST' });
    } catch { /* silent */ }
    addSystemMessage(`غادر ${user?.displayName || user?.username} الغرفة`);
    setActiveRoom(null);
    setRoomDetails(null);
    setParticipants([]);
    setMyParticipant(null);
    setChatMessages([]);
    setShowChat(false);
    setShowGift(null);
    setShowSettings(false);
    setShowWaitlist(false);
    setShowActionLog(false);
    setShowUserProfile(null);
    if (pollParticipantsRef.current) clearInterval(pollParticipantsRef.current);
    if (pollWaitlistRef.current) clearInterval(pollWaitlistRef.current);
    if (pollActionLogRef.current) clearInterval(pollActionLogRef.current);
    loadRooms();
  };

  const deleteRoom = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إغلاق الغرفة' });
        setActiveRoom(null);
        setRoomDetails(null);
        setParticipants([]);
        loadRooms();
      } else {
        toast({ title: 'خطأ', description: 'فشل إغلاق الغرفة', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
  };

  const createRoom = async (form: Record<string, unknown>) => {
    if (!user) return;
    setCreating(true);
    try {
      const res = await fetch('/api/voice-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || '',
          hostName: user.displayName || user.username,
          maxParticipants: form.maxParticipants || 50,
          isPrivate: false,
          micSeatCount: form.micSeatCount || 10,
          roomMode: form.roomMode || 'public',
          roomPassword: form.roomPassword || '',
          micTheme: form.micTheme || 'default',
          isAutoMode: form.isAutoMode !== false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إنشاء الغرفة!' });
        setShowCreate(false);
        loadRooms();
        // Auto join
        if (data.room) joinRoom(data.room);
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل إنشاء الغرفة', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
    setCreating(false);
  };

  // ─── Seat / Mic Actions ───────────────────────────────────────────

  const requestSeat = async (seatIndex?: number) => {
    if (!activeRoom || !user) return;
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=request-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar,
          seatIndex: seatIndex !== undefined ? seatIndex : -1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.autoAssigned) {
          toast({ title: 'تم تعيين مقعد لك!' });
        } else {
          toast({ title: 'تم إرسال الطلب', description: 'بانتظار موافقة الإدارة' });
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل طلب المقعد', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
  };

  const leaveSeat = async () => {
    if (!activeRoom) return;
    try {
      await fetch(`/api/voice-rooms/${activeRoom.id}?action=leave-seat`, { method: 'POST' });
      toast({ title: 'غادرت المقعد' });
    } catch { /* silent */ }
  };

  const toggleMic = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=toggle-mic`, { method: 'PUT' });
      const data = await res.json();
      if (data.frozen) {
        toast({ title: 'المايك مجمد', description: 'لا يمكنك فتح المايك حالياً', variant: 'destructive' });
      }
    } catch { /* silent */ }
  };

  // ─── Admin Actions ────────────────────────────────────────────────

  const doAction = async (action: string, body?: Record<string, unknown>, method: 'POST' | 'PUT' = 'POST') => {
    if (!activeRoom) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=${action}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        // Refresh data based on action
        if (action.includes('waitlist')) {
          const wlRes = await fetch(`/api/voice-rooms/${activeRoom.id}?action=waitlist`);
          const wlData = await wlRes.json();
          if (wlData.success) setWaitlist(wlData.waitlist || []);
        }
        if (action.includes('role') || action.includes('transfer') || action.includes('freeze') || action.includes('kick') || action.includes('ban') || action.includes('assign') || action.includes('seat')) {
          loadRoomDetails();
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'فشل تنفيذ الإجراء', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
    setActionLoading(false);
  };

  // ─── Gift Action ───────────────────────────────────────────────────

  const sendGift = async (giftId: string) => {
    if (!activeRoom || !showGift) return;
    const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ giftId, toUserId: showGift }),
    });
    const data = await res.json();
    if (data.success) {
      const target = participants.find(p => p.userId === showGift);
      addSystemMessage(`${user?.displayName} أرسل هدية إلى ${target?.displayName || 'مستخدم'}`);
      toast({ title: 'تم إرسال الهدية! 🎁' });
      setShowGift(null);
    } else {
      toast({ title: 'خطأ', description: 'فشل إرسال الهدية', variant: 'destructive' });
    }
  };

  // ─── Settings Update ───────────────────────────────────────────────

  const updateSettings = async (data: Partial<VoiceRoom>) => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.room) {
        setRoomDetails(result.room);
        setActiveRoom(result.room);
        toast({ title: 'تم تحديث الإعدادات' });
      } else {
        toast({ title: 'خطأ', description: result.error || 'فشل التحديث', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
  };

  // ─── Chat ──────────────────────────────────────────────────────────

  const addSystemMessage = (text: string) => {
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      userId: 'system',
      displayName: '',
      avatar: '',
      text,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    }]);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !user || (roomDetails?.chatMuted && myParticipant?.role !== 'owner' && myParticipant?.role !== 'coowner' && myParticipant?.role !== 'admin')) return;
    setChatMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      userId: user.id,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  };

  // ─── Seat Click Handler ────────────────────────────────────────────

  const handleSeatClick = (seatIndex: number, participant: VoiceRoomParticipant | null) => {
    if (participant) {
      // Click on occupied seat - show user profile
      setShowUserProfile(participant);
    } else {
      // Click on empty seat
      if (myParticipant && canDo('set-seat-status', myParticipant.role)) {
        // Admin: show seat context menu
        setShowSeatContext(seatIndex);
      } else if (myParticipant && canDo('request-seat', myParticipant.role)) {
        // Visitor: request seat
        requestSeat(seatIndex);
      }
    }
  };

  // ─── User Profile Action Handler ───────────────────────────────────

  const handleProfileAction = (action: string, data?: Record<string, unknown>) => {
    if (!showUserProfile) return;
    const target = showUserProfile;

    switch (action) {
      case 'gift':
        setShowGift(target.userId);
        break;
      case 'kick-from-mic':
        doAction('kick-from-mic', { targetUserId: target.userId });
        break;
      case 'kick-from-room':
        doAction('kick-from-room', { targetUserId: target.userId });
        if (target.userId === user?.id) {
          setTimeout(() => leaveRoom(), 500);
        }
        break;
      case 'ban':
        doAction('ban', { targetUserId: target.userId });
        if (target.userId === user?.id) {
          setTimeout(() => leaveRoom(), 500);
        }
        break;
      case 'freeze-seat':
        if (target.micFrozen) {
          doAction('unfreeze-seat', { targetUserId: target.userId });
        } else {
          doAction('freeze-seat', { targetUserId: target.userId });
        }
        break;
      case 'change-role':
        doAction('change-role', { targetUserId: target.userId, newRole: data?.newRole });
        break;
      case 'transfer-ownership':
        doAction('transfer-ownership', { newOwnerId: target.userId });
        break;
      case 'leave-seat':
        leaveSeat();
        break;
    }
  };

  // ─── Audience User Click ───────────────────────────────────────────

  const handleAudienceClick = (participant: VoiceRoomParticipant) => {
    setShowUserProfile(participant);
  };

  // ─── Seat Status Change ────────────────────────────────────────────

  const handleSetSeatStatus = (seatIndex: number, status: SeatStatus) => {
    doAction('set-seat-status', { seatIndex, status }, 'PUT');
  };

  // ─── Waitlist Actions ──────────────────────────────────────────────

  const handleApproveWaitlist = (waitlistId: string) => {
    doAction('approve-waitlist', { waitlistId });
  };

  const handleRejectWaitlist = (waitlistId: string) => {
    doAction('reject-waitlist', { waitlistId });
  };

  // ─── Derived State ─────────────────────────────────────────────────

  const myRole = myParticipant?.role || 'visitor';
  const isOnSeat = myParticipant && myParticipant.seatIndex >= 0;
  const isAdmin = canDo('manage-waitlist', myRole);
  const canSettings = hasPower(myRole, 'admin');
  const room = roomDetails || activeRoom;
  const micParticipants = participants.filter(p => p.seatIndex >= 0);
  const audienceParticipants = participants.filter(p => p.seatIndex < 0);
  const waitlistCount = waitlist.length;

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVE ROOM VIEW
  // ═══════════════════════════════════════════════════════════════════

  if (activeRoom && room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white" dir="rtl">
        {/* Header */}
        <div className="bg-slate-900/60 backdrop-blur-xl border-b border-purple-500/20 px-4 py-3 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm truncate">{room.name}</h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>بقلم {room.hostName}</span>
                  <span>·</span>
                  <span>{participants.length} مشارك</span>
                  <span>·</span>
                  <div className="flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5" />
                    <span>{micParticipants.length}/{room.micSeatCount}</span>
                  </div>
                  {room.roomLevel > 0 && (
                    <>
                      <span>·</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[8px] px-1 h-3">
                        Lv.{room.roomLevel}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {myRole === 'owner' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-400 hover:bg-rose-500/10 h-8 px-2 text-[10px]"
                  onClick={deleteRoom}
                >
                  <X className="w-4 h-4 ml-1" />
                  إغلاق
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2 text-[10px]"
                onClick={leaveRoom}
              >
                <LogOut className="w-4 h-4 ml-1" />
                مغادرة
              </Button>
            </div>
          </div>
        </div>

        {/* Room Content */}
        <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
          {/* Announcement Banner */}
          {room.announcement && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-start gap-2"
            >
              <Megaphone className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">{room.announcement}</p>
            </motion.div>
          )}

          {/* Participant count badge */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-full px-3 py-1 border border-slate-800/40">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-slate-300 font-medium">{participants.length}</span>
              <span className="text-[10px] text-slate-500">مستمع</span>
            </div>
            {isOnSeat && (
              <Badge className={`border text-[9px] ${ROLE_BG[myRole]}`}>
                {(() => { const I = ROLE_ICONS[myRole]; return <I className="w-3 h-3 inline ml-0.5" />; })()}
                {ROLE_LABELS[myRole]}
              </Badge>
            )}
          </div>

          {/* Mic Grid */}
          <div className="bg-slate-900/30 border border-slate-800/30 rounded-2xl p-4 sm:p-6">
            <MicGridLayout
              participants={micParticipants}
              seatCount={room.micSeatCount}
              hostId={room.hostId}
              currentUserId={user?.id || ''}
              myRole={myRole}
              micTheme={room.micTheme || 'default'}
              onSeatClick={handleSeatClick}
            />
          </div>

          {/* Audience Row */}
          {audienceParticipants.length > 0 && (
            <AudienceRow participants={audienceParticipants} onUserClick={handleAudienceClick} />
          )}

          {/* Description */}
          {room.description && (
            <p className="text-center text-xs text-slate-500 mt-4 px-4">{room.description}</p>
          )}
        </div>

        {/* ─── Bottom Control Bar ─────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-40 safe-area-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-around py-2.5 px-2">
            {/* Chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                showChat ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[9px]">محادثة</span>
            </button>

            {/* Mic toggle (on seat) */}
            {isOnSeat && (
              <button
                onClick={toggleMic}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                  myParticipant?.isMuted ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  myParticipant?.isMuted
                    ? 'bg-red-500/20 border-2 border-red-500/50'
                    : 'bg-emerald-500/20 border-2 border-emerald-500/50'
                }`}>
                  {myParticipant?.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </div>
                <span className="text-[9px]">{myParticipant?.isMuted ? 'مكتوم' : 'مفتوح'}</span>
              </button>
            )}

            {/* Take Seat / Leave Seat */}
            {!isOnSeat && (
              <button
                onClick={() => requestSeat()}
                disabled={actionLoading}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <HandMetal className="w-5 h-5" />}
                </div>
                <span className="text-[9px]">طلب مقعد</span>
              </button>
            )}
            {isOnSeat && (
              <button
                onClick={leaveSeat}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700/30 border-2 border-slate-600/50 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-[9px]">مغادرة المقعد</span>
              </button>
            )}

            {/* Gift */}
            <button
              onClick={() => {}}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="text-[9px]">هدية</span>
            </button>

            {/* Settings (admin) */}
            {canSettings && (
              <button
                onClick={() => setShowSettings(true)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-[9px]">إعدادات</span>
              </button>
            )}

            {/* Waitlist (admin) */}
            {isAdmin && (
              <button
                onClick={() => setShowWaitlist(true)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors relative"
              >
                <div className="relative">
                  <Clock className="w-5 h-5" />
                  {waitlistCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 min-w-[14px] h-[14px] bg-yellow-500 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-900 px-0.5">
                      {waitlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px]">الانتظار</span>
              </button>
            )}

            {/* Action Log (admin) */}
            {isAdmin && (
              <button
                onClick={() => setShowActionLog(true)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
              >
                <ScrollText className="w-5 h-5" />
                <span className="text-[9px]">الأحداث</span>
              </button>
            )}

            {/* Leave Room */}
            <button
              onClick={leaveRoom}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[9px]">مغادرة</span>
            </button>
          </div>
        </div>

        {/* ─── Panels ─────────────────────────────────────────────── */}

        {/* Chat Panel */}
        <ChatPanel
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          messages={chatMessages}
          chatMuted={!!room.chatMuted}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSend={sendChat}
        />

        {/* Gift Panel */}
        {showGift && (
          <GiftPanel
            isOpen={!!showGift}
            onClose={() => setShowGift(null)}
            gifts={gifts}
            targetName={participants.find(p => p.userId === showGift)?.displayName || 'مستخدم'}
            onSendGift={sendGift}
          />
        )}

        {/* Settings Panel */}
        {canSettings && showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            room={room}
            isOwner={myRole === 'owner'}
            myRole={myRole}
            onUpdate={updateSettings}
          />
        )}

        {/* Waitlist Panel */}
        {isAdmin && (
          <WaitlistPanel
            isOpen={showWaitlist}
            onClose={() => setShowWaitlist(false)}
            waitlist={waitlist}
            onApprove={handleApproveWaitlist}
            onReject={handleRejectWaitlist}
          />
        )}

        {/* Action Log Panel */}
        {isAdmin && (
          <ActionLogPanel
            isOpen={showActionLog}
            onClose={() => setShowActionLog(false)}
            logs={actionLog}
          />
        )}

        {/* User Profile Menu */}
        {showUserProfile && (
          <UserProfileMenu
            isOpen={!!showUserProfile}
            onClose={() => setShowUserProfile(null)}
            participant={showUserProfile}
            myRole={myRole}
            currentUserId={user?.id || ''}
            onAction={handleProfileAction}
          />
        )}

        {/* Seat Context Menu */}
        {showSeatContext !== null && (
          <SeatContextMenu
            isOpen={showSeatContext !== null}
            onClose={() => setShowSeatContext(null)}
            seatIndex={showSeatContext}
            currentStatus="open"
            onSetStatus={handleSetSeatStatus}
          />
        )}

        {/* Join Password Dialog */}
        <Dialog open={!!showJoinPassword} onOpenChange={() => setShowJoinPassword(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                كلمة المرور
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="أدخل كلمة مرور الغرفة"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoomWithPassword()}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowJoinPassword(null)} className="flex-1 border-slate-700 text-slate-300">
                  إلغاء
                </Button>
                <Button onClick={joinRoomWithPassword} disabled={!joinPassword.trim()} className="flex-1 bg-purple-600 hover:bg-purple-500">
                  دخول
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ROOMS LIST VIEW
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border-b border-purple-500/20 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center hover:bg-slate-700/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">المجلس</h1>
                <p className="text-[11px] text-slate-400">غرف صوتية تفاعلية</p>
              </div>
            </div>
            <CreateRoomDialog open={showCreate} onOpenChange={setShowCreate} onCreate={createRoom} loading={creating} />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/40 rounded-full px-3 py-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-slate-300 font-medium">{rooms.length}</span>
              <span className="text-[10px] text-slate-500">غرفة نشطة</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/40 rounded-full px-3 py-1">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                {rooms.reduce((sum, r) => sum + (r.participantCount || 0), 0)}
              </span>
              <span className="text-[10px] text-slate-500">مستمع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-3xl mx-auto p-4 pb-8">
        <AnimatePresence mode="wait">
          {roomsLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
              <p className="text-slate-500 text-sm mt-3">جارٍ تحميل الغرف...</p>
            </motion.div>
          ) : rooms.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-400 text-sm font-medium">لا توجد غرف صوتية</p>
              <p className="text-slate-600 text-xs mt-1">أنشئ غرفتك الأولى وابدأ المحادثة!</p>
              <Button
                onClick={() => setShowCreate(true)}
                className="mt-4 bg-gradient-to-l from-purple-600 to-purple-700 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 ml-1.5" /> إنشاء غرفة
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="rooms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {rooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  onClick={() => joinRoom(room)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
