'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) { setSelectedGift(null); setActiveCategory('popular'); setQuantity(1); }
  }, [isOpen]);

  const quantities = [
    { label: '×1', value: 1 },
    { label: '×10', value: 10 },
    { label: '×66', value: 66 },
    { label: '×99', value: 99 },
  ];

  return (
    <BottomSheetOverlay isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[85vh] flex flex-col pb-6">
        {/* Title */}
        <div className="text-[14px] font-bold text-center text-[#f0f0f8] px-4 pb-2">
          اختر هدية
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-hide">
          {GIFT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id
                ? "flex-shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border bg-[rgba(108,99,255,0.15)] border-[#6c63ff] text-[#a78bfa] transition-all"
                : "flex-shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#5a6080] transition-all"
              }
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Target selector pills */}
        <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-hide">
          {([
            { value: 'specific' as const, label: 'شخص محدد' },
            { value: 'on-mic' as const, label: 'من في المايك' },
            { value: 'everyone' as const, label: 'جميع الغرفة' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTarget(opt.value)}
              className={target === opt.value
                ? "flex-shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border bg-[rgba(108,99,255,0.15)] border-[#6c63ff] text-[#a78bfa] transition-all"
                : "flex-shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full border bg-[#1c2035] border-[rgba(255,255,255,0.07)] text-[#5a6080] transition-all"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Scrollable gift grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-4 gap-2 px-3 pb-2">
            {filteredGifts.map((gift) => {
              const receive = Math.floor(gift.price / 3);
              const isLuxury = gift.price >= 199;
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift.id)}
                  className={selectedGift === gift.id
                    ? "relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-[14px] border border-[#f59e0b] bg-[rgba(245,158,11,0.08)] transition-all"
                    : "relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-[14px] border bg-[#1c2035] border-[rgba(255,255,255,0.07)] transition-all"
                  }
                  style={selectedGift === gift.id ? { boxShadow: '0 0 12px rgba(245,158,11,0.3)' } : undefined}
                >
                  {isLuxury && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-[26px] leading-none">{gift.emoji}</span>
                  <span className="text-[10px] text-[#9ca3c4] font-semibold">{gift.nameAr}</span>
                  <span className="text-[11px] font-bold text-[#f59e0b]">{gift.price.toLocaleString()} 💎</span>
                  <span className="text-[9px] text-[#5a6080]">يصل: {receive} 💎</span>
                </button>
              );
            })}
          </div>

          {/* Quantity selector */}
          {selectedGift && (
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between bg-[#1c2035] rounded-xl px-3 py-2.5">
                <span className="text-[11px] text-[#5a6080] font-semibold">الكمية</span>
                <div className="flex gap-1.5">
                  {quantities.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => setQuantity(q.value)}
                      className={quantity === q.value
                        ? "px-3 py-1 rounded-lg text-[11px] font-bold bg-[#f59e0b] text-white transition-all"
                        : "px-3 py-1 rounded-lg text-[11px] font-bold bg-[#232843] text-[#9ca3c4] border border-[rgba(255,255,255,0.07)] transition-all"
                      }
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
          <div className="px-4 pb-2">
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
              className="w-full h-11 rounded-[14px] font-bold text-[15px] text-white bg-gradient-to-l from-amber-500 via-red-500 to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {totalCost > 0 ? "إرسال " + totalCost.toLocaleString() + " 💎" : "إرسال الهدية"}
            </button>
          </div>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
