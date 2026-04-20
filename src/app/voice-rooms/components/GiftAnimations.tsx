'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActiveGiftAnimation } from '../types';

function ParticleBurst() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      color: ['#f59e0b', '#ef4444', '#a78bfa', '#22c55e', '#3b82f6', '#ec4899'][i % 6],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1 }}
          transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, marginLeft: -(p.size / 2), marginTop: -(p.size / 2) }}
        />
      ))}
    </div>
  );
}

function FireworksBurst() {
  const bursts = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 160 - 80,
      y: -(Math.random() * 120 + 40),
      color: ['#f59e0b', '#ef4444', '#a78bfa', '#22c55e', '#ec4899'][i % 5],
      delay: i * 0.25,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bursts.map((b) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: 0, scale: 2.5 }}
          transition={{ duration: 1.5, delay: b.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{ width: 60, height: 60, backgroundColor: b.color, marginLeft: -30, marginTop: -30, x: b.x, y: b.y, boxShadow: '0 0 20px ' + b.color }}
        />
      ))}
    </div>
  );
}

function FloatingHearts() {
  const hearts = useMemo(() => {
    const emojis = ['❤️', '💖', '💕', '💗', '🌹'];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 160 - 80,
      delay: Math.random() * 0.8,
      emoji: emojis[i % emojis.length],
      size: Math.random() * 12 + 16,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, y: 60, x: 0 }}
          animate={{ opacity: 0, y: -250, x: h.x }}
          transition={{ duration: 2.2, delay: h.delay, ease: 'easeOut' }}
          className="absolute left-1/2 bottom-1/3"
          style={{ fontSize: h.size, marginLeft: -(h.size / 2) }}
        >
          {h.emoji}
        </motion.div>
      ))}
    </div>
  );
}

function FallingStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: -(Math.random() * 200 + 50),
      delay: Math.random() * 0.6,
      size: Math.random() * 10 + 10,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: s.y - 100, x: s.x, rotate: s.rotation }}
          animate={{ opacity: [0, 1, 1, 0], y: 200, rotate: s.rotation + 180 }}
          transition={{ duration: 2, delay: s.delay, ease: 'easeIn' }}
          className="absolute left-1/2 top-0"
          style={{ fontSize: s.size }}
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}

function ConfettiBurst() {
  const confetti = useMemo(() => {
    const colors = ['#f59e0b', '#ef4444', '#a78bfa', '#22c55e', '#3b82f6', '#ec4899', '#f97316'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: Math.random() * 100 - 200,
      rotation: Math.random() * 720 - 360,
      color: colors[i % colors.length],
      width: Math.random() * 8 + 4,
      height: Math.random() * 12 + 6,
      delay: Math.random() * 0.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 1, y: -80, x: 0, rotate: 0 }}
          animate={{ opacity: 0, y: 400, x: c.x, rotate: c.rotation }}
          transition={{ duration: 3, delay: c.delay, ease: 'easeIn' }}
          className="absolute left-1/2 top-0"
          style={{ width: c.width, height: c.height, backgroundColor: c.color, marginLeft: -(c.width / 2), borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

function FloatingGiftEmoji({ emoji }: { emoji: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -120, scale: 1.5 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ fontSize: 48, zIndex: 100 }}
    >
      {emoji}
    </motion.div>
  );
}

export default function GiftAnimations({ activeGift }: { activeGift: ActiveGiftAnimation | null }) {
  const [showAnimation, setShowAnimation] = useState(!!activeGift);

  useEffect(() => {
    if (!activeGift) {
      setShowAnimation(false);
      return;
    }
    setShowAnimation(true);
  }, [activeGift]);

  if (!activeGift || !showAnimation) return null;

  const isPremium = activeGift.price >= 199;
  const glowColor = activeGift.price >= 5200 ? 'rgba(245,158,11,0.3)' : activeGift.price >= 199 ? 'rgba(167,139,250,0.25)' : 'rgba(108,99,255,0.15)';

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
        >
          {/* Premium glow background */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.6, 0] }}
              transition={{ duration: 4, times: [0, 0.1, 0.7, 1] }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at center, ' + glowColor + ', transparent 70%)' }}
            />
          )}

          {/* Central emoji */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.5, times: [0, 0.15, 0.3, 1], ease: 'easeOut' }}
            className="relative flex items-center justify-center"
            style={{ width: 120, height: 120 }}
          >
            <span style={{ fontSize: 80, filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }}>{activeGift.emoji}</span>
          </motion.div>

          {/* Animation effect */}
          {activeGift.animation === 'particles' && <ParticleBurst />}
          {activeGift.animation === 'fireworks' && <FireworksBurst />}
          {activeGift.animation === 'hearts' && <FloatingHearts />}
          {activeGift.animation === 'stars' && <FallingStars />}
          {activeGift.animation === 'confetti' && <ConfettiBurst />}

          {/* Banner notification */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute bottom-[25%] left-1/2 -translate-x-1/2"
          >
            <div
              className="rounded-full px-5 py-2 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(239,68,68,0.9), rgba(167,139,250,0.9))',
                boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              <span className="text-white text-[13px] font-bold">
                {activeGift.senderName} ← {activeGift.emoji} → {activeGift.receiverName}
              </span>
              <span className="text-white/80 text-[11px] font-semibold">{activeGift.price} 💎</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
