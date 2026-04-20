'use client';

import { Trophy, Users } from 'lucide-react';
import type { VoiceRoomParticipant } from '../types';
import { getAvatarColor } from '../types';

export default function AudienceRow({
  participants,
  weeklyGems,
  onProfileClick,
}: {
  participants: VoiceRoomParticipant[];
  weeklyGems: number;
  onProfileClick: (p: VoiceRoomParticipant) => void;
}) {
  return (
    <section className="bg-transparent px-3 py-2 flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Right side (RTL): Trophy pill + weekly gems */}
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-[rgba(245,158,11,0.12)] rounded-full px-2.5 py-1">
          <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center">
            <Trophy className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[11px] text-[#f59e0b] font-bold tabular-nums">{weeklyGems.toLocaleString('ar-SA')}</span>
        </div>

        {/* Center: Scrollable listener avatars */}
        <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 min-w-0">
          {participants
            .filter(p => p.seatIndex < 0)
            .map(p => {
              const isGuestUser = !p.username || p.userId?.startsWith('guest-');
              return (
                <button
                  key={p.userId}
                  onClick={() => onProfileClick(p)}
                  className="flex-shrink-0 active:scale-95 transition-transform"
                >
                  <div className="relative">
                    <div
                      className={`w-[34px] h-[34px] rounded-full overflow-hidden flex items-center justify-center shadow-sm ${
                        isGuestUser ? 'opacity-50' : ''
                      }`}
                      style={{ background: getAvatarColor(p.userId) }}
                    >
                      {p.avatar ? (
                        <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[11px] font-bold text-white">{p.displayName.charAt(0)}</span>
                      )}
                    </div>
                    {isGuestUser && (
                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-[#5a6080] border-2 border-[#0d0f1a] flex items-center justify-center">
                        <span className="text-[5px] leading-none text-white">?</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Left side (RTL): User count pill */}
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-[rgba(108,99,255,0.12)] rounded-full px-2.5 py-1">
          <div className="w-4 h-4 rounded-full bg-[#6c63ff] flex items-center justify-center">
            <Users className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[11px] text-[#a78bfa] font-bold tabular-nums">{participants.length}</span>
        </div>
      </div>
    </section>
  );
}
