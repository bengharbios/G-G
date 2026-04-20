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

  // Sync state with room props when room changes (not via effect)
  const lastSyncedRoomId = useRef(room.id);
  if (room.id !== lastSyncedRoomId.current) {
    lastSyncedRoomId.current = room.id;
    setMicCount(room.micSeatCount);
    setRoomType(room.roomMode);
    setSelectedBg(room.roomImage || '');
    hasLoadedBgs.current = false;
  }

  useEffect(() => {
    if (!isOpen || hasLoadedBgs.current) return;
    hasLoadedBgs.current = true;
    let cancelled = false;
    (async () => {
      try {
        setBgLoading(true);
        const res = await fetch('/api/room-backgrounds');
        const data = await res.json();
        if (!cancelled && data.success && data.backgrounds) {
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
      } catch { /* ignore */ }
      finally { if (!cancelled) setBgLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose} title="إعدادات الغرفة">
      <div className="max-h-[78vh] flex flex-col pb-4">
        <div className="flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {/* Section: Mic count */}
          <div>
            <div className="text-[11px] font-semibold mb-2 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>عدد المايكات</div>
            <div className="flex items-center justify-between rounded-xl px-3.5 py-3" style={{ background: '#3a3a3a' }}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎙</span>
                <span className="text-[13px] font-semibold text-white">المقاعد الصوتية</span>
              </div>
              <div className="flex gap-1.5">
                {MIC_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setMicCount(n)}
                    className="px-3 py-1 rounded-lg text-[12px] font-bold transition-all duration-200"
                    style={{
                      background: micCount === n ? '#2B6AD6' : '#22262E',
                      color: micCount === n ? '#fff' : 'rgba(255,255,255,0.6)',
                      border: `2px solid ${micCount === n ? '#2B6AD6' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Mic permissions — Toggle switches */}
          <div>
            <div className="text-[11px] font-semibold mb-2 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>صلاحيات الصعود للمايك</div>
            <div className="space-y-1.5">
              <button
                onClick={() => setGuestMic(!guestMic)}
                className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-[#4a4a4a]"
                style={{ background: '#3a3a3a' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👤</span>
                  <span className="text-[13px] font-semibold text-white">الزوار يصعدون للمايك</span>
                </div>
                <div
                  className="w-10 h-[22px] rounded-full transition-all duration-200 relative flex-shrink-0"
                  style={{ background: guestMic ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200"
                    style={{ [guestMic ? 'left' : 'right']: '2px' }}
                  />
                </div>
              </button>
              <button
                onClick={() => setMemberMic(!memberMic)}
                className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-[#4a4a4a]"
                style={{ background: '#3a3a3a' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⭐</span>
                  <span className="text-[13px] font-semibold text-white">الأعضاء يصعدون مباشرة</span>
                </div>
                <div
                  className="w-10 h-[22px] rounded-full transition-all duration-200 relative flex-shrink-0"
                  style={{ background: memberMic ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200"
                    style={{ [memberMic ? 'left' : 'right']: '2px' }}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Section: Room Background */}
          <div>
            <div className="text-[11px] font-semibold mb-2 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>موضوع الغرفة (الخلفية)</div>
            {bgLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#6c63ff]" />
              </div>
            ) : availableBgs.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedBg('')}
                  className="relative rounded-xl overflow-hidden transition-all duration-200 aspect-[3/4]"
                  style={{
                    border: `2px solid ${selectedBg === '' ? '#2B6AD6' : 'transparent'}`,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#22262E' }}>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>بدون</span>
                  </div>
                  {selectedBg === '' && (
                    <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#2B6AD6' }}>
                      <span className="text-[8px] text-white">✓</span>
                    </div>
                  )}
                </button>
                {availableBgs.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => bg.owned ? setSelectedBg(bg.imageUrl) : undefined}
                    className="relative rounded-xl overflow-hidden transition-all duration-200 aspect-[3/4]"
                    style={{
                      border: `2px solid ${selectedBg === bg.imageUrl ? '#2B6AD6' : 'transparent'}`,
                      opacity: bg.owned ? 1 : 0.5,
                    }}
                  >
                    {(bg.thumbnailUrl || bg.imageUrl) ? (
                      <img src={bg.thumbnailUrl || bg.imageUrl} alt={bg.nameAr} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#3a3a3a' }}>
                        <ImageIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}
                    {!bg.owned && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-[9px] text-[#f59e0b] font-bold">{bg.price} 💎</span>
                      </div>
                    )}
                    {selectedBg === bg.imageUrl && (
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#2B6AD6' }}>
                        <span className="text-[8px] text-white">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl px-3.5 py-4 text-center" style={{ background: '#3a3a3a' }}>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>لا توجد خلفيات متاحة حالياً</span>
              </div>
            )}
          </div>

          {/* Section: Room Mode — TUILiveKit LayoutSwitch style cards */}
          <div>
            <div className="text-[11px] font-semibold mb-2 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>خصوصية الغرفة</div>
            <div className="grid grid-cols-3 gap-2">
              {roomTypes.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setRoomType(rt.value)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: roomType === rt.value ? '#243047' : '#3a3a3a',
                    border: `2px solid ${roomType === rt.value ? '#2B6AD6' : 'transparent'}`,
                  }}
                >
                  <span className="text-xl">{rt.icon}</span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: roomType === rt.value ? '#fff' : 'rgba(255,255,255,0.6)' }}
                  >
                    {rt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Kick duration display */}
          <div className="flex items-center justify-between rounded-xl px-3.5 py-3" style={{ background: '#3a3a3a' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-base">⏱</span>
              <span className="text-[13px] font-semibold text-white">مدة الطرد المؤقت</span>
            </div>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{kickDuration} دقائق</span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              boxShadow: '0 4px 16px rgba(108,99,255,0.25)',
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
