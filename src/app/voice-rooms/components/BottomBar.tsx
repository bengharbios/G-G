'use client';

import { Mic, MicOff, Gift, Volume2, VolumeX, Settings, X, Link2 } from 'lucide-react';
import type { RoomRole } from '../types';
import { canDo } from '../types';

export default function BottomBar({
  myRole,
  isOnSeat,
  isMicMuted,
  isRoomMuted,
  authUser,
  chatInput,
  setChatInput,
  onSendChat,
  onToggleMic,
  onToggleRoomMute,
  onSettingsOpen,
  onLeaveRoom,
  onCopyLink,
  onGiftOpen,
}: {
  myRole: RoomRole;
  isOnSeat: boolean;
  isMicMuted: boolean;
  isRoomMuted: boolean;
  authUser: { id: string } | null;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendChat: () => void;
  onToggleMic: () => void;
  onToggleRoomMute: () => void;
  onSettingsOpen: () => void;
  onLeaveRoom: () => void;
  onCopyLink: () => void;
  onGiftOpen: () => void;
}) {
  return (
    <footer className="bg-transparent border-t border-[rgba(108,99,255,0.18)] px-3 py-2.5 pb-5 flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Mute room button — only for admin+ */}
        {canDo(myRole, 'admin') && (
          <button
            onClick={onToggleRoomMute}
            className={`w-[38px] h-[38px] rounded-full bg-[#1c2035] border flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${
              isRoomMuted
                ? 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)]'
                : 'border-[rgba(255,255,255,0.07)]'
            }`}
          >
            {isRoomMuted
              ? <VolumeX className="w-[18px] h-[18px] text-[#ef4444]" />
              : <Volume2 className="w-[18px] h-[18px] text-[#9ca3c4]" />
            }
          </button>
        )}

        {/* Mic toggle — only when user is on a seat */}
        {isOnSeat && (
          <button
            onClick={onToggleMic}
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all ${
              isMicMuted
                ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]'
                : 'bg-[rgba(34,197,94,0.15)] border border-[#22c55e]'
            }`}
          >
            {isMicMuted
              ? <MicOff className="w-[18px] h-[18px] text-[#ef4444]" />
              : <Mic className="w-[18px] h-[18px] text-[#22c55e]" />
            }
          </button>
        )}

        {/* Chat input */}
        <div className="flex-1 bg-[#1c2035] border border-[rgba(255,255,255,0.07)] rounded-full flex items-center px-3.5 h-[38px] gap-1.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
            placeholder={!authUser ? 'سجل دخولك للمشاركة في المحادثة' : isRoomMuted ? 'المحادثة مكتومة' : 'اكتب رسالة...'}
            disabled={isRoomMuted || !authUser}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#f0f0f8] placeholder:text-[#5a6080] disabled:opacity-50"
            dir="rtl"
          />
        </div>

        {/* Gift button - only for registered users */}
        {authUser && (
          <button
            onClick={onGiftOpen}
            className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg active:scale-95 transition-transform"
          >
            <Gift className="w-[18px] h-[18px] text-white" />
          </button>
        )}
      </div>
    </footer>
  );
}
