/* ═══════════════════════════════════════════════════════════════════════
   VOICE ROOMS — Shared Types, Interfaces, Constants, and Helpers
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  vipLevel?: number;
}

export type RoomRole = 'owner' | 'coowner' | 'admin' | 'member' | 'visitor';
export type SeatStatus = 'open' | 'locked' | 'request' | 'reserved';
export type RoomMode = 'public' | 'key' | 'private';

export interface VoiceRoom {
  id: string; name: string; description: string; hostId: string; hostName: string;
  maxParticipants: number; isPrivate: boolean; micSeatCount: number;
  roomMode: RoomMode; roomPassword: string;
  roomLevel: number; micTheme: string; bgmEnabled: boolean; chatMuted: boolean;
  announcement: string; giftSplit: number; isAutoMode: boolean;
  lockedSeats: number[];
  participantCount?: number; createdAt: string;
  roomImage?: string;
}

export interface VoiceRoomParticipant {
  id: string; roomId: string; userId: string; username: string; displayName: string;
  avatar: string; isMuted: boolean; micFrozen: boolean; role: RoomRole;
  seatIndex: number; seatStatus: SeatStatus; vipLevel: number; joinedAt: string;
  pendingRole?: string;
  pendingMicInvite?: number;
}

export interface Gift {
  id: string; name: string; nameAr: string; emoji: string; price: number;
  category?: string; animation?: 'none' | 'particles' | 'fireworks' | 'hearts' | 'stars' | 'confetti';
}

export interface RoomTemplate {
  id: string; userId: string; name: string; description: string;
  micSeatCount: number; roomMode: string; roomPassword: string;
  maxParticipants: number; isAutoMode: boolean; micTheme: string;
  allowedRoles: string[]; updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isGift?: boolean;
  giftEmoji?: string;
  giftAnimation?: string;
}

export interface ActiveGiftAnimation {
  id: string;
  emoji: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  animation: 'none' | 'particles' | 'fireworks' | 'hearts' | 'stars' | 'confetti';
  price: number;
  timestamp: number;
}

export interface SeatData {
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  status: SeatStatus;
}

export interface MicMenuSheetState {
  isOpen: boolean;
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  mySeatIndex: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ROLE_LEVELS: Record<RoomRole, number> = {
  owner: 5, coowner: 4, admin: 3, member: 2, visitor: 1,
};

export const ROLE_LABELS: Record<RoomRole, string> = {
  owner: 'المالك', coowner: 'النائب', admin: 'إدارة', member: 'عضو', visitor: 'زائر',
};

export const ROLE_COLORS: Record<RoomRole, string> = {
  owner: '#f59e0b',
  coowner: '#a78bfa',
  admin: '#60a5fa',
  member: '#22c55e',
  visitor: '#94a3b8',
};

export const ROLE_PILL_BG: Record<RoomRole, string> = {
  owner: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  coowner: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
  admin: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  member: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
  visitor: 'bg-[rgba(108,99,255,0.15)] text-[#a78bfa]',
};

export const GIFT_CATEGORIES = [
  { id: 'popular', name: 'الأكثر شعبية', icon: '🔥' },
  { id: 'luxury', name: 'فاخرة', icon: '👑' },
  { id: 'special', name: 'مميزة', icon: '✨' },
];

export const DEFAULT_GIFTS: Gift[] = [
  { id: 'g1', name: 'Rose', nameAr: 'ورد', emoji: '🌹', price: 3, category: 'popular', animation: 'hearts' },
  { id: 'g2', name: 'Star', nameAr: 'نجمة', emoji: '⭐', price: 9, category: 'popular', animation: 'stars' },
  { id: 'g3', name: 'Heart', nameAr: 'قلب', emoji: '💖', price: 19, category: 'popular', animation: 'hearts' },
  { id: 'g4', name: 'Fire', nameAr: 'نار', emoji: '🔥', price: 49, category: 'popular', animation: 'particles' },
  { id: 'g5', name: 'GiftBox', nameAr: 'هدية', emoji: '🎁', price: 99, category: 'luxury', animation: 'fireworks' },
  { id: 'g6', name: 'Crown', nameAr: 'تاج', emoji: '👑', price: 199, category: 'luxury', animation: 'stars' },
  { id: 'g7', name: 'Rose99', nameAr: 'بوكيه ورد', emoji: '💐', price: 520, category: 'luxury', animation: 'hearts' },
  { id: 'g8', name: 'Rocket', nameAr: 'صاروخ', emoji: '🚀', price: 1314, category: 'luxury', animation: 'fireworks' },
  { id: 'g9', name: 'Diamond', nameAr: 'ماسة', emoji: '💎', price: 2999, category: 'special', animation: 'confetti' },
  { id: 'g10', name: 'Trophy', nameAr: 'كأس', emoji: '🏆', price: 5200, category: 'special', animation: 'fireworks' },
  { id: 'g11', name: 'GoldStar', nameAr: 'نجم ذهبي', emoji: '🌟', price: 10000, category: 'special', animation: 'confetti' },
  { id: 'g12', name: 'Castle', nameAr: 'قلعة', emoji: '🏰', price: 52000, category: 'special', animation: 'fireworks' },
];

export const MIC_OPTIONS = [5, 10, 15, 20];

export const ROOM_MODE_OPTIONS: { value: RoomMode; label: string; icon: typeof Globe; desc: string }[] = [
  { value: 'public', label: 'عام', icon: Globe, desc: 'يمكن لأي شخص الدخول' },
  { value: 'key', label: 'بكلمة سر', icon: Key, desc: 'تحتاج كلمة مرور' },
  { value: 'private', label: 'خاص', icon: EyeOff, desc: 'دعوات فقط' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Globe, Key, EyeOff } from 'lucide-react';

export const AVATAR_COLORS = ['#1e3a7a', '#3a1e6a', '#1a4040', '#3a2010', '#4a1e3a', '#1e4a3a', '#3a3a1e', '#2a1e4a'];

export const CHAT_SENDER_COLORS = ['#6c63ff', '#f59e0b', '#22c55e', '#f97316'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function canDo(myRole: RoomRole, requiredRole: RoomRole): boolean {
  return (ROLE_LEVELS[myRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getSenderColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return CHAT_SENDER_COLORS[Math.abs(hash) % CHAT_SENDER_COLORS.length];
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

export function genId(): string {
  return Math.random().toString(36).substring(2, 10);
}
