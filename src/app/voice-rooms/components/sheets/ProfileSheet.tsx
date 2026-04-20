'use client';

import { useState } from 'react';
import {
  Mic,
  MicOff,
  UserMinus,
  ChevronDown,
  Shield,
  Crown,
  UserX,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_PILL_BG,
  ROLE_LEVELS,
  canDo,
  type VoiceRoomParticipant,
  type RoomRole,
} from '../../types';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  participant: VoiceRoomParticipant | null;
  currentUserId: string;
  myRole: RoomRole;
  stats?: { daysActive: number; giftsSent: number; giftsReceived: number };
  onKickTemp?: (userId: string) => void;
  onBan?: (userId: string) => void;
  onChangeRole?: (userId: string, role: RoomRole) => void;
  onRemoveRole?: (userId: string) => void;
  onInviteToMic?: (userId: string) => void;
  onCloseSeat?: (userId: string) => void;
}

const ROLE_OPTIONS: { value: RoomRole; label: string }[] = [
  { value: 'member', label: 'عضو' },
  { value: 'admin', label: 'إدارة' },
  { value: 'coowner', label: 'نيابة' },
];

export default function ProfileSheet({
  isOpen,
  onClose,
  participant,
  currentUserId,
  myRole,
  stats,
  onKickTemp,
  onBan,
  onChangeRole,
  onRemoveRole,
  onInviteToMic,
  onCloseSeat,
}: ProfileSheetProps) {
  const [isFollowed, setIsFollowed] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!participant) return null;

  const isMe = participant.userId === currentUserId;
  const isAdmin = canDo(myRole, 'admin');
  const isOwner = myRole === 'owner';
  const targetRole = participant.role;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;
  const myLevel = ROLE_LEVELS[myRole] || 0;

  /* Can manage this user? */
  const canManage = isAdmin && !isMe && myLevel > targetLevel;

  /* Height: audience=179px, owner/admin=280px */
  const sheetHeight = canManage ? 280 : 179;

  const handleFollow = () => {
    setIsFollowed(!isFollowed);
  };

  const handleRoleChange = (role: RoomRole) => {
    if (onChangeRole) onChangeRole(participant.userId, role);
    setShowRoleMenu(false);
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height={sheetHeight}
      showClose
      zIndex={55}
    >
      {/* ── Top Section: Avatar + Info ── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar 40px circle */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 40,
            height: 40,
            borderRadius: TUI.radius.circle,
            backgroundColor: TUI.colors.bgInput,
          }}
        >
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: 18, color: TUI.colors.G6 }}>
                {participant.displayName?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Name + ID + Role Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="truncate"
              style={{
                fontSize: TUI.font.title16.size,
                fontWeight: 600,
                color: TUI.colors.white,
              }}
            >
              {participant.displayName}
            </span>
            {/* Role badge pill */}
            <span
              className="shrink-0 px-2 py-0.5 rounded-full"
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: ROLE_COLORS[targetRole],
                backgroundColor: `${ROLE_COLORS[targetRole]}20`,
              }}
            >
              {ROLE_LABELS[targetRole]}
            </span>
          </div>
          <span
            style={{
              fontSize: TUI.font.captionG5.size,
              color: TUI.colors.G5,
            }}
          >
            ID: {participant.userId.slice(0, 12)}…
          </span>
        </div>

        {/* Follow Button — 70×32px */}
        {!isMe && (
          <button
            onClick={handleFollow}
            className="shrink-0 transition-all"
            style={{
              width: 70,
              height: 32,
              borderRadius: TUI.radius.pill,
              fontSize: TUI.font.caption12.size,
              fontWeight: 500,
              backgroundColor: isFollowed ? 'transparent' : TUI.colors.notBlue,
              color: isFollowed ? TUI.colors.notGrey : TUI.colors.white,
              border: isFollowed ? `1px solid ${TUI.colors.notGrey}` : 'none',
              cursor: 'pointer',
            }}
          >
            {isFollowed ? 'تمت المتابعة' : 'متابعة'}
          </button>
        )}
      </div>

      {/* ── Divider ── */}
      <div
        className="mb-3"
        style={{
          height: 1,
          backgroundColor: TUI.colors.G3Divider,
        }}
      />

      {/* ── Owner/Admin Section ── */}
      {canManage && (
        <div>
          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 mb-3">
            {/* Mute/Unmute button */}
            <button
              onClick={() => {}}
              className="flex items-center justify-center"
              style={{
                width: 50,
                height: 50,
                borderRadius: TUI.radius.xl,
                backgroundColor: TUI.colors.blue30,
                border: 'none',
                cursor: 'pointer',
              }}
              title={participant.isMuted ? 'إلغاء الكتم' : 'كتم'}
            >
              {participant.isMuted ? (
                <MicOff size={25} color={TUI.colors.red} />
              ) : (
                <Mic size={25} color={TUI.colors.G7} />
              )}
            </button>

            {/* Kick Off button */}
            {onKickTemp && (
              <button
                onClick={() => onKickTemp(participant.userId)}
                className="flex items-center justify-center"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: TUI.radius.xl,
                  backgroundColor: TUI.colors.blue30,
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="طرد مؤقت"
              >
                <UserMinus size={25} color={TUI.colors.red} />
              </button>
            )}

            {/* Ban button */}
            {onBan && (
              <button
                onClick={() => onBan(participant.userId)}
                className="flex items-center justify-center"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: TUI.radius.xl,
                  backgroundColor: TUI.colors.blue30,
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="طرد نهائي"
              >
                <UserX size={25} color={TUI.colors.red} />
              </button>
            )}
          </div>

          {/* ── Owner Only: Role Management Dropdown ── */}
          {isOwner && targetRole !== 'owner' && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 w-full py-2 px-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: TUI.colors.bgInput,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Shield size={16} color={TUI.colors.G6} />
                <span
                  className="flex-1 text-right"
                  style={{
                    fontSize: TUI.font.captionG6.size,
                    color: TUI.colors.G6,
                  }}
                >
                  تغيير الدور
                </span>
                <ChevronDown
                  size={14}
                  color={TUI.colors.G5}
                  style={{
                    transform: showRoleMenu ? 'rotate(180deg)' : 'none',
                    transition: TUI.anim.fast,
                  }}
                />
              </button>

              {/* Dropdown */}
              {showRoleMenu && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-1 rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: TUI.colors.bgInput,
                    border: `1px solid ${TUI.colors.strokePrimary}`,
                    zIndex: 10,
                  }}
                >
                  {ROLE_OPTIONS.filter(
                    (opt) => ROLE_LEVELS[opt.value] < myLevel,
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleRoleChange(opt.value)}
                      className="w-full text-right py-2 px-3 transition-colors"
                      style={{
                        fontSize: TUI.font.captionG6.size,
                        color: TUI.colors.G7,
                        backgroundColor:
                          targetRole === opt.value
                            ? 'rgba(28, 102, 229, 0.1)'
                            : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}

                  {/* Remove Role (revert to visitor) */}
                  {targetRole !== 'visitor' && onRemoveRole && (
                    <>
                      <div
                        style={{
                          height: 1,
                          backgroundColor: TUI.colors.G3Divider,
                        }}
                      />
                      <button
                        onClick={() => {
                          onRemoveRole(participant.userId);
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-right py-2 px-3 transition-colors"
                        style={{
                          fontSize: TUI.font.captionG6.size,
                          color: TUI.colors.red,
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        إزالة العضوية
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </BottomSheetOverlay>
  );
}
