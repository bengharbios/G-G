'use client';

import { useCallback } from 'react';
import { LayoutGrid, Check } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  MIC_LAYOUTS,
  MIC_OPTIONS,
  type MicLayout,
  type MicLayoutId,
} from '../../types';

interface MicLayoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentMicTheme: string;
  currentSeatCount: number;
  onLayoutChange: (layoutId: MicLayoutId) => void;
  onSeatCountChange: (count: number) => void;
}

/* ── Mini preview for each layout ── */
function LayoutPreview({ layout, seatCount, isActive }: { layout: MicLayout; seatCount: number; isActive: boolean }) {
  const dots = layout.id.startsWith('grid')
    ? (() => {
        const cols = layout.cols;
        const rows = Math.ceil(seatCount / cols);
        const grid: boolean[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: boolean[] = [];
          for (let c = 0; c < cols; c++) {
            row.push(r * cols + c < seatCount);
          }
          grid.push(row);
        }
        return grid;
      })()
    : layout.id === 'theater'
      ? (() => {
          const rows: number[] = seatCount <= 6 ? [2, 2, 2] : seatCount <= 8 ? [3, 3, 2] : [3, 3, 3];
          const grid: boolean[][] = [];
          let idx = 0;
          for (const count of rows) {
            const row: boolean[] = [];
            for (let c = 0; c < count; c++) {
              row.push(idx < seatCount);
              idx++;
            }
            grid.push(row);
          }
          return grid;
        })()
      : layout.id === 'podcast'
        ? (() => {
            const grid: boolean[][] = [];
            // Host row (1 dot)
            grid.push([true]);
            const others = seatCount - 1;
            for (let r = 0; r < Math.ceil(others / 2); r++) {
              const row: boolean[] = [];
              for (let c = 0; c < 2; c++) {
                row.push(r * 2 + c < others);
              }
              grid.push(row);
            }
            return grid;
          })()
        : layout.id === 'radio'
          ? (() => {
              // Arc preview: single row with dots
              const row: boolean[] = [];
              for (let i = 0; i < seatCount; i++) row.push(true);
              return [row];
            })()
          : (() => {
              // Arc: single row
              const row: boolean[] = [];
              for (let i = 0; i < seatCount; i++) row.push(true);
              return [row];
            })();

  const dotSize = 8;
  const dotGap = 4;

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: '100%',
        height: 52,
        backgroundColor: isActive ? 'rgba(123, 97, 255, 0.08)' : 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        border: isActive ? `2px solid ${TUI.colors.purple}` : '2px solid rgba(255,255,255,0.06)',
      }}
    >
      {dots.map((row, ri) => (
        <div
          key={ri}
          className="flex items-center justify-center"
          style={{ gap: dotGap, flexDirection: 'column' }}
        >
          <div className="flex items-center justify-center" style={{ gap: dotGap }}>
            {row.map((active, ci) => (
              <div
                key={ci}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  backgroundColor: active
                    ? isActive ? TUI.colors.purple : 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: active && isActive ? `0 0 6px rgba(123, 97, 255, 0.4)` : 'none',
                  transition: TUI.anim.fast,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MicLayoutSheet({
  isOpen,
  onClose,
  currentMicTheme,
  currentSeatCount,
  onLayoutChange,
  onSeatCountChange,
}: MicLayoutSheetProps) {
  const handleLayoutSelect = useCallback(
    (layoutId: MicLayoutId) => {
      onLayoutChange(layoutId);
    },
    [onLayoutChange],
  );

  const handleSeatCountChange = useCallback(
    (count: number) => {
      onSeatCountChange(count);
    },
    [onSeatCountChange],
  );

  // Filter layouts that support the current seat count
  const availableLayouts = MIC_LAYOUTS.filter((l) =>
    l.seatCounts.includes(currentSeatCount),
  );

  // Also show the 'arc' layout as fallback for any seat count
  const hasFallback = !availableLayouts.some((l) => l.id === 'arc');
  const arcLayout = MIC_LAYOUTS.find((l) => l.id === 'arc');

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="auto"
      title="نمط المايكات"
    >
      <div className="flex flex-col" style={{ gap: 20, paddingBottom: 8 }}>

        {/* ═══════════════════════════════════════════════════════
            SEAT COUNT SELECTOR
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.G7 }}>
              عدد المقاعد
            </span>
            <span
              className="flex items-center justify-center px-2.5 py-0.5 rounded-full"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: TUI.colors.purple,
                backgroundColor: 'rgba(123, 97, 255, 0.1)',
                minWidth: 32,
              }}
            >
              {currentSeatCount}
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 6 }}>
            {MIC_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => handleSeatCountChange(count)}
                className="flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer touch-manipulation"
                style={{
                  backgroundColor:
                    currentSeatCount === count
                      ? 'rgba(123, 97, 255, 0.15)'
                      : 'rgba(255,255,255,0.04)',
                  border:
                    currentSeatCount === count
                      ? `2px solid ${TUI.colors.purple}`
                      : '2px solid rgba(255,255,255,0.06)',
                  color:
                    currentSeatCount === count
                      ? TUI.colors.purple
                      : TUI.colors.G5,
                  fontSize: 14,
                  fontWeight: currentSeatCount === count ? 700 : 500,
                  transition: TUI.anim.fast,
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            LAYOUT STYLE GRID
            Each card: preview + name + description + check badge
            ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.G7 }}>
            نمط الترتيب
          </span>

          <div
            className="grid grid-cols-2"
            style={{ gap: 8 }}
          >
            {availableLayouts.map((layout) => {
              const isActive = currentMicTheme === layout.id;
              return (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutSelect(layout.id)}
                  className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all cursor-pointer touch-manipulation bg-transparent border-none"
                  style={{
                    transition: TUI.anim.fast,
                  }}
                  aria-label={layout.name}
                >
                  {/* Preview */}
                  <LayoutPreview
                    layout={layout}
                    seatCount={currentSeatCount}
                    isActive={isActive}
                  />

                  {/* Name + description */}
                  <div className="flex flex-col items-center w-full" style={{ gap: 1 }}>
                    <div className="flex items-center justify-center w-full" style={{ gap: 4 }}>
                      {isActive && (
                        <Check
                          size={12}
                          style={{ color: TUI.colors.purple }}
                          strokeWidth={3}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? TUI.colors.purple : TUI.colors.G6,
                        }}
                      >
                        {layout.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: TUI.colors.G5,
                        lineHeight: '14px',
                      }}
                    >
                      {layout.description}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Fallback: arc layout (always available) */}
            {hasFallback && arcLayout && (
              <button
                key={arcLayout.id}
                onClick={() => handleLayoutSelect(arcLayout.id)}
                className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all cursor-pointer touch-manipulation bg-transparent border-none"
                style={{ transition: TUI.anim.fast }}
                aria-label={arcLayout.name}
              >
                <LayoutPreview
                  layout={arcLayout}
                  seatCount={currentSeatCount}
                  isActive={currentMicTheme === arcLayout.id}
                />
                <div className="flex flex-col items-center w-full" style={{ gap: 1 }}>
                  <div className="flex items-center justify-center w-full" style={{ gap: 4 }}>
                    {currentMicTheme === arcLayout.id && (
                      <Check size={12} style={{ color: TUI.colors.purple }} strokeWidth={3} />
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: currentMicTheme === arcLayout.id ? 600 : 400,
                        color: currentMicTheme === arcLayout.id ? TUI.colors.purple : TUI.colors.G6,
                      }}
                    >
                      {arcLayout.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: TUI.colors.G5, lineHeight: '14px' }}>
                    {arcLayout.description}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TIP
            ═══════════════════════════════════════════════════════ */}
        <div
          className="flex items-start"
          style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(123, 97, 255, 0.06)',
            borderRadius: 10,
            border: '1px solid rgba(123, 97, 255, 0.1)',
            gap: 8,
          }}
        >
          <LayoutGrid size={14} style={{ color: TUI.colors.purple, flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 11, color: TUI.colors.G5, lineHeight: '18px' }}>
            يمكنك تغيير نمط ترتيب المقاعد في أي وقت. التغيير يظهر فوراً لجميع المشاركين.
          </span>
        </div>
      </div>
    </BottomSheetOverlay>
  );
}
