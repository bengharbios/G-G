'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ActiveGiftAnimation } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   GiftAnimations — TUILiveKit Exact Gift Display + Canvas Particles

   Shows a banner with gift info and canvas-based particle effects.
   ═══════════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  shape: 'circle' | 'rect' | 'star';
}

const PARTICLE_COLORS = [
  '#FF3B30', '#AF52DE', '#FF9500', '#FFCC00', '#34C759',
  '#007AFF', '#6C54E8', '#00E5E5', '#F23C5B', '#1C66E5',
];

const BANNER_DURATION = {
  cheap: 2500,
  medium: 3500,
  expensive: 4500,
};

function getDuration(price: number): number {
  if (price >= 5200) return BANNER_DURATION.expensive;
  if (price >= 199) return BANNER_DURATION.medium;
  return BANNER_DURATION.cheap;
}

function createParticles(
  anim: ActiveGiftAnimation,
  count: number,
  canvasW: number,
  bannerH: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let vx = 0, vy = 0, x = 0, y = 0;

    switch (anim.animation) {
      case 'hearts':
        x = canvasW * 0.2 + Math.random() * canvasW * 0.6;
        y = bannerH;
        vx = (Math.random() - 0.5) * 3;
        vy = -(2 + Math.random() * 4);
        break;
      case 'stars':
        x = canvasW / 2;
        y = bannerH / 2;
        const angle = (Math.PI * 2 * i) / count;
        const speed = 3 + Math.random() * 5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 'fireworks':
        x = canvasW * 0.3 + Math.random() * canvasW * 0.4;
        y = bannerH;
        vx = (Math.random() - 0.5) * 6;
        vy = -(4 + Math.random() * 8);
        break;
      case 'confetti':
        x = Math.random() * canvasW;
        y = -10;
        vx = (Math.random() - 0.5) * 2;
        vy = 2 + Math.random() * 4;
        break;
      default: // particles
        x = canvasW / 2 + (Math.random() - 0.5) * 100;
        y = bannerH;
        vx = (Math.random() - 0.5) * 4;
        vy = -(1 + Math.random() * 5);
        break;
    }

    particles.push({
      x, y, vx, vy,
      size: 4 + Math.random() * 8,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life: 0,
      maxLife: 40 + Math.random() * 40,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: anim.animation === 'confetti' ? 'rect'
        : anim.animation === 'stars' ? 'star'
        : anim.animation === 'hearts' ? 'circle' : 'circle',
    });
  }
  return particles;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = ((i * 4 * Math.PI) / 5) - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function GiftAnimations({
  activeAnimation,
}: {
  activeAnimation: ActiveGiftAnimation | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);
  const bannerVisible = useRef(false);

  const spawnParticles = useCallback((anim: ActiveGiftAnimation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const count = anim.animation === 'confetti' ? 30
      : anim.animation === 'fireworks' ? 25
      : anim.animation === 'stars' ? 15
      : 12;
    particlesRef.current = createParticles(anim, count, canvas.width, 70);
  }, []);

  useEffect(() => {
    if (!activeAnimation) {
      bannerVisible.current = false;
      return;
    }

    bannerVisible.current = true;
    spawnParticles(activeAnimation);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const duration = getDuration(activeAnimation.price);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration + 1000) {
        bannerVisible.current = false;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rotation += p.rotSpeed;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [activeAnimation, spawnParticles]);

  if (!activeAnimation) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ width: '100%', maxWidth: '400px', height: '300px' }}
      />

      {/* Gift Banner */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-3 flex items-center gap-3 rounded-[8px] shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(108, 84, 232, 0.9), rgba(28, 102, 229, 0.9))',
          animation: 'slideDown 0.5s cubic-bezier(.175,.885,.32,1.275) forwards',
          maxWidth: '340px',
          width: '90%',
        }}
      >
        <span className="text-[32px] flex-shrink-0">{activeAnimation.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-semibold truncate">
            {activeAnimation.senderName} أرسل {activeAnimation.giftName} لـ {activeAnimation.receiverName}
          </p>
        </div>
        <span className="text-[12px] text-yellow-300 flex-shrink-0 font-bold whitespace-nowrap">
          {activeAnimation.price} 💎
        </span>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -30px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
