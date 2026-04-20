'use client';

import { useState, useEffect } from 'react';
import { Loader2, Globe, Key, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RoomMode } from '../../types';
import { MIC_OPTIONS, ROOM_MODE_OPTIONS } from '../../types';

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

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">إنشاء غرفة صوتية</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-3">
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">اسم الغرفة *</label>
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الغرفة"
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">الوصف</label>
            <Input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للغرفة"
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1.5 block">عدد المايكات</label>
            <div className="grid grid-cols-4 gap-2">
              {MIC_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setMicSeatCount(n)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    micSeatCount === n
                      ? 'bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.4)] text-[#a78bfa]'
                      : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#5a6080] mb-1.5 block">نوع الغرفة</label>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_MODE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRoomMode(opt.value)}
                    className={`py-2.5 rounded-xl border text-center transition-all ${
                      roomMode === opt.value
                        ? 'bg-[rgba(108,99,255,0.15)] border-[rgba(108,99,255,0.4)] text-[#a78bfa]'
                        : 'bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-0.5" />
                    <span className="text-[10px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {roomMode === 'key' && (
            <div>
              <label className="text-xs text-[#5a6080] mb-1 block">كلمة المرور</label>
              <Input
                value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-[#5a6080] mb-1 block">الحد الأقصى للمشاركين</label>
            <Input
              type="number" min={5} max={500}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8]"
            />
          </div>
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="w-full bg-gradient-to-l from-[#6c63ff] to-[#a78bfa] hover:opacity-90 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الغرفة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
