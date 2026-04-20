'use client';

import { Settings2, Users, Gift, Heart, Mic, MicOff, Loader2, MessageCircle } from 'lucide-react';
import { TUI } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   BottomBar — TUILiveKit bottom_menu_widget.dart exact replica

   Position: fixed bottom-right, transparent bg (buttons float over room)
   Owner: Settings + Seat Management (with red badge)
   Audience: Gift + Like (red) + Link Mic (dynamic states)
   Audience on seat: Barrage input + Mute mic toggle
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
}

/* ── Shared round button wrapper (28px icon circle) ── */
function RoundBtn({
  icon,
  bg,
  iconColor,
  badge,
  onClick,
  className = '',
}: {
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
  badge?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer ${className}`}
      style={{
        width: TUI.dim.btnIconSize,
        height: TUI.dim.btnIconSize,
        backgroundColor: bg,
        transition: TUI.anim.fast,
      }}
    >
      {icon}
      {/* Red badge for pending requests */}
      {badge !== undefined && badge > 0 && (
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
          {badge}
        </span>
      )}
    </button>
  );
}

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
}: BottomBarProps) {
  return (
    <div
      className="fixed flex items-end justify-end"
      style={{
        right: `${TUI.dim.bottomBarRight}px`,
        bottom: `${TUI.dim.bottomBarBottom}px`,
        zIndex: 50,
      }}
    >
      {isOwner ? (
        /* ══════════════════════════════════════════════════════════════
           OWNER LAYOUT — 2 buttons right-aligned
           ══════════════════════════════════════════════════════════════ */
        <div className="flex items-center" style={{ gap: TUI.dim.btnSpacing }}>
          {/* Settings button */}
          <RoundBtn
            icon={<Settings2 size={18} style={{ color: TUI.colors.white }} />}
            bg="rgba(255,255,255,0.15)"
            iconColor={TUI.colors.white}
            onClick={onOpenSettings}
          />

          {/* Seat Management button */}
          <RoundBtn
            icon={<Users size={18} style={{ color: TUI.colors.white }} />}
            bg="rgba(255,255,255,0.15)"
            iconColor={TUI.colors.white}
            badge={pendingSeatRequests}
            onClick={onOpenSeatManagement}
          />
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           AUDIENCE LAYOUT — 3 buttons right-aligned + barrage + mute
           ══════════════════════════════════════════════════════════════ */
        <div className="flex items-center" style={{ gap: TUI.dim.btnSpacing }}>
          {/* Gift button */}
          <div
            className="flex flex-col items-center gap-1"
            style={{ height: TUI.dim.audienceBtnH }}
          >
            <RoundBtn
              icon={<Gift size={16} style={{ color: TUI.colors.white }} />}
              bg="rgba(255,255,255,0.15)"
              iconColor={TUI.colors.white}
              onClick={onOpenGift}
            />
          </div>

          {/* Like button — TUILiveKit red heart */}
          <div
            className="flex flex-col items-center gap-1"
            style={{ height: TUI.dim.audienceBtnH }}
          >
            <RoundBtn
              icon={<Heart size={16} fill={TUI.colors.white} style={{ color: TUI.colors.white }} />}
              bg={TUI.colors.likeRed}
              iconColor={TUI.colors.white}
              onClick={onLike}
            />
          </div>

          {/* Link Mic button — dynamic states */}
          <div
            className="flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            style={{ height: TUI.dim.audienceBtnH }}
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
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: TUI.dim.btnIconSize,
                    height: TUI.dim.btnIconSize,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  <Loader2
                    size={18}
                    style={{ color: TUI.colors.white }}
                    className="animate-spin"
                  />
                </div>
                <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
                  إلغاء
                </span>
              </>
            ) : isOnSeat ? (
              /* ── On seat state: green bg + MicOff + "إنهاء" ── */
              <>
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: TUI.dim.btnIconSize,
                    height: TUI.dim.btnIconSize,
                    backgroundColor: TUI.colors.green,
                  }}
                >
                  <MicOff size={18} style={{ color: TUI.colors.white }} />
                </div>
                <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.white }}>
                  إنهاء
                </span>
              </>
            ) : (
              /* ── Not on seat, not applying: mic icon + "صالة" ── */
              <>
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: TUI.dim.btnIconSize,
                    height: TUI.dim.btnIconSize,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  <Mic size={18} style={{ color: TUI.colors.white }} />
                </div>
                <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
                  صالة
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          AUDIENCE ON SEAT — Barrage input + Mute mic (positioned left)
          ══════════════════════════════════════════════════════════════ */}
      {!isOwner && isOnSeat && (
        <>
          {/* Barrage input — bottom left */}
          <div
            className="absolute flex items-center cursor-pointer"
            style={{
              bottom: TUI.dim.barrageInputBottom,
              left: TUI.dim.barrageInputLeft,
              width: TUI.dim.barrageInputW,
              height: TUI.dim.barrageInputH,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 18,
              padding: '0 12px',
            }}
            onClick={() => {
              /* Opens chat input — placeholder for now */
            }}
          >
            <MessageCircle
              size={14}
              style={{ color: TUI.colors.G5, marginRight: 6 }}
            />
            <span
              className="truncate flex-1"
              style={{
                fontSize: TUI.font.captionG5.size,
                color: TUI.colors.G5,
                pointerEvents: 'none',
              }}
            >
              قل شيئاً...
            </span>
          </div>

          {/* Mute mic toggle — positioned left of barrage */}
          <button
            onClick={onToggleMic}
            className="absolute flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              bottom: TUI.dim.muteMicBottom,
              left: `${TUI.dim.muteMicLeft}px`,
              width: TUI.dim.muteMicSize,
              height: TUI.dim.muteMicSize,
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: TUI.anim.fast,
            }}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff
                size={20}
                style={{ color: TUI.colors.red }}
              />
            ) : (
              <Mic
                size={20}
                style={{ color: TUI.colors.white }}
              />
            )}
          </button>
        </>
      )}
    </div>
  );
}
