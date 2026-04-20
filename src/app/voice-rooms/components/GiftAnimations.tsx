'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ActiveGiftAnimation } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   GIFT ANIMATIONS — Full-screen canvas-based particle effects system
   Inspired by TUILiveKit's high-quality animation layering.
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Palette & Constants ──────────────────────────────────────────────────────

const VIBRANT_PALETTE = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#AF52DE',
  '#5856D6', '#007AFF', '#32ADE6', '#FF2D55', '#E91E63',
  '#00BCD4', '#8BC34A', '#FF5722', '#9C27B0', '#03A9F4',
];

const HEART_EMOJIS = ['❤️', '💖', '💕', '💗', '💘'];

const CONFETTI_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#AF52DE',
  '#5856D6', '#007AFF', '#FF2D55', '#E91E63', '#00BCD4',
  '#FF5722', '#9C27B0', '#F59E0B', '#EC4899',
];

// ─── Particle Types ───────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  friction: number;
  shape: 'circle' | 'rect' | 'star';
  rotation: number;
  rotationSpeed: number;
  // for confetti flutter
  flutter?: number;
  flutterSpeed?: number;
  flutterAmp?: number;
}

interface HeartParticle {
  x: number;
  startY: number;
  y: number;
  progress: number;
  speed: number;
  size: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
  curveOffset: number;
  alpha: number;
  maxProgress: number;
}

interface StarTrail {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

interface FireworkBurst {
  x: number;
  y: number;
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
    size: number;
    trail: { x: number; y: number; alpha: number }[];
  }[];
  launchTime: number;
  exploded: boolean;
  launchY: number;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Effect generators ────────────────────────────────────────────────────────

function generateParticles(w: number, h: number): Particle[] {
  const count = Math.floor(randomBetween(40, 60));
  const cx = w / 2;
  const cy = h / 2;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = degreesToRadians(randomBetween(0, 360));
    const speed = randomBetween(3, 8);
    const maxLife = randomBetween(60, 90); // ~1-1.5s at 60fps
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: randomItem(VIBRANT_PALETTE),
      size: randomBetween(4, 10),
      alpha: 1,
      life: 0,
      maxLife,
      gravity: 0.12,
      friction: 0.98,
      shape: Math.random() > 0.3 ? 'circle' : 'star',
      rotation: randomBetween(0, 360),
      rotationSpeed: randomBetween(-5, 5),
    });
  }
  return particles;
}

function generateFireworks(w: number, h: number): FireworkBurst[] {
  const burstCount = Math.floor(randomBetween(3, 5));
  const bursts: FireworkBurst[] = [];
  for (let i = 0; i < burstCount; i++) {
    const x = randomBetween(w * 0.15, w * 0.85);
    const y = randomBetween(h * 0.1, h * 0.45);
    bursts.push({
      x,
      y,
      launchTime: i * 12, // ~200ms apart at 60fps
      launchY: h,
      exploded: false,
      particles: [],
    });
  }
  return bursts;
}

function explodeFirework(burst: FireworkBurst): void {
  const particleCount = Math.floor(randomBetween(30, 50));
  const baseColor = randomItem(VIBRANT_PALETTE);
  burst.exploded = true;
  for (let i = 0; i < particleCount; i++) {
    const angle = degreesToRadians((360 / particleCount) * i + randomBetween(-10, 10));
    const speed = randomBetween(2, 6);
    burst.particles.push({
      x: burst.x,
      y: burst.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() > 0.3 ? baseColor : randomItem(VIBRANT_PALETTE),
      alpha: 1,
      life: 0,
      maxLife: randomBetween(60, 120),
      size: randomBetween(2, 5),
      trail: [],
    });
  }
}

function generateHearts(w: number, h: number): HeartParticle[] {
  const count = Math.floor(randomBetween(20, 30));
  const hearts: HeartParticle[] = [];
  for (let i = 0; i < count; i++) {
    hearts.push({
      x: w / 2 + randomBetween(-80, 80),
      startY: h * 0.65 + randomBetween(-20, 20),
      y: 0,
      progress: 0,
      speed: randomBetween(0.008, 0.018),
      size: randomBetween(24, 48),
      emoji: randomItem(HEART_EMOJIS),
      rotation: randomBetween(-30, 30),
      rotationSpeed: randomBetween(-1.5, 1.5),
      curveOffset: randomBetween(-120, 120),
      alpha: 1,
      maxProgress: 1,
    });
  }
  return hearts;
}

