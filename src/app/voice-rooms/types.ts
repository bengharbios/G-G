/* ═══════════════════════════════════════════════════════════════════════
   VOICE ROOMS — Shared Types, Interfaces, Constants, Helpers & Design Tokens
   ═══════════════════════════════════════════════════════════════════════ */

import { Globe, Key, EyeOff } from 'lucide-react';

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

// ─── Design Tokens (TUILiveKit-inspired) ─────────────────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    bg: {
      primary: '#0a0e1a',      // Deep dark base
      secondary: '#111827',    // Card/panel background
      tertiary: '#1a1f35',     // Elevated surfaces
      surface: '#1F2024',      // Panel/overlay background (TUILiveKit exact)
      overlay: 'rgba(0,0,0,0.4)', // Mask overlay
    },
    text: {
      primary: 'rgba(255,255,255,0.90)',   // Main text
      secondary: 'rgba(255,255,255,0.60)',  // Muted text
      tertiary: 'rgba(255,255,255,0.35)',   // Disabled/placeholder
    },
    accent: {
      primary: '#6c63ff',    // Brand purple-blue
      success: '#22c55e',    // Green
      warning: '#f59e0b',    // Amber
      error: '#ef4444',      // Red
      info: '#3b82f6',       // Blue
      like: '#FF3B66',       // Like button (from TUILiveKit H5)
      live: '#059669',       // Live dot green
    },
    stroke: {
      primary: 'rgba(255,255,255,0.08)',  // Dividers/borders
      secondary: 'rgba(255,255,255,0.15)', // Hover borders
      module: '#48494F',                   // Notification border (TUILiveKit exact)
    },
    slider: {
      empty: 'rgba(255,255,255,0.15)',
    },
  },
  radius: {
    sm: '4px',    // Audio bars, small elements
    md: '8px',    // Cards, inputs
    lg: '12px',   // Sheets, option cards, buttons
    xl: '16px',   // Notifications, panel cards
    pill: '25px', // Pill-shaped tags
  },
  shadow: {
    sm: '0 2px 4px rgba(0,0,0,0.2)',
    md: '0 4px 12px rgba(0,0,0,0.3)',
    lg: '0 8px 18px rgba(0,0,0,0.4)',
    glow: '0 0 20px rgba(108,99,255,0.15)',
    notification: '0 8px 18px 0 rgba(0,0,0,0.06), 0 2px 6px 0 rgba(0,0,0,0.06)',
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px',
  },
  typography: {
    xs: '11px', sm: '12px', md: '14px', lg: '16px', xl: '18px', '2xl': '22px', '3xl': '24px',
  },
  animation: {
    fast: '200ms ease',
    normal: '300ms cubic-bezier(.4,0,.2,1)',
    spring: '300ms cubic-bezier(.175,.885,.32,1.275)',
    slow: '500ms ease',
  },
} as const;

// ─── Heart / Like Colors (TUILiveKit LikeAnimation) ──────────────────────────

export const HEART_COLORS = [
  '#FF3B30', '#AF52DE', '#FF9500', '#FFCC00', '#34C759',
  '#007AFF', '#8E8E93', '#32ADE6', '#A2845E',
];

// ─── Avatar Palette (TUILiveKit-inspired) ────────────────────────────────────

export const AVATAR_PALETTE = [
  { bg: '#eff6ff', text: '#2563eb' },
  { bg: '#f0fdfa', text: '#0d9488' },
  { bg: '#fffbeb', text: '#d97706' },
  { bg: '#fff1f2', text: '#f43f5e' },
  { bg: '#f0f9ff', text: '#0284c7' },
  { bg: '#f1f5e9', text: '#475569' },
  { bg: '#ecfdf5', text: '#059669' },
  { bg: '#fff7ed', text: '#ea580c' },
];

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

export function getAvatarColorFromPalette(userId: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
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
