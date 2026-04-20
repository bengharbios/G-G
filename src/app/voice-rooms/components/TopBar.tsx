'use client';

import { X, ArrowRight } from 'lucide-react';
import { TUI, getAvatarColor } from '../types';
import type { VoiceRoomParticipant } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   TopBar — TUILiveKit top_widget.dart exact replica

   Position: fixed top, overlays room background (transparent bg)
   Left: room name + ID (tappable → onRoomInfo)
   Center-Right: scrollable audience avatars (max 107px, 24px each)
   Right: Close button (X for owner, arrow-left for audience)
   ═══════════════════════════════════════════════════════════════════════ */

interface TopBarProps {
  roomName: string;
  participantCount: number;
  isOwner: boolean;
  onClose: () => void;
  onRoomInfo: () => void;
  participants: VoiceRoomParticipant[];
}

const MAX_VISIBLE_AVATARS = 4;

export default function TopBar({
  roomName,
  participantCount,
  isOwner,
  onClose,
  onRoomInfo,
  participants,
}: TopBarProps) {
  /* ── Audience: participants NOT on a mic seat (seatIndex < 0) ── */
  const audienceList = participants.filter((p) => p.seatIndex < 0);
  const visibleAvatars = audienceList.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = audienceList.length - MAX_VISIBLE_AVATARS;

  return (
    <div
      className="fixed flex items-center justify-between"
      style={{
        top: `${TUI.dim.topBarTop}px`,
        left: `${TUI.dim.topBarLR}px`,
        right: `${TUI.dim.topBarLR}px`,
        height: `${TUI.dim.topBarHeight}px`,
        zIndex: 50,
      }}
    >
      {/* ── Left: Room info (tappable) ── */}
      <button
        onClick={onRoomInfo}
        className="flex flex-col justify-center min-w-0 flex-1 mr-2 cursor-pointer"
        aria-label="Room info"
      >
        {/* Room name */}
        <span
          className="truncate font-bold leading-tight"
          style={{
            fontSize: TUI.font.title16.size,
            fontWeight: 600,
            color: TUI.colors.white,
            maxWidth: 200,
          }}
        >
          {roomName}
        </span>

        {/* Participant count / ID hint */}
        <span
          className="leading-tight mt-0.5"
          style={{
            fontSize: TUI.font.captionG5.size,
            color: TUI.colors.G5,
          }}
        >
          {participantCount} مشاهد
        </span>
      </button>

      {/* ── Center-Right: Audience avatars row ── */}
      <div
        className="flex items-center overflow-hidden flex-shrink-0"
        style={{
          maxWidth: TUI.dim.audienceMaxW,
          gap: 4,
        }}
      >
        {visibleAvatars.map((p) => (
          <div
            key={p.userId}
            className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              width: TUI.dim.audienceAvatarSize,
              height: TUI.dim.audienceAvatarSize,
              backgroundColor: p.avatar
                ? 'transparent'
                : getAvatarColor(p.userId),
            }}
          >
            {p.avatar ? (
              <img
                src={p.avatar}
                alt={p.displayName || p.username}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <span
                className="font-medium"
                style={{
                  fontSize: 10,
                  color: TUI.colors.white,
                  lineHeight: 1,
                }}
              >
                {(p.displayName || p.username || '?').charAt(0)}
              </span>
            )}
          </div>
        ))}

        {/* "+N" badge for overflow */}
        {remainingCount > 0 && (
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: TUI.dim.badgeSize,
              height: TUI.dim.badgeSize,
              backgroundColor: 'rgba(0,0,0,0.5)',
              fontSize: TUI.dim.badgeFontSize,
              color: TUI.colors.white,
              fontWeight: 500,
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* ── Right: Close / Exit button ── */}
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-full flex items-center justify-center ml-3 cursor-pointer"
        style={{
          width: TUI.dim.closeButtonSize,
          height: TUI.dim.closeButtonSize,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
        aria-label={isOwner ? 'End live' : 'Leave room'}
      >
        {isOwner ? (
          <X
            size={14}
            style={{ color: TUI.colors.white }}
            strokeWidth={2}
          />
        ) : (
          <ArrowRight
            size={14}
            style={{ color: TUI.colors.white }}
            strokeWidth={2}
          />
        )}
      </button>
    </div>
  );
}
