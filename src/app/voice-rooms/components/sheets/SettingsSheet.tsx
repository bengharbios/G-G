'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Lock,
  Unlock,
  Shield,
  Clock,
  Diamond,
  ChevronLeft,
  X,
  Check,
  Crown,
  Vote,
  Palette,
  Pencil,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, type VoiceRoom } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   SettingsSheet — Yalla Ludo-Style Room Settings

   Teal-green gradient background, white setting cards with icons,
   chevron arrows, and two sub-dialogs (MicMode, AdminPermission).
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Props ──────────────────────────────────────────────────────────────────

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  onUpdate: (data: Record<string, unknown>) => void;
}

// ─── Mic Mode Option Types ─────────────────────────────────────────────────

type MicModeKey = 'chat5' | 'broadcast5' | 'chat10' | 'team10';

interface MicModeOption {
  key: MicModeKey;
  label: string;
  sublabel: string;
  icon: 'chat' | 'broadcast' | 'chat' | 'team';
  locked: boolean;
}

const MIC_MODE_OPTIONS: MicModeOption[] = [
  { key: 'chat5', label: 'محادثة', sublabel: '5 مايكات', icon: 'chat', locked: false },
  { key: 'broadcast5', label: 'بث', sublabel: '5 مايكات', icon: 'broadcast', locked: false },
  { key: 'chat10', label: 'محادثة', sublabel: '10 مايكات', icon: 'chat', locked: true },
  { key: 'team10', label: 'فريق', sublabel: '10 مايكات', icon: 'team', locked: true },
];

// ─── Settings Row Data ────────────────────────────────────────────────────

