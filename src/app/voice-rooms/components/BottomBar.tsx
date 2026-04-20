'use client';

import { Settings2, Users, Gift, Heart, Mic, MicOff, Loader2, MessageCircle } from 'lucide-react';
import { TUI } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   BottomBar — TUILiveKit bottom_menu_widget.dart exact replica

   Position: fixed right-aligned (NOT full-width), transparent bg
   Owner: Settings + Seat Management — icon(28px) + label(10px, G6)
   Audience: Gift + Like + Link Mic — icon(28px) + label(10px, G6)
   Audience on seat: barrage input + mute mic as separate positioned elements on LEFT side

   Responsive: safe-area-inset-bottom, 44px min touch targets, clamp sizing
   ═══════════════════════════════════════════════════════════════════════ */

interface BottomBarProps {
  isOwner: boolean;
  isOnSeat: boolean;
  isMuted: boolean;
  isApplyingSeat: boolean;
  onOpenSeatManagement: () => void;
  onOpenSettings: () => void;
  onOpenGift: () => void;
  onLike: () => void;
  onToggleMic: () => void;
  onRequestSeat: () => void;
  onLeaveSeat: () => void;
  pendingSeatRequests: number;
  onOpenChat: () => void;
}

/* ── Label style for buttons ── */
const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: TUI.colors.G6,
  lineHeight: 1,
};

const labelStyleActive: React.CSSProperties = {
  fontSize: 10,
  color: TUI.colors.white,
  lineHeight: 1,
};

export default function BottomBar({
  isOwner,
  isOnSeat,
  isMuted,
  isApplyingSeat,
  onOpenSeatManagement,
  onOpenSettings,
  onOpenGift,
  onLike,
  onToggleMic,
  onRequestSeat,
  onLeaveSeat,
  pendingSeatRequests,
  onOpenChat,
}: BottomBarProps) {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          Barrage input (LEFT side, separate from bottom bar) — visible for ALL users
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-50 flex items-center cursor-pointer touch-manipulation"
        style={{
          left: 'clamp(12px, 4vw, 15px)',
          bottom: 'clamp(16px, 5vh, 36px)',
          width: 'clamp(100px, 35vw, 130px)',
          height: 'clamp(32px, 9vw, 36px)',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 18,
          padding: '0 12px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={onOpenChat}
      >
        <MessageCircle
          size={14}
          style={{ color: TUI.colors.G5, marginRight: 6 }}
        />
        <span
          className="truncate flex-1"
          style={{
            fontSize: 'clamp(11px, 2.8vw, 12px)',
            color: TUI.colors.G5,
            pointerEvents: 'none',
          }}
        >
          قل شيئاً...
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Audience on seat: Mute mic button (LEFT side, separate from bottom bar)
          ═══════════════════════════════════════════════════════════════════════ */}
      {!isOwner && isOnSeat && (
        <button
          onClick={onToggleMic}
          className="fixed z-50 rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
          style={{
            left: 'clamp(120px, 40vw, 153px)',
            bottom: 'clamp(16px, 5vh, 36px)',
            width: 32,
            height: 32,
            minWidth: 44,
            minHeight: 44,
            backgroundColor: 'transparent',
            transition: TUI.anim.fast,
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <MicOff size={18} style={{ color: TUI.colors.red }} />
          ) : (
            <Mic size={18} style={{ color: TUI.colors.white }} />
          )}
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          Right-aligned action buttons (main bottom bar)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-50 flex items-center"
        style={{
          right: 'clamp(12px, 4vw, 27px)',
          bottom: 'clamp(16px, 5vh, 36px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          gap: 'clamp(8px, 3vw, 16px)',
        }}
      >
        {isOwner ? (
          /* ══════════════════════════════════════════════════════════════
             OWNER LAYOUT — Settings + Seat Management
             icon(28px) + label(10px, G6), transparent bg
             ══════════════════════════════════════════════════════════════ */
          <div className="flex items-center" style={{ gap: 'clamp(8px, 3vw, 16px)' }}>
            {/* Settings button */}
            <div
              className="flex flex-col items-center gap-1 cursor-pointer touch-manipulation"
              onClick={onOpenSettings}
              style={{ minHeight: 44 }}
            >
              <Settings2 size={28} style={{ color: TUI.colors.white }} />
              <span style={labelStyle}>الإعدادات</span>
            </div>

            {/* Seat Management button */}
            <div
              className="relative flex flex-col items-center gap-1 cursor-pointer touch-manipulation"
              onClick={onOpenSeatManagement}
              style={{ minHeight: 44 }}
            >
              <Users size={28} style={{ color: TUI.colors.white }} />
              {/* Red badge for pending seat requests */}
              {pendingSeatRequests > 0 && (
                <span
                  className="absolute -top-1 -left-1 rounded-full flex items-center justify-center"
                  style={{
                    width: TUI.dim.badgeSize,
                    height: TUI.dim.badgeSize,
                    backgroundColor: TUI.colors.red,
                    fontSize: TUI.dim.badgeFontSize,
                    color: TUI.colors.white,
                    fontWeight: 600,
                    lineHeight: 1,
                    minWidth: TUI.dim.badgeSize,
                    padding: '0 4px',
                  }}
                >
                  {pendingSeatRequests}
                </span>
              )}
              <span style={labelStyle}>إدارة المقاعد</span>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════
             AUDIENCE LAYOUT — Gift + Like + Link Mic
             icon(28px) + label(10px, G6), transparent bg
             ══════════════════════════════════════════════════════════════ */
          <div className="flex items-center" style={{ gap: 'clamp(8px, 3vw, 16px)' }}>
            {/* Gift button */}
            <div
              className="flex flex-col items-center gap-1 cursor-pointer touch-manipulation"
              onClick={onOpenGift}
              style={{ minHeight: 44 }}
            >
              <Gift size={28} style={{ color: TUI.colors.white }} />
              <span style={labelStyle}>هدية</span>
            </div>

            {/* Like button — TUILiveKit red heart */}
            <div
              className="flex flex-col items-center gap-1 cursor-pointer touch-manipulation"
              onClick={onLike}
              style={{ minHeight: 44 }}
            >
              <Heart size={28} fill={TUI.colors.white} style={{ color: TUI.colors.white }} />
              <span style={labelStyle}>إعجاب</span>
            </div>

            {/* Link Mic button — dynamic states */}
            <div
              className="flex flex-col items-center justify-center cursor-pointer touch-manipulation"
              style={{ minHeight: 44 }}
              onClick={
                isOnSeat
                  ? onLeaveSeat
                  : isApplyingSeat
                    ? onLeaveSeat /* cancel application */
                    : onRequestSeat
              }
            >
              {isApplyingSeat ? (
                /* ── Applying state: spinning loader ── */
                <>
                  <Loader2
                    size={28}
                    style={{ color: TUI.colors.white }}
                    className="animate-spin"
                  />
                  <span style={labelStyle}>إلغاء</span>
                </>
              ) : isOnSeat ? (
                /* ── On seat state: MicOff icon + "إنهاء" ── */
                <>
                  <MicOff size={28} style={{ color: TUI.colors.green }} />
                  <span style={labelStyleActive}>إنهاء</span>
                </>
              ) : (
                /* ── Not on seat, not applying: mic icon + "صالة" ── */
                <>
                  <Mic size={28} style={{ color: TUI.colors.white }} />
                  <span style={labelStyle}>صالة</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
