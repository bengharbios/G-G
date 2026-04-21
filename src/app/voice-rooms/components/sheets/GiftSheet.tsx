'use client';

import { useState, useMemo } from 'react';
import { Star, Send } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, GIFT_CATEGORIES, DEFAULT_GIFTS, GIFT_ASSETS, type Gift } from '../../types';

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

  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(filteredGifts.length / GIFTS_PER_PAGE));
  const pageGifts = filteredGifts.slice(
    currentPage * GIFTS_PER_PAGE,
    (currentPage + 1) * GIFTS_PER_PAGE,
  );

  const canSend = selectedGift !== null && selectedGift.price <= gems;

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedGift(null);
    setCurrentPage(0);
  };

  const handleSend = () => {
    if (selectedGift && canSend) {
      onSendGift(selectedGift.id, 1);
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
      height="440px"
      title="هدايا"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          Top Gifts Banner (matching screenshot — star icon banner)
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center gap-2 mb-3 px-1"
        style={{
          padding: '6px 10px',
          backgroundColor: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(123, 97, 255, 0.08))',
          borderRadius: 10,
          border: '1px solid rgba(255, 215, 0, 0.15)',
        }}
      >
        <Star size={16} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
        <span style={{ fontSize: 12, fontWeight: 600, color: TUI.colors.gold }}>
          هدايا مميزة
        </span>
        <span style={{ fontSize: 11, color: TUI.colors.G6, marginRight: 'auto' }}>
          أرسل هدايا لتظهّر في لوحة المتصدرين
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Gift Grid — 4 columns, 2 rows per page
          Each gift card: emoji + name + price in gold coins
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="grid grid-cols-4 mb-3"
        style={{
          gap: 6,
          minHeight: 220,
          padding: '0 2px',
        }}
      >
        {pageGifts.map((gift) => {
          const isSelected = selectedGift?.id === gift.id;
          const hasEffect = gift.animationResourceUrl || ['fireworks', 'confetti'].includes(gift.animation || '');
          return (
            <button
              key={gift.id}
              onClick={() => setSelectedGift(isSelected ? null : gift)}
              className="flex flex-col items-center justify-center transition-all relative overflow-hidden cursor-pointer touch-manipulation"
              style={{
                height: 108,
                backgroundColor: isSelected
                  ? 'rgba(123, 97, 255, 0.1)'
                  : 'rgba(255,255,255,0.03)',
                border: isSelected
                  ? `2px solid ${TUI.colors.purple}`
                  : '2px solid rgba(255,255,255,0.04)',
                borderRadius: 12,
              }}
            >
              {/* Gift emoji */}
              <div className="relative mb-1">
                <span style={{ fontSize: 36, lineHeight: 1 }}>{gift.emoji}</span>
                {/* Effect badge (for gifts with animations) */}
                {hasEffect && (
                  <span
                    className="absolute -top-1 -right-2 flex items-center justify-center rounded-full"
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: TUI.colors.purple,
                      fontSize: 7,
                      color: TUI.colors.white,
                      fontWeight: 700,
                      border: '1.5px solid rgba(26, 31, 58, 0.9)',
                    }}
                  >
                    FX
                  </span>
                )}
              </div>

              {/* Name */}
              <span
                className="truncate w-full text-center px-0.5"
                style={{
                  fontSize: 10,
                  color: isSelected ? TUI.colors.purple : TUI.colors.G6,
                  fontWeight: isSelected ? 600 : 400,
                  lineHeight: '14px',
                }}
              >
                {gift.nameAr}
              </span>

              {/* Price in gold coins */}
              <span
                className="flex items-center gap-0.5"
                style={{
                  fontSize: 10,
                  color: TUI.colors.gold,
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 10 }}>🪙</span>
                {gift.price >= 1000 ? `${(gift.price / 1000).toFixed(gift.price % 1000 === 0 ? 0 : 1)}K` : gift.price}
              </span>

              {/* Selected overlay — "إرسال" */}
              {isSelected && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(123, 97, 255, 0.08)',
                  }}
                >
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: TUI.colors.white,
                      backgroundColor: TUI.colors.purple,
                    }}
                  >
                    إرسال
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Pagination dots
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
                backgroundColor: currentPage === i ? TUI.colors.purple : 'rgba(255,255,255,0.15)',
                border: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Category Tabs + Gems Balance + Send Button
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2">
        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1" style={{ direction: 'rtl' }}>
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
                    ? 'rgba(123, 97, 255, 0.15)'
                    : 'transparent',
                border: selectedCategory === cat.id
                  ? '1px solid rgba(123, 97, 255, 0.3)'
                  : '1px solid transparent',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Send Button + Gems */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Gems balance */}
          <span
            className="shrink-0 flex items-center gap-1"
            style={{ fontSize: 11, color: TUI.colors.gold, fontWeight: 600 }}
          >
            🪙 {gems.toLocaleString()}
          </span>

          {/* Send button (purple gradient) */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              color: TUI.colors.white,
              backgroundColor: canSend
                ? 'linear-gradient(135deg, #7B61FF 0%, #C084FC 100%)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: canSend ? '0 0 12px rgba(123, 97, 255, 0.3)' : 'none',
              transition: TUI.anim.fast,
              opacity: canSend ? 1 : 0.5,
            }}
          >
            <Send size={13} />
            إرسال
          </button>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
