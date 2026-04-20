'use client';

import { Mic, Users, Lock, UserMinus, Unlock, Timer, Ban } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import type { VoiceRoomParticipant, RoomRole } from '../../types';
import { canDo } from '../../types';

export default function MicMenuSheet({
  isOpen, onClose, seatIndex, participant, isSeatLocked, onAction, currentUserId, myRole, mySeatIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  seatIndex: number;
  participant: VoiceRoomParticipant | null;
  isSeatLocked: boolean;
  onAction: (action: string) => void;
  currentUserId: string;
  myRole: RoomRole;
  mySeatIndex: number;
}) {
  const isAdmin = canDo(myRole, 'admin');
  const isOnMic = participant?.userId === currentUserId;
  const isAlreadyOnSeat = mySeatIndex >= 0 && mySeatIndex !== seatIndex;
  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      {/* Title */}
      <div className="text-[13px] font-bold text-[#9ca3c4] text-center px-4 pb-3 border-b border-[rgba(255,255,255,0.07)] mx-4">
        {participant
          ? `المايك ${seatIndex + 1} — ${participant.displayName}`
          : `المايك ${seatIndex + 1}`}
      </div>

      {/* Menu items */}
      <div className="p-3 space-y-1 pb-6">
        {/* When someone is ON the mic */}
        {participant && (
          <>
            {/* View profile — always available */}
            <button
              onClick={() => { onAction('view-profile'); onClose(); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#a78bfa] hover:bg-[#232843] active:bg-[#232843] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[rgba(108,99,255,0.15)] flex items-center justify-center flex-shrink-0">
                <Users className="w-[18px] h-[18px] text-[#a78bfa]" />
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold">عرض البروفايل</div>
                <div className="text-[11px] text-[#5a6080] font-normal">مشاهدة ملف المستخدم الشخصي</div>
              </div>
            </button>

            {/* ── ADMIN ACTIONS: only visible to admin+ ── */}
            {isAdmin && (
              <>
                {/* Close mic (lock + pull) */}
                {!isSeatLocked && (
                  <button
                    onClick={() => { onAction('close-seat'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f59e0b] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,0.15)] flex items-center justify-center flex-shrink-0">
                      <Lock className="w-[18px] h-[18px] text-[#f59e0b]" />
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold">إغلاق المايك</div>
                      <div className="text-[11px] text-[#5a6080] font-normal">إغلاق المايك وإخراج العضو منه</div>
                    </div>
                  </button>
                )}

                {/* Pull from mic (without locking) */}
                <button
                  onClick={() => { onAction('pull-from-mic'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                    <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">إنزال من المايك</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">إخراج العضو من المنبر فوراً</div>
                  </div>
                </button>

                {/* Open the mic (unlock) - only if locked */}
                {isSeatLocked && (
                  <button
                    onClick={() => { onAction('unlock-seat'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                      <Unlock className="w-[18px] h-[18px] text-[#22c55e]" />
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold">فتح المايك</div>
                      <div className="text-[11px] text-[#5a6080] font-normal">فتح المايك والسماح بالجلوس</div>
                    </div>
                  </button>
                )}

                {/* Temp kick from room */}
                <button
                  onClick={() => { onAction('kick-temp'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f97316] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(249,115,22,0.15)] flex items-center justify-center flex-shrink-0">
                    <Timer className="w-[18px] h-[18px] text-[#f97316]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">طرد مؤقت من الروم</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">مدة الطرد: 10 دقائق</div>
                  </div>
                </button>

                {/* Perm ban from room */}
                <button
                  onClick={() => { onAction('kick-perm'); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                    <Ban className="w-[18px] h-[18px] text-[#ef4444]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold">طرد نهائي من الروم</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">حظر دائم من الغرفة</div>
                  </div>
                </button>
              </>
            )}

            {/* ── OWN SEAT ACTIONS ── */}
            {isOnMic && (
              <button
                onClick={() => { onAction('leave-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#ef4444] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">النزول من المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">ترك مقعدك الصوتي</div>
                </div>
              </button>
            )}
          </>
        )}

        {/* When seat is EMPTY */}
        {!participant && (
          <>
            {/* Change mic (if already on a different seat) */}
            {isAlreadyOnSeat && (
              <button
                onClick={() => { onAction('change-mic'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#a78bfa] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(108,99,255,0.15)] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-[18px] h-[18px] text-[#a78bfa]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">تغيير المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">الانتقال من المايك {mySeatIndex + 1} إلى المايك {seatIndex + 1}</div>
                </div>
              </button>
            )}
            {/* Sit on this mic (when not on any seat) */}
            {!isAlreadyOnSeat && (
              <button
                onClick={() => { onAction('take-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-[18px] h-[18px] text-[#22c55e]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">صعود للمايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">الجلوس على هذا المقعد الصوتي</div>
                </div>
              </button>
            )}

            {/* Lock seat (close empty mic) */}
            {!isSeatLocked && isAdmin && (
              <button
                onClick={() => { onAction('lock-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#f59e0b] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(245,158,11,0.15)] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-[18px] h-[18px] text-[#f59e0b]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">إغلاق المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">منع أي شخص من الجلوس هنا</div>
                </div>
              </button>
            )}

            {/* Unlock seat (open empty mic) */}
            {isSeatLocked && isAdmin && (
              <button
                onClick={() => { onAction('unlock-seat'); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#22c55e] hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                  <Unlock className="w-[18px] h-[18px] text-[#22c55e]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold">فتح المايك</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">السماح للأعضاء بالجلوس</div>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </BottomSheetOverlay>
  );
}
