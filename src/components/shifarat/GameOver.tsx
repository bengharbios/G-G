'use client';

import { motion } from 'framer-motion';
import { Trophy, Home, RotateCcw, BarChart3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameOverProps {
  winner: { name: string; score: number };
  loser: { name: string; score: number };
  totalRounds: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function GameOver({
  winner,
  loser,
  totalRounds,
  onPlayAgain,
  onHome,
}: GameOverProps) {
  // Total words guessed
  const totalWordsGuessed = winner.score + loser.score;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-auto text-center"
      >
        {/* Trophy Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 12,
          }}
          className="mb-6"
        >
          <div
            className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full mb-2"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(245, 158, 11, 0.15))',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.2), 0 0 80px rgba(16, 185, 129, 0.1)',
            }}
          >
            <span className="text-5xl sm:text-6xl">🏆</span>
          </div>
        </motion.div>

        {/* Confetti stars */}
        <div className="relative mb-4">
          {['⭐', '✨', '🌟', '💫', '🎊'].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -20, scale: 0 }}
              animate={{
                opacity: [0, 1, 0.6],
                y: [0, -30 - i * 10, -50 - i * 10],
                scale: [0, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.15,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute text-lg"
              style={{
                left: `${15 + i * 17}%`,
                top: '-10px',
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Winner Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black mb-2"
          style={{
            background: 'linear-gradient(to left, #fbbf24, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {winner.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-400 text-sm mb-6"
        >
          فاز باللعبة! 🎉
        </motion.p>

        {/* Score Cards */}
        <div className="flex gap-3 mb-6">
          {/* Winner */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="flex-1 p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">الفائز</span>
            </div>
            <div className="text-3xl font-black text-white">{winner.score}</div>
            <div className="text-xs text-slate-400 mt-1">{winner.name}</div>
          </motion.div>

          {/* Loser */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="flex-1 p-4"
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(51, 65, 85, 0.3)',
              borderRadius: '1rem',
              opacity: 0.7,
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500">الثاني</span>
            </div>
            <div className="text-3xl font-black text-slate-300">{loser.score}</div>
            <div className="text-xs text-slate-500 mt-1">{loser.name}</div>
          </motion.div>
        </div>

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mb-6 p-4"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            borderRadius: '1rem',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">إحصائيات اللعبة</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xl font-black text-white">{totalRounds}</div>
              <div className="text-[10px] text-slate-500">إجمالي الجولات</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-400">{totalWordsGuessed}</div>
              <div className="text-[10px] text-slate-500">كلمات صحيحة</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-400">{winner.score - loser.score}</div>
              <div className="text-[10px] text-slate-500">فارق النقاط</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={onPlayAgain}
            className="w-full py-5 font-bold text-base text-white"
            style={{
              background: 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '1rem',
              minHeight: '52px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <RotateCcw className="w-5 h-5 ml-2" />
            العب مرة أخرى 🔥
          </Button>

          <Button
            onClick={onHome}
            variant="ghost"
            className="w-full py-4 text-slate-400 hover:text-slate-300 gap-2 text-sm"
            style={{ borderRadius: '1rem' }}
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
