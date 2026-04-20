'use client';

import { Mic, Users, Lock, UserMinus, Unlock, Timer, Ban } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import type { VoiceRoomParticipant, RoomRole } from '../../types';
import { canDo } from '../../types';

interface MenuItemData {
  action: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  iconBg: string;
  destructive?: boolean;
}

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

  // Build menu items
  const menuItems: MenuItemData[] = [];

  if (participant) {
    // View profile — always available
    menuItems.push({
      action: 'view-profile',
      icon: <Users className="w-[18px] h-[18px]" />,
      title: 'عرض البروفايل',
      subtitle: 'مشاهدة ملف المستخدم الشخصي',
      color: '#6c63ff',
      iconBg: 'rgba(108,99,255,0.12)',
    });

    if (isAdmin) {
      // Close mic (lock + pull)
      if (!isSeatLocked) {
        menuItems.push({
          action: 'close-seat',
          icon: <Lock className="w-[18px] h-[18px]" />,
          title: 'إغلاق المايك',
          subtitle: 'إغلاق المايك وإخراج العضو منه',
          color: '#f59e0b',
          iconBg: 'rgba(245,158,11,0.12)',
        });
      }
      // Pull from mic
      menuItems.push({
        action: 'pull-from-mic',
        icon: <UserMinus className="w-[18px] h-[18px]" />,
        title: 'إنزال من المايك',
        subtitle: 'إخراج العضو من المنبر فوراً',
        color: '#ef4444',
        iconBg: 'rgba(239,68,68,0.12)',
        destructive: true,
      });
      // Open mic (unlock)
      if (isSeatLocked) {
        menuItems.push({
          action: 'unlock-seat',
          icon: <Unlock className="w-[18px] h-[18px]" />,
          title: 'فتح المايك',
          subtitle: 'فتح المايك والسماح بالجلوس',
          color: '#22c55e',
          iconBg: 'rgba(34,197,94,0.12)',
        });
      }
      // Temp kick
      menuItems.push({
        action: 'kick-temp',
        icon: <Timer className="w-[18px] h-[18px]" />,
        title: 'طرد مؤقت من الروم',
        subtitle: 'مدة الطرد: 10 دقائق',
        color: '#f97316',
        iconBg: 'rgba(249,115,22,0.12)',
      });
      // Perm ban
      menuItems.push({
        action: 'kick-perm',
        icon: <Ban className="w-[18px] h-[18px]" />,
        title: 'طرد نهائي من الروم',
        subtitle: 'حظر دائم من الغرفة',
        color: '#ef4444',
        iconBg: 'rgba(239,68,68,0.12)',
        destructive: true,
      });
    }

    // Own seat actions
    if (isOnMic) {
      menuItems.push({
        action: 'leave-seat',
        icon: <UserMinus className="w-[18px] h-[18px]" />,
        title: 'النزول من المايك',
        subtitle: 'ترك مقعدك الصوتي',
        color: '#ef4444',
        iconBg: 'rgba(239,68,68,0.12)',
        destructive: true,
      });
    }
  } else {
    // Seat is EMPTY
    if (isAlreadyOnSeat) {
      menuItems.push({
        action: 'change-mic',
        icon: <Mic className="w-[18px] h-[18px]" />,
        title: 'تغيير المايك',
        subtitle: `الانتقال من المايك ${mySeatIndex + 1} إلى المايك ${seatIndex + 1}`,
        color: '#6c63ff',
        iconBg: 'rgba(108,99,255,0.12)',
      });
    } else {
      menuItems.push({
        action: 'take-seat',
        icon: <Mic className="w-[18px] h-[18px]" />,
        title: 'صعود للمايك',
        subtitle: 'الجلوس على هذا المقعد الصوتي',
        color: '#22c55e',
        iconBg: 'rgba(34,197,94,0.12)',
      });
    }

    if (!isSeatLocked && isAdmin) {
      menuItems.push({
        action: 'lock-seat',
        icon: <Lock className="w-[18px] h-[18px]" />,
        title: 'إغلاق المايك',
        subtitle: 'منع أي شخص من الجلوس هنا',
        color: '#f59e0b',
        iconBg: 'rgba(245,158,11,0.12)',
      });
    }

    if (isSeatLocked && isAdmin) {
      menuItems.push({
        action: 'unlock-seat',
        icon: <Unlock className="w-[18px] h-[18px]" />,
        title: 'فتح المايك',
        subtitle: 'السماح للأعضاء بالجلوس',
        color: '#22c55e',
        iconBg: 'rgba(34,197,94,0.12)',
      });
    }
  }

  // Find divider positions (before destructive items, before own seat actions)
  const getDividerBefore = (index: number) => {
    const item = menuItems[index];
    if (!item) return false;
    // Divider before "pull-from-mic" if preceded by non-destructive
    if (item.action === 'pull-from-mic') return index > 0;
    // Divider before "leave-seat" if preceded by admin actions
    if (item.action === 'leave-seat') return index > 0;
    // Divider before destructive items when participant exists
    if (item.action === 'kick-temp' && index > 1) return true;
    return false;
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={participant
        ? `المايك ${seatIndex + 1} — ${participant.displayName}`
        : `المايك ${seatIndex + 1}`}
    >
      <div className="space-y-1 pb-4">
        {menuItems.map((item, idx) => (
          <div key={item.action}>
            {getDividerBefore(idx) && (
              <div className="my-2 mx-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            )}
            <button
              onClick={() => { onAction(item.action); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-[#3a3a3a] active:bg-[#4a4a4a] group"
              style={{
                background: 'transparent',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{ background: item.iconBg, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="text-right flex-1 min-w-0">
                <div
                  className="text-[14px] font-semibold leading-tight"
                  style={{ color: item.destructive ? '#ef4444' : 'rgba(255,255,255,0.9)' }}
                >
                  {item.title}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {item.subtitle}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </BottomSheetOverlay>
  );
}
