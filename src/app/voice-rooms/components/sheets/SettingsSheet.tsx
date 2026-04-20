'use client';

import { useState } from 'react';
import {
  ImageIcon,
  Mic,
  MicOff,
  Users,
  Lock,
  Globe,
  Key,
  EyeOff,
  Edit3,
  Check,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  DEFAULT_BG_URLS,
  MIC_OPTIONS,
  ROOM_MODE_OPTIONS,
  type VoiceRoom,
} from '../../types';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  onUpdate: (data: Partial<VoiceRoom>) => void;
}

export default function SettingsSheet({
  isOpen,
  onClose,
  room,
  onUpdate,
}: SettingsSheetProps) {
  const [selectedBg, setSelectedBg] = useState<string | null>(room.roomImage || null);
  const [isMuted, setIsMuted] = useState(room.chatMuted);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(room.name);
  const [selectedMode, setSelectedMode] = useState(room.roomMode);
  const [selectedMicCount, setSelectedMicCount] = useState(room.micSeatCount);
  const [isAutoMode, setIsAutoMode] = useState(room.isAutoMode);

  const handleSaveName = () => {
    if (nameInput.trim() && nameInput !== room.name) {
      onUpdate({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const handleBgSelect = (url: string) => {
    setSelectedBg(url);
    onUpdate({ roomImage: url });
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    onUpdate({ chatMuted: next });
  };

  const handleModeSelect = (mode: typeof room.roomMode) => {
    setSelectedMode(mode);
    onUpdate({ roomMode: mode });
  };

  const handleMicCountSelect = (count: number) => {
    setSelectedMicCount(count);
    onUpdate({ micSeatCount: count });
  };

  const handleToggleAutoMode = () => {
    const next = !isAutoMode;
    setIsAutoMode(next);
    onUpdate({ isAutoMode: next });
  };

  /* ── Settings items (horizontal scroll, matching Flutter settings_panel) ── */
  const settingsItems = [
    {
      id: 'background',
      icon: <ImageIcon size={30} color={TUI.colors.G7} />,
      label: 'الخلفية',
    },
    {
      id: 'mute',
      icon: isMuted ? (
        <MicOff size={30} color={TUI.colors.red} />
      ) : (
        <Mic size={30} color={TUI.colors.green} />
      ),
      label: isMuted ? 'الغاء الكتم' : 'كتم الغرفة',
    },
    {
      id: 'name',
      icon: <Edit3 size={30} color={TUI.colors.G7} />,
      label: 'اسم الغرفة',
    },
  ];

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height={350}
      title="الإعدادات"
    >
      {/* Horizontal Settings Items */}
      <div
        className="flex gap-[22px] mb-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ direction: 'rtl' }}
      >
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'mute') handleToggleMute();
              if (item.id === 'name') setEditingName(true);
            }}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            {/* Icon container: 56px, rounded-[10px], bg blue30, p-2 */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: TUI.radius.xl,
                backgroundColor: TUI.colors.blue30,
                padding: 2,
              }}
            >
              {item.icon}
            </div>
            {/* Label */}
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Background Image Picker ── */}
      <div className="mb-4">
        <p
          className="mb-2"
          style={{
            fontSize: TUI.font.captionG6.size,
            color: TUI.colors.G6,
            fontWeight: 500,
          }}
        >
          اختر الخلفية
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* No background option */}
          <button
            onClick={() => handleBgSelect('')}
            className="shrink-0 w-16 h-16 rounded-lg flex items-center justify-center transition-all"
            style={{
              borderRadius: TUI.radius.lg,
              border: selectedBg === null || selectedBg === ''
                ? `2px solid ${TUI.colors.sliderFilled}`
                : '2px solid transparent',
              backgroundColor: TUI.colors.bgInput,
            }}
          >
            <ImageIcon size={20} color={TUI.colors.G5} />
          </button>
          {DEFAULT_BG_URLS.map((url, idx) => (
            <button
              key={idx}
              onClick={() => handleBgSelect(url)}
              className="shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
              style={{
                borderRadius: TUI.radius.lg,
                border: selectedBg === url
                  ? `2px solid ${TUI.colors.sliderFilled}`
                  : '2px solid transparent',
              }}
            >
              <img
                src={url}
                alt={`bg-${idx}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Room Name Editor ── */}
      {editingName && (
        <div className="mb-4 flex items-center gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            className="flex-1 outline-none"
            style={{
              height: 36,
              padding: '0 12px',
              backgroundColor: TUI.colors.bgInput,
              borderRadius: TUI.radius.md,
              color: TUI.colors.white,
              fontSize: TUI.font.body14.size,
              border: `1px solid ${TUI.colors.strokePrimary}`,
            }}
            maxLength={30}
            autoFocus
          />
          <button
            onClick={handleSaveName}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: TUI.radius.md,
              backgroundColor: TUI.colors.B1,
              border: 'none',
            }}
          >
            <Check size={18} color={TUI.colors.white} />
          </button>
        </div>
      )}

      {/* ── Room Mode ── */}
      <div className="mb-4">
        <p
          className="mb-2"
          style={{
            fontSize: TUI.font.captionG6.size,
            color: TUI.colors.G6,
            fontWeight: 500,
          }}
        >
          نوع الغرفة
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ROOM_MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => handleModeSelect(mode.value)}
                className="flex flex-col items-center gap-1.5 py-3 transition-all"
                style={{
                  borderRadius: TUI.radius.lg,
                  backgroundColor: isActive
                    ? 'rgba(28, 102, 229, 0.12)'
                    : TUI.colors.bgInput,
                  border: isActive
                    ? `1px solid ${TUI.colors.B1}`
                    : '1px solid transparent',
                }}
              >
                <Icon
                  size={22}
                  color={isActive ? TUI.colors.B1d : TUI.colors.G5}
                />
                <span
                  style={{
                    fontSize: TUI.font.captionG6.size,
                    color: isActive ? TUI.colors.white : TUI.colors.G6,
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mic Count ── */}
      <div className="mb-4">
        <p
          className="mb-2"
          style={{
            fontSize: TUI.font.captionG6.size,
            color: TUI.colors.G6,
            fontWeight: 500,
          }}
        >
          عدد المقاعد
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MIC_OPTIONS.map((count) => {
            const isActive = selectedMicCount === count;
            return (
              <button
                key={count}
                onClick={() => handleMicCountSelect(count)}
                className="shrink-0 px-4 py-2 rounded-full transition-all"
                style={{
                  fontSize: TUI.font.caption12.size,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? TUI.colors.white : TUI.colors.G6,
                  backgroundColor: isActive
                    ? TUI.colors.B1
                    : TUI.colors.bgInput,
                  borderRadius: TUI.radius.pill,
                  border: 'none',
                }}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Auto Mode Toggle ── */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: TUI.font.captionG6.size,
            color: TUI.colors.G6,
            fontWeight: 500,
          }}
        >
          الجلوس الحر (بدون موافقة)
        </span>
        {/* Toggle switch */}
        <button
          onClick={handleToggleAutoMode}
          className="relative shrink-0 transition-colors"
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: isAutoMode ? TUI.colors.B1 : TUI.colors.sliderEmpty,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            className="absolute top-[2px] transition-all"
            style={{
              width: 20,
              height: 20,
              borderRadius: TUI.radius.circle,
              backgroundColor: TUI.colors.white,
              left: isAutoMode ? 22 : 2,
            }}
          />
        </button>
      </div>
    </BottomSheetOverlay>
  );
}
