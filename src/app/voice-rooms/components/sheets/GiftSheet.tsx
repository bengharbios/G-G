'use client';

import { useState, useMemo } from 'react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, GIFT_CATEGORIES, DEFAULT_GIFTS, type Gift } from '../../types';

interface GiftSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftId: string, quantity: number) => void;
  gems: number;
}

const QUANTITY_OPTIONS = [1, 10, 99];

export default function GiftSheet({ isOpen, onClose, onSendGift, gems }: GiftSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredGifts = useMemo(
    () => DEFAULT_GIFTS.filter((g) => g.category === selectedCategory),
    [selectedCategory],
  );

  const totalCost = selectedGift ? selectedGift.price * quantity : 0;
  const canSend = selectedGift !== null && totalCost <= gems;

  const handleSend = () => {
    if (selectedGift && canSend) {
      onSendGift(selectedGift.id, quantity);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setQuantity(1);
    onClose();
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={handleClose}
      height={400}
      title="إرسال هدية"
    >
      {/* Gems Balance */}
      <div
        className="flex items-center justify-between mb-3"
        style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}
      >
        <span>💎 {gems.toLocaleString()}</span>
        {selectedGift && (
          <span style={{ color: totalCost > gems ? TUI.colors.red : TUI.colors.white }}>
            الإجمالي: 💎 {totalCost.toLocaleString()}
          </span>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide" style={{ direction: 'rtl' }}>
        {GIFT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSelectedGift(null);
            }}
            className="shrink-0 px-4 py-2 rounded-lg transition-colors"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: selectedCategory === cat.id ? TUI.colors.white : TUI.colors.G6,
              backgroundColor:
                selectedCategory === cat.id
                  ? 'rgba(28, 102, 229, 0.15)'
                  : 'transparent',
              borderBottom:
                selectedCategory === cat.id
                  ? `2px solid ${TUI.colors.B1}`
                  : '2px solid transparent',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Gift Grid — 4 columns */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {filteredGifts.map((gift) => {
          const isSelected = selectedGift?.id === gift.id;
          return (
            <button
              key={gift.id}
              onClick={() => setSelectedGift(gift)}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-all"
              style={{
                height: 88,
                backgroundColor: isSelected
                  ? 'rgba(28, 102, 229, 0.1)'
                  : 'transparent',
                border: isSelected
                  ? `2px solid ${TUI.colors.sliderFilled}`
                  : '2px solid transparent',
                borderRadius: TUI.radius.lg,
              }}
            >
              {/* Emoji */}
              <span className="mb-1" style={{ fontSize: 32 }}>{gift.emoji}</span>
              {/* Name */}
              <span
                className="truncate w-full text-center"
                style={{
                  fontSize: TUI.font.captionG6.size,
                  color: TUI.colors.G7,
                }}
              >
                {gift.nameAr}
              </span>
              {/* Price Badge */}
              <span
                className="flex items-center gap-0.5"
                style={{
                  fontSize: TUI.font.captionG6.size,
                  color: TUI.colors.G6,
                }}
              >
                💎 {gift.price}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quantity Selector + Send */}
      <div className="flex flex-col gap-3">
        {/* Quantity pills */}
        <div className="flex items-center justify-center gap-2">
          {QUANTITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className="px-5 py-1.5 rounded-full transition-all"
              style={{
                fontSize: TUI.font.caption12.size,
                fontWeight: quantity === q ? 600 : 400,
                color: quantity === q ? TUI.colors.white : TUI.colors.G6,
                backgroundColor:
                  quantity === q
                    ? TUI.colors.B1
                    : TUI.colors.bgInput,
                borderRadius: TUI.radius.pill,
                border: 'none',
              }}
            >
              ×{q}
            </button>
          ))}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full flex items-center justify-center transition-opacity"
          style={{
            height: 40,
            backgroundColor: canSend ? TUI.colors.B1 : TUI.colors.G3,
            color: TUI.colors.white,
            borderRadius: TUI.radius.pill,
            fontSize: '14px',
            fontWeight: 500,
            opacity: canSend ? 1 : 0.5,
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          {selectedGift
            ? `إرسال ${selectedGift.emoji} ${selectedGift.nameAr}`
            : 'اختر هدية'}
        </button>
      </div>
    </BottomSheetOverlay>
  );
}
