'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { HEART_COLORS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   LikeAnimation — TUILiveKit Exact Heart Animation

   Floating hearts that rise from bottom with physics-based motion.
   Each heart has random size, color, offset, rotation, and wobble.
   ═══════════════════════════════════════════════════════════════════════ */

interface Heart {
  id: number;
  x: number;
  size: number;
  color: string;
  rotation: number;
  wobbleAmp: number;
  wobbleFreq: number;
  startTime: number;
  duration: number;
}

let heartId = 0;

export default function LikeAnimation({ active }: { active: boolean }) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrame = useRef<number>(0);

  const spawnHeart = useCallback(() => {
    const h: Heart = {
      id: heartId++,
      x: 40 + Math.random() * 20,
      size: 16 + Math.random() * 10,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      rotation: -15 + Math.random() * 30,
      wobbleAmp: 5 + Math.random() * 10,
      wobbleFreq: 2 + Math.random() * 3,
      startTime: Date.now(),
      duration: 1800 + Math.random() * 1200,
    };
    setHearts(prev => [...prev.slice(-14), h]);
  }, []);

  useEffect(() => {
    if (active) {
      spawnHeart();
      spawnTimer.current = setInterval(spawnHeart, 120 + Math.random() * 80);
    } else {
      if (spawnTimer.current) {
        clearInterval(spawnTimer.current);
        spawnTimer.current = null;
      }
    }
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [active, spawnHeart]);

  // Cleanup old hearts
  useEffect(() => {
    if (hearts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setHearts(prev => prev.filter(h => now - h.startTime < h.duration + 200));
    }, 500);
    return () => clearInterval(timer);
  }, [hearts.length]);

  return (
    <div
      ref={containerRef}
      className="fixed left-4 bottom-24 pointer-events-none z-30"
      style={{ width: '80px', height: '200px' }}
    >
      {hearts.map(h => {
        const elapsed = Date.now() - h.startTime;
        const progress = Math.min(elapsed / h.duration, 1);
        const opacity = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const translateY = progress * -200;
        const translateX = Math.sin(progress * h.wobbleFreq * Math.PI) * h.wobbleAmp;

        return (
          <svg
            key={h.id}
            width={h.size}
            height={h.size}
            viewBox="0 0 24 24"
            fill={h.color}
            style={{
              position: 'absolute',
              left: `${h.x + translateX}px`,
              bottom: '0px',
              opacity: Math.max(0, opacity),
              transform: `translateY(${translateY}px) rotate(${h.rotation}deg)`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              transition: 'none',
            }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      })}
    </div>
  );
}
