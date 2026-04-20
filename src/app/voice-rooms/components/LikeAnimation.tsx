'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { HEART_COLORS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   LikeAnimation — Floating hearts inspired by TUILiveKit LikeAnimation.vue
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Animation Constants ─────────────────────────────────────────────────────
const CONTAINER_WIDTH = 200;
const CONTAINER_HEIGHT = 350;
const HEART_SIZE = 36;
const TOTAL_DURATION = 3000;       // Total lifetime of each heart (ms)
const SCALE_IN_DURATION = 500;     // Scale-up phase (ms)
const PATH_START = 500;            // When path animation begins (ms)
const PATH_DURATION = 2500;        // Path animation length (ms)
const SPAWN_INTERVAL = 100;        // Stagger delay between hearts (ms)

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeartPath {
  cp1x: number; cp1y: number;  // First Bézier control point
  midX: number; midY: number;  // Junction between two segments
  cp2x: number; cp2y: number;  // Second Bézier control point
  endX: number; endY: number;   // Final destination
}

interface HeartInstance {
  el: HTMLDivElement;
  startTime: number;
  startX: number;
  startY: number;
  path: HeartPath;
}

export interface LikeAnimationRef {
  /** Spawn `count` hearts with 100 ms stagger */
  play: (count?: number) => void;
  /** Remove all active hearts and cancel pending spawns */
  clear: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomColor(): string {
  return HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
}

/**
 * Build an SVG heart string with the given fill colour.
 * Renders the double-layer heart from TUILiveKit HeartIcon.vue at HEART_SIZE.
 */
function heartSvgMarkup(color: string): string {
  const d =
    'M44 72 C18 50, 8 38, 8 28 C8 16, 18 8, 30 8 C38 8, 43 13, 44 16 C45 13, 50 8, 58 8 C70 8, 80 16, 80 28 C80 38, 70 50, 44 72 Z';
  return `<svg width="${HEART_SIZE}" height="${HEART_SIZE}" viewBox="0 0 88 88" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))">`
    + `<path d="${d}" fill="${color}" fill-opacity="0.5"/>`
    + `<path d="${d}" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
    + `</svg>`;
}

/**
 * Two-segment quadratic Bézier interpolation.
 *
 * t ∈ [0, 0.5]  → first  segment: P0 → CP1 → MID
 * t ∈ [0.5, 1]  → second segment: MID → CP2 → P1
 */
function quadBezier2(
  t: number,
  p0: number, cp1: number, mid: number, cp2: number, p1: number,
): number {
  if (t <= 0.5) {
    const u = t * 2;          // normalise to [0, 1]
    const inv = 1 - u;
    return inv * inv * p0 + 2 * inv * u * cp1 + u * u * mid;
  }
  const u = (t - 0.5) * 2;   // normalise to [0, 1]
  const inv = 1 - u;
  return inv * inv * mid + 2 * inv * u * cp2 + u * u * p1;
}

/**
 * Generate a randomised S-curve path for a heart starting at `startX`.
 * Both segments always push the heart upward while swaying laterally.
 */
function buildPath(startX: number): HeartPath {
  const sway1 = (Math.random() - 0.5) * 90;
  const swayMid = (Math.random() - 0.5) * 60;
  const sway2 = (Math.random() - 0.5) * 90;
  const endDrift = (Math.random() - 0.5) * 50;

  const startY = CONTAINER_HEIGHT;

  return {
    cp1x: startX + sway1,
    cp1y: startY - (CONTAINER_HEIGHT * 0.33),
    midX: startX + swayMid,
    midY: startY - (CONTAINER_HEIGHT * 0.5),
    cp2x: startX + sway2,
    cp2y: startY - (CONTAINER_HEIGHT * 0.67),
    endX: startX + endDrift,
    endY: -HEART_SIZE,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const LikeAnimation = forwardRef<LikeAnimationRef>(
  function LikeAnimation(_props, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const heartsRef = useRef<HeartInstance[]>([]);
    const rafRef = useRef<number>(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // ── Animation loop (ref-based to avoid self-referential useCallback) ───
    // We use a stable ref so the recursive rAF can always reference the latest fn.
    const tickFnRef = useRef<() => void>(() => {});

    useEffect(() => {
      tickFnRef.current = () => {
        const now = performance.now();
        const removeIndices: number[] = [];

        for (let i = 0; i < heartsRef.current.length; i++) {
          const h = heartsRef.current[i];
          const elapsed = now - h.startTime;

          // Heart has expired
          if (elapsed >= TOTAL_DURATION) {
            removeIndices.push(i);
            continue;
          }

          // ── Scale: 0 → 1 during first 500 ms ──
          const scale = Math.min(elapsed / SCALE_IN_DURATION, 1);

          // ── Opacity: linear 1 → 0 over TOTAL_DURATION ──
          const opacity = Math.max(1 - elapsed / TOTAL_DURATION, 0);

          // ── Position along Bézier path ──
          let x = h.startX;
          let y = h.startY;

          if (elapsed >= PATH_START) {
            const pathProgress = Math.min((elapsed - PATH_START) / PATH_DURATION, 1);

            x = quadBezier2(
              pathProgress,
              h.startX, h.path.cp1x, h.path.midX, h.path.cp2x, h.path.endX,
            );
            y = quadBezier2(
              pathProgress,
              h.startY, h.path.cp1y, h.path.midY, h.path.cp2y, h.path.endY,
            );
          }

          h.el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          h.el.style.opacity = String(opacity);
        }

        // Remove expired hearts (reverse order to keep indices valid)
        for (let i = removeIndices.length - 1; i >= 0; i--) {
          const idx = removeIndices[i];
          heartsRef.current[idx].el.remove();
          heartsRef.current.splice(idx, 1);
        }

        // Continue if there are still active hearts
        if (heartsRef.current.length > 0) {
          rafRef.current = requestAnimationFrame(tickFnRef.current);
        }
      };
    }, []);

    const ensureTicking = useCallback(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tickFnRef.current);
    }, []);

    // ── Spawn a single heart into the DOM ──────────────────────────────────
    const spawnHeart = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'left:0',
        'top:0',
        `width:${HEART_SIZE}px`,
        `height:${HEART_SIZE}px`,
        'will-change:transform,opacity',
        'pointer-events:none',
      ].join(';');

      el.innerHTML = heartSvgMarkup(randomColor());
      container.appendChild(el);

      const startX = Math.random() * (CONTAINER_WIDTH - HEART_SIZE);
      const startY = CONTAINER_HEIGHT;

      const heart: HeartInstance = {
        el,
        startTime: performance.now(),
        startX,
        startY,
        path: buildPath(startX),
      };

      heartsRef.current.push(heart);
      ensureTicking();
    }, [ensureTicking]);

    // ── Imperative API ─────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      play(count: number = 1) {
        for (let i = 0; i < count; i++) {
          const timer = setTimeout(spawnHeart, i * SPAWN_INTERVAL);
          timersRef.current.push(timer);
        }
      },

      clear() {
        // Cancel pending spawn timers
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        // Stop animation loop
        cancelAnimationFrame(rafRef.current);

        // Remove all heart DOM nodes
        heartsRef.current.forEach((h) => h.el.remove());
        heartsRef.current = [];
      },
    }), [spawnHeart]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────
    useEffect(() => {
      return () => {
        cancelAnimationFrame(rafRef.current);
        timersRef.current.forEach(clearTimeout);
        heartsRef.current.forEach((h) => h.el.remove());
      };
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
      <div
        ref={containerRef}
        aria-hidden
        style={{
          position: 'fixed',
          right: 0,
          bottom: 60,
          width: CONTAINER_WIDTH,
          height: CONTAINER_HEIGHT,
          pointerEvents: 'none',
          zIndex: 100,
          overflow: 'hidden',
        }}
      />
    );
  },
);

export default LikeAnimation;