function generateStars(w: number, h: number): StarTrail[] {
  const count = Math.floor(randomBetween(8, 12));
  const stars: StarTrail[] = [];
  const starColors = ['#FFCC00', '#FFD700', '#FFF8DC', '#FFE4B5', '#FAFAD2', '#FFFACD'];

  for (let i = 0; i < count; i++) {
    // Start from random edge, cross to opposite
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number, targetX: number, targetY: number;

    switch (edge) {
      case 0: // top-left area → bottom-right area
        x = randomBetween(-20, w * 0.3);
        y = randomBetween(-20, h * 0.2);
        targetX = randomBetween(w * 0.7, w + 20);
        targetY = randomBetween(h * 0.8, h + 20);
        break;
      case 1: // top-right → bottom-left
        x = randomBetween(w * 0.7, w + 20);
        y = randomBetween(-20, h * 0.2);
        targetX = randomBetween(-20, w * 0.3);
        targetY = randomBetween(h * 0.8, h + 20);
        break;
      case 2: // left edge → right edge
        x = randomBetween(-20, w * 0.1);
        y = randomBetween(h * 0.2, h * 0.6);
        targetX = randomBetween(w * 0.9, w + 20);
        targetY = randomBetween(h * 0.4, h * 0.8);
        break;
      default: // right edge → left edge
        x = randomBetween(w * 0.9, w + 20);
        y = randomBetween(h * 0.1, h * 0.5);
        targetX = randomBetween(-20, w * 0.1);
        targetY = randomBetween(h * 0.5, h * 0.9);
        break;
    }

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = dist / 80; // traverse in ~80 frames

    stars.push({
      x,
      y,
      targetX,
      targetY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      length: randomBetween(60, 120),
      alpha: 1,
      life: 0,
      maxLife: 80 + Math.floor(randomBetween(0, 40)),
      twinklePhase: randomBetween(0, Math.PI * 2),
      twinkleSpeed: randomBetween(0.15, 0.3),
      color: randomItem(starColors),
      trail: [],
    });
  }
  return stars;
}

function generateConfetti(w: number, h: number): Particle[] {
  const count = Math.floor(randomBetween(80, 120));
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const maxLife = randomBetween(200, 280); // ~3.3-4.7s at 60fps
    particles.push({
      x: randomBetween(-20, w + 20),
      y: randomBetween(-60, -10),
      vx: randomBetween(-2, 2),
      vy: randomBetween(1, 3),
      color: randomItem(CONFETTI_COLORS),
      size: Math.random() > 0.4
        ? randomBetween(5, 10)
        : randomBetween(3, 7),
      alpha: 1,
      life: 0,
      maxLife,
      gravity: 0.04,
      friction: 0.999,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      rotation: randomBetween(0, 360),
      rotationSpeed: randomBetween(-8, 8),
      flutter: randomBetween(0, Math.PI * 2),
      flutterSpeed: randomBetween(0.03, 0.08),
      flutterAmp: randomBetween(0.5, 2),
    });
  }
  return particles;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(degreesToRadians(rotation));
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const outerR = size;
    const innerR = size * 0.4;
    if (i === 0) ctx.moveTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
    else ctx.lineTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
    ctx.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  deltaTime: number
): boolean {
  let anyAlive = false;

  for (const p of particles) {
    p.life += deltaTime;
    if (p.life >= p.maxLife) {
      p.alpha = 0;
      continue;
    }
    anyAlive = true;

    const lifeRatio = p.life / p.maxLife;
    // Fade out in last 40%
    p.alpha = lifeRatio > 0.6 ? 1 - (lifeRatio - 0.6) / 0.4 : 1;

    // Physics
    p.vy += p.gravity * deltaTime;
    p.vx *= Math.pow(p.friction, deltaTime);
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.rotation += p.rotationSpeed * deltaTime;

    // Confetti flutter
    if (p.flutter !== undefined && p.flutterAmp !== undefined && p.flutterSpeed !== undefined) {
      p.flutter += p.flutterSpeed * deltaTime;
      p.x += Math.sin(p.flutter) * p.flutterAmp * deltaTime;
    }

    // Draw
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else if (p.shape === 'rect') {
      ctx.translate(p.x, p.y);
      ctx.rotate(degreesToRadians(p.rotation));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size * 0.7, p.size, p.size * 1.4);
    } else if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color, Math.max(0, p.alpha));
    }

    ctx.restore();
  }

  return anyAlive;
}

