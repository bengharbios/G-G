'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { RoomMode } from '../../types';
import { MIC_OPTIONS, ROOM_MODE_OPTIONS } from '../../types';

const dialogOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogPanel = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 320 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export default function CreateRoomDialog({
  isOpen, onClose, onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; micSeatCount: number; roomMode: RoomMode; roomPassword: string; maxParticipants: number; isAutoMode: boolean; micTheme: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [micSeatCount, setMicSeatCount] = useState(10);
  const [roomMode, setRoomMode] = useState<RoomMode>('public');
  const [roomPassword, setRoomPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/voice-rooms/template-create?action=template')
        .then(r => r.json())
        .then(d => {
          if (d.template) {
            const t = d.template;
            setName(t.name || '');
            setDescription(t.description || '');
            setMicSeatCount(t.micSeatCount || 10);
            setRoomMode((t.roomMode as RoomMode) || 'public');
            setRoomPassword(t.roomPassword || '');
            setMaxParticipants(t.maxParticipants || 50);
            setIsAutoMode(t.isAutoMode || false);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate({ name, description, micSeatCount, roomMode, roomPassword, maxParticipants, isAutoMode, micTheme: 'default' });
    setSaving(false);
    onClose();
    setName(''); setDescription(''); setRoomPassword('');
    setMicSeatCount(10); setRoomMode('public'); setMaxParticipants(50); setIsAutoMode(false);
  };

  const inputStyle: React.CSSProperties = {
    background: '#3a3a3a',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.9)',
    borderRadius: '10px',
    height: 40,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    padding: '0 12px',
    transition: 'border-color 200ms ease',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="create-room-overlay"
            variants={dialogOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            onClick={onClose}
          />
          <motion.div
            key="create-room-panel"
            variants={dialogPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-[110] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[360px] max-h-[85vh] overflow-y-auto"
            style={{
              background: '#1F2024',
              border: '1px solid #48494F',
              borderRadius: '16px',
              boxShadow: '0 8px 18px 0 rgba(0,0,0,0.06), 0 2px 6px 0 rgba(0,0,0,0.06), 0 0 40px rgba(0,0,0,0.3)',
            }}
            dir="rtl"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-[17px] font-bold text-white text-center">إنشاء غرفة صوتية</h2>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 space-y-4">
              {/* Room Name */}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  اسم الغرفة <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم الغرفة"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2B6AD6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>الوصف</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للغرفة"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2B6AD6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Mic count selector */}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>عدد المايكات</label>
                <div className="grid grid-cols-4 gap-2">
                  {MIC_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={() => setMicSeatCount(n)}
                      className="py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.96]"
                      style={{
                        background: micSeatCount === n ? '#243047' : '#3a3a3a',
                        color: micSeatCount === n ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `2px solid ${micSeatCount === n ? '#2B6AD6' : 'transparent'}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room mode cards — TUILiveKit ConnectionTypeDialog style */}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>نوع الغرفة</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_MODE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isActive = roomMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setRoomMode(opt.value)}
                        className="py-3 rounded-xl text-center transition-all duration-200 active:scale-[0.96]"
                        style={{
                          background: isActive ? '#243047' : '#3a3a3a',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: `2px solid ${isActive ? '#2B6AD6' : 'transparent'}`,
                        }}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-[10px] font-semibold">{opt.label}</span>
                        <div className="text-[9px] mt-0.5" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password field (key mode only) */}
              {roomMode === 'key' && (
                <div>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>كلمة المرور</label>
                  <input
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#2B6AD6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
              )}

              {/* Max participants */}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>الحد الأقصى للمشاركين</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#2B6AD6')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !name.trim()}
                  className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                  style={{
                    background: name.trim() ? 'linear-gradient(135deg, #6c63ff, #a78bfa)' : '#3a3a3a',
                    boxShadow: name.trim() ? '0 4px 16px rgba(108,99,255,0.25)' : 'none',
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الغرفة'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