interface SettingRow {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  value?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

// ─── Toggle Switch Component ──────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors"
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: checked ? TUI.colors.tealLight : TUI.colors.cardBorder,
        border: 'none',
        cursor: 'pointer',
      }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="absolute top-[3px] transition-all"
        style={{
          width: 22,
          height: 22,
          borderRadius: TUI.radius.circle,
          backgroundColor: TUI.colors.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          right: checked ? 3 : 23,
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MicModeDialog
   ═══════════════════════════════════════════════════════════════════════ */

function MicModeDialog({
  isOpen,
  onClose,
  currentMode,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentMode: MicModeKey;
  onConfirm: (mode: MicModeKey) => void;
}) {
  const [selected, setSelected] = useState<MicModeKey>(currentMode);

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  // Render mic circles based on mode type
  const renderMicVisual = (option: MicModeOption) => {
    const baseColor = option.locked ? '#BDBDBD' : TUI.colors.tealLight;

    if (option.icon === 'broadcast') {
      // Star pattern: 1 top + 4 around it
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className="rounded-sm"
            style={{
              width: 14,
              height: 14,
              backgroundColor: baseColor,
              opacity: option.locked ? 0.4 : 1,
            }}
          />
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: baseColor,
                  opacity: option.locked ? 0.4 : 1,
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    // Chat / Team: rows of circles
    const rows = option.sublabel.includes('10') ? 2 : 1;
    const cols = option.sublabel.includes('10') ? 5 : 5;

    return (
      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-1">
            {Array.from({ length: cols }).map((_, col) => (
              <div
                key={col}
                className="rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: baseColor,
                  opacity: option.locked ? 0.4 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full flex flex-col"
            style={{
              maxWidth: 420,
              maxHeight: '85vh',
              borderTopLeftRadius: TUI.radius.xl,
              borderTopRightRadius: TUI.radius.xl,
              backgroundColor: TUI.colors.white,
              overflow: 'hidden',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Teal Header */}
            <div
              className="flex items-center justify-center relative"
              style={{
                height: 52,
                background: `linear-gradient(135deg, ${TUI.colors.tealDark}, ${TUI.colors.teal})`,
              }}
            >
              <span
                className="absolute"
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: TUI.colors.white,
                }}
              >
                نمط المايك
              </span>
              <button
                onClick={onClose}
                className="absolute left-4 flex items-center justify-center rounded-full"
                style={{ width: 32, height: 32, color: TUI.colors.white }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 2x2 Grid */}
            <div
              className="grid grid-cols-2 gap-3 p-4"
              style={{ direction: 'rtl' }}
            >
              {MIC_MODE_OPTIONS.map((option) => {
                const isSelected = selected === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => !option.locked && setSelected(option.key)}
                    className="relative flex flex-col items-center justify-center gap-2 p-3 transition-all"
                    style={{
                      borderRadius: TUI.radius.lg,
                      border: isSelected
                        ? `2px solid ${TUI.colors.tealLight}`
                        : `1px solid ${TUI.colors.cardBorder}`,
                      backgroundColor: isSelected ? TUI.colors.tealMint : '#FAFAFA',
                      opacity: option.locked ? 0.55 : 1,
                      cursor: option.locked ? 'not-allowed' : 'pointer',
                      minHeight: 110,
                    }}
                  >
                    {/* Lock icon for locked items */}
                    {option.locked && (
                      <div
                        className="absolute top-2 left-2 flex items-center justify-center rounded-full"
                        style={{
                          width: 22,
                          height: 22,
                          backgroundColor: 'rgba(0,0,0,0.06)',
                        }}
                      >
                        <Lock size={12} color={TUI.colors.textGray} />
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                        style={{
                          width: 22,
                          height: 22,
                          backgroundColor: TUI.colors.tealLight,
                        }}
                      >
                        <Check size={13} color={TUI.colors.white} strokeWidth={3} />
                      </div>
                    )}

                    {/* Mic visual */}
                    {renderMicVisual(option)}

                    {/* Label */}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? TUI.colors.teal : TUI.colors.textDark,
                      }}
                    >
                      {option.label} - {option.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <div className="p-4 pt-0">
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center rounded-lg transition-all active:scale-[0.98]"
                style={{
                  height: 46,
                  background: `linear-gradient(135deg, #FFD700, #FFC107)`,
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(255,193,7,0.3)',
                }}
              >
                تأكيد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AdminPermissionDialog
   ═══════════════════════════════════════════════════════════════════════ */

interface AdminPermissionState {
  useClock: boolean;
  startVote: boolean;
  lockMic: boolean;
  changeTheme: boolean;
}

function AdminPermissionDialog({
  isOpen,
  onClose,
  onConfirm,
  initialState,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (state: AdminPermissionState) => void;
  initialState: AdminPermissionState;
}) {
  const [perms, setPerms] = useState<AdminPermissionState>(initialState);

  const updatePerm = (key: keyof AdminPermissionState, value: boolean) => {
    setPerms((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(perms);
    onClose();
  };

  const permItems: {
    key: keyof AdminPermissionState;
    label: string;
    icon: React.ReactNode;
    iconBg: string;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      key: 'useClock',
      label: 'السماح للمشرف باستخدام الساعة',
      icon: <Clock size={18} color={TUI.colors.orange} />,
      iconBg: 'rgba(255,152,0,0.12)',
    },
    {
      key: 'startVote',
      label: 'السماح للمشرف ببدء التصويت',
      icon: <Vote size={18} color={TUI.colors.orange} />,
      iconBg: 'rgba(255,152,0,0.12)',
    },
    {
      key: 'lockMic',
      label: 'السماح للمشرف بقفل/فتح المايك',
      icon: <Unlock size={18} color={TUI.colors.orange} />,
      iconBg: 'rgba(255,152,0,0.12)',
      badge: '1',
      badgeColor: TUI.colors.orange,
    },
    {
      key: 'changeTheme',
      label: 'السماح للمشرف بتغيير السمة',
      icon: <Palette size={18} color={TUI.colors.orange} />,
      iconBg: 'rgba(255,152,0,0.12)',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full flex flex-col"
            style={{
              maxWidth: 420,
              maxHeight: '85vh',
              borderTopLeftRadius: TUI.radius.xl,
              borderTopRightRadius: TUI.radius.xl,
              backgroundColor: TUI.colors.white,
              overflow: 'hidden',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Teal Header */}
            <div
              className="flex items-center justify-center relative"
              style={{
                height: 52,
                background: `linear-gradient(135deg, ${TUI.colors.tealDark}, ${TUI.colors.teal})`,
              }}
            >
              <span
                className="absolute"
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: TUI.colors.white,
                }}
              >
                صلاحية الإدارة
              </span>
              <button
                onClick={onClose}
                className="absolute left-4 flex items-center justify-center rounded-full"
                style={{ width: 32, height: 32, color: TUI.colors.white }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Permission Toggle Rows */}
            <div className="p-4 flex flex-col gap-1" style={{ direction: 'rtl' }}>
              {permItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 py-3"
                  style={{
                    borderBottom: `1px solid ${TUI.colors.cardBorder}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: TUI.radius.md,
                      backgroundColor: item.iconBg,
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Label + Badge */}
                  <div className="flex-1 flex items-center gap-2">
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: TUI.colors.textDark,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className="flex items-center justify-center shrink-0 rounded-full"
                        style={{
                          minWidth: 20,
                          height: 20,
                          padding: '0 6px',
                          backgroundColor: item.badgeColor || TUI.colors.red,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: TUI.colors.white,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Toggle */}
                  <ToggleSwitch
                    checked={perms[item.key]}
                    onChange={(v) => updatePerm(item.key, v)}
                  />
                </div>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="p-4 pt-2">
              <button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center rounded-lg transition-all active:scale-[0.98]"
                style={{
                  height: 46,
                  background: `linear-gradient(135deg, #FFD700, #FFC107)`,
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(255,193,7,0.3)',
                }}
              >
                تأكيد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SettingsSheet — Main Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function SettingsSheet({
  isOpen,
  onClose,
  room,
  onUpdate,
}: SettingsSheetProps) {
  // ── Sub-dialog states ──
  const [showMicModeDialog, setShowMicModeDialog] = useState(false);
  const [showAdminPermDialog, setShowAdminPermDialog] = useState(false);
  const [selectedMicMode, setSelectedMicMode] = useState<MicModeKey>('chat5');

  const [adminPerms, setAdminPerms] = useState<AdminPermissionState>({
    useClock: true,
    startVote: false,
    lockMic: true,
    changeTheme: false,
  });

  // ── Mic mode labels for display ──
  const getMicModeLabel = (key: MicModeKey): string => {
    const map: Record<MicModeKey, string> = {
      chat5: 'محادثة - 5 مايكات',
      broadcast5: 'بث - 5 مايكات',
      chat10: 'محادثة - 10 مايكات',
      team10: 'فريق - 10 مايكات',
    };
    return map[key];
  };

  // ── Handlers ──
  const handleMicModeConfirm = useCallback(
    (mode: MicModeKey) => {
      setSelectedMicMode(mode);
      onUpdate({ micMode: mode });
    },
    [onUpdate],
  );

  const handleAdminPermConfirm = useCallback(
    (state: AdminPermissionState) => {
      setAdminPerms(state);
      onUpdate({ adminPermissions: state });
    },
    [onUpdate],
  );

  // ── Settings rows ──
  const settingsGroups: SettingRow[][] = [
    // Group 1: Mic & Permissions
    [
      {
        id: 'mic-mode',
        label: 'نمط المايك',
        icon: <Mic size={20} color={TUI.colors.teal} />,
        iconBg: 'rgba(13,138,122,0.1)',
        value: getMicModeLabel(selectedMicMode),
        onClick: () => setShowMicModeDialog(true),
      },
      {
        id: 'mic-permission',
        label: 'صلاحية المايك',
        icon: <Lock size={20} color={TUI.colors.red} />,
        iconBg: 'rgba(252,85,85,0.1)',
        onClick: () => {},
      },
      {
        id: 'admin-permission',
        label: 'صلاحية الإدارة',
        icon: <Pencil size={20} color={TUI.colors.orange} />,
        iconBg: 'rgba(255,152,0,0.1)',
        onClick: () => setShowAdminPermDialog(true),
      },
    ],
    // Group 2: Room Management
    [
      {
        id: 'membership-fee',
        label: 'رسوم العضوية',
        icon: <Diamond size={20} color={TUI.colors.blue} />,
        iconBg: 'rgba(33,150,243,0.1)',
        value: '80',
        onClick: () => {},
      },
      {
        id: 'remove-members',
        label: 'إزالة الأعضاء',
        icon: <Clock size={20} color={TUI.colors.orange} />,
        iconBg: 'rgba(255,152,0,0.1)',
        onClick: () => {},
      },
      {
        id: 'blocked-list',
        label: 'قائمة الممنوعين',
        icon: <Shield size={20} color={TUI.colors.orange} />,
        iconBg: 'rgba(255,152,0,0.1)',
        onClick: () => {},
      },
    ],
    // Group 3: Operations & Bonus
    [
      {
        id: 'operation-records',
        label: 'سجل العمليات',
        icon: <ScrollText size={20} color={TUI.colors.orange} />,
        iconBg: 'rgba(255,152,0,0.1)',
        onClick: () => {},
      },
      {
        id: 'daily-bonus',
        label: 'المكافأة اليومية',
        icon: <Diamond size={20} color={TUI.colors.blue} />,
        iconBg: 'rgba(33,150,243,0.1)',
        onClick: () => {},
      },
    ],
  ];

  return (
    <>
      {/* ── Main Settings Sheet ── */}
      <BottomSheetOverlay
        isOpen={isOpen}
        onClose={onClose}
        height="75%"
        title=""
        zIndex={50}
      >
        {/* Override the default content — custom teal design */}
        <div
          className="flex flex-col h-full"
          style={{ direction: 'rtl' }}
        >
          {/* ── Teal Header with gradient ── */}
          <div
            className="flex items-center justify-center relative shrink-0"
            style={{
              height: 56,
              background: `linear-gradient(135deg, ${TUI.colors.tealDark}, ${TUI.colors.teal}, ${TUI.colors.tealLight})`,
              borderTopLeftRadius: TUI.radius.xl,
              borderTopRightRadius: TUI.radius.xl,
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: TUI.colors.white,
              }}
            >
              الإعدادات
            </span>
            <button
              onClick={onClose}
              className="absolute left-4 flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 32,
                height: 32,
                color: 'rgba(255,255,255,0.9)',
              }}
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Scrollable Content ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              background: `linear-gradient(180deg, ${TUI.colors.teal} 0%, ${TUI.colors.tealDark} 100%)`,
              padding: '16px 16px 24px',
            }}
          >
            {/* ── User Profile Section ── */}
            <div
              className="flex items-center gap-3 p-3 mb-4"
              style={{
                backgroundColor: TUI.colors.white,
                borderRadius: TUI.radius.lg,
                boxShadow: TUI.colors.cardShadow,
              }}
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: TUI.radius.circle,
                  background: `linear-gradient(135deg, ${TUI.colors.teal}, ${TUI.colors.tealLight})`,
                }}
              >
                <Crown size={22} color={TUI.colors.gold} />
              </div>

              {/* User Info */}
              <div className="flex-1 flex flex-col gap-1">
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: TUI.colors.textDark,
                  }}
                >
                  {room.hostName || 'المالك'}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: '12px',
                      color: TUI.colors.textGray,
                    }}
                  >
                    ID: {room.hostId?.slice(0, 8) || '----'}
                  </span>
                  <span
                    className="flex items-center justify-center px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'rgba(13,138,122,0.1)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: TUI.colors.teal,
                    }}
                  >
                    مالك
                  </span>
                </div>
              </div>

              {/* Tag field */}
              <div
                className="flex items-center justify-center shrink-0 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,215,0,0.15)',
                  border: `1px solid rgba(255,215,0,0.3)`,
                }}
              >
                <Sparkles size={14} color={TUI.colors.gold} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: TUI.colors.goldDark,
                    marginRight: 4,
                  }}
                >
                  VIP
                </span>
              </div>
            </div>

            {/* ── Settings Card Groups ── */}
            {settingsGroups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className="mb-3"
                style={{
                  backgroundColor: TUI.colors.white,
                  borderRadius: TUI.radius.lg,
                  boxShadow: TUI.colors.cardShadow,
                  overflow: 'hidden',
                }}
              >
                {group.map((row, rowIdx) => (
                  <button
                    key={row.id}
                    onClick={row.onClick}
                    className="w-full flex items-center gap-3 px-4 transition-colors active:bg-gray-50"
                    style={{
                      height: 56,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom:
                        rowIdx < group.length - 1
                          ? `1px solid ${TUI.colors.cardBorder}`
                          : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: TUI.radius.md,
                        backgroundColor: row.iconBg,
                      }}
                    >
                      {row.icon}
                    </div>

                    {/* Label */}
                    <span
                      className="flex-1 text-right"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: TUI.colors.textDark,
                      }}
                    >
                      {row.label}
                    </span>

                    {/* Value (if any) */}
                    {row.value && (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: '13px',
                          fontWeight: 400,
                          color: TUI.colors.textGray,
                          marginLeft: 8,
                        }}
                      >
                        {row.value}
                      </span>
                    )}

                    {/* Badge (if any) */}
                    {row.badge && (
                      <span
                        className="flex items-center justify-center shrink-0 rounded-full"
                        style={{
                          minWidth: 18,
                          height: 18,
                          padding: '0 5px',
                          backgroundColor: row.badgeColor || TUI.colors.red,
                          fontSize: '10px',
                          fontWeight: 700,
                          color: TUI.colors.white,
                          marginLeft: 6,
                        }}
                      >
                        {row.badge}
                      </span>
                    )}

                    {/* Chevron */}
                    <ChevronLeft
                      size={18}
                      color={TUI.colors.textMuted}
                      className="shrink-0"
                      style={{ marginLeft: 2 }}
                    />
                  </button>
                ))}
              </div>
            ))}

            {/* Bottom spacing */}
            <div style={{ height: 16 }} />
          </div>
        </div>
      </BottomSheetOverlay>

      {/* ── Sub-Dialogs ── */}
      <MicModeDialog
        isOpen={showMicModeDialog}
        onClose={() => setShowMicModeDialog(false)}
        currentMode={selectedMicMode}
        onConfirm={handleMicModeConfirm}
      />

      <AdminPermissionDialog
        isOpen={showAdminPermDialog}
        onClose={() => setShowAdminPermDialog(false)}
        onConfirm={handleAdminPermConfirm}
        initialState={adminPerms}
      />
    </>
  );
}
