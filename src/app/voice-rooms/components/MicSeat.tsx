'use client';

import { Mic, MicOff, Lock, Crown, Snowflake, Plus } from 'lucide-react';
import type { SeatData } from '../types';
import { getAvatarColor, ROLE_COLORS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════════
   AudioIcon — Exact TUILiveKit AudioIcon.vue port
   ═══════════════════════════════════════════════════════════════════════════
   Structure mirrors AudioIcon.vue:
     .audio-icon-container  (24×24, relative, cursor-pointer)
       .audio-level-container (absolute, top:2 left:7, 10×14, radius:4, overflow:hidden)
         .audio-level        (width:100%, bg text-success, transition height 0.2s)
       .audio-icon           (absolute, top:0 left:0 — IconAudioClose or IconAudioOpen)

   In TUILiveKit the single .audio-level div height = audioVolume * 4%.
   We keep 5 individual bars with staggered animation delays (audio-bar-1..5)
   to preserve the visual bounce while matching the container geometry exactly.
   ═══════════════════════════════════════════════════════════════════════════ */

function AudioIcon({
  isMuted,
  isSpeaking,
  audioVolume,
}: {
  isMuted: boolean;
  isSpeaking: boolean;
  audioVolume: number;
}) {
  /** Show bars when the user is actively speaking or muted (dimmed) */
  const showBars = isSpeaking || isMuted;
  /** Muted bars get 15% opacity; speaking bars are fully green */
  const barActive = isSpeaking;

  return (
    <div
      className="audio-icon-container relative w-6 h-6 cursor-pointer"
      aria-hidden
    >
      {/* ── audio-level-container — TUILiveKit exact ── */}
      {showBars && (
        <div
          className="audio-level-container absolute top-[2px] left-[7px]
            flex flex-col-reverse justify-between
            w-[10px] h-[14px] overflow-hidden rounded-[4px]"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`audio-bar-${n} w-full transition-[height] duration-200 ${
                barActive
                  ? 'bg-[var(--text-color-success,#22c55e)]'
                  : 'bg-[var(--text-color-success,#22c55e)]/15'
              }`}
              style={
                barActive && audioVolume > 0
                  ? { height: `${Math.min(audioVolume * 4, 100)}%` }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* ── audio-icon (mic open / close) — TUILiveKit exact ── */}
      <div className="audio-icon absolute top-0 left-0">
        {isMuted ? (
          <MicOff
            size={24}
            className="text-[var(--text-color-tertiary,rgba(255,255,255,0.35))]"
          />
        ) : (
          <Mic
            size={24}
            className="text-[var(--text-color-primary,rgba(255,255,255,0.90))]"
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MicSeat — Individual mic seat item
   ═══════════════════════════════════════════════════════════════════════════ */

export default function MicSeat({
  seat,
  isMySeat,
  onClick,
  index,
}: {
  seat: SeatData;
  isMySeat: boolean;
  onClick: (seatIndex: number) => void;
  index: number;
}) {
  const { participant, status } = seat;
  const isOwner = participant?.role === 'owner';
  const isSpeaking =
    participant && !participant.isMuted && !participant.micFrozen;

  /* ── Shared wrapper classes ── */
  const wrapperBase =
    'flex flex-col items-center gap-1 cursor-pointer group outline-none';
  const avatarSize = 'w-9 h-9'; // 36px

  /* ═══════════════════════════════════════════════════════════════════════════
     LOCKED SEAT — grayed out, no participant
     ═══════════════════════════════════════════════════════════════════════════ */
  if (status === 'locked' && !participant) {
    return (
      <button
        onClick={() => onClick(index)}
        className={wrapperBase}
        aria-label={`Seat ${index + 1} locked`}
      >
        <div
          className={`relative rounded-xl w-14 h-14 flex items-center justify-center
            bg-[#111318]/80 border-2 border-[rgba(255,255,255,0.06)]
            opacity-60 transition-all duration-200 ease-[ease]
            group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-black/20`}
        >
          <Lock className="w-4 h-4 text-[#555]" />
        </div>
        <span className="text-[9px] text-[#5a6080] tabular-nums">{index + 1}</span>
      </button>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     OCCUPIED SEAT — avatar, name, role badge, TUILiveKit AudioIcon
     ═══════════════════════════════════════════════════════════════════════════ */
  if (participant) {
    const avatarColor = getAvatarColor(participant.userId);

    /* Ring classes based on state */
    let ringClass = 'border-[rgba(255,255,255,0.12)]';
    if (isSpeaking) ringClass = 'border-emerald-500 animate-speak-glow';
    if (isOwner) ringClass = 'border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]';
    if (participant.isMuted) ringClass = 'border-[rgba(255,255,255,0.08)]';

    /* My seat highlight */
    const mySeatRing = isMySeat
      ? 'ring-2 ring-[#6c63ff]/50 ring-offset-1 ring-offset-[#0d0f1a]'
      : '';

    /** Audio volume for the level bars (0-25 range mapped to 0-100%) */
    const audioVolume = isSpeaking ? Math.random() * 20 + 5 : 0;

    return (
      <button
        onClick={() => onClick(index)}
        className={wrapperBase}
        aria-label={`Seat ${index + 1} — ${participant.displayName}`}
      >
        {/* Seat container: avatar + AudioIcon side by side */}
        <div className="relative flex items-center gap-1.5">
          {/* ── Avatar ── */}
          <div
            className={`relative ${avatarSize} rounded-full flex items-center justify-center
              overflow-hidden border-2 ${ringClass} ${mySeatRing}
              transition-all duration-200 ease-[ease]
              group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-black/30`}
            style={{ background: avatarColor }}
          >
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-white select-none">
                {participant.displayName.charAt(0)}
              </span>
            )}

            {/* ── Overlay badges ── */}

            {/* Crown badge (top-right) for owner */}
            {isOwner && (
              <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-amber-500 border-2 border-[#141726] flex items-center justify-center z-10">
                <Crown className="w-[10px] h-[10px] text-white fill-white" />
              </div>
            )}

            {/* Muted mic overlay — red tint */}
            {participant.isMuted && (
              <div className="absolute inset-0 rounded-full bg-red-500/30 flex items-center justify-center backdrop-blur-[1px]">
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              </div>
            )}

            {/* Frozen mic overlay — ice icon */}
            {participant.micFrozen && !participant.isMuted && (
              <div className="absolute inset-0 rounded-full bg-sky-500/20 flex items-center justify-center backdrop-blur-[1px]">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              </div>
            )}
          </div>

          {/* ── TUILiveKit AudioIcon (24×24) ── */}
          <AudioIcon
            isMuted={participant.isMuted}
            isSpeaking={!!isSpeaking}
            audioVolume={audioVolume}
          />
        </div>

        {/* Name with role color */}
        <span
          className="text-[9.5px] text-center max-w-[58px] truncate leading-tight transition-colors duration-200"
          style={{ color: ROLE_COLORS[participant.role] }}
        >
          {participant.displayName}
        </span>
      </button>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EMPTY / OPEN SEAT — dashed circle, "+" icon, pulse
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <button
      onClick={() => onClick(index)}
      className={wrapperBase}
      aria-label={`Seat ${index + 1} — empty, click to sit`}
    >
      <div
        className={`relative rounded-xl w-14 h-14 flex items-center justify-center
          border-2 border-dashed border-[rgba(255,255,255,0.1)]
          bg-[#1a2540]/60
          transition-all duration-200 ease-[ease]
          group-hover:scale-105 group-hover:border-[rgba(108,99,255,0.4)]
          group-hover:bg-[rgba(108,99,255,0.06)]
          group-hover:shadow-lg group-hover:shadow-[rgba(108,99,255,0.1)]
          animate-empty-pulse`}
      >
        <Plus className="w-5 h-5 text-[rgba(255,255,255,0.2)] transition-colors duration-200 group-hover:text-[#6c63ff]/70" />
      </div>
      <span className="text-[9px] text-[#5a6080] tabular-nums">{index + 1}</span>
    </button>
  );
}
