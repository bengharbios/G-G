'use client';

import { motion } from 'framer-motion';
import { Mic, Lock, Crown, MicOff } from 'lucide-react';
import type { SeatData } from '../types';
import { TUI, getAvatarColorFromPalette } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeat — Single voice seat matching TUILiveKit VoiceRoomRootWidget

   States:
     • Empty (open)       — faint circle + mic icon
     • Locked             — faint circle + lock icon
     • Occupied           — avatar + optional badges
       – Speaking         — animated ripple ring (#29CC6A)
       – Muted            — red MicOff badge (bottom-right)
       – Owner            — crown badge (top-right)
   ═══════════════════════════════════════════════════════════════════════ */

interface MicSeatProps {
  seatData: SeatData;
  isOwner: boolean;
  isSpeaking: boolean;
  onClick: () => void;
}

/** Truncate string to maxLen chars with ellipsis */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '\u2026' : str;
}

export default function MicSeat({
  seatData,
  isOwner,
  isSpeaking,
  onClick,
}: MicSeatProps) {
  const { seatIndex, participant, status } = seatData;
  const isLocked = status === 'locked';
  const isEmpty = !participant && !isLocked;
  const isOccupied = !!participant;
  const isMySeat = isOwner;

  // Determine if the user on this seat is the owner (for crown badge)
  const isSeatOwner = isOccupied && participant?.role === 'owner';

  // Determine if muted
  const isMuted = isOccupied && (participant?.isMuted || participant?.micFrozen);

  // Avatar palette color for fallback
  const palette = isOccupied ? getAvatarColorFromPalette(participant.userId) : null;

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 group outline-none"
      aria-label={isOccupied ? `Seat ${seatIndex + 1}: ${participant.displayName}` : `Seat ${seatIndex + 1}: empty`}
    >
      {/* ── Seat Circle (50×50) ── */}
      <div
        className="relative rounded-full flex items-center justify-center transition-transform duration-150 ease-out group-hover:scale-105"
        style={{
          width: TUI.dim.seatContainerSize,
          height: TUI.dim.seatContainerSize,
          backgroundColor: isEmpty || isLocked ? TUI.colors.emptySeatBg : 'transparent',
          border: isMySeat ? `2px solid ${TUI.colors.seatSelectedBorder}` : '2px solid transparent',
        }}
      >
        {/* ── Speaking Ripple Animation ── */}
        {isOccupied && isSpeaking && (
          <>
            {/* Primary ripple */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            {/* Secondary ripple (staggered) */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.6,
              }}
            />
          </>
        )}

        {/* ── Seat Number Badge (top-left pill) ── */}
        <span
          className="absolute -top-0.5 -left-0.5 flex items-center justify-center rounded-full z-10 pointer-events-none select-none"
          style={{
            minWidth: 16,
            height: 14,
            padding: '0 4px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontSize: 10,
            lineHeight: '14px',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {seatIndex + 1}
        </span>

        {/* ── Empty / Locked State ── */}
        {(isEmpty || isLocked) && (
          <>
            {isLocked ? (
              <Lock
                size={TUI.dim.seatIconSize}
                style={{ color: TUI.colors.G5 }}
                strokeWidth={1.5}
              />
            ) : (
              <Mic
                size={TUI.dim.seatIconSize}
                style={{ color: TUI.colors.G5 }}
                strokeWidth={1.5}
              />
            )}
          </>
        )}

        {/* ── Occupied State — Avatar ── */}
        {isOccupied && (
          <>
            {/* Avatar circle (40px) */}
            <div
              className="relative flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: 40,
                height: 40,
                border: `2px solid ${isSpeaking ? TUI.colors.green : 'transparent'}`,
              }}
            >
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.displayName}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <span
                  className="flex items-center justify-center rounded-full select-none"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: palette?.bg || '#eff6ff',
                    color: palette?.text || '#2563eb',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {participant.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* ── Muted Badge (bottom-right, red) ── */}
            {isMuted && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full z-10"
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: TUI.colors.red,
                }}
              >
                <MicOff size={9} color="#fff" strokeWidth={2.5} />
              </span>
            )}

            {/* ── Owner Crown Badge (top-right) ── */}
            {isSeatOwner && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center z-10"
                style={{
                  width: 16,
                  height: 16,
                }}
              >
                <Crown size={14} fill="#f59e0b" stroke="#f59e0b" strokeWidth={1} />
              </span>
            )}
          </>
        )}
      </div>

      {/* ── User Name Below Seat ── */}
      <span
        className="max-w-[60px] text-center leading-tight select-none"
        style={{
          fontSize: 12,
          color: TUI.colors.G6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={isOccupied ? participant.displayName : ''}
      >
        {isOccupied ? truncate(participant.displayName, 6) : '\u00A0'}
      </span>
    </button>
  );
}
