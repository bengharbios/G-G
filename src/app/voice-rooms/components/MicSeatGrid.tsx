'use client';

import type { SeatData } from '../types';
import MicSeat from './MicSeat';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeatGrid — Seat grid layout matching TUILiveKit SeatGridLayout

   Layout rules (from Flutter VoiceRoomRootWidget):
     • 3, 6, 9 seats  → 3 per row
     • 4, 8 seats     → 4 per row
     • 5 seats        → 3 first row, 2 second row
     • 7 seats        → 4 first row, 3 second row
     • Otherwise      → flex wrap naturally

   Responsive: fluid padding, clamp maxHeight/gap, no overflow at 320px
   ═══════════════════════════════════════════════════════════════════════ */

interface MicSeatGridProps {
  seats: SeatData[];
  currentUserId: string;
  speakingUserIds: Set<string>;
  isOwner: boolean;
  onSeatClick: (seatIndex: number) => void;
}

export default function MicSeatGrid({
  seats,
  currentUserId,
  speakingUserIds,
  isOwner,
  onSeatClick,
}: MicSeatGridProps) {
  return (
    <div
      className="w-full mx-auto px-3 sm:px-4"
      style={{
        paddingTop: 'clamp(8px, 2vw, 12px)',
        paddingBottom: 'clamp(4px, 1.5vw, 8px)',
        maxHeight: 'clamp(180px, 35vh, 245px)',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      <div
        className="flex flex-wrap justify-center"
        style={{
          gap: 'clamp(6px, 2vw, 10px)',
        }}
      >
        {seats.map((seat) => {
          const isSpeaking =
            seat.participant !== null && speakingUserIds.has(seat.participant.userId);
          const isSeatOwner =
            seat.participant !== null && seat.participant.userId === currentUserId && isOwner;

          return (
            <MicSeat
              key={seat.seatIndex}
              seatData={seat}
              isOwner={isSeatOwner}
              isSpeaking={isSpeaking}
              onClick={() => onSeatClick(seat.seatIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}
