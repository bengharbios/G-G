'use client';

import { useState } from 'react';
import { Gift, ImageIcon, X, Users, UserMinus, Mic, Timer, Ban } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import type { VoiceRoomParticipant, RoomRole } from '../../types';
import { canDo, getAvatarColor, ROLE_LABELS, ROLE_PILL_BG } from '../../types';

export default function ProfileSheet({
  isOpen, onClose, participant, stats, onGiftClick, myRole, authUserId, hostId, onKickTemp, onBanUser, onChangeRole, onInviteToMic, onRemoveRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  participant: VoiceRoomParticipant | null;
  stats: { giftsSent: number; giftsReceived: number; totalReceivedValue: number } | null;
  onGiftClick: () => void;
  myRole: RoomRole;
  authUserId: string;
  hostId: string;
  onKickTemp: (userId: string) => void;
  onBanUser: (userId: string) => void;
  onChangeRole: (userId: string, newRole: RoomRole) => void;
  onInviteToMic: (userId: string) => void;
  onRemoveRole: (userId: string) => void;
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  if (!participant && !isOpen) return null;
  const avatarColor = participant ? getAvatarColor(participant.userId) : '#1c2035';

  const isNotSelf = participant?.userId !== authUserId && participant?.userId !== hostId;
  const canManageRoles = canDo(myRole, 'coowner') && isNotSelf;
  const canRemoveMembership = canDo(myRole, 'admin') && isNotSelf && participant?.role === 'member';
  const canRemoveHigherRole = canDo(myRole, 'coowner') && isNotSelf && ['admin', 'coowner'].includes(participant?.role || '');
  const canInviteMic = canDo(myRole, 'admin') && participant?.userId !== authUserId && participant?.seatIndex < 0;
  const isGuest = !participant?.username || participant?.userId?.startsWith('guest-');
  const availableRoles: RoomRole[] = ['member', 'admin', 'coowner'];
  const showGrantMembership = canManageRoles && participant?.role === 'visitor' && !isGuest;
  const showRemoveRole = canRemoveMembership || canRemoveHigherRole;
  const removeRoleLabel = participant?.role === 'coowner' ? 'إزالة النيابة' : participant?.role === 'admin' ? 'إزالة الإشراف' : 'إزالة العضوية';

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      {participant && (
        <>
          {/* Header with avatar + name + role */}
          <div className="flex items-center gap-3.5 px-5 pb-4 border-b border-[rgba(255,255,255,0.07)]">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#6c63ff] overflow-hidden"
              style={{ background: avatarColor }}
            >
              {participant.avatar ? (
                <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{participant.displayName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold text-[#f0f0f8] truncate">{participant.displayName}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_PILL_BG[participant.role]}`}>
                  {ROLE_LABELS[participant.role]}
                </span>
                {isGuest && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[rgba(148,163,184,0.15)] text-[#5a6080]">
                    مستمع
                  </span>
                )}
                {participant.vipLevel > 0 && (
                  <span className="text-[11px] text-[#5a6080]">
                    مستوى <span className="text-[#f0f0f8] font-bold">{participant.vipLevel}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex mx-4 mt-3 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.07)]">
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center border-l border-[rgba(255,255,255,0.07)]">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.giftsSent ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">هدايا أُرسلت</div>
            </div>
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center border-l border-[rgba(255,255,255,0.07)]">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.giftsReceived ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">هدايا مستلمة</div>
            </div>
            <div className="flex-1 bg-[#1c2035] py-2.5 px-2 text-center">
              <div className="text-[15px] font-bold text-[#f0f0f8]">{stats?.totalReceivedValue ?? 0}</div>
              <div className="text-[10px] text-[#5a6080] mt-0.5">مجوهرات</div>
            </div>
          </div>

          {/* Role management */}
          {canManageRoles && !isGuest && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              {showGrantMembership ? (
                <button
                  onClick={() => { onChangeRole(participant.userId, 'member'); onClose(); }}
                  className="w-full flex items-center gap-3 bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⭐</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-[#f0f0f8]">منح العضوية</div>
                    <div className="text-[11px] text-[#5a6080] font-normal">ترقية المستخدم ليصبح عضواً في الغرفة</div>
                  </div>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-[#f0f0f8]">تغيير الدور</span>
                    <span className="text-[11px] text-[#5a6080]">{ROLE_LABELS[participant.role]}</span>
                  </button>
                  {roleMenuOpen && (
                    <div className="flex gap-1.5 mt-2">
                      {availableRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => { onChangeRole(participant.userId, role); setRoleMenuOpen(false); onClose(); }}
                          className={`flex-1 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                            participant.role === role
                              ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                              : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[#6c63ff]'
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* Remove role button */}
          {showRemoveRole && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <button
                onClick={() => { onRemoveRole(participant!.userId); onClose(); }}
                className="w-full flex items-center gap-3 bg-[rgba(239,68,68,0.06)] rounded-xl px-3.5 py-3 hover:bg-[rgba(239,68,68,0.1)] active:bg-[rgba(239,68,68,0.1)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0">
                  <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold text-[#ef4444]">{removeRoleLabel}</div>
                  <div className="text-[11px] text-[#5a6080] font-normal">إزالة الدور وإعادته إلى زائر في الغرفة</div>
                </div>
              </button>
            </div>
          )}
          {/* Guest indicator */}
          {isGuest && canDo(myRole, 'admin') && (
            <div className="px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <div className="flex items-center gap-2 bg-[rgba(148,163,184,0.08)] rounded-xl px-3.5 py-3">
                <Users className="w-4 h-4 text-[#5a6080]" />
                <span className="text-[12px] text-[#5a6080]">مستخدم غير مسجل - لا يمكن منحه عضوية</span>
              </div>
            </div>
          )}

          {/* Admin action buttons: kick temp + ban */}
          {canDo(myRole, 'admin') && participant?.userId !== authUserId && participant?.userId !== hostId && (
            <div className="flex gap-2 px-4 mt-2.5 border-t border-[rgba(255,255,255,0.07)] pt-2.5">
              <button onClick={() => { onKickTemp(participant!.userId); onClose(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] text-[#f97316] text-[12px] font-semibold">
                <Timer className="w-4 h-4" /> طرد مؤقت
              </button>
              <button onClick={() => { onBanUser(participant!.userId); onClose(); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12px] font-semibold">
                <Ban className="w-4 h-4" /> حظر نهائي
              </button>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex gap-2 px-4 mt-3 pb-6">
            {canInviteMic && (
            <button
              onClick={() => { onInviteToMic(participant!.userId); onClose(); }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.15)] active:scale-[0.97] transition-all"
            >
              <Mic className="w-[22px] h-[22px] text-[#22c55e]" />
              <span className="text-[11px] text-[#22c55e] font-semibold">دعوة للمايك</span>
            </button>
            )}
            {authUserId && (
            <button
              onClick={() => { onClose(); setTimeout(onGiftClick, 300); }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <Gift className="w-[22px] h-[22px] text-[#f59e0b]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إرسال هدية</span>
            </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <ImageIcon className="w-[22px] h-[22px] text-[#a78bfa]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إطار 5 دقائق</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] hover:bg-[#232843] active:scale-[0.97] transition-all"
            >
              <X className="w-[22px] h-[22px] text-[#5a6080]" />
              <span className="text-[11px] text-[#9ca3c4] font-semibold">إغلاق</span>
            </button>
          </div>
        </>
      )}
    </BottomSheetOverlay>
  );
}
