'use client';

import { Mic, MicOff, Gift, Volume2, VolumeX, Heart } from 'lucide-react';
import type { RoomRole } from '../types';
import { canDo } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   BottomBar — TUILiveKit toolbar inspired

   RTL Arabic interface.
   - Fixed bottom bar: 56px, bg #111827, border-top
   - Buttons evenly spaced: Mic · Like · Gift · Volume (admin+)
   - Each button: flex column, icon 24px + optional label
   - Active state: accent colour
   - Disabled state: dimmed
   - Hover: subtle glow effect
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
    <footer
      className="flex-shrink-0 select-none"
      style={{
        height: '56px',
        backgroundColor: '#111827',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-around h-full px-3">
        {/* ── Room mute toggle (admin+ only) ── */}
        {canDo(myRole, 'admin') && (
          <ToolbarButton
            icon={isRoomMuted ? VolumeX : Volume2}
            label="كتم"
            active={isRoomMuted}
            accentColor="#ef4444"
            onClick={onToggleRoomMute}
          />
        )}

        {/* ── Mic toggle (only when on seat) ── */}
        {isOnSeat && (
          <ToolbarButton
            icon={isMicMuted ? MicOff : Mic}
            label="مايك"
            active={!isMicMuted}
            accentColor="#22c55e"
            onClick={onToggleMic}
          />
        )}

        {/* ── Like button (always visible) ── */}
        <ToolbarButton
          icon={Heart}
          label="إعجاب"
          active={false}
          accentColor="#FF3B66"
          onClick={onLike}
        />

        {/* ── Gift button ── */}
        <ToolbarButton
          icon={Gift}
          label="هدية"
          active={false}
          accentColor="#f59e0b"
          onClick={onGiftOpen}
        />
      </div>
    </footer>
  );
}

/* ─── Individual Toolbar Button ────────────────────────────────────── */

function ToolbarButton({
  icon: Icon,
  label,
  active,
  accentColor,
  onClick,
}: {
  icon: typeof Mic;
  label?: string;
  active: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 active:scale-90 focus:outline-none"
      style={{
        minWidth: '52px',
        padding: '6px 12px',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = `${accentColor}14`;
        el.style.boxShadow = `0 0 20px ${accentColor}25`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = 'transparent';
        el.style.boxShadow = 'none';
      }}
    >
      <Icon
        className="transition-colors duration-200"
        style={{
          width: '24px',
          height: '24px',
          color: active ? accentColor : 'rgba(255,255,255,0.55)',
          ...(active
            ? {
                filter: `drop-shadow(0 0 6px ${accentColor}60)`,
              }
            : {}),
        }}
      />
      {label && (
        <span
          className="text-[10px] font-medium transition-colors duration-200 leading-none"
          style={{
            color: active ? accentColor : 'rgba(255,255,255,0.30)',
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
