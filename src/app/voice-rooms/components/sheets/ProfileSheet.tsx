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
  const avatarColor = participant ? getAvatarColor(participant.userId) : '#1F2024';

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
        <div className="space-y-4 pb-4">
          {/* Header: large avatar + name + role badge */}
          <div className="flex flex-col items-center text-center">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0 border-2 overflow-hidden"
              style={{ background: avatarColor, borderColor: 'rgba(255,255,255,0.15)' }}
            >
              {participant.avatar ? (
                <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{participant.displayName.charAt(0)}</span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-[18px] font-bold text-white">{participant.displayName}</div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${ROLE_PILL_BG[participant.role]}`}>
                  {ROLE_LABELS[participant.role]}
                </span>
                {isGuest && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[rgba(148,163,184,0.15)] text-[rgba(255,255,255,0.5)]">
                    مستمع
                  </span>
                )}
                {participant.vipLevel > 0 && (
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    مستوى <span className="text-white font-bold">{participant.vipLevel}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex rounded-xl overflow-hidden" style={{ background: '#3a3a3a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex-1 py-3 px-2 text-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[15px] font-bold text-white">{stats?.giftsSent ?? 0}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>هدايا أُرسلت</div>
            </div>
            <div className="flex-1 py-3 px-2 text-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[15px] font-bold text-white">{stats?.giftsReceived ?? 0}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>هدايا مستلمة</div>
            </div>
            <div className="flex-1 py-3 px-2 text-center">
              <div className="text-[15px] font-bold text-white">{stats?.totalReceivedValue ?? 0}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>مجوهرات</div>
            </div>
          </div>

          {/* Role management section */}
          {canManageRoles && !isGuest && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>إدارة الأدوار</div>
              {showGrantMembership ? (
                <button
                  onClick={() => { onChangeRole(participant.userId, 'member'); onClose(); }}
                  className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-[#4a4a4a]"
                  style={{ background: '#3a3a3a' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <span className="text-base">⭐</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-white">منح العضوية</div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>ترقية المستخدم ليصبح عضواً في الغرفة</div>
                  </div>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-[#4a4a4a]"
                    style={{ background: '#3a3a3a' }}
                  >
                    <span className="text-[13px] font-semibold text-white">تغيير الدور</span>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{ROLE_LABELS[participant.role]}</span>
                  </button>
                  {roleMenuOpen && (
                    <div className="flex gap-1.5">
                      {availableRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => { onChangeRole(participant.userId, role); setRoleMenuOpen(false); onClose(); }}
                          className="flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200"
                          style={{
                            background: participant.role === role ? '#2B6AD6' : '#3a3a3a',
                            color: participant.role === role ? '#fff' : 'rgba(255,255,255,0.6)',
                            border: `2px solid ${participant.role === role ? '#2B6AD6' : 'transparent'}`,
                          }}
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
            <button
              onClick={() => { onRemoveRole(participant!.userId); onClose(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-[#4a4a4a]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
                <UserMinus className="w-[18px] h-[18px] text-[#ef4444]" />
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold text-[#ef4444]">{removeRoleLabel}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>إزالة الدور وإعادته إلى زائر في الغرفة</div>
              </div>
            </button>
          )}

          {/* Guest indicator */}
          {isGuest && canDo(myRole, 'admin') && (
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-3" style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <Users className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>مستخدم غير مسجل - لا يمكن منحه عضوية</span>
            </div>
          )}

          {/* Admin action buttons: kick temp + ban */}
          {canDo(myRole, 'admin') && participant?.userId !== authUserId && participant?.userId !== hostId && (
            <div className="flex gap-2">
              <button
                onClick={() => { onKickTemp(participant!.userId); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 hover:brightness-110"
                style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}
              >
                <Timer className="w-4 h-4" /> طرد مؤقت
              </button>
              <button
                onClick={() => { onBanUser(participant!.userId); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 hover:brightness-110"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <Ban className="w-4 h-4" /> حظر نهائي
              </button>
            </div>
          )}

          {/* Action buttons grid */}
          <div className="flex gap-2">
            {canInviteMic && (
              <button
                onClick={() => { onInviteToMic(participant!.userId); onClose(); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.97]"
                style={{ background: '#3a3a3a', border: '2px solid rgba(34,197,94,0.25)' }}
              >
                <Mic className="w-[20px] h-[20px] text-[#22c55e]" />
                <span className="text-[10px] text-[#22c55e] font-semibold">دعوة للمايك</span>
              </button>
            )}
            {authUserId && (
              <button
                onClick={() => { onClose(); setTimeout(onGiftClick, 300); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.97]"
                style={{ background: '#3a3a3a' }}
              >
                <Gift className="w-[20px] h-[20px] text-[#f59e0b]" />
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>إرسال هدية</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.97]"
              style={{ background: '#3a3a3a' }}
            >
              <ImageIcon className="w-[20px] h-[20px]" style={{ color: '#6c63ff' }} />
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>إطار 5 دقائق</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 hover:bg-[#4a4a4a] active:scale-[0.97]"
              style={{ background: '#3a3a3a' }}
            >
              <X className="w-[20px] h-[20px]" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>إغلاق</span>
            </button>
          </div>
        </div>
      )}
    </BottomSheetOverlay>
  );
}
