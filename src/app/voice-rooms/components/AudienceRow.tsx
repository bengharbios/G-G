'use client';

import { Trophy } from 'lucide-react';
import type { VoiceRoomParticipant } from '../types';
import { getAvatarColor } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   AudienceRow — TUILiveKit-inspired audience avatars strip

   RTL Arabic interface.
   - Weekly gems pill on the far side
   - Scrollable avatar circles (32px) with overlap effect
   - "+N more" badge when more than display limit
   - Click avatar to open ProfileSheet
   ═══════════════════════════════════════════════════════════════════════ */

const DISPLAY_LIMIT = 20;

export default function AudienceRow({
  participants,
  weeklyGems,
  onProfileClick,
}: {
  participants: VoiceRoomParticipant[];
  weeklyGems: number;
  onProfileClick: (p: VoiceRoomParticipant) => void;
}) {
  const audienceMembers = participants.filter((p) => p.seatIndex < 0);
  const visibleMembers = audienceMembers.slice(0, DISPLAY_LIMIT);
  const remaining = audienceMembers.length - DISPLAY_LIMIT;

  return (
    <section className="flex-shrink-0 px-3 py-2" style={{ backgroundColor: 'transparent' }}>
      <div className="flex items-center gap-2">
        {/* ── Scrollable audience avatars ── */}
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide py-0.5 min-w-0">
          {visibleMembers.map((p, idx) => {
            const isGuestUser =
              !p.username || p.userId?.startsWith('guest-');

            return (
              <button
                key={p.userId}
                onClick={() => onProfileClick(p)}
                className="flex-shrink-0 active:scale-95 transition-transform focus:outline-none"
                style={{
                  marginInlineStart: idx > 0 ? '-8px' : '0',
                  zIndex: visibleMembers.length - idx,
                  position: 'relative',
                }}
                aria-label={p.displayName}
              >
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: getAvatarColor(p.userId),
                    border: '2px solid #0a0e1a',
                    opacity: isGuestUser ? 0.5 : 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="text-[10px] font-bold text-white leading-none"
                    >
                      {p.displayName.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Guest indicator badge */}
                {isGuestUser && (
                  <div
                    className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: '#5a6080',
                      border: '2px solid #0a0e1a',
                    }}
                  >
                    <span className="text-[5px] leading-none text-white">
                      ?
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* ── "+N more" badge ── */}
          {remaining > 0 && (
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                marginInlineStart: visibleMembers.length > 0 ? '-8px' : '0',
                backgroundColor: 'rgba(108,99,255,0.20)',
                border: '2px solid #0a0e1a',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color: '#a78bfa' }}
              >
                +{remaining}
              </span>
            </div>
          )}
        </div>

        {/* ── Weekly gems pill ── */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0 rounded-full px-2.5 py-1"
          style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#f59e0b' }}
          >
            <Trophy className="w-2.5 h-2.5 text-white" />
          </div>
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: '#f59e0b' }}
          >
            {weeklyGems.toLocaleString('ar-SA')}
          </span>
        </div>
      </div>
    </section>
  );
}
