'use client';

import { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import type { Gift as GiftType } from '../../types';
import { DEFAULT_GIFTS, GIFT_CATEGORIES } from '../../types';

export default function GiftSheet({
  isOpen, onClose, gifts, onSendGift,
}: {
  isOpen: boolean;
  onClose: () => void;
  gifts: GiftType[];
  onSendGift: (giftId: string, target: string, quantity: number) => void;
}) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [target, setTarget] = useState<'specific' | 'on-mic' | 'everyone'>('everyone');
  const [quantity, setQuantity] = useState(1);

  const giftList = gifts.length > 0 ? gifts : DEFAULT_GIFTS;
  const filteredGifts = giftList.filter(g => g.category === activeCategory);
  const selectedGiftData = giftList.find(g => g.id === selectedGift);
  const totalCost = selectedGiftData ? selectedGiftData.price * quantity : 0;

  // Reset on open via handler
  const handleClose = () => {
    setSelectedGift(null);
    setActiveCategory('popular');
    setQuantity(1);
    onClose();
  };

  const quantities = [
    { label: '×1', value: 1 },
    { label: '×10', value: 10 },
    { label: '×66', value: 66 },
    { label: '×99', value: 99 },
  ];

  const targetOptions = [
    { value: 'specific' as const, label: 'شخص محدد' },
    { value: 'on-mic' as const, label: 'من في المايك' },
    { value: 'everyone' as const, label: 'جميع الغرفة' },
  ];

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={handleClose} title="اختر هدية">
      <div className="max-h-[75vh] flex flex-col pb-4">
        {/* Category tabs */}
        <div className="flex gap-2 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GIFT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 text-[11px] font-semibold px-3.5 py-2 rounded-full transition-all duration-200"
              style={{
                background: activeCategory === cat.id ? '#2B6AD6' : '#3a3a3a',
                color: activeCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.6)',
                border: `2px solid ${activeCategory === cat.id ? '#2B6AD6' : 'transparent'}`,
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Target selector */}
        <div className="flex gap-2 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {targetOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTarget(opt.value)}
              className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: target === opt.value ? 'rgba(108,99,255,0.15)' : 'transparent',
                color: target === opt.value ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${target === opt.value ? 'rgba(108,99,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Scrollable gift grid */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="grid grid-cols-4 gap-2 pb-3">
            {filteredGifts.map((gift) => {
              const receive = Math.floor(gift.price / 3);
              const isLuxury = gift.price >= 199;
              const isSelected = selectedGift === gift.id;
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift.id)}
                  className="relative flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all duration-200 active:scale-[0.96]"
                  style={{
                    background: isSelected ? '#243047' : '#3a3a3a',
                    border: `2px solid ${isSelected ? '#2B6AD6' : 'transparent'}`,
                  }}
                >
                  {isLuxury && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#f59e0b' }}>
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-[26px] leading-none">{gift.emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{gift.nameAr}</span>
                  <span className="text-[11px] font-bold text-[#f59e0b]">{gift.price.toLocaleString()} 💎</span>
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>يصل: {receive} 💎</span>
                </button>
              );
            })}
          </div>

          {/* Quantity selector */}
          {selectedGift && (
            <div className="rounded-xl px-3 py-3 mb-3" style={{ background: '#3a3a3a' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>الكمية</span>
                <div className="flex gap-1.5">
                  {quantities.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => setQuantity(q.value)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200"
                      style={{
                        background: quantity === q.value ? '#2B6AD6' : '#22262E',
                        color: quantity === q.value ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `2px solid ${quantity === q.value ? '#2B6AD6' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <span className="text-[12px] font-bold text-[#f59e0b]">{totalCost.toLocaleString()} 💎</span>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={() => {
              if (selectedGift) {
                onSendGift(selectedGift, target, quantity);
                setSelectedGift(null);
                setQuantity(1);
                onClose();
              }
            }}
            disabled={!selectedGift}
            className="w-full h-12 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              background: selectedGift
                ? 'linear-gradient(135deg, #f59e0b, #ef4444, #a855f7)'
                : '#3a3a3a',
              boxShadow: selectedGift ? '0 4px 16px rgba(245,158,11,0.25)' : 'none',
            }}
          >
            <Gift className="w-4 h-4" />
            {totalCost > 0 ? `إرسال ${totalCost.toLocaleString()} 💎` : 'إرسال الهدية'}
          </button>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
