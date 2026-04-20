'use client';

import { Lock, Mic, MicOff } from 'lucide-react';
import type { SeatData, RoomRole } from '../types';
import { getAvatarColor, ROLE_COLORS } from '../types';

export default function MicSeat({
  seatIndex, seatData, currentUserId, myRole, hostId, onClick,
}: {
  seatIndex: number;
  seatData: SeatData;
  currentUserId: string;
  myRole: RoomRole;
  hostId: string;
  onClick: () => void;
}) {
  const { participant, status } = seatData;
  const isOwner = participant?.userId === hostId;
  const isSpeaking = participant && !participant.isMuted && !participant.micFrozen;

  /* ── Locked seat ── */
  if (status === 'locked' && !participant) {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
        <div className="relative">
          <div className="w-[52px] h-[52px] rounded-full bg-[#111318] border-2 border-[rgba(255,255,255,0.06)] flex items-center justify-center opacity-70">
            <Lock className="w-4 h-4 text-[#555]" />
          </div>
        </div>
        <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
        <span className="text-[9.5px] text-[#5a6080]">مقفل</span>
      </button>
    );
  }

  /* ── Occupied seat ── */
  if (participant) {
    const avatarColor = getAvatarColor(participant.userId);

    let ringClass = 'border-[#22c55e] bg-[#1c2035]';
    if (isOwner) ringClass = 'border-[#f59e0b] bg-[#1c2035] shadow-[0_0_0_2px_rgba(245,158,11,0.2)]';
    else if (isSpeaking) ringClass = 'border-[#22c55e] bg-[#1c2035] animate-speak-glow';

    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
        <div className="relative">
          <div
            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center overflow-hidden border-2 ${ringClass}`}
            style={{ background: avatarColor }}
          >
            {participant.avatar ? (
              <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-white">{participant.displayName.charAt(0)}</span>
            )}
          </div>
          {/* Owner badge */}
          {isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#f59e0b] border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">★</span>
            </div>
          )}
          {/* Speaking indicator */}
          {isSpeaking && !isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">♪</span>
            </div>
          )}
          {/* Muted indicator */}
          {participant.isMuted && !isOwner && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#ef4444]/80 border-2 border-[#141726] flex items-center justify-center">
              <MicOff className="w-2 h-2 text-white" />
            </div>
          )}
          {/* Frozen indicator */}
          {participant.micFrozen && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-blue-500/80 border-2 border-[#141726] flex items-center justify-center">
              <span className="text-[7px] leading-none">❄</span>
            </div>
          )}
        </div>
        <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
        <span
          className="text-[9.5px] text-center max-w-[54px] overflow-hidden text-ellipsis whitespace-nowrap leading-tight"
          style={{ color: ROLE_COLORS[participant.role] }}
        >
          {participant.displayName}
        </span>
      </button>
    );
  }

  /* ── Empty seat ── */
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform">
      <div className="relative">
        <div className="w-[52px] h-[52px] rounded-full bg-[#1a2540] border-2 border-[rgba(108,99,255,0.25)] flex items-center justify-center">
          <Mic className="w-4 h-4 text-[#6c63ff]/60" />
        </div>
      </div>
      <span className="text-[9px] text-[#5a6080]">{seatIndex + 1}</span>
      <span className="text-[9.5px] text-[#5a6080]">{'\u00A0'}</span>
    </button>
  );
}
