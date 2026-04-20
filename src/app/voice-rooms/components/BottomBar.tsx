'use client';

import { Mic, MicOff, Gift, Volume2, VolumeX, Heart } from 'lucide-react';
import type { RoomRole } from '../types';
import { canDo, DESIGN_TOKENS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   BottomBar — TUILiveKit main-center-bottom / bottom toolbar

   Exact TUILiveKit patterns:
   - PC (md+): 72px toolbar, bg #1F2024, top stroke line, left/right split
   - Mobile: 48px compact bar, absolute bottom, like button 32px round
   - Icon buttons: min-w 56px, h 56px, flex-col, gap 4px, rounded-xl
   - Device slider: bg #2a2d35, h 40px, rounded-md, gap 8px
   - Like button: 32px round, bg #FF3B66, active scale(0.95)
   ═══════════════════════════════════════════════════════════════════════ */

export default function BottomBar({
  myRole,
  isOnSeat,
  isMicMuted,
  isRoomMuted,
  onToggleMic,
  onToggleRoomMute,
  onGiftOpen,
  onLike,
}: {
  myRole: RoomRole;
  isOnSeat: boolean;
  isMicMuted: boolean;
  isRoomMuted: boolean;
  onToggleMic: () => void;
  onToggleRoomMute: () => void;
  onGiftOpen: () => void;
  onLike: () => void;
}) {
  return (
    <>
      {/* ═══ PC Toolbar (md+): TUILiveKit main-center-bottom ═══ */}
      <footer
        className="hidden md:flex flex-shrink-0 select-none flex-col relative w-full"
        style={{ backgroundColor: DESIGN_TOKENS.colors.bg.surface }}
      >
        {/* Top stroke line — TUILiveKit ::before pattern */}
        <div
          className="absolute top-0"
          style={{
            left: DESIGN_TOKENS.spacing.md,
            right: DESIGN_TOKENS.spacing.md,
            height: '1px',
            backgroundColor: DESIGN_TOKENS.colors.stroke.primary,
          }}
        />

        {/* Content area: height 72px, flex, justify-between */}
        <div
          className="flex items-center justify-between w-full"
          style={{
            height: DESIGN_TOKENS.layout.toolbarHeight,
            padding: `0 ${DESIGN_TOKENS.spacing.md}`,
            boxSizing: 'border-box',
          }}
        >
          {/* ── Left: flex-1, h-full, items-center, gap 16px ── */}
          <div
            className="flex items-center w-full h-full"
            style={{ gap: DESIGN_TOKENS.spacing.md }}
          >
            {/* Device slider area (mic + volume when on seat) — TUILiveKit device-setting */}
            {isOnSeat && (
              <div
                className="flex items-center shrink-0"
                style={{
                  gap: DESIGN_TOKENS.spacing.sm,
                  backgroundColor: DESIGN_TOKENS.colors.bg.bubble,
                  padding: '0 8px',
                  borderRadius: DESIGN_TOKENS.radius.md,
                  height: '40px',
                }}
              >
                <MicToggleButton
                  isMuted={isMicMuted}
                  onClick={onToggleMic}
                  compact
                />
                {/* Volume slider placeholder (46px width — TUILiveKit device-slider) */}
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: '46px',
                    backgroundColor: DESIGN_TOKENS.colors.slider.empty,
                  }}
                />
              </div>
            )}

            {/* Tool buttons group — TUILiveKit main-center-bottom-tools */}
            <div className="flex flex-wrap" style={{ gap: DESIGN_TOKENS.layout.gap }}>
              {/* Like — custom-icon-container */}
              <ToolbarIconButton
                icon={Heart}
                label="إعجاب"
                active={false}
                accentColor={DESIGN_TOKENS.colors.accent.like}
                onClick={onLike}
              />

              {/* Gift */}
              <ToolbarIconButton
                icon={Gift}
                label="هدية"
                active={false}
                accentColor={DESIGN_TOKENS.colors.accent.warning}
                onClick={onGiftOpen}
              />

              {/* Room mute toggle (admin+ only) */}
              {canDo(myRole, 'admin') && (
                <ToolbarIconButton
                  icon={isRoomMuted ? VolumeX : Volume2}
                  label="كتم الغرفة"
                  active={isRoomMuted}
                  accentColor={DESIGN_TOKENS.colors.accent.error}
                  onClick={onToggleRoomMute}
                />
              )}
            </div>
          </div>

          {/* ── Right: h-full, flex, items-center, justify-center ── */}
          <div className="flex items-center justify-center h-full shrink-0">
            {/* Placeholder for future action buttons (End Live, etc.) */}
          </div>
        </div>
      </footer>

      {/* ═══ Mobile Bottom Bar: TUILiveKit LivePlayerH5 bottom ═══ */}
      <div
        className="flex md:hidden items-center justify-between w-full select-none"
        style={{
          height: DESIGN_TOKENS.layout.bottomBarHeight,
          padding: '0 8px',
          boxSizing: 'border-box',
          backgroundColor: DESIGN_TOKENS.colors.bg.surface,
          borderTop: `1px solid ${DESIGN_TOKENS.colors.stroke.primary}`,
        }}
      >
        {/* Left side — mic toggle */}
        <div className="flex items-center" style={{ gap: DESIGN_TOKENS.spacing.sm }}>
          {isOnSeat && (
            <MicToggleButton isMuted={isMicMuted} onClick={onToggleMic} />
          )}
        </div>

        {/* Right side — action buttons (flex-end) — TUILiveKit bottom-operate-button */}
        <div
          className="flex items-center justify-end"
          style={{
            flex: '1 0 auto',
            padding: '0 8px',
            gap: DESIGN_TOKENS.spacing.sm,
          }}
        >
          {/* Like button — TUILiveKit like-button: 32px round, bg #FF3B66 */}
          <button
            onClick={onLike}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: DESIGN_TOKENS.colors.accent.like,
              color: 'white',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(0.95)';
              el.style.opacity = '0.9';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(1)';
              el.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(1)';
              el.style.opacity = '1';
            }}
            aria-label="إعجاب"
          >
            <Heart style={{ width: '18px', height: '18px', fill: 'white' }} />
          </button>

          {/* Gift button */}
          <button
            onClick={onGiftOpen}
            className="flex items-center justify-center cursor-pointer transition-all"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: DESIGN_TOKENS.colors.accent.warning,
              color: 'white',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(0.95)';
              el.style.opacity = '0.9';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(1)';
              el.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'scale(1)';
              el.style.opacity = '1';
            }}
            aria-label="هدية"
          >
            <Gift style={{ width: '18px', height: '18px', fill: 'white' }} />
          </button>

          {/* Room mute (admin+ only) */}
          {canDo(myRole, 'admin') && (
            <button
              onClick={onToggleRoomMute}
              className="flex items-center justify-center cursor-pointer transition-all"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isRoomMuted
                  ? DESIGN_TOKENS.colors.accent.error
                  : 'rgba(255,255,255,0.15)',
                color: 'white',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(0.95)';
                el.style.opacity = '0.9';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'scale(1)';
                el.style.opacity = '1';
              }}
              aria-label="كتم الغرفة"
            >
              {isRoomMuted ? (
                <VolumeX style={{ width: '18px', height: '18px' }} />
              ) : (
                <Volume2 style={{ width: '18px', height: '18px' }} />
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Mic Toggle Button (compact for device-setting bar) ────────── */

function MicToggleButton({
  isMuted,
  onClick,
  compact = false,
}: {
  isMuted: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = isMuted ? MicOff : Mic;
  const color = isMuted
    ? DESIGN_TOKENS.colors.accent.error
    : DESIGN_TOKENS.colors.text.primary;

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none"
      style={{
        width: compact ? '24px' : '40px',
        height: compact ? '24px' : '40px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: DESIGN_TOKENS.radius.md,
        padding: 0,
        color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = DESIGN_TOKENS.colors.text.linkHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color;
      }}
      aria-label={isMuted ? 'فتح المايك' : 'كتم المايك'}
    >
      <Icon style={{ width: '20px', height: '20px' }} />
    </button>
  );
}

/* ─── TUILiveKit custom-icon-container ──────────────────────────────
   min-w 56px, h 56px, flex-col, gap 4px, rounded-xl, hover glow
   disabled: opacity 0.5, cursor not-allowed, tertiary color
   */

function ToolbarIconButton({
  icon: Icon,
  label,
  active,
  accentColor,
  onClick,
  disabled = false,
}: {
  icon: typeof Mic;
  label?: string;
  active: boolean;
  accentColor: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none"
      style={{
        minWidth: '56px',
        width: 'auto',
        height: '56px',
        gap: DESIGN_TOKENS.spacing.xs,
        borderRadius: DESIGN_TOKENS.radius.lg,
        backgroundColor: 'transparent',
        border: 'none',
        padding: '4px 8px',
        position: 'relative',
        color: active ? accentColor : DESIGN_TOKENS.colors.text.primary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = DESIGN_TOKENS.shadow.iconHover;
        el.style.color = DESIGN_TOKENS.colors.text.linkHover;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'none';
        el.style.color = active ? accentColor : DESIGN_TOKENS.colors.text.primary;
      }}
      aria-label={label}
    >
      <Icon
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: 'transparent',
          ...(active ? { filter: `drop-shadow(0 0 6px ${accentColor}60)` } : {}),
        }}
      />
      {label && (
        <span
          style={{
            fontSize: DESIGN_TOKENS.typography.sm,
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
