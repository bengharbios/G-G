'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import type { VoiceRoom, RoomMode } from '../../types';
import { MIC_OPTIONS } from '../../types';

export default function SettingsSheet({
  isOpen, onClose, room, onUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  const [micCount, setMicCount] = useState(room.micSeatCount);
  const [guestMic, setGuestMic] = useState(false);
  const [memberMic, setMemberMic] = useState(true);
  const [roomType, setRoomType] = useState<RoomMode>(room.roomMode);
  const [kickDuration] = useState(10);
  const [saving, setSaving] = useState(false);
  const [availableBgs, setAvailableBgs] = useState<Array<{ id: string; imageUrl: string; thumbnailUrl: string; nameAr: string; rarity: string; price: number; owned: boolean }>>([]);
  const [selectedBg, setSelectedBg] = useState(room.roomImage || '');
  const [bgLoading, setBgLoading] = useState(false);
  const hasLoadedBgs = useRef(false);

  const roomTypes: { value: RoomMode; label: string; icon: string }[] = [
    { value: 'public', label: 'عامة', icon: '🔓' },
    { value: 'private', label: 'خاصة', icon: '🔒' },
    { value: 'key', label: 'مقيّدة', icon: '🔑' },
  ];

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      micSeatCount: micCount,
      roomMode: roomType,
      isAutoMode: guestMic ? 1 : 0,
      guestMicEnabled: guestMic,
      memberMicEnabled: memberMic,
      roomImage: selectedBg,
    });
    setSaving(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setMicCount(room.micSeatCount);
      setRoomType(room.roomMode);
      setSelectedBg(room.roomImage || '');
      hasLoadedBgs.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || hasLoadedBgs.current) return;
    hasLoadedBgs.current = true;
    setBgLoading(true);
    fetch('/api/room-backgrounds')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.backgrounds) {
          setAvailableBgs(data.backgrounds.map((b: Record<string, unknown>) => ({
            id: (b.background as Record<string, unknown>).id as string,
            imageUrl: (b.background as Record<string, unknown>).imageUrl as string,
            thumbnailUrl: (b.background as Record<string, unknown>).thumbnailUrl as string,
            nameAr: (b.background as Record<string, unknown>).nameAr as string,
            rarity: (b.background as Record<string, unknown>).rarity as string,
            price: (b.background as Record<string, unknown>).price as number,
            owned: b.owned as boolean,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setBgLoading(false));
  }, [isOpen]);

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] flex flex-col pb-6">
        {/* Title */}
        <div className="text-[15px] font-bold text-center text-[#f0f0f8] px-4 pb-3.5 border-b border-[rgba(255,255,255,0.07)] mb-2">
          إعدادات الغرفة
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
          {/* Section: Mic count */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">عدد المايكات</div>
            <div className="flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎙</span>
                <span className="text-[13px] font-semibold text-[#f0f0f8]">المقاعد الصوتية</span>
              </div>
              <div className="flex gap-1.5">
                {MIC_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setMicCount(n)}
                    className={`px-3 py-1 rounded-lg border text-[12px] font-bold transition-all ${
                      micCount === n
                        ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                        : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Mic permissions */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">صلاحيات الصعود للمايك</div>
            <div className="space-y-1">
              <button
                onClick={() => setGuestMic(!guestMic)}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👤</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">الزوار يصعدون للمايك</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${guestMic ? 'bg-[#22c55e]' : 'bg-[#5a6080]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${guestMic ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </button>
              <button
                onClick={() => setMemberMic(!memberMic)}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⭐</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">الأعضاء يصعدون مباشرة</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${memberMic ? 'bg-[#22c55e]' : 'bg-[#5a6080]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${memberMic ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Section: Room Background */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">موضوع الغرفة (الخلفية)</div>
            {bgLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#6c63ff]" />
              </div>
            ) : availableBgs.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setSelectedBg('')}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                    selectedBg === '' ? 'border-[#6c63ff]' : 'border-transparent'
                  }`}
                >
                  <div className="w-full h-full bg-[#141726] flex items-center justify-center">
                    <span className="text-[10px] text-[#5a6080]">بدون</span>
                  </div>
                </button>
                {availableBgs.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => bg.owned ? setSelectedBg(bg.imageUrl) : undefined}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] ${
                      selectedBg === bg.imageUrl ? 'border-[#6c63ff]' : 'border-transparent'
                    } ${!bg.owned ? 'opacity-50' : ''}`}
                  >
                    {(bg.thumbnailUrl || bg.imageUrl) ? (
                      <img src={bg.thumbnailUrl || bg.imageUrl} alt={bg.nameAr} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1c2035] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-[#5a6080]" />
                      </div>
                    )}
                    {!bg.owned && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[9px] text-[#f59e0b] font-bold">{bg.price} 💎</span>
                      </div>
                    )}
                    {selectedBg === bg.imageUrl && (
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#6c63ff] flex items-center justify-center">
                        <span className="text-[8px] text-white">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-[#1c2035] rounded-xl px-3.5 py-3 text-center">
                <span className="text-[12px] text-[#5a6080]">لا توجد خلفيات متاحة حالياً</span>
              </div>
            )}
          </div>

          {/* Section: Privacy */}
          <div className="mb-3.5">
            <div className="text-[11px] text-[#5a6080] font-semibold mb-2">خصوصية الغرفة</div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  const idx = roomTypes.findIndex(r => r.value === roomType);
                  setRoomType(roomTypes[(idx + 1) % roomTypes.length].value);
                }}
                className="w-full flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3 hover:bg-[#232843] active:bg-[#232843] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{roomTypes.find(r => r.value === roomType)?.icon || '🔓'}</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">نوع الغرفة</span>
                </div>
                <span className="text-[12px] text-[#5a6080]">
                  {roomTypes.find(r => r.value === roomType)?.label}
                </span>
              </button>
              <div className="flex items-center justify-between bg-[#1c2035] rounded-xl px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⏱</span>
                  <span className="text-[13px] font-semibold text-[#f0f0f8]">مدة الطرد المؤقت</span>
                </div>
                <span className="text-[12px] text-[#5a6080]">{kickDuration} دقائق</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold text-[14px] text-white bg-gradient-to-l from-[#6c63ff] to-[#a78bfa] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
