'use client';

import type { SeatData } from '../types';
import { TUI } from '../types';
import MicSeat from './MicSeat';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeatGrid — Seat grid layout matching TUILiveKit SeatGridLayout

   Layout rules (from Flutter VoiceRoomRootWidget):
     • 3, 6, 9 seats  → 3 per row
     • 4, 8 seats     → 4 per row
     • 5 seats        → 3 first row, 2 second row
     • 7 seats        → 4 first row, 3 second row
     • Otherwise      → flex wrap naturally
   ═══════════════════════════════════════════════════════════════════════ */

interface MicSeatGridProps {
  seats: SeatData[];
  currentUserId: string;
  speakingUserIds: Set<string>;
  isOwner: boolean;
  onSeatClick: (seatIndex: number) => void;
}

/**
 * Returns the number of seats per row based on TUILiveKit's SeatGridLayout algorithm.
 * The Flutter source uses a switch on seat count to determine columns.
 */
function getColumnsForSeatCount(count: number): number {
  switch (count) {
    case 3:
    case 6:
    case 9:
      return 3;
    case 4:
    case 8:
      return 4;
    case 5:
      return 3; // 3 + 2
    case 7:
      return 4; // 4 + 3
    default:
      // For other counts, flex-wrap handles it naturally
      return count <= 5 ? 3 : count <= 8 ? 4 : 5;
  }
}

export default function MicSeatGrid({
  seats,
  currentUserId,
  speakingUserIds,
  isOwner,
  onSeatClick,
}: MicSeatGridProps) {
  const totalSeats = seats.length;

  // Determine if we need a fixed grid or flex-wrap layout
  // For counts that have a specific layout (3-9 seats), use grid
  // For others, use flex-wrap
  const columns = getColumnsForSeatCount(totalSeats);
  const useGridLayout = totalSeats <= 9 && [3, 4, 5, 6, 7, 8, 9].includes(totalSeats);

  return (
    <div
      className="w-full mx-auto"
      style={{
        paddingTop: 12,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
        maxHeight: TUI.dim.seatGridHeight,
      }}
    >
      <div
        className="flex flex-wrap justify-center"
        style={{
          gap: TUI.dim.seatRowSpacing,
          ...(useGridLayout
            ? {
                maxWidth: columns * (TUI.dim.seatContainerSize + 20 + TUI.dim.seatRowSpacing),
              }
            : {}),
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
