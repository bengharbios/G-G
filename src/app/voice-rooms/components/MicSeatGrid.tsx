'use client';

import MicSeat from './MicSeat';
import type { SeatData } from '../types';

/**
 * MicSeatGrid — Voice seat grid container
 * TUILiveKit uses a grid layout within the main-left-center area.
 * Background is dark (black) with the seats displayed in a responsive grid.
 */

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
    <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
          المنابر الصوتية
        </span>
        <span
          className="rounded-full px-2 py-0.5"
          style={{
            fontSize: '10px',
            background: 'rgba(108,99,255,0.15)',
            color: '#a78bfa',
            border: '1px solid rgba(108,99,255,0.3)',
          }}
        >
          {seats.length} مايك
        </span>
      </div>

      {/* Grid — responsive layout matching TUILiveKit seat view */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ userSelect: 'none' }}
      >
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
      </div>
    </section>
  );
}
