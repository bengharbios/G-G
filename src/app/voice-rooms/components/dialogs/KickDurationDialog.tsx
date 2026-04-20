'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function KickDurationDialog({
  isOpen, onClose, onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}) {
  const [duration, setDuration] = useState(5);
  const presets = [
    { label: '٥ دقائق', value: 5 },
    { label: '١٥ دقيقة', value: 15 },
    { label: '٣٠ دقيقة', value: 30 },
    { label: 'ساعة', value: 60 },
    { label: '٢٤ ساعة', value: 1440 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">مدة الطرد المؤقت</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setDuration(p.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                duration === p.value
                  ? 'border-[#f59e0b]/50 bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
                  : 'border-[rgba(255,255,255,0.07)] bg-[#1c2035] text-[#9ca3c4] hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              {p.label}
            </button>
          ))}
          <Button onClick={() => onConfirm(duration)} className="w-full bg-[#ef4444] hover:bg-[#ef4444]/80 rounded-xl mt-2">
            <Ban className="w-4 h-4 ml-2" /> طرد
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
