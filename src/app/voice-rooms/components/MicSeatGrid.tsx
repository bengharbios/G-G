'use client';

import { useMemo } from 'react';
import type { SeatData, VoiceRoomParticipant, RoomRole } from '../types';
import MicSeat from './MicSeat';

export default function MicSeatGrid({
  seats,
  currentUserId,
  myRole,
  hostId,
  onSeatClick,
}: {
  seats: SeatData[];
  currentUserId: string;
  myRole: RoomRole;
  hostId: string;
  onSeatClick: (seatIndex: number) => void;
}) {
  return (
    <section className="bg-transparent px-3 py-3.5 pb-2.5 border-b border-[rgba(255,255,255,0.07)] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#5a6080]">المنابر الصوتية</span>
        <span className="text-[10px] bg-[rgba(108,99,255,0.15)] text-[#a78bfa] border border-[rgba(108,99,255,0.3)] rounded-full px-2 py-0.5">
          {seats.length} مايك
        </span>
      </div>
      {/* Grid: exactly 5 per row */}
      <div className="grid grid-cols-5 gap-x-1.5 gap-y-2.5">
        {seats.map((seat) => (
          <MicSeat
            key={seat.seatIndex}
            seatIndex={seat.seatIndex}
            seatData={seat}
            currentUserId={currentUserId}
            myRole={myRole}
            hostId={hostId}
            onClick={() => onSeatClick(seat.seatIndex)}
          />
        ))}
      </div>
    </section>
  );
}
