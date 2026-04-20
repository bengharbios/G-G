'use client';

/* ═══════════════════════════════════════════════════════════════════════
   AudienceRow — Horizontal avatar row for lobby room cards

   Shows up to `max` circular avatars with a "+N" overflow badge.
   Used inside RoomListView room cards to display participant previews.
   ═══════════════════════════════════════════════════════════════════════ */

import { TUI, getAvatarColor } from '../types';

interface AudienceRowProps {
  participants: { avatar: string; userId?: string }[];
  max?: number;
}

export default function AudienceRow({ participants, max = 3 }: AudienceRowProps) {
  if (!participants.length) return null;

  const visible = participants.slice(0, max);
  const overflow = participants.length - max;

  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      {visible.map((p, i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded-full overflow-hidden border-2"
          style={{
            width: 20,
            height: 20,
            borderColor: TUI.colors.G2,
            zIndex: visible.length - i,
          }}
        >
          {p.avatar ? (
            <img
              src={p.avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white"
              style={{
                fontSize: 8,
                fontWeight: 600,
                backgroundColor: getAvatarColor(p.userId || String(i)),
              }}
            >
              ?
            </div>
          )}
        </div>
      ))}

      {overflow > 0 && (
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            backgroundColor: TUI.colors.bgInput,
            fontSize: 9,
            fontWeight: 600,
            color: TUI.colors.G7,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