function updateAndDrawHearts(
  ctx: CanvasRenderingContext2D,
  hearts: HeartParticle[],
  w: number,
  deltaTime: number
): boolean {
  let anyAlive = false;

  for (const h of hearts) {
    h.progress += h.speed * deltaTime;
    if (h.progress >= h.maxProgress) {
      h.alpha = 0;
      continue;
    }
    anyAlive = true;

    // S-curve bezier: using cubic interpolation
    const t = h.progress;
    const s = 1 - t;
    // S-curve: start center, curve out, then back, then up
    const bezierX = 3 * s * s * t * h.curveOffset * 1.5
      + 3 * s * t * t * (-h.curveOffset * 0.5)
      + t * t * t * h.curveOffset * 0.2;
    const bezierY = 3 * s * s * t * (-100)
      + 3 * s * t * t * (-200)
      + t * t * t * (-350);

    h.x = w / 2 + bezierX;
    h.y = h.startY + bezierY;
    h.rotation += h.rotationSpeed * deltaTime;

    // Fade out in last 25%
    h.alpha = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, h.alpha);
    ctx.translate(h.x, h.y);
    ctx.rotate(degreesToRadians(h.rotation));
    ctx.font = `${h.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(h.emoji, 0, 0);
    ctx.restore();
  }

  return anyAlive;
}

function updateAndDrawFireworks(
  ctx: CanvasRenderingContext2D,
  bursts: FireworkBurst[],
  frame: number,
  deltaTime: number
): boolean {
  let anyAlive = false;

  for (const burst of bursts) {
    if (frame < burst.launchTime) {
      anyAlive = true;
      continue;
    }

    if (!burst.exploded) {
      // Launch phase: rocket going up
      const launchProgress = (frame - burst.launchTime) / 20; // ~333ms launch
      if (launchProgress >= 1) {
        explodeFirework(burst);
      } else {
        anyAlive = true;
        // Draw rocket trail
        const rocketY = burst.launchY - (burst.launchY - burst.y) * easeOutCubic(launchProgress);
        const rocketAlpha = 0.6 + launchProgress * 0.4;

        // Trail
        ctx.save();
        ctx.globalAlpha = rocketAlpha * 0.4;
        ctx.strokeStyle = '#FFCC00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(burst.x, burst.launchY);
        ctx.lineTo(burst.x, rocketY);
        ctx.stroke();

        // Rocket head
        ctx.globalAlpha = rocketAlpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(burst.x, rocketY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      continue;
    }

    // Exploded phase
    for (const p of burst.particles) {
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        p.alpha = 0;
        continue;
      }
      anyAlive = true;

      const lifeRatio = p.life / p.maxLife;
      p.alpha = lifeRatio > 0.5 ? 1 - (lifeRatio - 0.5) / 0.5 : 1;

      p.vy += 0.04 * deltaTime;
      p.vx *= Math.pow(0.98, deltaTime);
      p.vy *= Math.pow(0.98, deltaTime);
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Store trail
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha * 0.3 });
      if (p.trail.length > 6) p.trail.shift();

      // Draw trail
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailAlpha = (i / p.trail.length) * t.alpha * 0.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, trailAlpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.size * (i / p.trail.length) * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw particle
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return anyAlive;
}

function updateAndDrawStars(
  ctx: CanvasRenderingContext2D,
  stars: StarTrail[],
  deltaTime: number
): boolean {
  let anyAlive = false;

  for (const s of stars) {
    s.life += deltaTime;
    if (s.life >= s.maxLife) {
      s.alpha = 0;
      continue;
    }
    anyAlive = true;

    const lifeRatio = s.life / s.maxLife;
    // Fade in first 10%, full 10-70%, fade out 70-100%
    if (lifeRatio < 0.1) {
      s.alpha = lifeRatio / 0.1;
    } else if (lifeRatio > 0.7) {
      s.alpha = 1 - (lifeRatio - 0.7) / 0.3;
    } else {
      s.alpha = 1;
    }

    // Twinkle effect
    s.twinklePhase += s.twinkleSpeed * deltaTime;
    const twinkle = 0.7 + 0.3 * Math.sin(s.twinklePhase);

    s.x += s.vx * deltaTime;
    s.y += s.vy * deltaTime;

    // Store trail
    s.trail.push({ x: s.x, y: s.y, alpha: s.alpha * twinkle });
    if (s.trail.length > 12) s.trail.shift();

    // Draw trail (gradient tail)
    if (s.trail.length > 1) {
      for (let i = 1; i < s.trail.length; i++) {
        const t0 = s.trail[i - 1];
        const t1 = s.trail[i];
        const trailProgress = i / s.trail.length;

        ctx.save();
        ctx.globalAlpha = Math.max(0, t1.alpha * trailProgress * 0.6);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = trailProgress * 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw head glow
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.alpha * twinkle);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return anyAlive;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Premium overlay renderer (canvas-based golden glow) ─────────────────────

function drawPremiumOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: number,
  maxFrames: number
): void {
  const progress = frame / maxFrames;

  // Golden radial glow from center, pulsing
  const glowAlpha = Math.sin(progress * Math.PI) * 0.35;
  if (glowAlpha > 0.01) {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    gradient.addColorStop(0, `rgba(245, 158, 11, ${glowAlpha})`);
    gradient.addColorStop(0.3, `rgba(245, 158, 11, ${glowAlpha * 0.5})`);
    gradient.addColorStop(0.6, `rgba(217, 119, 6, ${glowAlpha * 0.2})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  // Rotating light rays
  const rayCount = 12;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(frame * 0.005);
  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 * i) / rayCount;
    const rayAlpha = Math.sin(progress * Math.PI) * 0.08;
    ctx.save();
    ctx.rotate(angle);
    ctx.globalAlpha = Math.max(0, rayAlpha);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(0, -Math.max(w, h) * 0.7);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Sparkle ring
  const ringRadius = Math.min(w, h) * 0.25 * Math.min(1, frame / 30);
  const sparkleCount = 24;
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkleCount + frame * 0.02;
    const sparkleAlpha = Math.sin(progress * Math.PI) * (0.4 + 0.6 * Math.sin(frame * 0.1 + i));
    const sx = w / 2 + Math.cos(angle) * ringRadius;
    const sy = h / 2 + Math.sin(angle) * ringRadius;
    ctx.save();
    ctx.globalAlpha = Math.max(0, sparkleAlpha * 0.6);
    ctx.fillStyle = '#FFCC00';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GiftAnimationsProps {
  animation: ActiveGiftAnimation | null;
}

