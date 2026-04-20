/* ═══════════════════════════════════════════════════════════════════════
   VOICE ROOMS — Types, Interfaces, Constants, Helpers & Design Tokens
   Exact TUILiveKit (Tencent) color/dimension/typography system
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
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  maxParticipants: number;
  isPrivate: boolean;
  micSeatCount: number;
  roomMode: RoomMode;
  roomPassword: string;
  roomLevel: number;
  micTheme: string;
  bgmEnabled: boolean;
  chatMuted: boolean;
  announcement: string;
  giftSplit: number;
  isAutoMode: boolean;
  lockedSeats: number[];
  participantCount?: number;
  createdAt: string;
  roomImage?: string;
}

export interface VoiceRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isMuted: boolean;
  micFrozen: boolean;
  role: RoomRole;
  seatIndex: number;
  seatStatus: SeatStatus;
  vipLevel: number;
  joinedAt: string;
  pendingRole?: string;
  pendingMicInvite?: number;
}

export interface Gift {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  price: number;
  category?: string;
  animation?: 'none' | 'particles' | 'fireworks' | 'hearts' | 'stars' | 'confetti';
}

export interface RoomTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  micSeatCount: number;
  roomMode: string;
  roomPassword: string;
  maxParticipants: number;
  isAutoMode: boolean;
  micTheme: string;
  allowedRoles: string[];
  updatedAt: string;
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

// ─── TUILiveKit Exact Design Tokens ──────────────────────────────────────────

export const TUI = {
  // ── Brand / Primary Colors (from Flutter colors.dart) ──
  colors: {
    B1: '#1C66E5',           // Primary Blue — buttons, links, selected
    B1d: '#4791FF',          // Blue Light
    B2: '#00E5E5',           // Teal
    B2d: '#1AFFC9',          // Teal Light
    C1: '#00C2A8',           // Green
    C2: '#6C54E8',           // Purple
    C3: '#FF643D',           // Orange
    C4: '#F23C5B',           // Pink-Red

    // ── Gray Scale (G1=darkest → G8=lightest) ──
    G1: '#0F1014',           // Near Black — main backgrounds
    G2: '#22262E',           // Dark Panel — drawer, list items, sheets
    G3: '#4F586B',           // Muted text, dividers
    G3Divider: 'rgba(79, 88, 107, 0.5)',
    G4: '#6B758A',
    G5: '#8F9AB2',           // Secondary text, empty states
    G6: '#B2BBD1',           // Tertiary text
    G7: '#D5E0F2',           // Body text on dark bg
    G8: '#F2F5FC',           // Background light, empty seat circle

    // ── Flowkit Semantic ──
    red: '#FC5555',          // Error, destructive
    green: '#29CC6A',        // Success
    blue: '#0099FF',         // Info
    white: '#FFFFFF',        // Primary text
    purple: '#7B61FF',
    charcoal: '#222222',

    // ── Operational ──
    bgOperate: '#1F2024',    // Background operate
    bgInput: '#2B2C30',      // Input background
    sliderFilled: '#2B6AD6',
    sliderEmpty: '#48494F',
    textSuccess: '#38A673',
    textWarning: '#0FA968',
    strokePrimary: '#3A3C42',

    // ── Non-standard ──
    notRed: '#E5395C',
    notBlue: '#0157DF',
    notGrey: '#7C85A6',
    notWhite: '#D1D9EC',
    notBlack: '#181B21',

    // ── Transparencies ──
    white20: 'rgba(255,255,255,0.2)',
    white30: 'rgba(255,255,255,0.3)',
    blue30: 'rgba(79, 88, 107, 0.3)',    // Card backgrounds
    black4D: 'rgba(15, 16, 20, 0.3)',     // Overlay
    black80: 'rgba(0,0,0,0.8)',           // Deep mask

    // ── Seat ──
    seatGray: '#2B2C30',
    seatSelectedBorder: '#2B6AD6',
    emptySeatBg: 'rgba(242, 245, 252, 0.1)',  // #F2F5FC at 10%

    // ── Like ──
    likeRed: '#FF3B30',

    // ── Live badge ──
    liveGreen: '#29CC6A',
  },

  // ── Radius (from business.scss + Flutter source) ──
  radius: {
    sm: '4px',        // Audio bars, small elements
    md: '8px',        // Cards, inputs, live-player
    lg: '12px',       // Sheets, option cards, buttons
    xl: '15px',       // Sheet top corners (TUILiveKit Drawer)
    '2xl': '16px',    // Notifications
    pill: '20px',     // Pill-shaped tags, follow button
    circle: '50%',    // Avatars, seat circles
  },

  // ── Typography (from Flutter usage) ──
  font: {
    title20: { size: '20px', weight: 600, color: '#FFFFFF' },     // Page titles
    title16: { size: '16px', weight: 600, color: '#FFFFFF' },     // Panel titles, menu items
    body16:  { size: '16px', weight: 400, color: '#D5E0F2' },     // User names, list text (G7)
    body14:  { size: '14px', weight: 400, color: '#D5E0F2' },     // Secondary labels (G7)
    caption12: { size: '12px', weight: 400, color: '#FFFFFF' },   // Button labels, badges
    captionG6: { size: '12px', weight: 400, color: '#B2BBD1' },   // Icon labels below buttons
    captionG5: { size: '12px', weight: 400, color: '#8F9AB2' },   // Empty state text
    actionRed: { size: '12px', weight: 500, color: '#FC5555' },   // Hang-up button
    actionBlue: { size: '12px', weight: 500, color: '#1C66E5' },  // Accept/reject buttons
  },

  // ── Dimensions (from screen_adapter.dart — 375×812 base) ──
  dim: {
    // Top Widget
    topBarHeight: 40,
    topBarTop: 54,
    topBarLR: 12,
    closeButtonSize: 20,

    // Seat Grid
    seatGridTop: 122,
    seatGridHeight: 245,
    seatContainerSize: 50,
    seatIconSize: 28,
    seatRowSpacing: 10,

    // Bottom Menu
    bottomBarBottom: 36,
    bottomBarRight: 27,
    ownerBtnW: 72,
    ownerBtnH: 46,
    audienceBtnW: 152,
    audienceBtnH: 46,
    btnIconSize: 28,
    btnSpacing: 16,
    badgeSize: 20,
    badgeFontSize: 12,

    // Barrage / Chat
    barrageLeft: 16,
    barrageBottom: 84,
    barrageWidth: 305,
    barrageHeight: 224,
    barrageInputW: 130,
    barrageInputH: 36,
    barrageInputBottom: 36,
    barrageInputLeft: 15,

    // Mute Mic
    muteMicSize: 32,
    muteMicBottom: 38,
    muteMicLeft: 153,

    // Audience List
    audienceMaxW: 107,
    audienceAvatarSize: 24,

    // Panels / Sheets
    panelRadiusTop: 15,
    settingsHeight: 350,
    seatMgmtHeight: 724,
    userMgmtHeight: 179,
    itemHeight: 60,
    avatarSize: 40,
    panelPaddingH: 24,
  },

  // ── Shadows ──
  shadow: {
    drawer: '0 -2px 8px rgba(0,0,0,0.08)',
    card: '0 4px 12px rgba(0,0,0,0.3)',
    iconHover: '0 0 10px 0 rgba(0,0,0,0.3)',
    notification: '0 8px 18px 0 rgba(0,0,0,0.06), 0 2px 6px 0 rgba(0,0,0,0.06)',
  },

  // ── Animation ──
  anim: {
    fast: '200ms ease',
    normal: '300ms cubic-bezier(.4,0,.2,1)',
    drawer: '300ms cubic-bezier(.4,0,.2,1)',
    spring: '300ms cubic-bezier(.175,.885,.32,1.275)',
    slow: '500ms ease',
  },
} as const;

// ─── Heart / Like Colors (TUILiveKit LikeAnimation) ──────────────────────────

export const HEART_COLORS = [
  '#FF3B30', '#AF52DE', '#FF9500', '#FFCC00', '#34C759',
  '#007AFF', '#8E8E93', '#32ADE6', '#A2845E',
];

// ─── Avatar Palette ──────────────────────────────────────────────────────────

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

// ─── Default Background Images (TUILiveKit CDN) ─────────────────────────────

export const DEFAULT_BG_URLS = [
  'https://liteav-test-1252463788.cos.ap-guangzhou.myqcloud.com/voice_room/voice_room_background1.png',
  'https://liteav-test-1252463788.cos.ap-guangzhou.myqcloud.com/voice_room/voice_room_background2.png',
  'https://liteav-test-1252463788.cos.ap-guangzhou.myqcloud.com/voice_room/voice_room_background3.png',
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
  coowner: 'bg-[rgba(124,133,166,0.15)] text-[#D1D9EC]',
  admin: 'bg-[rgba(1,87,223,0.15)] text-[#4791FF]',
  member: 'bg-[rgba(124,133,166,0.15)] text-[#D1D9EC]',
  visitor: 'bg-[rgba(124,133,166,0.15)] text-[#D1D9EC]',
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
export const CHAT_SENDER_COLORS = ['#6C54E8', '#f59e0b', '#29CC6A', '#FF643D'];

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
