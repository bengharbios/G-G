'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PasswordDialog({
  isOpen, onClose, onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [pw, setPw] = useState('');
  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#181c2e] border-[rgba(108,99,255,0.18)] text-[#f0f0f8] max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">كلمة المرور</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="أدخل كلمة المرور..."
            className="h-10 bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#f0f0f8] text-center"
            type="password"
            onKeyDown={(e) => e.key === 'Enter' && pw && onSubmit(pw)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl text-[#9ca3c4]">إلغاء</Button>
            <Button onClick={() => pw && onSubmit(pw)} disabled={!pw} className="flex-1 bg-[#22c55e] hover:bg-[#22c55e]/80 rounded-xl">دخول</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
