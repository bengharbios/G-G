'use client';

import {
  User,
  ArrowUpCircle,
  ArrowLeftRight,
  Lock,
  Unlock,
  XCircle,
  MicOff,
  UserMinus,
  Ban,
  LogOut,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_LEVELS,
  canDo,
  type MicMenuSheetState,
  type RoomRole,
  type VoiceRoomParticipant,
} from '../../types';

interface MicMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  state: MicMenuSheetState;
  myRole: RoomRole;
  isAutoMode: boolean;
  onAction: (action: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  dividerAfter?: boolean;
}

export default function MicMenuSheet({
  isOpen,
  onClose,
  state,
  myRole,
  isAutoMode,
  onAction,
}: MicMenuSheetProps) {
  const { seatIndex, participant, mySeatIndex } = state;
  const isAdmin = canDo(myRole, 'admin');
  const isOwner = canDo(myRole, 'coowner');
  const isOnMySeat = seatIndex === mySeatIndex;
  const isOccupied = !!participant;
  const isLocked = !isOccupied; // we detect locked from parent; empty but unlocked = open

  const buildMenu = (): MenuItem[] => {
    const items: MenuItem[] = [];

    if (isOnMySeat) {
      /* ── My own seat ── */
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
      });

      items.push({
        id: 'leave-seat',
        label: 'مغادرة المقعد',
        icon: <LogOut size={22} />,
        color: TUI.colors.red,
        dividerAfter: true,
      });
    } else if (isOccupied && participant) {
      /* ── Someone else's seat ── */
      const participantLevel = ROLE_LEVELS[participant.role] || 0;
      const myLevel = ROLE_LEVELS[myRole] || 0;

      // Profile (always visible)
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
      });

      if (isAdmin && myLevel > participantLevel) {
        // Mute/Unmute
        items.push({
          id: participant.isMuted ? 'unmute' : 'mute',
          label: participant.isMuted ? 'إلغاء الكتم' : 'كتم',
          icon: participant.isMuted ? (
            <Unlock size={22} />
          ) : (
            <MicOff size={22} />
          ),
          color: participant.isMuted ? TUI.colors.green : TUI.colors.G7,
        });

        // Kick off mic
        items.push({
          id: 'close-seat',
          label: 'إغلاق المقعد',
          icon: <XCircle size={22} />,
          color: TUI.colors.red,
          dividerAfter: true,
        });

        // Kick temp
        items.push({
          id: 'kick-temp',
          label: 'طرد مؤقت',
          icon: <UserMinus size={22} />,
          color: TUI.colors.red,
        });

        // Ban
        items.push({
          id: 'kick-permanent',
          label: 'طرد نهائي',
          icon: <Ban size={22} />,
          color: TUI.colors.red,
        });
      }
    } else {
      /* ── Empty seat ── */
      // Profile area (empty)
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
        dividerAfter: true,
      });

      if (isAdmin) {
        // Take seat
        if (mySeatIndex < 0) {
          items.push({
            id: 'take-seat',
            label: 'صعود',
            icon: <ArrowUpCircle size={22} />,
            color: TUI.colors.B1,
          });
        }

        // Change mic (if already on another seat)
        if (mySeatIndex >= 0) {
          items.push({
            id: 'change-mic',
            label: 'نقل',
            icon: <ArrowLeftRight size={22} />,
            color: TUI.colors.B1,
          });
        }

        // Lock/Unlock
        items.push({
          id: 'toggle-lock',
          label: 'قفل',
          icon: <Lock size={22} />,
          color: TUI.colors.G7,
        });

        // Invite someone
        items.push({
          id: 'invite',
          label: 'دعوة',
          icon: <User size={22} />,
          color: TUI.colors.B1,
        });
      }
    }

    return items;
  };

  const menuItems = buildMenu();

  const handleAction = (actionId: string) => {
    onAction(actionId);
    onClose();
  };

  const renderAvatar = () => {
    if (isOccupied && participant) {
      return (
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 36,
            height: 36,
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
              <span style={{ fontSize: 16, color: TUI.colors.G6 }}>
                {participant.displayName?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: TUI.radius.circle,
          backgroundColor: TUI.colors.bgInput,
        }}
      >
        <span style={{ fontSize: 14, color: TUI.colors.G5 }}>
          {seatIndex + 1}
        </span>
      </div>
    );
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="auto"
      showClose
    >
      {/* Participant header */}
      <div className="flex items-center gap-3 mb-1 pb-3" style={{ borderBottom: `1px solid ${TUI.colors.G3Divider}` }}>
        {renderAvatar()}
        <div className="flex-1 min-w-0">
          <span
            className="block truncate"
            style={{
              fontSize: TUI.font.title16.size,
              fontWeight: 600,
              color: TUI.colors.white,
            }}
          >
            {isOccupied && participant ? participant.displayName : `مقعد ${seatIndex + 1}`}
          </span>
          {isOccupied && participant && (
            <span
              style={{
                fontSize: TUI.font.captionG5.size,
                color: ROLE_COLORS[participant.role],
              }}
            >
              {ROLE_LABELS[participant.role]}
            </span>
          )}
          {!isOccupied && (
            <span style={{ fontSize: TUI.font.captionG5.size, color: TUI.colors.G5 }}>
              فارغ
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mt-1">
        {menuItems.map((item, idx) => (
          <div key={item.id}>
            <button
              onClick={() => handleAction(item.id)}
              className="flex items-center gap-3 w-full py-0 transition-colors"
              style={{
                height: TUI.dim.itemHeight,
                padding: '0 4px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center" style={{ color: item.color }}>
                {item.icon}
              </div>
              {/* Label */}
              <span
                className="flex-1 text-right"
                style={{
                  fontSize: TUI.font.body14.size,
                  fontWeight: 500,
                  color: item.color,
                }}
              >
                {item.label}
              </span>
            </button>

            {/* Divider */}
            {item.dividerAfter && idx < menuItems.length - 1 && (
              <div
                style={{
                  height: 1,
                  backgroundColor: TUI.colors.G3Divider,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </BottomSheetOverlay>
  );
}