export default function GiftAnimations({ animation }: GiftAnimationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef<{
    particles: Particle[];
    fireworks: FireworkBurst[];
    hearts: HeartParticle[];
    stars: StarTrail[];
    confetti: Particle[];
    frame: number;
    type: ActiveGiftAnimation['animation'] | null;
    isPremium: boolean;
    maxFrames: number;
  }>({
    particles: [],
    fireworks: [],
    hearts: [],
    stars: [],
    confetti: [],
    frame: 0,
    type: null,
    isPremium: false,
    maxFrames: 180,
  });

  const prevAnimationId = useRef<string | null>(null);

  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    stateRef.current = {
      particles: [],
      fireworks: [],
      hearts: [],
      stars: [],
      confetti: [],
      frame: 0,
      type: null,
      isPremium: false,
      maxFrames: 180,
    };
  }, []);

  useEffect(() => {
    // No animation — clean up
    if (!animation) {
      stopAnimation();
      prevAnimationId.current = null;
      return;
    }

    // Same animation — don't restart
    if (animation.id === prevAnimationId.current) return;
    prevAnimationId.current = animation.id;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Cancel any previous animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    const isPremium = animation.price >= 5200;
    const effectType = animation.animation;
    let maxFrames = 180; // ~3s at 60fps

    // Duration mapping
    switch (effectType) {
      case 'particles': maxFrames = 150; break;   // 2.5s
      case 'fireworks': maxFrames = 240; break;    // 4s
      case 'hearts': maxFrames = 180; break;       // 3s
      case 'stars': maxFrames = 120; break;        // 2s
      case 'confetti': maxFrames = 260; break;     // ~4.3s
    }

    const state = stateRef.current;
    state.particles = effectType === 'particles' ? generateParticles(w, h) : [];
    state.fireworks = effectType === 'fireworks' ? generateFireworks(w, h) : [];
    state.hearts = effectType === 'hearts' ? generateHearts(w, h) : [];
    state.stars = effectType === 'stars' ? generateStars(w, h) : [];
    state.confetti = effectType === 'confetti' ? generateConfetti(w, h) : [];
    state.frame = 0;
    state.type = effectType;
    state.isPremium = isPremium;
    state.maxFrames = maxFrames;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDelta = (now - lastTime) / 16.667; // normalize to 60fps
      const delta = Math.min(rawDelta, 3); // cap delta to avoid huge jumps
      lastTime = now;

      state.frame++;

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Premium overlay
      if (isPremium) {
        drawPremiumOverlay(ctx, w, h, state.frame, maxFrames);
      }

      // Draw effect
      let alive = state.frame < maxFrames;

      if (effectType === 'particles' && state.particles.length > 0) {
        alive = updateAndDrawParticles(ctx, state.particles, delta) || alive;
      }
      if (effectType === 'fireworks' && state.fireworks.length > 0) {
        alive = updateAndDrawFireworks(ctx, state.fireworks, state.frame, delta) || alive;
      }
      if (effectType === 'hearts' && state.hearts.length > 0) {
        alive = updateAndDrawHearts(ctx, state.hearts, w, delta) || alive;
      }
      if (effectType === 'stars' && state.stars.length > 0) {
        alive = updateAndDrawStars(ctx, state.stars, delta) || alive;
      }
      if (effectType === 'confetti' && state.confetti.length > 0) {
        alive = updateAndDrawParticles(ctx, state.confetti, delta) || alive;
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [animation, stopAnimation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!animation) return null;

  const isPremium = animation.price >= 5200;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 200 }}>
      {/* Canvas layer — particle effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Center emoji — DOM overlay for crisp rendering */}
      {animation.emoji && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 201 }}
        >
          <div
            style={{
              fontSize: isPremium ? 100 : 72,
              filter: isPremium
                ? 'drop-shadow(0 0 30px rgba(245,158,11,0.7)) drop-shadow(0 0 60px rgba(245,158,11,0.3))'
                : 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
              animation: 'giftEmojiBounce 3.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
          >
            {animation.emoji}
          </div>
        </div>
      )}

      {/* Banner notification */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{
          bottom: '22%',
          transform: 'translateX(-50%)',
          zIndex: 202,
          animation: 'giftBannerSlide 3.5s ease forwards',
        }}
      >
        <div
          className="rounded-full px-5 py-2.5 flex items-center gap-2.5 whitespace-nowrap"
          style={{
            background: isPremium
              ? 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95), rgba(180,83,9,0.95))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(239,68,68,0.9), rgba(167,139,250,0.9))',
            boxShadow: isPremium
              ? '0 4px 24px rgba(245,158,11,0.5), 0 0 48px rgba(245,158,11,0.2)'
              : '0 4px 20px rgba(245,158,11,0.3)',
            border: isPremium ? '1px solid rgba(255,215,0,0.5)' : 'none',
          }}
        >
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {animation.senderName} → {animation.receiverName}
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(0,0,0,0.2)',
              padding: '1px 6px',
              borderRadius: 8,
            }}
          >
            {animation.giftName}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>
            {animation.price} 💎
          </span>
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx global>{`
        @keyframes giftEmojiBounce {
          0%   { opacity: 0; transform: scale(0); }
          12%  { opacity: 1; transform: scale(1.5); }
          20%  { transform: scale(1); }
          30%  { transform: scale(1.08); }
          40%  { transform: scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: scale(0.8) translateY(-30px); }
        }
        @keyframes giftBannerSlide {
          0%   { opacity: 0; transform: translateX(-50%) translateY(30px); }
          10%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
