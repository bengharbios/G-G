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

const GIFTS_PER_PAGE = 8;

export default function GiftSheet({ isOpen, onClose, onSendGift, gems }: GiftSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  const filteredGifts = useMemo(
    () => DEFAULT_GIFTS.filter((g) => g.category === selectedCategory),
    [selectedCategory],
  );

  // Pagination: 8 gifts per page (matching TUILiveKit's PageView)
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(filteredGifts.length / GIFTS_PER_PAGE));
  const pageGifts = filteredGifts.slice(
    currentPage * GIFTS_PER_PAGE,
    (currentPage + 1) * GIFTS_PER_PAGE,
  );

  const canSend = selectedGift !== null && selectedGift.price <= gems;

  // Reset page when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedGift(null);
    setCurrentPage(0);
  };

  const handleSend = () => {
    if (selectedGift && canSend) {
      onSendGift(selectedGift.id, 1); // TUILiveKit sends 1 at a time
      setSelectedGift(null);
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setCurrentPage(0);
    onClose();
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={handleClose}
      height={420}
      title="هدايا"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          Gift Grid — 4 columns, 2 rows per page (TUILiveKit exact layout)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-2 mb-3" style={{ minHeight: 220 }}>
        {pageGifts.map((gift) => {
          const isSelected = selectedGift?.id === gift.id;
          return (
            <button
              key={gift.id}
              onClick={() => setSelectedGift(isSelected ? null : gift)}
              className="flex flex-col items-center justify-center transition-all relative overflow-hidden cursor-pointer touch-manipulation"
              style={{
                height: 108,
                backgroundColor: isSelected
                  ? 'rgba(28, 102, 229, 0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: isSelected
                  ? `2px solid ${TUI.colors.B1}`
                  : '2px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}
            >
              {/* Gift emoji (TUILiveKit uses remote imageUrl, we use emoji) */}
              <span className="mb-1" style={{ fontSize: 34 }}>{gift.emoji}</span>

              {/* Name / Send button toggle (TUILiveKit pattern) */}
              {isSelected ? (
                <span
                  className="font-medium"
                  style={{
                    fontSize: 12,
                    color: TUI.colors.B1,
                  }}
                >
                  إرسال
                </span>
              ) : (
                <span
                  className="truncate w-full text-center px-1"
                  style={{
                    fontSize: 11,
                    color: TUI.colors.G7,
                  }}
                >
                  {gift.nameAr}
                </span>
              )}

              {/* Price */}
              <span
                className="flex items-center gap-0.5"
                style={{
                  fontSize: 10,
                  color: TUI.colors.G5,
                }}
              >
                💎 {gift.price}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Pagination dots (TUILiveKit uses PageView indicator)
          ═══════════════════════════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className="rounded-full transition-all cursor-pointer"
              style={{
                width: currentPage === i ? 16 : 6,
                height: 6,
                backgroundColor: currentPage === i ? TUI.colors.B1 : 'rgba(255,255,255,0.2)',
                border: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Category Tabs + Send Button
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide" style={{ direction: 'rtl' }}>
          {GIFT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className="shrink-0 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: selectedCategory === cat.id ? TUI.colors.white : TUI.colors.G6,
                backgroundColor:
                  selectedCategory === cat.id
                    ? 'rgba(255,255,255,0.12)'
                    : 'transparent',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Gems balance */}
        <span
          className="shrink-0 flex items-center gap-1"
          style={{ fontSize: 12, color: TUI.colors.G5 }}
        >
          💎 {gems.toLocaleString()}
        </span>
      </div>
    </BottomSheetOverlay>
  );
}
