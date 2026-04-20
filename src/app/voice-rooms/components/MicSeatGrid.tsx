'use client';

import MicSeat from './MicSeat';
import type { SeatData } from '../types';

export default function MicSeatGrid({
  seats,
  currentUserId,
  onSeatClick,
}: {
  seats: SeatData[];
  currentUserId: string;
  onSeatClick: (seatIndex: number) => void;
}) {
  return (
    <section
      className="bg-transparent px-3 py-3 pb-2.5 flex-shrink-0
        border-b border-[rgba(255,255,255,0.07)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-[#5a6080]">المنابر الصوتية</span>
        <span className="text-[10px] bg-[rgba(108,99,255,0.15)] text-[#a78bfa] border border-[rgba(108,99,255,0.3)] rounded-full px-2 py-0.5">
          {seats.length} مايك
        </span>
      </div>

      {/* Grid — responsive 3 cols on small, 5 cols on larger */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {seats.map((seat) => (
          <div key={seat.seatIndex} className="flex items-center justify-center">
            <MicSeat
              seat={seat}
              isMySeat={seat.participant?.userId === currentUserId}
              onClick={onSeatClick}
              index={seat.seatIndex}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
